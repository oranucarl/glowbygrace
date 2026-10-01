/* Glow by Grace — shop page filters */
(function () {
  const { productCard, minPrice, observeReveals } = window.GBG;
  const PRODUCTS = window.GBG_PRODUCTS;
  const CATS = window.GBG_CATEGORIES.filter(
    (c) => c.key === "all" || PRODUCTS.some((p) => p.category === c.key)
  );

  const params = new URLSearchParams(location.search);
  const state = {
    cat: CATS.some((c) => c.key === params.get("cat")) ? params.get("cat") : "all",
    price: "all",
    sort: "featured"
  };

  const chips = document.querySelector("[data-chips]");
  const grid = document.querySelector("[data-grid]");
  const count = document.querySelector("[data-count]");
  const empty = document.querySelector("[data-empty]");
  const priceSel = document.querySelector("[data-price]");
  const sortSel = document.querySelector("[data-sort]");

  chips.innerHTML = CATS.map(
    (c) => `<button class="chip" role="tab" data-cat="${c.key}">${c.label}</button>`
  ).join("");

  function render() {
    chips.querySelectorAll(".chip").forEach((b) => {
      const on = b.dataset.cat === state.cat;
      b.classList.toggle("active", on);
      b.setAttribute("aria-selected", on);
    });

    let list = PRODUCTS.filter((p) => state.cat === "all" || p.category === state.cat);
    if (state.price !== "all") {
      const [min, max] = state.price.split("-").map(Number);
      list = list.filter((p) => p.lengths.some((l) => l.price >= min && l.price <= max));
    }
    if (state.sort === "low") list.sort((a, b) => minPrice(a) - minPrice(b));
    if (state.sort === "high") list.sort((a, b) => minPrice(b) - minPrice(a));
    if (state.sort === "name") list.sort((a, b) => a.name.localeCompare(b.name));

    grid.innerHTML = list.map(productCard).join("");
    count.textContent = `${list.length} ${list.length === 1 ? "style" : "styles"}`;
    empty.hidden = list.length > 0;
    observeReveals(grid);

    const url = new URL(location);
    if (state.cat === "all") url.searchParams.delete("cat");
    else url.searchParams.set("cat", state.cat);
    history.replaceState(null, "", url);
  }

  chips.addEventListener("click", (e) => {
    const b = e.target.closest("[data-cat]");
    if (!b) return;
    state.cat = b.dataset.cat;
    render();
  });
  priceSel.addEventListener("change", () => { state.price = priceSel.value; render(); });
  sortSel.addEventListener("change", () => { state.sort = sortSel.value; render(); });

  render();
})();
