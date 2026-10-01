/* Glow by Grace — shared order rendering (account, order confirmation, admin) */
(function () {
  const { naira, esc } = window.GBG;

  const STATUS = {
    pending_payment: { label: "Awaiting payment", tone: "warn" },
    paid: { label: "Paid", tone: "ok" },
    processing: { label: "Being prepared", tone: "info" },
    shipped: { label: "On its way", tone: "info" },
    delivered: { label: "Delivered", tone: "done" },
    cancelled: { label: "Cancelled", tone: "muted" }
  };
  const FLOW = ["paid", "processing", "shipped", "delivered"];

  const statusPill = (s) => `<span class="pill pill-${(STATUS[s] || {}).tone || "muted"}">${(STATUS[s] || { label: s }).label}</span>`;
  const when = (iso, opts = { dateStyle: "medium", timeStyle: "short" }) =>
    iso ? new Date(iso).toLocaleString("en-NG", { timeZone: "Africa/Lagos", ...opts }) : "";
  const day = (iso) => when(iso, { dateStyle: "medium" });
  const CHANNELS = { card: "Card", bank: "Bank", bank_transfer: "Bank transfer", ussd: "USSD", mobile_money: "Mobile money", qr: "QR", opay: "OPay" };
  const channel = (c) => CHANNELS[c] || c || "Paystack";

  // progress tracker: paid → being prepared → on its way → delivered
  function progress(order) {
    if (order.status === "cancelled" || order.status === "pending_payment") return "";
    const at = FLOW.indexOf(order.status);
    const events = order.order_events || [];
    return `<ol class="progress">${FLOW.map((s, i) => {
      const ev = events.filter((e) => e.status === s).pop();
      return `<li class="${i <= at ? "done" : ""}${i === at ? " now" : ""}"><span></span><b>${STATUS[s].label}</b>${ev ? `<small>${when(ev.created_at)}</small>` : ""}</li>`;
    }).join("")}</ol>`;
  }

  function items(order) {
    return `<div class="o-items">${(order.order_items || []).map((i) => `
      <div class="o-item">
        ${i.image_url ? `<img src="${esc(i.image_url)}" alt="">` : `<span class="o-noimg"></span>`}
        <div><b>${esc(i.product_name)}</b><small>Length ${esc(i.length)} · Qty ${i.quantity} · ${naira(i.unit_price)} each</small></div>
        <span>${naira(i.line_total)}</span>
      </div>`).join("")}
    </div>`;
  }

  function totals(order) {
    return `<div class="o-totals">
      <div><span>Subtotal</span><span>${naira(order.subtotal)}</span></div>
      <div><span>Delivery · ${esc(order.delivery_zone_name)}</span><span>${order.delivery_fee ? naira(order.delivery_fee) : "Free"}</span></div>
      <div class="grand"><span>${order.paid_at ? "Total paid" : "Total"}</span><span>${naira(order.total)}</span></div>
    </div>`;
  }

  function details(order) {
    return `<div class="o-meta">
      <div><h6>Delivering to</h6><p>${esc(order.customer_name)}<br>${esc(order.address)}<br>${esc(order.city)}, ${esc(order.state)}<br>${esc(order.phone)}</p></div>
      <div><h6>Payment</h6><p>${order.paid_at
        ? `Paid ${when(order.paid_at)}<br>${esc(channel(order.payment_channel))} via Paystack<br><small>Ref ${esc(order.payment_reference)}</small>`
        : order.status === "cancelled" ? "Not paid — order cancelled" : "Not paid yet"}</p></div>
      ${order.notes ? `<div class="wide"><h6>Your note</h6><p>${esc(order.notes)}</p></div>` : ""}
    </div>`;
  }

  // full order body (used inside account cards and the confirmation page)
  function orderDetail(order) {
    return `${progress(order)}${items(order)}${totals(order)}${details(order)}`;
  }

  window.GBG_ORDERS = { STATUS, FLOW, statusPill, when, day, orderDetail, items, totals, progress };
})();
