/* =========================================================
   "Grace" — simulated AI hair assistant
   ---------------------------------------------------------
   Runs fully in the browser (no API key needed). It reads the
   catalogue in products.js, understands simple free text
   (style words, budgets like "100k" or "₦150,000", delivery /
   payment questions) and hands off to WhatsApp when the
   shopper wants a human.
   ========================================================= */
(function () {
  const { naira, minPrice, waLink, ICON, addToBag, openQuick } = window.GBG;
  const PRODUCTS = window.GBG_PRODUCTS;

  const STYLE_LABEL = {
    straight: "bone straight",
    curly: "curly / afro",
    wavy: "wavy",
    bob: "short bob",
    braids: "braids",
    colored: "bold colour",
    bundles: "bundles",
    closure: "closures",
    any: "anything gorgeous"
  };
  const BUDGETS = [
    { key: "u80", label: "Under ₦80k", min: 0, max: 80000 },
    { key: "80-150", label: "₦80k – ₦150k", min: 80000, max: 150000 },
    { key: "150-250", label: "₦150k – ₦250k", min: 150000, max: 250000 },
    { key: "250+", label: "₦250k +", min: 250000, max: Infinity },
    { key: "any", label: "Any budget", min: 0, max: Infinity }
  ];

  const state = { style: null, budget: null, shown: [], liked: [], started: false };

  /* ---------- DOM ---------- */
  const avatar = `<svg viewBox="0 0 64 64" aria-hidden="true"><path fill="currentColor" d="M35.5 9.5c-9.8-.9-18 6.2-18.6 16-.4 6.3-2.4 11.4-6.6 16.2 3.4.6 6.6-.2 9.2-2.2-.6 5.4-3 9.9-7 13.8 7.8.6 14.4-3.4 17.6-10 1.4 4.8.8 9.6-2 14 6.6-1.8 11-7 11.8-14.2l.4-5.8c-3.8-.6-6.4-3.8-6.4-7.8 0-4.6 3.4-8.2 7.8-8.6-1.2-6.4-3.8-10.8-6.2-11.4z"/><path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" d="M41.2 12.2c4.6 2.4 7.2 7 7.2 12.2l3.4 5.6-3.4 1.2.6 3.2c.3 1.8-.8 3.2-2.6 3.4l-2.6.2-.8 6"/></svg>`;

  const fab = document.createElement("button");
  fab.className = "chat-fab";
  fab.setAttribute("aria-label", "Chat with Grace, our hair assistant");
  fab.innerHTML = `<span class="av">${avatar}</span><span>Ask Grace<small>Find your perfect hair</small></span>`;

  const panel = document.createElement("section");
  panel.className = "chat-panel";
  panel.setAttribute("aria-label", "Grace hair assistant");
  panel.innerHTML = `
    <div class="chat-head">
      <div class="av">${avatar}</div>
      <div><h4>Grace</h4><p>AI hair assistant · online</p></div>
      <div class="hbtns">
        <button data-restart aria-label="Start over" title="Start over"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg></button>
        <button data-min aria-label="Close chat">${ICON.close}</button>
      </div>
    </div>
    <div class="chat-body" data-body aria-live="polite"></div>
    <form class="chat-input" data-form>
      <input data-input type="text" placeholder="e.g. curly wig under 100k" autocomplete="off" aria-label="Message Grace">
      <button type="submit" aria-label="Send"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4z"/></svg></button>
    </form>
    <div class="chat-foot">Need a human? <a href="#" data-handoff>Chat with the seller on WhatsApp</a></div>`;
  document.body.append(fab, panel);

  const body = panel.querySelector("[data-body]");
  const input = panel.querySelector("[data-input]");

  function open() {
    panel.classList.add("open");
    fab.classList.add("hidden");
    if (!state.started) { state.started = true; greet(); }
    setTimeout(() => input.focus({ preventScroll: true }), 350);
  }
  function close() {
    panel.classList.remove("open");
    fab.classList.remove("hidden");
  }
  fab.addEventListener("click", open);
  panel.querySelector("[data-min]").addEventListener("click", close);
  panel.querySelector("[data-restart]").addEventListener("click", () => {
    Object.assign(state, { style: null, budget: null, shown: [], liked: [] });
    body.innerHTML = "";
    greet();
  });
  panel.querySelector("[data-handoff]").addEventListener("click", (e) => { e.preventDefault(); handoff(); });
  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-open-chat]")) { e.preventDefault(); open(); }
  });

  /* ---------- Rendering ---------- */
  const scroll = () => (body.scrollTop = body.scrollHeight);

  function addUser(text) {
    const d = document.createElement("div");
    d.className = "msg user";
    d.textContent = text;
    body.append(d);
    clearQuick();
    scroll();
  }

  function clearQuick() { body.querySelectorAll(".quick").forEach((q) => q.remove()); }

  let queue = Promise.resolve();
  function bot(html, delay) {
    queue = queue.then(
      () =>
        new Promise((res) => {
          const t = document.createElement("div");
          t.className = "msg bot typing";
          t.innerHTML = "<i></i><i></i><i></i>";
          body.append(t);
          scroll();
          const plain = html.replace(/<[^>]+>/g, "");
          const ms = delay ?? Math.min(1500, 450 + plain.length * 12);
          setTimeout(() => {
            t.className = "msg bot";
            t.innerHTML = html;
            scroll();
            res();
          }, ms);
        })
    );
    return queue;
  }

  function quick(options) {
    queue = queue.then(() => {
      const q = document.createElement("div");
      q.className = "quick";
      options.forEach((o) => {
        const b = document.createElement("button");
        b.type = "button";
        b.textContent = o.label;
        if (o.wa) b.className = "wa";
        b.addEventListener("click", () => {
          addUser(o.label);
          o.run();
        });
        q.append(b);
      });
      body.append(q);
      scroll();
    });
    return queue;
  }

  function cards(list, budget) {
    queue = queue.then(() => {
      const wrap = document.createElement("div");
      wrap.className = "recs";
      list.forEach((p) => {
        const fit = bestLength(p, budget);
        const el = document.createElement("div");
        el.className = "rec";
        el.innerHTML = `
          <div class="m"><img src="${p.model}" alt="${p.name}"><img src="${p.sample}" alt="${p.name} hair close-up"></div>
          <div class="t">
            <h5>${p.name}</h5>
            <div class="p">${naira(fit.price)} <small>· ${fit.len}</small></div>
            <div class="rb"><button data-a>Add</button><button class="ghost" data-v>View</button></div>
          </div>`;
        el.querySelector("[data-a]").onclick = () => {
          addToBag(p.id, fit.len);
          if (!state.liked.includes(p.name)) state.liked.push(p.name);
        };
        el.querySelector("[data-v]").onclick = () => {
          if (!state.liked.includes(p.name)) state.liked.push(p.name);
          openQuick(p.id);
        };
        wrap.append(el);
      });
      body.append(wrap);
      scroll();
    });
    return queue;
  }

  /* ---------- Logic ---------- */
  function bestLength(p, budget) {
    if (!budget) return p.lengths[0];
    const inRange = p.lengths.filter((l) => l.price >= budget.min && l.price <= budget.max);
    if (inRange.length) return inRange[inRange.length - 1]; // longest that fits
    const under = p.lengths.filter((l) => l.price <= budget.max);
    return under.length ? under[under.length - 1] : p.lengths[0];
  }

  function matches(style, budget) {
    let list = PRODUCTS.slice();
    if (style && style !== "any") list = list.filter((p) => p.category === style);
    if (budget) list = list.filter((p) => p.lengths.some((l) => l.price <= budget.max && l.price >= budget.min));
    // bestsellers first, then by price
    return list.sort((a, b) => (b.badge === "Bestseller") - (a.badge === "Bestseller") || minPrice(a) - minPrice(b));
  }

  function greet() {
    const h = new Date().getHours();
    const hi = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
    bot(`${hi}, gorgeous! ✨ I'm <b>Grace</b>, the Glow by Grace hair assistant.`, 600);
    bot("Tell me the look you want and your budget, and I'll pick the perfect units for you. What are you feeling today?");
    askStyle();
  }

  function askStyle() {
    quick([
      { label: "Bone straight", run: () => setStyle("straight") },
      { label: "Curly / afro", run: () => setStyle("curly") },
      { label: "Wavy", run: () => setStyle("wavy") },
      { label: "Short bob", run: () => setStyle("bob") },
      { label: "Braids", run: () => setStyle("braids") },
      { label: "Bold colour", run: () => setStyle("colored") },
      { label: "Bundles", run: () => setStyle("bundles") },
      { label: "Not sure — surprise me", run: () => setStyle("any") }
    ]);
  }

  function askBudget() {
    quick(BUDGETS.map((b) => ({ label: b.label, run: () => setBudget(b) })));
  }

  const STYLE_REPLIES = {
    straight: "Bone straight — sleek, glossy and always classy. 💁🏾‍♀️",
    curly: "Curls! Big, bouncy and full of life. Love it. 🌀",
    wavy: "Waves are such a mood — soft, glam and versatile. 🌊",
    bob: "A bob is the ultimate power move. Short, chic, effortless. ✂️",
    braids: "Protective and stylish — braids it is. 🤎",
    colored: "Ooh, a colour moment! Let's turn some heads. 🔥",
    bundles: "Bundles give you full control of your install. 🙌🏾",
    closure: "Closures are perfect for a natural-looking parting. ✨",
    any: "Love that — let me show you a little of everything. 💫"
  };

  function setStyle(style) {
    state.style = style;
    bot(STYLE_REPLIES[style]);
    if (state.budget) return recommend();
    bot("What budget are you working with?");
    askBudget();
  }

  function setBudget(b) {
    state.budget = b;
    if (!state.style) {
      bot(`Got it — ${b.label.toLowerCase()}. What style are you going for?`);
      return askStyle();
    }
    recommend();
  }

  function recommend(more) {
    const { style, budget } = state;
    let list = matches(style, budget);
    let note = "";
    if (!list.length) {
      // relax budget, keep style
      list = matches(style, null);
      if (list.length) {
        note = `I don't have ${STYLE_LABEL[style]} in that exact range right now, but these are the closest options:`;
      } else {
        list = matches("any", budget);
        note = `We don't stock ${STYLE_LABEL[style]} at the moment, but these fit your budget beautifully:`;
      }
    }
    if (more) list = list.filter((p) => !state.shown.includes(p.id));
    const pick = list.slice(0, 3);
    if (!pick.length) {
      bot("That's everything I have for that combo! Want to try a different style or budget — or chat with the seller for custom orders?");
      return followUps();
    }
    pick.forEach((p) => state.shown.push(p.id));
    const bLabel = budget && budget.key !== "any" ? ` (<b>${budget.label}</b>)` : "";
    bot(note || `Here ${pick.length > 1 ? "are my top picks" : "is my top pick"} for <b>${STYLE_LABEL[style]}</b>${bLabel}. Hover a photo to see the hair up close 👇🏾`);
    cards(pick, budget);
    if (pick[0]) {
      const top = pick[0];
      bot(`My personal favourite? <b>${top.name}</b> — ${top.desc.split(".")[0].replace(/^./, (ch) => ch.toLowerCase())}.`);
    }
    followUps();
  }

  function followUps() {
    quick([
      { label: "Show me more", run: () => recommend(true) },
      { label: "Change style", run: () => { state.shown = []; bot("No problem! What style?"); askStyle(); } },
      { label: "Change budget", run: () => { state.shown = []; bot("Sure — what budget?"); askBudget(); } },
      { label: "Talk to the seller", wa: true, run: handoff }
    ]);
  }

  function handoff() {
    const parts = ["Hi Glow by Grace! I was chatting with Grace on your website."];
    if (state.style) parts.push(`I'm looking for: ${STYLE_LABEL[state.style]}.`);
    if (state.budget) parts.push(`Budget: ${state.budget.label}.`);
    if (state.liked.length) parts.push(`I liked: ${state.liked.join(", ")}.`);
    parts.push("Can you help me?");
    const url = waLink(parts.join(" "));
    bot(`I'll connect you with the Glow by Grace team on WhatsApp (<b>${window.GBG_STORE.whatsappDisplay}</b>). I've added your preferences to the message so you don't have to repeat yourself. 💬`, 700).then(() => {
      const q = document.createElement("div");
      q.className = "quick";
      q.innerHTML = `<a class="btn btn-wa" style="padding:11px 18px;font-size:.72rem" href="${url}" target="_blank" rel="noopener">${ICON.wa} Open WhatsApp</a>`;
      body.append(q);
      scroll();
      window.open(url, "_blank", "noopener");
    });
  }

  /* ---------- Free-text understanding ---------- */
  function parseBudget(t) {
    const re = /(₦|ngn|n(?=\d)|under|below|less than|budget(?: is| of)?|around|about|max|up to|over|above|from|between|and|to)?\s?(\d{1,3}(?:,\d{3})+|\d+(?:\.\d+)?)\s?(k\b|m\b|thousand|million)?(?!\s?(?:x\d|"|”|inch|inches|in\b|%))/gi;
    const nums = [...t.matchAll(re)]
      .map((m) => {
        let v = parseFloat(m[2].replace(/,/g, ""));
        const unit = (m[3] || "").toLowerCase();
        if (unit === "k" || unit === "thousand") v *= 1000;
        else if (unit === "m" || unit === "million") v *= 1000000;
        else if (v < 1000) v = m[1] ? v * 1000 : NaN; // "under 90" → 90k, but a bare "13" is ignored
        return v;
      })
      .filter((v) => v >= 5000 && v < 10000000);
    if (!nums.length) {
      if (/cheap|afford|budget|low|small money|not too expensive/.test(t)) return BUDGETS[0];
      if (/luxury|premium|expensive|high end|best quality|no budget|any budget|money no be/.test(t)) return BUDGETS[4];
      return null;
    }
    if (nums.length >= 2 && /between|to|-|and/.test(t)) {
      const [a, b] = nums.slice(0, 2).sort((x, y) => x - y);
      return { key: "custom", label: `${naira(a)} – ${naira(b)}`, min: a, max: b };
    }
    const v = nums[0];
    if (/over|above|more than|from|at least|\+/.test(t)) return { key: "custom", label: `${naira(v)} +`, min: v, max: Infinity };
    return { key: "custom", label: `under ${naira(v)}`, min: 0, max: v };
  }

  function parseStyle(t) {
    if (/\bbob|short\b|pixie/.test(t)) return "bob";
    if (/braid|knotless|cornrow|twist|locs?\b/.test(t)) return "braids";
    if (/613|blonde|colou?r|ginger|auburn|burgundy|red\b|99j|copper/.test(t)) return "colored";
    if (/bundle|weave|weft|sew|install/.test(t)) return "bundles";
    if (/curl|kinky|afro|coil|spiral|jerry|bouncy/.test(t)) return "curly";
    if (/wav|body wave|deep wave|water wave|loose/.test(t)) return "wavy";
    if (/straight|bone|sleek|silky|silk/.test(t)) return "straight";
    if (/closure|frontal only|lace piece/.test(t)) return "closure";
    if (/surprise|anything|not sure|any style|don.?t know|recommend/.test(t)) return "any";
    return null;
  }

  function findProduct(t) {
    return PRODUCTS.find((p) => t.includes(p.name.toLowerCase()) || t.includes(p.name.toLowerCase().split(" ")[0] + " " + (p.name.toLowerCase().split(" ")[1] || "")));
  }

  function respond(raw) {
    const t = raw.toLowerCase().trim();
    if (!t) return;

    if (/whats ?app|seller|human|agent|person|call|speak|talk to|customer (care|service)|owner|grace herself|real person/.test(t)) return handoff();

    if (/^(hi|hello|hey|good (morning|afternoon|evening)|hiya|howdy|sup|yo)\b/.test(t) && t.split(" ").length <= 4) {
      bot("Hey love! 🤎 What look are you going for today — straight, curly, wavy, a bob, braids or a colour moment?");
      return askStyle();
    }
    if (/thank|thanks|thx|tanks|appreciate/.test(t)) {
      bot("You're so welcome! 💛 Anything else I can help you find?");
      return followUps();
    }
    if (/deliver|shipping|ship|how long|arrive|location|where are you|pick ?up/.test(t)) {
      bot("🚚 <b>Lagos:</b> same-day or next-day delivery.<br>🇳🇬 <b>Nationwide:</b> 2–4 working days.<br>🌍 International shipping available on request. Delivery fee is confirmed on WhatsApp at checkout.");
      return followUps();
    }
    if (/pay|payment|transfer|card|installment|part pay/.test(t)) {
      bot("💳 Checkout happens on WhatsApp — the team confirms your order, then you pay by bank transfer (or any option they offer). Want me to connect you?");
      return quick([
        { label: "Yes, connect me", wa: true, run: handoff },
        { label: "Keep browsing", run: () => { bot("Sure! What style?"); askStyle(); } }
      ]);
    }
    if (/return|refund|exchange/.test(t)) {
      bot("We want you to love your hair! Unworn units with the lace uncut can be exchanged — message the seller within 48 hours of delivery and they'll sort you out.");
      return followUps();
    }
    if (/glueless|beginner|first time|first wig|easy/.test(t)) {
      bot("For beginners I always recommend <b>glueless closure units</b> — no glue, no stress, ready in minutes. Here are some favourites:");
      const list = PRODUCTS.filter((p) => /closure/i.test(p.lace) && p.category !== "closure").slice(0, 3);
      cards(list, state.budget);
      return followUps();
    }
    if (/care|wash|maintain|last|longevity|how to/.test(t)) {
      bot("Hair care 101 ✨<br>• Wash every 7–10 wears with sulphate-free shampoo<br>• Always condition and detangle from ends up<br>• Use heat protectant before styling<br>• Store on a wig stand or in a satin bag<br>Treat it right and quality human hair lasts 1–2+ years.");
      return followUps();
    }

    const prod = findProduct(t);
    if (prod) {
      bot(`<b>${prod.name}</b> — ${prod.tagline}. Prices: ${prod.lengths.map((l) => `${l.len} ${naira(l.price)}`).join(" · ")}.`);
      cards([prod], state.budget);
      return followUps();
    }

    const style = parseStyle(t);
    const budget = parseBudget(t);
    if (style) state.style = style;
    if (budget) state.budget = budget;

    if (style || budget) {
      state.shown = [];
      if (style && budget) {
        bot(`Love it — <b>${STYLE_LABEL[style]}</b>${budget.key !== "any" ? `, <b>${budget.label}</b>` : ""}. Let me look… 🔎`, 600);
        return recommend();
      }
      if (style) return setStyle(style);
      if (budget) return setBudget(budget);
    }

    bot("Hmm, I didn't quite catch that 🙈 — I'm still learning! You can tell me a style (like <i>curly</i> or <i>bone straight</i>) and a budget (like <i>under 150k</i>), or chat with a real person.");
    quick([
      { label: "Pick a style", run: () => { bot("Lovely — choose one:"); askStyle(); } },
      { label: "Talk to the seller", wa: true, run: handoff }
    ]);
  }

  panel.querySelector("[data-form]").addEventListener("submit", (e) => {
    e.preventDefault();
    const v = input.value.trim();
    if (!v) return;
    addUser(v);
    input.value = "";
    respond(v);
  });

  // Gentle nudge on the shop page after a while
  if (document.body.dataset.page === "shop") {
    setTimeout(() => {
      if (!state.started && !panel.classList.contains("open")) fab.animate(
        [{ transform: "scale(1)" }, { transform: "scale(1.08)" }, { transform: "scale(1)" }],
        { duration: 700, iterations: 2 }
      );
    }, 12000);
  }

  window.GBG.openChat = open;
})();
