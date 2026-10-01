/* =========================================================
   Glow by Grace — backend connection (Supabase)
   ---------------------------------------------------------
   Loads the live catalogue + delivery zones, handles Google
   sign-in and calls the checkout server functions.
   Everything is exposed on window.GBG_API.
   ========================================================= */
(function () {
  const cfg = window.GBG_CONFIG || {};
  const configured =
    /^https:\/\//.test(cfg.supabaseUrl || "") &&
    !!cfg.supabaseAnonKey &&
    !/YOUR-/.test(cfg.supabaseUrl + cfg.supabaseAnonKey);

  const sb = configured && window.supabase ? window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey) : null;
  const NOT_READY = "The shop isn't connected to its database yet. Add your Supabase details to assets/js/config.js.";

  function need() {
    if (!sb) throw new Error(NOT_READY);
    return sb;
  }

  // database row -> the product shape the site uses everywhere
  function mapProduct(r) {
    const lengths = (r.product_variants || [])
      .slice()
      .sort((a, b) => a.sort - b.sort || a.price - b.price)
      .map((v) => ({ id: v.id, len: v.length, price: v.price, stock: v.stock, sort: v.sort }));
    return {
      id: r.id,
      name: r.name,
      tagline: r.tagline || "",
      category: r.category,
      badge: r.badge || "",
      lace: r.lace || "—",
      density: r.density || "—",
      desc: r.description || "",
      model: r.model_url || "",
      sample: r.sample_url || r.model_url || "",
      colors: r.colors || [],
      featured: r.featured,
      active: r.active,
      sort: r.sort,
      lengths
    };
  }

  async function loadCatalog() {
    const db = need();
    const [prods, zones] = await Promise.all([
      db.from("products").select("*, product_variants(*)").eq("active", true).order("sort").order("name"),
      db.from("delivery_zones").select("*").eq("active", true).order("sort")
    ]);
    if (prods.error) throw prods.error;
    if (zones.error) throw zones.error;
    const list = prods.data.map(mapProduct).filter((p) => p.lengths.length);
    window.GBG_PRODUCTS.splice(0, window.GBG_PRODUCTS.length, ...list);
    window.GBG_ZONES.splice(0, window.GBG_ZONES.length, ...zones.data);
  }

  const api = {
    configured,
    client: sb,
    mapProduct,
    catalogError: null,
    // always resolves; check api.catalogError when it does
    ready: null,

    async session() {
      if (!sb) return null;
      const { data } = await sb.auth.getSession();
      return data.session;
    },
    async user() {
      const s = await api.session();
      return s ? s.user : null;
    },
    onAuth(cb) {
      if (sb) sb.auth.onAuthStateChange((_event, session) => cb(session ? session.user : null));
    },
    async signIn(redirectTo) {
      const { error } = await need().auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: redirectTo || location.href.split("#")[0] }
      });
      if (error) throw error;
    },
    async signOut() {
      if (sb) await sb.auth.signOut();
    },
    async isAdmin() {
      if (!sb) return false;
      const { data, error } = await sb.rpc("is_admin");
      return !error && data === true;
    },

    // Calls a Supabase Edge Function and turns error responses into readable messages.
    async fn(name, body) {
      const { data, error } = await need().functions.invoke(name, { body });
      if (error) {
        let msg = error.message || "Request failed";
        try {
          const j = await error.context.json();
          if (j && j.error) msg = j.error;
        } catch (e) {}
        throw new Error(msg);
      }
      return data;
    },

    displayName(user) {
      const m = (user && user.user_metadata) || {};
      return m.full_name || m.name || (user && user.email) || "";
    },
    avatar(user) {
      const m = (user && user.user_metadata) || {};
      return m.avatar_url || m.picture || "";
    }
  };

  api.ready = sb
    ? loadCatalog().catch((err) => {
        console.error(err);
        api.catalogError = "We couldn't load the collection right now. Please refresh the page.";
      })
    : Promise.resolve().then(() => { api.catalogError = NOT_READY; });

  window.GBG_API = api;
})();
