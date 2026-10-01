/* Glow by Grace — order confirmation page (Paystack returns shoppers here) */
(function () {
  const { naira, esc, ICON, toast } = window.GBG;
  const API = window.GBG_API;
  const O = window.GBG_ORDERS;
  const root = document.querySelector("[data-order-page]");
  const params = new URLSearchParams(location.search);
  const orderId = params.get("id");
  const reference = params.get("reference") || params.get("trxref");

  const message = (title, text, actions = "") =>
    (root.innerHTML = `<div class="empty"><h3>${title}</h3><p>${text}</p>${actions ? `<p style="margin-top:20px">${actions}</p>` : ""}</div>`);

  async function fetchOrder() {
    const { data, error } = await API.client
      .from("orders")
      .select("*, order_items(*), order_events(*)")
      .eq("id", orderId)
      .order("created_at", { referencedTable: "order_events" })
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  function render(order, verifyError) {
    const paid = !!order.paid_at;
    const cancelled = order.status === "cancelled";
    const first = esc(order.customer_name.split(" ")[0]);
    const hero = paid
      ? `<div class="o-hero ok"><span class="o-check">✓</span><div class="eyebrow">Order confirmed</div><h1 class="display">Thank you, <em>${first}!</em></h1>
         <p>We've received your payment. A confirmation email is on its way to <b>${esc(order.email)}</b>.</p></div>`
      : cancelled
      ? `<div class="o-hero"><div class="eyebrow">Order cancelled</div><h1 class="display">This order was <em>cancelled</em></h1><p>No payment was taken.</p></div>`
      : `<div class="o-hero warn"><div class="eyebrow">Payment not completed</div><h1 class="display">Almost <em>there…</em></h1>
         <p>${verifyError ? esc(verifyError) : "We haven't received payment for this order yet. If you were charged, it can take a minute to confirm — refresh this page shortly."}</p>
         <div class="btns"><button class="btn btn-dark" data-pay>Pay ${naira(order.total)} now</button><button class="btn btn-ghost" data-cancel>Cancel order</button></div></div>`;

    root.innerHTML = `
      ${hero}
      <section class="card order-card open">
        <div class="order-top">
          <div><small>Order</small><b>${esc(order.order_number)}</b></div>
          <div><small>Placed</small><b>${O.day(order.created_at)}</b></div>
          <div>${O.statusPill(order.status)}</div>
        </div>
        ${O.orderDetail(order)}
      </section>
      <p class="o-links"><a class="btn btn-ghost" href="account.html">All my orders</a> <a class="btn btn-dark" href="shop.html">Keep shopping ${ICON.arrow}</a></p>`;

    const payBtn = root.querySelector("[data-pay]");
    if (payBtn) payBtn.onclick = async () => {
      payBtn.disabled = true;
      payBtn.textContent = "Connecting to Paystack…";
      try {
        const res = await API.fn("checkout", { order_id: order.id, return_url: location.href.split("?")[0] });
        location.href = res.authorization_url;
      } catch (err) {
        toast(err.message);
        payBtn.disabled = false;
        payBtn.textContent = `Pay ${naira(order.total)} now`;
      }
    };
    const cancelBtn = root.querySelector("[data-cancel]");
    if (cancelBtn) cancelBtn.onclick = async () => {
      if (!confirm(`Cancel order ${order.order_number}?`)) return;
      const { error } = await API.client.rpc("cancel_my_order", { p_order_id: order.id });
      if (error) return toast(error.message);
      render(await fetchOrder());
    };
  }

  async function start() {
    if (!API.configured) return message("Not connected", esc(API.catalogError || "The shop isn't connected yet."));
    if (!orderId) return message("No order selected", "Open your orders from your account.", `<a class="btn btn-dark" href="account.html">My account</a>`);
    const user = await API.user();
    if (!user) {
      message("Please sign in", "Sign in with the Google account you used at checkout to see this order.", `<button class="btn btn-google" data-signin>${ICON.google} Continue with Google</button>`);
      root.querySelector("[data-signin]").onclick = () => API.signIn(location.href);
      return;
    }

    let verifyError = null;
    try {
      await API.fn("verify-payment", { order_id: orderId, reference });
    } catch (err) {
      verifyError = err.message;
    }
    // drop Paystack's query params so a refresh doesn't look like a fresh return
    if (reference) history.replaceState(null, "", `order.html?id=${encodeURIComponent(orderId)}`);

    const order = await fetchOrder().catch(() => null);
    if (!order) return message("Order not found", "We couldn't find this order on your account.", `<a class="btn btn-dark" href="account.html">My orders</a>`);
    render(order, verifyError);
  }

  start();
})();
