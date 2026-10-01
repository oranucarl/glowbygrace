/* =========================================================
   Glow by Grace — store admin
   Orders, products (with photos, lengths, prices, stock),
   delivery zones and admin access. Only emails listed in the
   `admins` table can use it — enforced by the database.
   ========================================================= */
(function () {
  const { naira, esc, ICON, toast } = window.GBG;
  const API = window.GBG_API;
  const O = window.GBG_ORDERS;
  const db = API.client;
  const root = document.querySelector("[data-admin]");
  const CATS = window.GBG_CATEGORIES.filter((c) => c.key !== "all");
  const BUCKET = "product-images";

  let user = null;
  let tab = "overview";
  let orders = [];
  let products = [];
  let zones = [];
  const filter = { status: "open", q: "" };

  const dialog = document.createElement("dialog");
  dialog.className = "adm-dialog";
  document.body.append(dialog);
  dialog.addEventListener("click", (e) => { if (e.target === dialog || e.target.closest("[data-close-dialog]")) dialog.close(); });

  const slugify = (s) => s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_-]+/g, "-").replace(/^-|-$/g, "");
  const waNumber = (phone) => {
    const d = String(phone || "").replace(/\D/g, "");
    return d.startsWith("0") ? "234" + d.slice(1) : d;
  };
  const fail = (error) => { if (error) { toast(error.message); throw error; } };

  /* ---------- Data ---------- */
  async function loadOrders() {
    const { data, error } = await db
      .from("orders")
      .select("*, order_items(*), order_events(*)")
      .order("created_at", { ascending: false })
      .order("created_at", { referencedTable: "order_events" })
      .limit(1000);
    fail(error);
    orders = data;
  }
  async function loadProducts() {
    const { data, error } = await db.from("products").select("*, product_variants(*)").order("sort").order("name");
    fail(error);
    products = data.map(API.mapProduct);
  }
  async function loadZones() {
    const { data, error } = await db.from("delivery_zones").select("*").order("sort");
    fail(error);
    zones = data;
  }

  /* ---------- Shell ---------- */
  const TABS = [["overview", "Overview"], ["orders", "Orders"], ["products", "Products"], ["delivery", "Delivery"], ["admins", "Admins"]];

  function shell() {
    root.innerHTML = `
      <div class="adm-head">
        <div><div class="eyebrow">Glow by Grace</div><h1 class="display">Store <em>admin</em></h1></div>
        <div class="adm-who"><span class="muted">${esc(user.email)}</span><a class="btn btn-ghost" href="account.html">My account</a></div>
      </div>
      <div class="tabs" role="tablist">${TABS.map(([k, l]) => `<button role="tab" data-tab="${k}" class="${tab === k ? "active" : ""}">${l}</button>`).join("")}</div>
      <div data-body><p class="loading-note">Loading…</p></div>`;
  }
  const body = () => root.querySelector("[data-body]");

  async function show(next) {
    tab = next;
    root.querySelectorAll("[data-tab]").forEach((b) => b.classList.toggle("active", b.dataset.tab === tab));
    body().innerHTML = `<p class="loading-note">Loading…</p>`;
    try {
      if (tab === "overview" || tab === "orders") await loadOrders();
      if (tab === "products") await loadProducts();
      if (tab === "delivery") await loadZones();
      ({ overview, orders: ordersTab, products: productsTab, delivery: deliveryTab, admins: adminsTab })[tab]();
    } catch (err) {
      body().innerHTML = `<p class="loading-note">${esc(err.message)}</p>`;
    }
  }

  /* ---------- Overview ---------- */
  function overview() {
    const paid = orders.filter((o) => o.paid_at && o.status !== "cancelled");
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonth = paid.filter((o) => new Date(o.paid_at) >= monthStart);
    const toFulfil = orders.filter((o) => o.status === "paid" || o.status === "processing");
    const shipping = orders.filter((o) => o.status === "shipped");
    const awaiting = orders.filter((o) => o.status === "pending_payment");
    const stat = (label, value, sub, go) => `<button class="stat card" ${go ? `data-go="${go}"` : ""}><small>${label}</small><b>${value}</b>${sub ? `<span>${sub}</span>` : ""}</button>`;
    body().innerHTML = `
      <div class="stats">
        ${stat("Revenue this month", naira(thisMonth.reduce((s, o) => s + o.total, 0)), `${thisMonth.length} paid order${thisMonth.length === 1 ? "" : "s"}`)}
        ${stat("Revenue all time", naira(paid.reduce((s, o) => s + o.total, 0)), `${paid.length} paid order${paid.length === 1 ? "" : "s"}`)}
        ${stat("To prepare / send", toFulfil.length, "paid or being prepared", "open")}
        ${stat("On the way", shipping.length, "shipped, not yet delivered", "shipped")}
        ${stat("Awaiting payment", awaiting.length, "checkout started, not paid", "pending_payment")}
      </div>
      <h2 class="sub">Needs attention <span>${toFulfil.length}</span></h2>
      ${toFulfil.length ? orderTable(toFulfil.slice(0, 10)) : `<p class="muted">Nothing waiting — every paid order has been sent. ✦</p>`}`;
  }

  /* ---------- Orders ---------- */
  function orderTable(list) {
    return `<div class="table-wrap"><table class="adm-table">
      <thead><tr><th>Order</th><th>Date</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th></tr></thead>
      <tbody>${list.map((o) => `
        <tr data-open-order="${o.id}" tabindex="0">
          <td><b>${esc(o.order_number)}</b></td>
          <td>${O.when(o.created_at)}</td>
          <td>${esc(o.customer_name)}<small>${esc(o.delivery_zone_name)} · ${esc(o.state)}</small></td>
          <td>${o.order_items.reduce((s, i) => s + i.quantity, 0)}</td>
          <td><b>${naira(o.total)}</b></td>
          <td>${O.statusPill(o.status)}</td>
        </tr>`).join("")}
      </tbody></table></div>`;
  }

  function ordersTab() {
    const q = filter.q.toLowerCase();
    const list = orders.filter((o) => {
      if (filter.status === "open" && !["paid", "processing", "shipped"].includes(o.status)) return false;
      if (!["all", "open"].includes(filter.status) && o.status !== filter.status) return false;
      return !q || [o.order_number, o.customer_name, o.email, o.phone].some((v) => String(v).toLowerCase().includes(q));
    });
    body().innerHTML = `
      <div class="adm-toolbar">
        <select class="select" data-filter-status>
          <option value="open">Open (paid → shipped)</option>
          <option value="all">All orders</option>
          ${Object.entries(O.STATUS).map(([k, v]) => `<option value="${k}">${v.label}</option>`).join("")}
        </select>
        <input class="input" type="search" data-filter-q placeholder="Search order no., name, email, phone" value="${esc(filter.q)}">
        <span class="muted">${list.length} order${list.length === 1 ? "" : "s"}</span>
      </div>
      ${list.length ? orderTable(list) : `<p class="muted">No orders match.</p>`}`;
    body().querySelector("[data-filter-status]").value = filter.status;
  }

  function openOrder(id) {
    const o = orders.find((x) => x.id === id);
    if (!o) return;
    const next = { paid: "processing", processing: "shipped", shipped: "delivered" }[o.status];
    dialog.innerHTML = `
      <div class="dlg-head">
        <div><small class="muted">Order</small><h3>${esc(o.order_number)}</h3></div>
        ${O.statusPill(o.status)}
        <button class="close-x" data-close-dialog aria-label="Close">${ICON.close}</button>
      </div>
      <div class="dlg-body">
        <div class="adm-contact">
          <div><small>Customer</small><b>${esc(o.customer_name)}</b><span>${esc(o.email)} · ${esc(o.phone)}</span></div>
          <a class="btn btn-wa" target="_blank" rel="noopener" href="https://wa.me/${waNumber(o.phone)}?text=${encodeURIComponent(`Hi ${o.customer_name.split(" ")[0]}, this is Glow by Grace about your order ${o.order_number}.`)}">${ICON.wa} WhatsApp</a>
          <a class="btn btn-ghost" href="mailto:${esc(o.email)}?subject=${encodeURIComponent(`Your Glow by Grace order ${o.order_number}`)}">Email</a>
        </div>
        ${O.orderDetail(o)}
        <div class="adm-status">
          <label class="field"><span>Update status</span>
            <select data-status>${Object.entries(O.STATUS).map(([k, v]) => `<option value="${k}"${k === o.status ? " selected" : ""}>${v.label}</option>`).join("")}</select>
          </label>
          <button class="btn btn-dark" data-save-status="${o.id}">Save status</button>
          ${next ? `<button class="btn btn-gold" data-quick-status="${next}" data-id="${o.id}">Mark as “${O.STATUS[next].label}”</button>` : ""}
        </div>
        <p class="muted small">Placed ${O.when(o.created_at)} · Last updated ${O.when(o.updated_at)}</p>
      </div>`;
    if (!dialog.open) dialog.showModal();
    history.replaceState(null, "", `#order=${o.id}`);
  }
  dialog.addEventListener("close", () => { if (location.hash.startsWith("#order=")) history.replaceState(null, "", location.pathname); });

  async function setStatus(id, status) {
    const o = orders.find((x) => x.id === id);
    if (o.status === status) return toast("Status unchanged");
    if (status === "pending_payment" && o.paid_at) return toast("This order is already paid.");
    if (status === "cancelled" && o.paid_at && !confirm("This order was paid. Cancel it? Remember to refund the customer from your Paystack dashboard.")) return;
    if (["paid", "processing", "shipped", "delivered"].includes(status) && !o.paid_at && !confirm("This order has no confirmed Paystack payment. Change the status anyway?")) return;
    const { error } = await db.from("orders").update({ status }).eq("id", id);
    fail(error);
    await loadOrders();
    toast(`${o.order_number}: ${O.STATUS[status].label}`);
    openOrder(id);
    if (tab === "orders") ordersTab(); else if (tab === "overview") overview();
  }

  /* ---------- Products ---------- */
  function productsTab() {
    body().innerHTML = `
      <div class="adm-toolbar">
        <button class="btn btn-dark" data-new-product>+ Add product</button>
        <span class="muted">${products.length} product${products.length === 1 ? "" : "s"} · ${products.filter((p) => p.active).length} live on the shop</span>
      </div>
      <div class="table-wrap"><table class="adm-table">
        <thead><tr><th></th><th>Product</th><th>Category</th><th>Lengths &amp; prices</th><th>Stock</th><th>Live</th></tr></thead>
        <tbody>${products.map((p) => {
          const tracked = p.lengths.filter((l) => l.stock !== null);
          const stock = !tracked.length ? "Not tracked" : tracked.map((l) => `${esc(l.len)}: ${l.stock === 0 ? `<span class="err">0</span>` : l.stock}`).join("<br>");
          return `
          <tr data-edit-product="${esc(p.id)}" tabindex="0">
            <td>${p.model ? `<img class="adm-thumb" src="${esc(p.model)}" alt="">` : ""}</td>
            <td><b>${esc(p.name)}</b>${p.featured ? ` <span class="pill pill-info">Featured</span>` : ""}<small>${esc(p.tagline)}</small></td>
            <td>${esc((CATS.find((c) => c.key === p.category) || { label: p.category }).label)}</td>
            <td>${p.lengths.map((l) => `${esc(l.len)} · ${naira(l.price)}`).join("<br>") || `<span class="err">No lengths</span>`}${p.colors.length ? `<small>Colours: ${esc(p.colors.join(", "))}</small>` : ""}</td>
            <td>${stock}</td>
            <td>${p.active ? `<span class="pill pill-ok">Live</span>` : `<span class="pill pill-muted">Hidden</span>`}</td>
          </tr>`;
        }).join("")}</tbody>
      </table></div>`;
  }

  function variantRow(v = {}) {
    return `<div class="var-row" data-variant="${v.id || ""}">
      <input class="input" name="len" placeholder='Length e.g. 22"' value="${esc(v.len || "")}">
      <input class="input" name="price" type="number" min="1" step="1" placeholder="Price ₦" value="${v.price || ""}">
      <input class="input" name="stock" type="number" min="0" step="1" placeholder="Stock (blank = not tracked)" value="${v.stock ?? ""}">
      <button type="button" class="link err" data-remove-variant aria-label="Remove length">Remove</button>
    </div>`;
  }

  function imageField(name, label, url) {
    return `<div class="field img-field" data-img-field="${name}">
      <span>${label}</span>
      <div class="img-pick">
        <img data-preview src="${esc(url || "")}" alt=""${url ? "" : " hidden"}>
        <div>
          <input class="input" name="${name}" placeholder="Image URL" value="${esc(url || "")}">
          <label class="btn btn-ghost btn-sm">Upload photo<input type="file" accept="image/*" hidden data-upload="${name}"></label>
        </div>
      </div>
    </div>`;
  }

  function editProduct(id) {
    const p = id ? products.find((x) => x.id === id) : null;
    const v = (k) => esc(p ? p[k] || "" : "");
    dialog.innerHTML = `
      <form data-product-form="${p ? esc(p.id) : ""}">
        <div class="dlg-head"><h3>${p ? `Edit ${esc(p.name)}` : "New product"}</h3><button type="button" class="close-x" data-close-dialog aria-label="Close">${ICON.close}</button></div>
        <div class="dlg-body">
          <div class="fields">
            <label class="field"><span>Name</span><input class="input" name="name" required value="${v("name")}"></label>
            <label class="field"><span>Web address (ID)</span><input class="input" name="id" ${p ? "disabled" : ""} pattern="[a-z0-9]+(-[a-z0-9]+)*" placeholder="auto from name" value="${v("id")}"></label>
            <label class="field"><span>Category</span><select class="select" name="category">${CATS.map((c) => `<option value="${c.key}"${p && p.category === c.key ? " selected" : ""}>${c.label}</option>`).join("")}</select></label>
            <label class="field"><span>Short line under the name</span><input class="input" name="tagline" placeholder="e.g. 13x4 HD lace frontal" value="${v("tagline")}"></label>
            <label class="field"><span>Badge (optional)</span><input class="input" name="badge" placeholder="e.g. Bestseller, New in" value="${v("badge")}"></label>
            <label class="field"><span>Display order</span><input class="input" name="sort" type="number" value="${p ? p.sort : products.length + 1}"></label>
            <label class="field"><span>Lace</span><input class="input" name="lace" value="${p && p.lace !== "—" ? v("lace") : ""}"></label>
            <label class="field"><span>Density</span><input class="input" name="density" value="${p && p.density !== "—" ? v("density") : ""}"></label>
            <label class="field wide"><span>Colours <i>(optional — separate with commas, e.g. Natural black, 1B, Honey blonde. Leave empty if there's no colour choice)</i></span><input class="input" name="colors" value="${p ? esc(p.colors.join(", ")) : ""}"></label>
            <label class="field wide"><span>Description</span><textarea class="input" name="description" rows="3">${v("desc")}</textarea></label>
            ${imageField("model_url", "Main photo (hair being worn)", p && p.model)}
            ${imageField("sample_url", "Close-up photo (shown on hover)", p && p.sample)}
          </div>
          <h4>Lengths, prices &amp; stock</h4>
          <p class="muted small">Leave stock blank if you don't track it. Set it to 0 to show that length as sold out.</p>
          <div data-variants>${(p ? p.lengths : [{}]).map(variantRow).join("")}</div>
          <button type="button" class="link" data-add-variant>+ Add another length</button>
          <div class="checks">
            <label class="check"><input type="checkbox" name="active"${!p || p.active ? " checked" : ""}> Live on the shop</label>
            <label class="check"><input type="checkbox" name="featured"${p && p.featured ? " checked" : ""}> Feature on the home page</label>
          </div>
        </div>
        <div class="dlg-foot">
          ${p ? `<button type="button" class="link err" data-delete-product="${esc(p.id)}">Delete product</button>` : "<span></span>"}
          <button class="btn btn-dark" data-save-product>Save product</button>
        </div>
      </form>`;
    if (!dialog.open) dialog.showModal();
  }

  async function uploadImage(input) {
    const file = input.files[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) return toast("Please choose an image under 8MB");
    const form = input.closest("form");
    const field = input.closest("[data-img-field]");
    const name = form.elements.name.value || "product";
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `${slugify(name) || "product"}/${Date.now()}.${ext}`;
    toast("Uploading photo…");
    const { error } = await db.storage.from(BUCKET).upload(path, file, { cacheControl: "31536000", contentType: file.type });
    if (error) return toast(error.message);
    const url = db.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
    field.querySelector(`input[name="${input.dataset.upload}"]`).value = url;
    const img = field.querySelector("[data-preview]");
    img.src = url;
    img.hidden = false;
    toast("Photo uploaded ✦");
  }

  async function saveProduct(form) {
    const existingId = form.dataset.productForm;
    const el = form.elements;
    const name = el.name.value.trim();
    if (!name) return toast("Please enter a product name");
    const id = existingId || slugify(el.id.value.trim() || name);
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id)) return toast("The web address may only use lowercase letters, numbers and dashes");

    const variants = [...form.querySelectorAll("[data-variant]")].map((row, i) => ({
      id: row.dataset.variant || null,
      length: row.querySelector('[name="len"]').value.trim(),
      price: parseInt(row.querySelector('[name="price"]').value, 10),
      stock: row.querySelector('[name="stock"]').value === "" ? null : parseInt(row.querySelector('[name="stock"]').value, 10),
      sort: i + 1
    }));
    if (!variants.length) return toast("Add at least one length");
    if (variants.some((v) => !v.length || !(v.price > 0))) return toast("Every length needs a name and a price");
    if (variants.some((v) => v.stock !== null && !(v.stock >= 0))) return toast("Stock must be 0 or more");
    if (new Set(variants.map((v) => v.length)).size !== variants.length) return toast("Each length can only appear once");

    const row = {
      name,
      category: el.category.value,
      tagline: el.tagline.value.trim() || null,
      badge: el.badge.value.trim() || null,
      lace: el.lace.value.trim() || null,
      density: el.density.value.trim() || null,
      description: el.description.value.trim() || null,
      colors: [...new Set(el.colors.value.split(",").map((c) => c.trim()).filter(Boolean))],
      model_url: el.model_url.value.trim() || null,
      sample_url: el.sample_url.value.trim() || null,
      sort: parseInt(el.sort.value, 10) || 0,
      active: el.active.checked,
      featured: el.featured.checked
    };
    const btn = form.querySelector("[data-save-product]");
    btn.disabled = true;
    try {
      if (existingId) {
        fail((await db.from("products").update(row).eq("id", id)).error);
      } else {
        const { error } = await db.from("products").insert({ id, ...row });
        if (error && error.code === "23505") throw new Error("A product with this web address already exists — change the name or ID.");
        fail(error);
      }
      // sync lengths: remove deleted ones first so renamed lengths don't clash
      const before = existingId ? products.find((p) => p.id === id).lengths.map((l) => l.id) : [];
      const keep = variants.filter((v) => v.id).map((v) => v.id);
      const removed = before.filter((vid) => !keep.includes(vid));
      if (removed.length) fail((await db.from("product_variants").delete().in("id", removed)).error);
      // park kept rows on temporary names so swapping lengths between rows can't hit the unique rule
      for (const v of variants.filter((v) => v.id)) {
        fail((await db.from("product_variants").update({ length: `__tmp-${v.id}` }).eq("id", v.id)).error);
      }
      for (const v of variants) {
        const data = { product_id: id, length: v.length, price: v.price, stock: v.stock, sort: v.sort };
        fail((v.id ? await db.from("product_variants").update(data).eq("id", v.id) : await db.from("product_variants").insert(data)).error);
      }
      dialog.close();
      toast(`${name} saved ✦`);
      await loadProducts();
      productsTab();
    } catch (err) {
      toast(err.message);
    } finally {
      btn.disabled = false;
    }
  }

  async function deleteProduct(id) {
    const p = products.find((x) => x.id === id);
    if (!confirm(`Delete ${p.name}? Past orders keep their details. To just hide it from the shop, untick “Live on the shop” instead.`)) return;
    fail((await db.from("products").delete().eq("id", id)).error);
    dialog.close();
    toast(`${p.name} deleted`);
    await loadProducts();
    productsTab();
  }

  /* ---------- Delivery zones ---------- */
  function zoneRow(z = {}) {
    return `<form class="zone-row card" data-zone="${z.id || ""}">
      <label class="field"><span>Name</span><input class="input" name="name" required value="${esc(z.name || "")}" placeholder="e.g. Within Lagos"></label>
      <label class="field"><span>Fee (₦)</span><input class="input" name="fee" type="number" min="0" step="1" required value="${z.fee ?? ""}" placeholder="0 = free"></label>
      <label class="field grow"><span>Description shown at checkout</span><input class="input" name="description" value="${esc(z.description || "")}" placeholder="e.g. Same-day or next-day delivery"></label>
      <label class="field states"><span>States covered <i>(comma separated — leave empty for “all other states”)</i></span><input class="input" name="states" list="ng-states" value="${esc((z.states || []).join(", "))}" placeholder="All other states"></label>
      <label class="field"><span>Order</span><input class="input" name="sort" type="number" value="${z.sort ?? zones.length + 1}"></label>
      <label class="check"><input type="checkbox" name="active"${z.active === false ? "" : " checked"}> Available</label>
      <div class="zone-btns"><button class="btn btn-dark btn-sm">Save</button>${z.id ? `<button type="button" class="link err" data-delete-zone="${z.id}">Delete</button>` : ""}</div>
    </form>`;
  }

  function deliveryTab() {
    body().innerHTML = `
      <p class="muted">At checkout the customer's <b>state</b> picks the delivery option automatically: the option that lists their state applies, otherwise the one with no states listed (“all other states”). Customers see every option, with theirs marked “Applied”. Untick “Available” to hide an option without deleting it.</p>
      <datalist id="ng-states">${window.GBG_STATES.map((s) => `<option value="${s}">`).join("")}</datalist>
      <div data-zones>${zones.map(zoneRow).join("")}</div>
      <button class="btn btn-ghost" data-add-zone>+ Add delivery option</button>`;
  }

  async function saveZone(form) {
    const el = form.elements;
    const fee = parseInt(el.fee.value, 10);
    if (!el.name.value.trim()) return toast("Please enter a name");
    if (!(fee >= 0)) return toast("Fee must be 0 or more");
    const states = [...new Set(el.states.value.split(",").map((s) => s.trim()).filter(Boolean))];
    const unknown = states.filter((s) => !window.GBG_STATES.some((x) => x.toLowerCase() === s.toLowerCase()));
    if (unknown.length) return toast(`Not a state on the checkout list: ${unknown.join(", ")}. Use names like “Lagos”, “FCT (Abuja)”.`);
    const fixed = states.map((s) => window.GBG_STATES.find((x) => x.toLowerCase() === s.toLowerCase()));
    const row = { name: el.name.value.trim(), fee, description: el.description.value.trim() || null, states: fixed, sort: parseInt(el.sort.value, 10) || 0, active: el.active.checked };
    const id = form.dataset.zone;
    fail((id ? await db.from("delivery_zones").update(row).eq("id", id) : await db.from("delivery_zones").insert(row)).error);
    toast("Delivery option saved ✦");
    await loadZones();
    deliveryTab();
  }

  /* ---------- Admins ---------- */
  async function adminsTab() {
    const { data, error } = await db.from("admins").select("*").order("created_at");
    fail(error);
    body().innerHTML = `
      <p class="muted">People who can open this dashboard. They sign in with the Google account for that email.</p>
      <div class="card adm-list">${data.map((a) => `
        <div class="adm-list-row"><b>${esc(a.email)}</b><small class="muted">added ${O.day(a.created_at)}</small>
        ${a.email === (user.email || "").toLowerCase() ? `<span class="muted small">you</span>` : `<button class="link err" data-remove-admin="${esc(a.email)}">Remove</button>`}</div>`).join("")}
      </div>
      <form class="adm-toolbar" data-add-admin>
        <input class="input" name="email" type="email" required placeholder="name@gmail.com">
        <button class="btn btn-dark">Add admin</button>
      </form>`;
  }

  /* ---------- Events ---------- */
  root.addEventListener("click", async (e) => {
    const t = e.target.closest("button, tr, [data-go]");
    if (!t) return;
    if (t.dataset.tab) return show(t.dataset.tab);
    if (t.dataset.go) { filter.status = t.dataset.go; return show("orders"); }
    if (t.dataset.openOrder) return openOrder(t.dataset.openOrder);
    if (t.dataset.editProduct) return editProduct(t.dataset.editProduct);
    if (t.hasAttribute("data-new-product")) return editProduct(null);
    if (t.hasAttribute("data-add-zone")) return root.querySelector("[data-zones]").insertAdjacentHTML("beforeend", zoneRow());
    if (t.dataset.deleteZone) {
      if (!confirm("Delete this delivery option? Past orders keep their delivery details.")) return;
      fail((await db.from("delivery_zones").delete().eq("id", t.dataset.deleteZone)).error);
      await loadZones();
      return deliveryTab();
    }
    if (t.dataset.removeAdmin) {
      if (!confirm(`Remove ${t.dataset.removeAdmin} as an admin?`)) return;
      fail((await db.from("admins").delete().eq("email", t.dataset.removeAdmin)).error);
      return adminsTab();
    }
  });
  root.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && e.target.matches("tr[tabindex]")) e.target.click();
  });
  root.addEventListener("change", (e) => {
    if (e.target.matches("[data-filter-status]")) { filter.status = e.target.value; ordersTab(); }
  });
  root.addEventListener("input", (e) => {
    if (e.target.matches("[data-filter-q]")) {
      filter.q = e.target.value;
      const pos = e.target.selectionStart;
      ordersTab();
      const q = root.querySelector("[data-filter-q]");
      q.focus();
      q.setSelectionRange(pos, pos);
    }
  });
  root.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (e.target.matches("[data-zone]")) return saveZone(e.target);
    if (e.target.matches("[data-add-admin]")) {
      const email = e.target.elements.email.value.trim().toLowerCase();
      const { error } = await db.from("admins").insert({ email });
      if (error) return toast(error.code === "23505" ? "Already an admin" : error.message);
      toast(`${email} added ✦`);
      return adminsTab();
    }
  });

  dialog.addEventListener("click", (e) => {
    const t = e.target.closest("button");
    if (!t) return;
    if (t.dataset.saveStatus) return setStatus(t.dataset.saveStatus, dialog.querySelector("[data-status]").value);
    if (t.dataset.quickStatus) return setStatus(t.dataset.id, t.dataset.quickStatus);
    if (t.hasAttribute("data-add-variant")) return dialog.querySelector("[data-variants]").insertAdjacentHTML("beforeend", variantRow());
    if (t.hasAttribute("data-remove-variant")) return t.closest("[data-variant]").remove();
    if (t.dataset.deleteProduct) return deleteProduct(t.dataset.deleteProduct);
  });
  dialog.addEventListener("change", (e) => {
    if (e.target.matches("[data-upload]")) uploadImage(e.target);
  });
  dialog.addEventListener("input", (e) => {
    const field = e.target.closest("[data-img-field]");
    if (field && e.target.classList.contains("input")) {
      const img = field.querySelector("[data-preview]");
      img.src = e.target.value;
      img.hidden = !e.target.value;
    }
  });
  dialog.addEventListener("submit", (e) => {
    e.preventDefault();
    if (e.target.matches("[data-product-form]")) saveProduct(e.target);
  });

  /* ---------- Start ---------- */
  async function start(u) {
    user = u;
    if (!API.configured) { root.innerHTML = `<p class="loading-note">${esc(API.catalogError || "The shop isn't connected yet.")}</p>`; return; }
    if (!user) {
      root.innerHTML = `<div class="auth-center" data-auth></div>`;
      window.GBG_AUTH.render(root.querySelector("[data-auth]"), { title: "Store admin", text: "Sign in with an admin account." });
      return;
    }
    if (!(await API.isAdmin())) {
      root.innerHTML = `<div class="empty"><h3>No admin access</h3><p>${esc(user.email)} isn't an admin for this store. Ask an existing admin to add you.</p><p style="margin-top:20px"><a class="btn btn-dark" href="account.html">My account</a></p></div>`;
      return;
    }
    shell();
    const deepOrder = (location.hash.match(/^#order=([\w-]+)/) || [])[1];
    await show(deepOrder ? "orders" : "overview");
    if (deepOrder) { filter.status = "all"; ordersTab(); openOrder(deepOrder); }
  }

  (async () => {
    await start(await API.user());
    API.onAuth((u) => { if ((u && u.id) !== (user && user.id)) start(u); });
  })();
})();
