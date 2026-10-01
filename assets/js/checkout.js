/* Glow by Grace — checkout page */
(function () {
  const { naira, esc, ICON, bagLines, clearBag, openBag, inStock } = window.GBG;
  const API = window.GBG_API;
  const root = document.querySelector("[data-checkout]");

  const STATES = ["Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT (Abuja)", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara"];

  let user = null;
  let profile = null;
  let zoneId = null;
  let busy = false;

  function summary(lines) {
    const subtotal = lines.reduce((s, l) => s + l.qty * l.price, 0);
    const zone = (window.GBG_ZONES || []).find((z) => z.id === zoneId);
    const fee = zone ? zone.fee : null;
    return `
      <aside class="co-summary card">
        <div class="co-sum-head"><h3>Order summary</h3><button type="button" class="link" data-edit-bag>Edit bag</button></div>
        <div class="o-items">${lines.map((l) => `
          <div class="o-item">
            <img src="${esc(l.p.model)}" alt="">
            <div><b>${esc(l.p.name)}</b><small>Length ${esc(l.len)}${l.color ? ` · ${esc(l.color)}` : ""} · Qty ${l.qty} · ${naira(l.price)} each</small>
              ${inStock(l.v) ? (l.v.stock != null && l.qty > l.v.stock ? `<small class="err">Only ${l.v.stock} left — please reduce the quantity</small>` : "") : `<small class="err">Sold out — please remove it</small>`}
              ${l.p.colors.length && !l.p.colors.includes(l.color) ? `<small class="err">Colour no longer available — please remove it and choose again</small>` : ""}
            </div>
            <span>${naira(l.qty * l.price)}</span>
          </div>`).join("")}
        </div>
        <div class="o-totals">
          <div><span>Subtotal</span><span>${naira(subtotal)}</span></div>
          <div><span>Delivery${zone ? ` · ${esc(zone.name)}` : ""}</span><span>${fee === null ? "Choose an option" : fee ? naira(fee) : "Free"}</span></div>
          <div class="grand"><span>Total</span><span>${naira(subtotal + (fee || 0))}</span></div>
        </div>
        <p class="co-secure">🔒 Payments are processed securely by Paystack. We never see or store your card details.</p>
      </aside>`;
  }

  function signInPanel() {
    return `<div data-auth></div>`;
  }

  function form() {
    const p = profile || {};
    const zones = window.GBG_ZONES || [];
    if (!zoneId) zoneId = (zones.find((z) => z.id === p.delivery_zone_id) || {}).id || null;
    const val = (k, fallback = "") => esc(p[k] || fallback);
    return `
      <form class="card co-form" data-form novalidate>
        <div class="co-who">
          ${API.avatar(user) ? `<img src="${esc(API.avatar(user))}" alt="" referrerpolicy="no-referrer">` : ""}
          <div><small>Signed in as</small><b>${esc(user.email)}</b></div>
          <button type="button" class="link" data-signout>Not you?</button>
        </div>

        <h3>Contact</h3>
        <div class="fields">
          <label class="field"><span>Full name</span><input name="name" required autocomplete="name" value="${val("full_name", API.displayName(user))}"></label>
          <label class="field"><span>Phone number</span><input name="phone" required type="tel" autocomplete="tel" placeholder="0801 234 5678" value="${val("phone")}"></label>
        </div>

        <h3>Delivery address</h3>
        <div class="fields">
          <label class="field wide"><span>Street address</span><input name="address" required autocomplete="street-address" placeholder="House number, street, landmark" value="${val("address")}"></label>
          <label class="field"><span>City / area</span><input name="city" required autocomplete="address-level2" placeholder="e.g. Lekki Phase 1" value="${val("city")}"></label>
          <label class="field"><span>State</span>
            <select name="state" required autocomplete="address-level1">
              <option value="">Select state</option>
              ${STATES.map((s) => `<option${s === p.state ? " selected" : ""}>${s}</option>`).join("")}
            </select>
          </label>
        </div>

        <h3>Delivery option</h3>
        <div class="zones">
          ${zones.length ? zones.map((z) => `
            <label class="zone">
              <input type="radio" name="zone" value="${z.id}"${z.id === zoneId ? " checked" : ""}>
              <span><b>${esc(z.name)}</b>${z.description ? `<small>${esc(z.description)}</small>` : ""}</span>
              <em>${z.fee ? naira(z.fee) : "Free"}</em>
            </label>`).join("") : `<p class="err">No delivery options are available right now. Please contact us on WhatsApp.</p>`}
        </div>

        <label class="field wide"><span>Order note <i>(optional)</i></span><textarea name="notes" rows="3" maxlength="500" placeholder="Anything we should know about your order or delivery?"></textarea></label>
        <label class="check"><input type="checkbox" name="save" checked> Save these details for next time</label>

        <p class="err" data-error hidden></p>
        <button class="btn btn-dark co-pay" data-pay>Pay securely</button>
        <p class="co-secure">By paying you agree to our <a href="terms.html" style="text-decoration:underline">terms</a> and <a href="privacy.html" style="text-decoration:underline">privacy policy</a>.</p>
      </form>`;
  }

  function render() {
    const lines = bagLines();
    if (API.catalogError) {
      root.innerHTML = `<p class="loading-note">${API.catalogError}</p>`;
      return;
    }
    if (!lines.length) {
      root.innerHTML = `<div class="empty"><h3>Your bag is empty</h3><p>Add some hair you love, then come back to check out.</p><p style="margin-top:20px"><a class="btn btn-dark" href="shop.html">Shop the hair ${ICON.arrow}</a></p></div>`;
      return;
    }
    root.innerHTML = `<div class="co-grid"><div>${user ? form() : signInPanel()}</div>${summary(lines)}</div>`;
    if (!user) {
      window.GBG_AUTH.render(root.querySelector("[data-auth]"), {
        title: "Sign in to check out",
        text: "Sign in or create an account so you can track this order and check out faster next time. Your bag is saved.",
        onSignedIn: () => {}
      });
    }
    updatePay();
  }

  function updatePay() {
    const btn = root.querySelector("[data-pay]");
    if (!btn) return;
    const lines = bagLines();
    const zone = (window.GBG_ZONES || []).find((z) => z.id === zoneId);
    const total = lines.reduce((s, l) => s + l.qty * l.price, 0) + (zone ? zone.fee : 0);
    btn.textContent = busy ? "Connecting to Paystack…" : `Pay ${naira(total)} securely`;
    btn.disabled = busy;
  }

  function showError(msg) {
    const el = root.querySelector("[data-error]");
    if (!el) return alert(msg);
    el.textContent = msg;
    el.hidden = !msg;
    if (msg) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  async function pay(formEl) {
    const f = new FormData(formEl);
    const get = (k) => String(f.get(k) || "").trim();
    const missing = [["name", "your full name"], ["phone", "your phone number"], ["address", "your street address"], ["city", "your city / area"], ["state", "your state"]]
      .filter(([k]) => !get(k));
    if (missing.length) return showError(`Please enter ${missing.map((m) => m[1]).join(", ")}.`);
    if (!/^[+\d][\d\s-]{6,}$/.test(get("phone"))) return showError("Please enter a valid phone number.");
    if (!zoneId) return showError("Please choose a delivery option.");
    const lines = bagLines();
    if (lines.some((l) => !inStock(l.v) || (l.v.stock != null && l.qty > l.v.stock) || (l.p.colors.length && !l.p.colors.includes(l.color)))) {
      return showError("Some items in your bag are sold out or low in stock. Please update your bag.");
    }

    busy = true;
    showError("");
    updatePay();
    try {
      const res = await API.fn("checkout", {
        items: lines.map((l) => ({ product_id: l.id, length: l.len, color: l.color, qty: l.qty })),
        zone_id: zoneId,
        customer: { name: get("name"), phone: get("phone"), address: get("address"), city: get("city"), state: get("state"), notes: get("notes") },
        save_details: f.get("save") === "on",
        return_url: new URL("order.html", location.href).href
      });
      // the order now exists in the account (awaiting payment), so the bag can be emptied
      clearBag();
      location.href = res.authorization_url;
    } catch (err) {
      busy = false;
      updatePay();
      showError(err.message);
    }
  }

  root.addEventListener("click", async (e) => {
    if (e.target.closest("[data-signout]")) {
      await API.signOut();
    } else if (e.target.closest("[data-edit-bag]")) {
      openBag();
    }
  });
  root.addEventListener("change", (e) => {
    if (e.target.name === "zone") {
      zoneId = e.target.value;
      showError("");
      const aside = root.querySelector(".co-summary");
      if (aside) aside.outerHTML = summary(bagLines());
      updatePay();
    }
  });
  root.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!busy) pay(e.target);
  });

  // keep the summary in sync when the bag drawer is edited
  document.querySelector("[data-drawer]").addEventListener("click", () => setTimeout(() => {
    if (busy) return;
    const lines = bagLines();
    const aside = root.querySelector(".co-summary");
    if (!lines.length || !aside) render();
    else { aside.outerHTML = summary(lines); updatePay(); }
  }));

  async function loadUser(u) {
    user = u;
    profile = null;
    if (user) {
      const { data } = await API.client.from("profiles").select("*").eq("id", user.id).maybeSingle();
      profile = data;
    }
    render();
  }

  API.ready.then(async () => {
    if (API.catalogError) return render();
    await loadUser(await API.user());
    API.onAuth((u) => { if ((u && u.id) !== (user && user.id)) loadUser(u); });
  });
})();
