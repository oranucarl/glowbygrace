/* Glow by Grace — customer account: orders + saved details */
(function () {
  const { naira, esc, ICON, toast } = window.GBG;
  const API = window.GBG_API;
  const O = window.GBG_ORDERS;
  const root = document.querySelector("[data-account-page]");

  let user = null;
  let orders = [];
  let tab = "orders";
  let admin = false;

  function signedOut() {
    root.innerHTML = `
      <div class="page-head center">
        <div class="eyebrow">Your account</div>
        <h1 class="display">Welcome <em>back</em></h1>
      </div>
      <section class="card co-signin center">
        <h3>Sign in to see your orders</h3>
        <p>Track deliveries, view past orders and check out faster. New here? Signing in creates your account automatically.</p>
        <button class="btn btn-google" data-signin>${ICON.google} Continue with Google</button>
      </section>`;
  }

  function orderCard(o) {
    const thumbs = (o.order_items || []).slice(0, 4).map((i) => (i.image_url ? `<img src="${esc(i.image_url)}" alt="">` : "")).join("");
    const count = (o.order_items || []).reduce((s, i) => s + i.quantity, 0);
    return `
      <article class="card order-card" id="${esc(o.order_number)}" data-order="${o.id}">
        <button class="order-top" data-toggle aria-expanded="false">
          <div><small>Order</small><b>${esc(o.order_number)}</b></div>
          <div><small>Placed</small><b>${O.day(o.created_at)}</b></div>
          <div class="hide-sm"><small>Items</small><b>${count}</b></div>
          <div><small>Total</small><b>${naira(o.total)}</b></div>
          <div>${O.statusPill(o.status)}</div>
          <span class="thumbs hide-sm">${thumbs}</span>
          <span class="chev" aria-hidden="true">›</span>
        </button>
        <div class="order-body">
          ${O.orderDetail(o)}
          ${o.status === "pending_payment" ? `<div class="btns"><button class="btn btn-dark" data-pay="${o.id}">Pay ${naira(o.total)} now</button><button class="btn btn-ghost" data-cancel="${o.id}">Cancel order</button></div>` : ""}
        </div>
      </article>`;
  }

  function ordersView() {
    if (!orders.length) {
      return `<div class="empty"><h3>No orders yet</h3><p>When you place an order, it will show up here so you can track it.</p><p style="margin-top:20px"><a class="btn btn-dark" href="shop.html">Shop the hair ${ICON.arrow}</a></p></div>`;
    }
    const active = orders.filter((o) => ["pending_payment", "paid", "processing", "shipped"].includes(o.status));
    const past = orders.filter((o) => !active.includes(o));
    return `
      ${active.length ? `<h2 class="sub">In progress <span>${active.length}</span></h2>${active.map(orderCard).join("")}` : ""}
      ${past.length ? `<h2 class="sub">Past orders <span>${past.length}</span></h2>${past.map(orderCard).join("")}` : ""}`;
  }

  function detailsView(p) {
    const zones = window.GBG_ZONES || [];
    const v = (k) => esc((p && p[k]) || "");
    return `
      <form class="card co-form" data-profile>
        <p class="muted">These details are filled in for you at checkout.</p>
        <div class="fields">
          <label class="field"><span>Full name</span><input name="full_name" value="${v("full_name")}" autocomplete="name"></label>
          <label class="field"><span>Phone number</span><input name="phone" type="tel" value="${v("phone")}" autocomplete="tel"></label>
          <label class="field wide"><span>Street address</span><input name="address" value="${v("address")}" autocomplete="street-address"></label>
          <label class="field"><span>City / area</span><input name="city" value="${v("city")}" autocomplete="address-level2"></label>
          <label class="field"><span>State</span><input name="state" value="${v("state")}" autocomplete="address-level1"></label>
          <label class="field"><span>Usual delivery option</span>
            <select name="delivery_zone_id"><option value="">—</option>${zones.map((z) => `<option value="${z.id}"${p && p.delivery_zone_id === z.id ? " selected" : ""}>${esc(z.name)}</option>`).join("")}</select>
          </label>
          <label class="field"><span>Email</span><input value="${esc(user.email)}" disabled></label>
        </div>
        <button class="btn btn-dark">Save details</button>
      </form>`;
  }

  async function render() {
    const pic = API.avatar(user);
    root.innerHTML = `
      <div class="acct-head">
        ${pic ? `<img src="${esc(pic)}" alt="" referrerpolicy="no-referrer">` : `<span class="acct-initial">${esc(API.displayName(user).charAt(0).toUpperCase())}</span>`}
        <div>
          <div class="eyebrow">Your account</div>
          <h1 class="display">Hello, <em>${esc(API.displayName(user).split(" ")[0])}</em></h1>
          <p class="muted">${esc(user.email)}</p>
        </div>
        <div class="acct-actions">
          ${admin ? `<a class="btn btn-gold" href="admin.html">Store admin</a>` : ""}
          <button class="btn btn-ghost" data-signout>Sign out</button>
        </div>
      </div>
      <div class="tabs" role="tablist">
        <button role="tab" data-tab="orders" class="${tab === "orders" ? "active" : ""}">My orders</button>
        <button role="tab" data-tab="details" class="${tab === "details" ? "active" : ""}">My details</button>
      </div>
      <div data-tab-body><p class="loading-note">Loading…</p></div>`;
    const body = root.querySelector("[data-tab-body]");
    if (tab === "orders") {
      body.innerHTML = ordersView();
      const hash = decodeURIComponent(location.hash.slice(1));
      const target = hash && document.getElementById(hash);
      if (target) { toggle(target, true); target.scrollIntoView({ behavior: "smooth", block: "start" }); }
    } else {
      const { data } = await API.client.from("profiles").select("*").eq("id", user.id).maybeSingle();
      body.innerHTML = detailsView(data);
    }
  }

  function toggle(card, open) {
    card.classList.toggle("open", open);
    card.querySelector("[data-toggle]").setAttribute("aria-expanded", open);
  }

  async function loadOrders() {
    const { data, error } = await API.client
      .from("orders")
      .select("*, order_items(*), order_events(*)")
      .order("created_at", { ascending: false })
      .order("created_at", { referencedTable: "order_events" });
    if (error) throw error;
    orders = data;
  }

  root.addEventListener("click", async (e) => {
    const t = e.target.closest("button");
    if (!t) return;
    if (t.hasAttribute("data-signin")) return API.signIn(location.href).catch((err) => toast(err.message));
    if (t.hasAttribute("data-signout")) { await API.signOut(); return; }
    if (t.dataset.tab) { tab = t.dataset.tab; return render(); }
    if (t.hasAttribute("data-toggle")) { const c = t.closest(".order-card"); return toggle(c, !c.classList.contains("open")); }
    if (t.dataset.pay) {
      t.disabled = true;
      t.textContent = "Connecting to Paystack…";
      try {
        const res = await API.fn("checkout", { order_id: t.dataset.pay, return_url: new URL("order.html", location.href).href });
        location.href = res.authorization_url;
      } catch (err) { toast(err.message); t.disabled = false; t.textContent = "Pay now"; }
    }
    if (t.dataset.cancel) {
      const o = orders.find((x) => x.id === t.dataset.cancel);
      if (!confirm(`Cancel order ${o.order_number}?`)) return;
      const { error } = await API.client.rpc("cancel_my_order", { p_order_id: o.id });
      if (error) return toast(error.message);
      await loadOrders();
      render();
      toast(`Order ${o.order_number} cancelled`);
    }
  });

  root.addEventListener("submit", async (e) => {
    if (!e.target.matches("[data-profile]")) return;
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.target));
    for (const k in f) f[k] = String(f[k]).trim() || null;
    const { error } = await API.client.from("profiles").update(f).eq("id", user.id);
    toast(error ? error.message : "Details saved ✦");
  });

  async function load(u) {
    user = u;
    if (!user) return signedOut();
    root.innerHTML = `<p class="loading-note">Loading your orders…</p>`;
    try {
      [admin] = await Promise.all([API.isAdmin(), loadOrders()]);
      render();
    } catch (err) {
      root.innerHTML = `<p class="loading-note">${esc(err.message)}</p>`;
    }
  }

  (async function start() {
    if (!API.configured) { root.innerHTML = `<p class="loading-note">${esc(API.catalogError || "The shop isn't connected yet.")}</p>`; return; }
    await API.ready;
    await load(await API.user());
    API.onAuth((u) => { if ((u && u.id) !== (user && user.id)) load(u); });
  })();
})();
