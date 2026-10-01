/* =========================================================
   Glow by Grace — shared layout, bag, product cards
   ========================================================= */
(function () {
  const STORE = window.GBG_STORE;
  const PRODUCTS = window.GBG_PRODUCTS;
  const API = window.GBG_API;

  /* ---------- Icons ---------- */
  const ICON = {
    // girl's head logo mark (profile with flowing hair)
    head: `<svg class="brand-mark" viewBox="0 0 64 64" aria-hidden="true">
      <defs><linearGradient id="gbgGold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e2c08a"/><stop offset="1" stop-color="#a87a3f"/></linearGradient></defs>
      <circle cx="32" cy="32" r="31" fill="none" stroke="url(#gbgGold)" stroke-width="1.4"/>
      <path fill="currentColor" d="M35.5 9.5c-9.8-.9-18 6.2-18.6 16-.4 6.3-2.4 11.4-6.6 16.2 3.4.6 6.6-.2 9.2-2.2-.6 5.4-3 9.9-7 13.8 7.8.6 14.4-3.4 17.6-10 1.4 4.8.8 9.6-2 14 6.6-1.8 11-7 11.8-14.2l.4-5.8c-3.8-.6-6.4-3.8-6.4-7.8 0-4.6 3.4-8.2 7.8-8.6-1.2-6.4-3.8-10.8-6.2-11.4z"/>
      <path fill="none" stroke="url(#gbgGold)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M41.2 12.2c4.6 2.4 7.2 7 7.2 12.2l3.4 5.6-3.4 1.2.6 3.2c.3 1.8-.8 3.2-2.6 3.4l-2.6.2-.8 6"/>
      <path fill="url(#gbgGold)" d="M50 16.5l.9 2.2 2.2.9-2.2.9-.9 2.2-.9-2.2-2.2-.9 2.2-.9z"/>
    </svg>`,
    bag: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 8h14l-1.2 11.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8z"/><path d="M9 10V6.5a3 3 0 0 1 6 0V10"/></svg>`,
    sparkle: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0l2.6 9.4L24 12l-9.4 2.6L12 24l-2.6-9.4L0 12l9.4-2.6z"/></svg>`,
    close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>`,
    wa: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.4-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.6-.4zM12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2z"/></svg>`,
    user: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.4-6 8-6s6.5 2 8 6"/></svg>`,
    google: `<svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>`,
    arrow: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`
  };
  window.GBG_ICON = ICON;

  /* ---------- Helpers ---------- */
  const naira = (n) => "₦" + Number(n).toLocaleString("en-NG");
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const inStock = (l) => l.stock === null || l.stock === undefined || l.stock > 0;
  const soldOut = (p) => !p.lengths.some(inStock);
  const minPrice = (p) => Math.min(...(p.lengths.filter(inStock).length ? p.lengths.filter(inStock) : p.lengths).map((l) => l.price));
  const byId = (id) => PRODUCTS.find((p) => p.id === id);
  const waLink = (text) =>
    `https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent(text)}`;
  const page = document.body.dataset.page || "home";

  window.GBG = { naira, esc, inStock, soldOut, minPrice, byId, waLink, ICON, ready: API.ready };

  /* ---------- Header ---------- */
  const header = document.createElement("header");
  header.className = "site-header" + (page === "home" ? " on-hero" : "");
  header.innerHTML = `
    <div class="container header-inner">
      <nav class="nav-left" aria-label="Main">
        <a class="nav-link keep ${page === "home" ? "active" : ""}" href="index.html">Home</a>
        <button class="ask-pill" data-open-chat aria-label="Ask Grace, our hair assistant"><span class="dot"></span><span class="label">Ask Grace</span></button>
      </nav>
      <div class="brand-cluster">
        <a class="brand" href="index.html" aria-label="Glow by Grace home">
          ${ICON.head}
          <span class="brand-word">Glow<small>by</small>Grace</span>
        </a>
        <a class="shop-badge" href="shop.html" aria-label="Shop all hair">
          <svg class="ring" viewBox="0 0 100 100" aria-hidden="true">
            <defs><path id="shopCircle" d="M50,50 m-40,0 a40,40 0 1,1 80,0 a40,40 0 1,1 -80,0"/></defs>
            <text><textPath href="#shopCircle">shop the glow ✦ shop the glow ✦ </textPath></text>
          </svg>
          <span class="core">${ICON.bag}</span>
          <span class="sparkle">${ICON.sparkle}</span>
          <span class="count" data-bag-count>0</span>
        </a>
      </div>
      <div class="nav-right">
        <a class="icon-btn account-btn" href="account.html" data-account aria-label="Your account" title="Your account">${ICON.user}</a>
        <button class="icon-btn" data-open-bag aria-label="Open bag">${ICON.bag}</button>
      </div>
    </div>`;
  document.body.prepend(header);

  const announce = document.createElement("div");
  announce.className = "announce";
  announce.innerHTML = `Same-day delivery in Lagos ✦ Nationwide shipping ✦ <a href="${waLink("Hi Glow by Grace! I have a question.")}" target="_blank" rel="noopener">Chat on WhatsApp</a>`;
  document.body.prepend(announce);

  if (page === "home") {
    const onScroll = () => {
      const hero = document.querySelector(".hero");
      const limit = hero ? hero.offsetHeight - 120 : 200;
      header.classList.toggle("on-hero", window.scrollY < limit);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Footer ---------- */
  const footer = document.createElement("footer");
  footer.className = "site-footer";
  footer.innerHTML = `
    <div class="container">
      <p class="footer-big">Glow <span class="script">by</span> Grace</p>
      <div class="footer-grid">
        <div>
          <h5>Hair that loves you back</h5>
          <p>Premium human hair wigs, bundles and closures, curated in Lagos for queens everywhere. Every unit is checked by hand before it leaves us.</p>
        </div>
        <div>
          <h5>Explore</h5>
          <a href="index.html">Home</a><br>
          <a href="shop.html">Shop all hair</a><br>
          <a href="#" data-open-chat>Ask Grace (hair assistant)</a><br>
          <a href="account.html">My account &amp; orders</a>
        </div>
        <div>
          <h5>Shop by style</h5>
          <a href="shop.html?cat=straight">Bone straight</a><br>
          <a href="shop.html?cat=curly">Curly</a><br>
          <a href="shop.html?cat=bob">Bobs</a><br>
          <a href="shop.html?cat=braids">Braids</a>
        </div>
        <div>
          <h5>Talk to us</h5>
          <a href="${waLink("Hi Glow by Grace!")}" target="_blank" rel="noopener">WhatsApp ${STORE.whatsappDisplay}</a><br>
          <p>Mon – Sat · 9am – 7pm</p>
        </div>
      </div>
      <div class="footer-bottom">
        <span>© ${new Date().getFullYear()} Glow by Grace. All rights reserved. · <a href="privacy.html">Privacy</a> · <a href="terms.html">Terms</a></span>
        <span>Made with love in Lagos ✦</span>
      </div>
    </div>`;
  document.body.append(footer);

  /* ---------- Overlay, modal, drawer, toast ---------- */
  const shell = document.createElement("div");
  shell.innerHTML = `
    <div class="overlay" data-overlay></div>
    <div class="modal" role="dialog" aria-modal="true" aria-label="Product details" data-modal></div>
    <div class="config" role="dialog" aria-modal="true" aria-label="Choose your options" tabindex="-1" data-config></div>
    <aside class="drawer" aria-label="Your bag" data-drawer>
      <div class="drawer-head"><h3>Your bag</h3><button class="close-x" data-close aria-label="Close bag">${ICON.close}</button></div>
      <div class="drawer-items" data-bag-items></div>
      <div class="drawer-foot" data-bag-foot></div>
    </aside>
    <div class="toast" data-toast></div>`;
  document.body.append(...shell.children);

  const overlay = document.querySelector("[data-overlay]");
  const modal = document.querySelector("[data-modal]");
  const config = document.querySelector("[data-config]");
  const drawer = document.querySelector("[data-drawer]");
  const toastEl = document.querySelector("[data-toast]");

  let toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2200);
  }

  function closeAll() {
    overlay.classList.remove("open");
    modal.classList.remove("open");
    config.classList.remove("open");
    drawer.classList.remove("open");
    document.body.style.overflow = "";
  }
  overlay.addEventListener("click", closeAll);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeAll();
    const m = e.target.closest && e.target.closest(".product-media");
    if (m && (e.key === "Enter" || e.key === " ") && e.target === m) { e.preventDefault(); openQuick(m.dataset.quick); }
  });
  drawer.querySelector("[data-close]").addEventListener("click", closeAll);

  /* ---------- Bag (saved in this browser only) ---------- */
  const BAG_KEY = "gbg-bag-v1";
  let bag = [];
  try { bag = JSON.parse(localStorage.getItem(BAG_KEY)) || []; } catch (e) { bag = []; }
  const saveBag = () => { try { localStorage.setItem(BAG_KEY, JSON.stringify(bag)); } catch (e) {} };

  // how many of one length are already in the bag (across colours) — stock is per length
  const inBagQty = (id, len) => bag.filter((l) => l.id === id && l.len === len).reduce((s, l) => s + l.qty, 0);
  const optionLabel = (len, color) => [len, color].filter(Boolean).join(", ");

  // Adds a fully-chosen item. Without a length (or a required colour) it opens the options picker instead.
  function addToBag(id, len, color = null, qty = 1) {
    const p = byId(id);
    if (!p) return false;
    if (!len || (p.colors.length && !p.colors.includes(color))) { openConfig(id, { len, color }); return false; }
    if (!p.colors.length) color = null;
    const variant = p.lengths.find((l) => l.len === len);
    if (!variant || !inStock(variant)) { toast(`${p.name} (${len}) is sold out`); return false; }
    if (variant.stock != null && inBagQty(id, len) + qty > variant.stock) {
      toast(`Only ${variant.stock} of ${p.name} (${len}) available`);
      return false;
    }
    const line = bag.find((l) => l.id === id && l.len === len && (l.color || null) === color);
    if (line) line.qty += qty;
    else bag.push({ id, len, color, qty });
    saveBag();
    renderBag();
    toast(`${p.name} (${optionLabel(len, color)}) added to your bag ✦`);
    return true;
  }

  function bagLines() {
    return bag
      .map((l) => {
        const p = byId(l.id);
        if (!p) return null;
        const v = p.lengths.find((x) => x.len === l.len);
        if (!v) return null;
        return { ...l, color: l.color || null, p, v, price: v.price };
      })
      .filter(Boolean);
  }

  function renderBag() {
    const lines = bagLines();
    const count = lines.reduce((s, l) => s + l.qty, 0);
    document.querySelectorAll("[data-bag-count]").forEach((el) => {
      el.textContent = count;
      el.classList.toggle("show", count > 0);
    });
    const items = drawer.querySelector("[data-bag-items]");
    const foot = drawer.querySelector("[data-bag-foot]");
    if (!lines.length) {
      items.innerHTML = `<div class="drawer-empty"><h4>Your bag is empty</h4><p>Find a unit you love — or let Grace help you choose.</p></div>`;
      foot.innerHTML = `<a class="btn btn-dark" href="shop.html">Shop the hair ${ICON.arrow}</a>`;
      return;
    }
    items.innerHTML = lines
      .map(
        (l, i) => `
      <div class="bag-item">
        <img src="${l.p.model}" alt="${l.p.name}">
        <div>
          <h4>${l.p.name}</h4>
          <small>${esc(optionLabel(l.len, l.color))} · ${naira(l.price)}</small><br>
          <span class="qty"><button data-dec="${i}" aria-label="Decrease">−</button>${l.qty}<button data-inc="${i}" aria-label="Increase">+</button></span>
        </div>
        <button class="remove" data-rm="${i}">Remove</button>
      </div>`
      )
      .join("");
    const total = lines.reduce((s, l) => s + l.qty * l.price, 0);
    const zones = (window.GBG_ZONES || []).map((z) => `${esc(z.name)}: ${z.fee ? naira(z.fee) : "free"}`).join(" · ");
    foot.innerHTML = `
      <div class="total"><span>Subtotal</span><span>${naira(total)}</span></div>
      <p class="note">${zones ? `Delivery — ${zones}. ` : ""}Pay securely by card, bank transfer or USSD at checkout.</p>
      <a class="btn btn-dark" href="checkout.html">Checkout ${ICON.arrow}</a>
      <a class="bag-wa" target="_blank" rel="noopener" href="${waLink(orderMessage(lines, total))}">${ICON.wa} Questions first? Ask us on WhatsApp</a>`;
  }

  function clearBag() {
    bag = [];
    saveBag();
    renderBag();
  }

  function orderMessage(lines, total) {
    const rows = lines.map((l) => `• ${l.p.name} — ${optionLabel(l.len, l.color)} x${l.qty} (${naira(l.price * l.qty)})`).join("\n");
    return `Hi Glow by Grace! I'd like to order:\n${rows}\n\nSubtotal: ${naira(total)}\nPlease confirm availability and delivery. Thank you!`;
  }

  drawer.addEventListener("click", (e) => {
    const t = e.target.closest("button");
    if (!t) return;
    const inc = t.dataset.inc, dec = t.dataset.dec, rm = t.dataset.rm;
    const lines = bagLines();
    const idx = inc ?? dec ?? rm;
    if (idx === undefined) return;
    const target = lines[idx];
    const real = bag.find((l) => l.id === target.id && l.len === target.len && (l.color || null) === target.color);
    if (inc !== undefined) {
      if (target.v.stock != null && inBagQty(target.id, target.len) >= target.v.stock) return toast(`Only ${target.v.stock} of this length available`);
      real.qty++;
    }
    if (dec !== undefined) real.qty = Math.max(0, real.qty - 1);
    if (rm !== undefined || real.qty === 0) bag = bag.filter((l) => l !== real);
    saveBag();
    renderBag();
  });

  function openBag() {
    renderBag();
    overlay.classList.add("open");
    drawer.classList.add("open");
    document.body.style.overflow = "hidden";
  }

  /* ---------- Product card ---------- */
  function productCard(p) {
    const out = soldOut(p);
    const tag = out ? "Sold out" : p.badge;
    return `
      <article class="product-card reveal${out ? " sold-out" : ""}" data-id="${p.id}">
        <div class="product-media" data-quick="${p.id}" role="button" tabindex="0" aria-label="View ${p.name}">
          ${tag ? `<span class="tag">${tag}</span>` : ""}
          <span class="swap-hint"><span class="h">Hover to see hair</span><span class="t">Tap to see hair</span></span>
          <img class="img-model" src="${p.model}" alt="${p.name} worn by a model" loading="lazy">
          <img class="img-sample" src="${p.sample}" alt="${p.name} hair close-up" loading="lazy">
          <span class="product-actions">
            <button type="button" class="qv" data-quick="${p.id}">Quick view</button>
            ${out ? "" : `<button type="button" data-add="${p.id}">Add to bag</button>`}
            <button type="button" class="wa" data-wa="${p.id}" aria-label="Order ${p.name} on WhatsApp">${ICON.wa}</button>
          </span>
        </div>
        <div class="product-info">
          <div class="meta">${p.tagline}</div>
          <h3>${p.name}</h3>
          <div class="price"><small>from</small>${naira(minPrice(p))}</div>
          <div class="lengths">${p.lengths.map((l) => `<span${inStock(l) ? "" : ' class="out" title="Sold out"'}>${l.len}</span>`).join("")}${p.colors.length ? `<span class="colors">${p.colors.length} colour${p.colors.length > 1 ? "s" : ""}</span>` : ""}</div>
        </div>
      </article>`;
  }

  /* ---------- Quick view ---------- */
  function openQuick(id) {
    const p = byId(id);
    if (!p) return;
    let sel = p.lengths.find(inStock) || p.lengths[0];
    let color = p.colors.length === 1 ? p.colors[0] : null;
    modal.innerHTML = `
      <button class="close-x" data-close aria-label="Close">${ICON.close}</button>
      <div class="modal-media">
        <img data-main src="${p.model}" alt="${p.name}">
        <div class="thumbs">
          <button class="active" data-img="${p.model}" aria-label="Model photo"><img src="${p.model}" alt=""></button>
          <button data-img="${p.sample}" aria-label="Hair close-up"><img src="${p.sample}" alt=""></button>
        </div>
      </div>
      <div class="modal-body">
        <div class="eyebrow">${p.tagline}</div>
        <h3>${p.name}</h3>
        <div class="price" data-price>${naira(sel.price)}</div>
        <p class="desc">${p.desc}</p>
        <div class="specs">
          <div><small>Lace</small><b>${p.lace}</b></div>
          <div><small>Density</small><b>${p.density}</b></div>
        </div>
        <div class="len-label">Length</div>
        <div class="len-options">${p.lengths
          .map((l, i) => `<button class="${l === sel ? "active" : ""}" data-len="${i}"${inStock(l) ? "" : ' disabled title="Sold out"'}>${l.len}${inStock(l) ? "" : " · sold out"}</button>`)
          .join("")}</div>
        ${p.colors.length ? `<div class="len-label">Colour</div>
        <div class="len-options">${p.colors.map((c) => `<button class="${c === color ? "active" : ""}" data-color="${esc(c)}">${esc(c)}</button>`).join("")}</div>` : ""}
        <div class="btns">
          <button class="btn btn-dark" data-modal-add${inStock(sel) ? "" : " disabled"}>${inStock(sel) ? `Add to bag ${ICON.bag}` : "Sold out"}</button>
          <a class="btn btn-wa" data-modal-wa target="_blank" rel="noopener" href="#">${ICON.wa} Order on WhatsApp</a>
        </div>
      </div>`;
    const waBtn = modal.querySelector("[data-modal-wa]");
    const setWa = () =>
      (waBtn.href = waLink(`Hi Glow by Grace! I'm interested in the ${p.name} (${optionLabel(sel.len, color)}) — ${naira(sel.price)}. Is it available?`));
    setWa();
    modal.querySelector("[data-close]").onclick = closeAll;
    modal.querySelectorAll("[data-img]").forEach((b) =>
      b.addEventListener("click", () => {
        modal.querySelector("[data-main]").src = b.dataset.img;
        modal.querySelectorAll("[data-img]").forEach((x) => x.classList.toggle("active", x === b));
      })
    );
    modal.querySelectorAll("[data-len]").forEach((b) =>
      b.addEventListener("click", () => {
        sel = p.lengths[+b.dataset.len];
        modal.querySelector("[data-price]").textContent = naira(sel.price);
        modal.querySelectorAll("[data-len]").forEach((x) => x.classList.toggle("active", x === b));
        setWa();
      })
    );
    modal.querySelectorAll("[data-color]").forEach((b) =>
      b.addEventListener("click", () => {
        color = b.dataset.color;
        modal.querySelectorAll("[data-color]").forEach((x) => x.classList.toggle("active", x === b));
        setWa();
      })
    );
    modal.querySelector("[data-modal-add]").onclick = () => {
      if (p.colors.length && !color) return toast("Please choose a colour");
      if (addToBag(p.id, sel.len, color)) closeAll();
    };
    overlay.classList.add("open");
    modal.classList.add("open");
    document.body.style.overflow = "hidden";
  }

  /* ---------- Options picker (opens from "Add to bag") ---------- */
  function openConfig(id, preset = {}) {
    const p = byId(id);
    if (!p) return;
    const avail = p.lengths.filter(inStock);
    let len = preset.len && avail.some((l) => l.len === preset.len) ? preset.len : avail.length === 1 ? avail[0].len : null;
    let color = preset.color && p.colors.includes(preset.color) ? preset.color : p.colors.length === 1 ? p.colors[0] : null;
    let qty = 1;

    function draw() {
      const v = p.lengths.find((l) => l.len === len);
      const left = v && v.stock != null ? Math.max(0, v.stock - inBagQty(p.id, len)) : 10;
      qty = Math.min(Math.max(1, qty), Math.max(1, left));
      const needColor = p.colors.length && !color;
      const ready = v && !needColor && left > 0;
      const label = !avail.length ? "Sold out" : !v ? "Choose a length" : needColor ? "Choose a colour" : left <= 0 ? "No more available" : `Add to bag · ${naira(v.price * qty)}`;
      config.innerHTML = `
        <div class="cfg-head">
          <img src="${esc(p.model)}" alt="">
          <div>
            <div class="eyebrow">${esc(p.tagline)}</div>
            <h3>${esc(p.name)}</h3>
            <div class="cfg-price">${v ? naira(v.price) : `<small>from</small> ${naira(minPrice(p))}`}</div>
          </div>
          <button class="close-x" data-cfg-close aria-label="Close">${ICON.close}</button>
        </div>
        <div class="cfg-group">
          <div class="cfg-label">Length <span>${len ? esc(len) : "Choose one"}</span></div>
          <div class="cfg-opts">${p.lengths.map((l) => `
            <button type="button" data-cfg-len="${esc(l.len)}" class="${l.len === len ? "active" : ""}" ${inStock(l) ? "" : "disabled"} aria-pressed="${l.len === len}">
              <b>${esc(l.len)}</b><small>${inStock(l) ? naira(l.price) : "Sold out"}</small>
            </button>`).join("")}
          </div>
        </div>
        ${p.colors.length ? `
        <div class="cfg-group">
          <div class="cfg-label">Colour <span>${color ? esc(color) : "Choose one"}</span></div>
          <div class="cfg-opts cfg-colors">${p.colors.map((c) => `
            <button type="button" data-cfg-color="${esc(c)}" class="${c === color ? "active" : ""}" aria-pressed="${c === color}">${esc(c)}</button>`).join("")}
          </div>
        </div>` : ""}
        <div class="cfg-group cfg-qty">
          <div class="cfg-label">Quantity</div>
          <span class="qty"><button type="button" data-cfg-dec aria-label="Fewer">−</button>${qty}<button type="button" data-cfg-inc aria-label="More">+</button></span>
          ${v && v.stock != null ? `<small>${left} available</small>` : ""}
        </div>
        <button type="button" class="btn btn-dark cfg-add" data-cfg-add ${ready ? "" : "disabled"}>${label}</button>
        <button type="button" class="link cfg-more" data-cfg-details>View full details</button>`;
    }

    config.onclick = (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      if (b.hasAttribute("data-cfg-close")) return closeAll();
      if (b.hasAttribute("data-cfg-details")) { closeAll(); return openQuick(p.id); }
      if (b.dataset.cfgLen !== undefined) len = b.dataset.cfgLen;
      else if (b.dataset.cfgColor !== undefined) color = b.dataset.cfgColor;
      else if (b.hasAttribute("data-cfg-inc")) qty++;
      else if (b.hasAttribute("data-cfg-dec")) qty--;
      else if (b.hasAttribute("data-cfg-add")) {
        if (addToBag(p.id, len, color, qty)) closeAll();
        return;
      }
      draw();
    };

    draw();
    modal.classList.remove("open");
    overlay.classList.add("open");
    config.classList.add("open");
    document.body.style.overflow = "hidden";
    setTimeout(() => (config.querySelector(".cfg-opts button:not(:disabled)") || config).focus({ preventScroll: true }), 50);
  }

  /* ---------- Global click delegation ---------- */
  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-add],[data-quick],[data-wa],[data-open-bag]");
    if (!t) return;
    if (t.dataset.add) { e.preventDefault(); e.stopPropagation(); openConfig(t.dataset.add); }
    else if (t.dataset.wa) {
      e.preventDefault(); e.stopPropagation();
      const p = byId(t.dataset.wa);
      window.open(waLink(`Hi Glow by Grace! I'm interested in the ${p.name} (from ${naira(minPrice(p))}). Is it available?`), "_blank", "noopener");
    }
    else if (t.dataset.quick) { e.preventDefault(); openQuick(t.dataset.quick); }
    else if (t.hasAttribute("data-open-bag")) { e.preventDefault(); openBag(); }
  });

  // touch devices: first tap on the photo shows the hair sample, second tap opens quick view
  document.addEventListener("touchstart", (e) => {
    const media = e.target.closest(".product-media");
    if (!media || e.target.closest("button")) return;
    const card = media.closest(".product-card");
    if (!card.classList.contains("show-sample")) {
      document.querySelectorAll(".product-card.show-sample").forEach((c) => c.classList.remove("show-sample"));
      card.classList.add("show-sample");
      card.dataset.justSwapped = "1";
    }
  }, { passive: true });
  document.addEventListener("click", (e) => {
    const media = e.target.closest(".product-media");
    if (!media || e.target.closest("button")) return;
    const card = media.closest(".product-card");
    if (card.dataset.justSwapped) { e.preventDefault(); e.stopImmediatePropagation(); delete card.dataset.justSwapped; }
  }, true);

  /* ---------- Reveal on scroll ---------- */
  const io = "IntersectionObserver" in window
    ? new IntersectionObserver((entries) => entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      }), { threshold: 0.12 })
    : null;
  function observeReveals(root = document) {
    root.querySelectorAll(".reveal:not(.in)").forEach((el) => (io ? io.observe(el) : el.classList.add("in")));
  }

  /* ---------- Account button ---------- */
  function renderAccount(user) {
    document.querySelectorAll("[data-account]").forEach((a) => {
      const pic = user && API.avatar(user);
      a.classList.toggle("signed-in", !!user);
      a.title = user ? `Signed in as ${API.displayName(user)}` : "Sign in / your account";
      a.innerHTML = pic ? `<img src="${esc(pic)}" alt="" referrerpolicy="no-referrer">` : ICON.user;
    });
  }
  API.user().then(renderAccount);
  API.onAuth(renderAccount);

  window.GBG.productCard = productCard;
  window.GBG.addToBag = addToBag;
  window.GBG.openQuick = openQuick;
  window.GBG.openConfig = openConfig;
  window.GBG.openBag = openBag;
  window.GBG.observeReveals = observeReveals;
  window.GBG.bagLines = bagLines;
  window.GBG.clearBag = clearBag;
  window.GBG.toast = toast;

  renderBag();
  API.ready.then(renderBag);
  document.addEventListener("DOMContentLoaded", () => observeReveals());
  observeReveals();
})();
