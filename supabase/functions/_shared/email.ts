import { env } from "./http.ts";

type Item = { product_name: string; length: string; unit_price: number; quantity: number; line_total: number; image_url: string | null };
type Order = {
  id: string;
  order_number: string;
  email: string;
  customer_name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  delivery_zone_name: string;
  notes: string | null;
  subtotal: number;
  delivery_fee: number;
  total: number;
  payment_reference: string | null;
  payment_channel: string | null;
  paid_at: string | null;
  created_at: string;
  order_items: Item[];
};

const STORE = "Glow by Grace";
const C = { cream: "#f7f0e7", cream2: "#efe4d6", espresso: "#2a1a14", muted: "#8a7366", gold: "#c49a5a", white: "#fffdfa" };

const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
const naira = (n: number) => "₦" + Number(n).toLocaleString("en-NG");
const lagosTime = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString("en-NG", { timeZone: "Africa/Lagos", dateStyle: "long", timeStyle: "short" })
    : "";
const channelLabel = (c: string | null) =>
  ({ card: "Card", bank: "Bank", bank_transfer: "Bank transfer", ussd: "USSD", mobile_money: "Mobile money", qr: "QR", opay: "OPay" } as Record<string, string>)[c || ""] || (c ? c : "Paystack");
const siteUrl = () => env("SITE_URL").replace(/\/$/, "");

function itemsTable(order: Order) {
  const rows = order.order_items
    .map(
      (i) => `
      <tr>
        <td style="padding:14px 0;border-bottom:1px solid ${C.cream2};width:64px;vertical-align:top">
          ${i.image_url ? `<img src="${esc(i.image_url)}" width="56" height="70" alt="" style="display:block;width:56px;height:70px;object-fit:cover;border-radius:8px">` : ""}
        </td>
        <td style="padding:14px 12px;border-bottom:1px solid ${C.cream2};vertical-align:top">
          <div style="font-family:Georgia,serif;font-size:16px;color:${C.espresso}">${esc(i.product_name)}</div>
          <div style="font-size:13px;color:${C.muted};margin-top:4px">Length ${esc(i.length)} · Qty ${i.quantity} · ${naira(i.unit_price)} each</div>
        </td>
        <td style="padding:14px 0;border-bottom:1px solid ${C.cream2};text-align:right;vertical-align:top;font-weight:700;white-space:nowrap">${naira(i.line_total)}</td>
      </tr>`
    )
    .join("");
  const line = (label: string, value: string, strong = false) => `
      <tr>
        <td colspan="2" style="padding:6px 0;font-size:${strong ? 16 : 14}px;${strong ? "font-weight:800" : `color:${C.muted}`}">${label}</td>
        <td style="padding:6px 0;text-align:right;font-size:${strong ? 16 : 14}px;font-weight:${strong ? 800 : 600}">${value}</td>
      </tr>`;
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
      ${rows}
      <tr><td colspan="3" style="height:10px"></td></tr>
      ${line("Subtotal", naira(order.subtotal))}
      ${line(`Delivery (${esc(order.delivery_zone_name)})`, order.delivery_fee ? naira(order.delivery_fee) : "Free")}
      ${line("Total paid", naira(order.total), true)}
    </table>`;
}

function layout(title: string, inner: string) {
  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title></head>
<body style="margin:0;padding:0;background:${C.cream};font-family:Helvetica,Arial,sans-serif;color:${C.espresso}">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.cream}">
    <tr><td align="center" style="padding:28px 12px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:${C.white};border-radius:18px;overflow:hidden">
        <tr><td style="background:${C.espresso};padding:26px 28px;text-align:center">
          <div style="font-family:Georgia,serif;font-size:28px;color:${C.cream};letter-spacing:.5px">Glow <span style="color:${C.gold};font-style:italic">by</span> Grace</div>
        </td></tr>
        ${inner}
        <tr><td style="background:${C.cream2};padding:20px 28px;text-align:center;font-size:12px;color:${C.muted};line-height:1.6">
          Questions about your order? Reply to this email or WhatsApp us on 0814 398 5557.<br>
          © ${new Date().getFullYear()} ${STORE} · Lagos, Nigeria
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function customerEmail(order: Order) {
  const first = order.customer_name.split(" ")[0];
  const inner = `
    <tr><td style="padding:30px 28px 8px">
      <div style="font-size:12px;letter-spacing:3px;text-transform:uppercase;font-weight:700;color:${C.gold}">Order confirmed</div>
      <h1 style="font-family:Georgia,serif;font-weight:400;font-size:30px;margin:10px 0 8px">Thank you, ${esc(first)}!</h1>
      <p style="font-size:15px;line-height:1.6;color:${C.muted};margin:0">We've received your payment and your order is being prepared. We'll keep you updated as it moves.</p>
    </td></tr>
    <tr><td style="padding:18px 28px 0">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.cream};border-radius:12px">
        <tr>
          <td style="padding:14px 16px;font-size:13px"><div style="color:${C.muted}">Order number</div><div style="font-weight:800;font-size:16px;margin-top:2px">${esc(order.order_number)}</div></td>
          <td style="padding:14px 16px;font-size:13px;text-align:right"><div style="color:${C.muted}">Paid on</div><div style="font-weight:700;margin-top:2px">${esc(lagosTime(order.paid_at))}</div></td>
        </tr>
      </table>
    </td></tr>
    <tr><td style="padding:18px 28px 0">
      <h2 style="font-size:12px;letter-spacing:2px;text-transform:uppercase;margin:0 0 4px">Your items</h2>
      ${itemsTable(order)}
    </td></tr>
    <tr><td style="padding:22px 28px 0">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="vertical-align:top;width:50%;padding-right:10px;font-size:14px;line-height:1.6">
            <h2 style="font-size:12px;letter-spacing:2px;text-transform:uppercase;margin:0 0 6px">Delivering to</h2>
            ${esc(order.customer_name)}<br>${esc(order.address)}<br>${esc(order.city)}, ${esc(order.state)}<br>${esc(order.phone)}
          </td>
          <td style="vertical-align:top;width:50%;padding-left:10px;font-size:14px;line-height:1.6">
            <h2 style="font-size:12px;letter-spacing:2px;text-transform:uppercase;margin:0 0 6px">Payment</h2>
            ${esc(channelLabel(order.payment_channel))} via Paystack<br>
            <span style="color:${C.muted};font-size:12px">Ref: ${esc(order.payment_reference)}</span>
          </td>
        </tr>
      </table>
      ${order.notes ? `<p style="font-size:14px;line-height:1.6;margin:16px 0 0"><b>Your note:</b> ${esc(order.notes)}</p>` : ""}
    </td></tr>
    <tr><td style="padding:24px 28px 30px">
      <h2 style="font-size:12px;letter-spacing:2px;text-transform:uppercase;margin:0 0 8px">What happens next</h2>
      <ol style="margin:0 0 22px;padding-left:18px;font-size:14px;line-height:1.7;color:${C.espresso}">
        <li>We inspect and pack your hair by hand.</li>
        <li>We send it out to ${esc(order.delivery_zone_name.toLowerCase())} and update your order status.</li>
        <li>You glow. ✦</li>
      </ol>
      <a href="${siteUrl()}/account.html#${encodeURIComponent(order.order_number)}" style="display:inline-block;background:${C.espresso};color:${C.cream};text-decoration:none;padding:14px 26px;border-radius:999px;font-weight:700;font-size:13px;letter-spacing:1.5px;text-transform:uppercase">Track your order</a>
    </td></tr>`;
  return layout(`Order ${order.order_number} confirmed`, inner);
}

function customerText(order: Order) {
  const items = order.order_items.map((i) => `- ${i.product_name} (${i.length}) x${i.quantity}: ${naira(i.line_total)}`).join("\n");
  return `Thank you for your order, ${order.customer_name}!

Order ${order.order_number} — paid ${lagosTime(order.paid_at)}

${items}

Subtotal: ${naira(order.subtotal)}
Delivery (${order.delivery_zone_name}): ${order.delivery_fee ? naira(order.delivery_fee) : "Free"}
Total paid: ${naira(order.total)}

Delivering to:
${order.customer_name}
${order.address}
${order.city}, ${order.state}
${order.phone}

Payment reference: ${order.payment_reference}

Track your order: ${siteUrl()}/account.html#${order.order_number}

${STORE}`;
}

function sellerEmail(order: Order) {
  const inner = `
    <tr><td style="padding:28px">
      <div style="font-size:12px;letter-spacing:3px;text-transform:uppercase;font-weight:700;color:${C.gold}">New paid order</div>
      <h1 style="font-family:Georgia,serif;font-weight:400;font-size:28px;margin:10px 0 4px">${esc(order.order_number)} · ${naira(order.total)}</h1>
      <p style="font-size:14px;line-height:1.6;margin:0 0 18px;color:${C.muted}">Paid ${esc(lagosTime(order.paid_at))} by ${esc(channelLabel(order.payment_channel))} (ref ${esc(order.payment_reference)})</p>
      ${itemsTable(order)}
      <p style="font-size:14px;line-height:1.7;margin:20px 0 0">
        <b>Customer:</b> ${esc(order.customer_name)} · ${esc(order.email)} · ${esc(order.phone)}<br>
        <b>Address:</b> ${esc(order.address)}, ${esc(order.city)}, ${esc(order.state)}<br>
        <b>Delivery:</b> ${esc(order.delivery_zone_name)}
        ${order.notes ? `<br><b>Note:</b> ${esc(order.notes)}` : ""}
      </p>
      <p style="margin:22px 0 0"><a href="${siteUrl()}/admin.html#order=${order.id}" style="display:inline-block;background:${C.espresso};color:${C.cream};text-decoration:none;padding:13px 24px;border-radius:999px;font-weight:700;font-size:13px">Open in admin</a></p>
    </td></tr>`;
  return layout(`New order ${order.order_number}`, inner);
}

async function send(payload: Record<string, unknown>) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env("RESEND_API_KEY")}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: env("EMAIL_FROM"), ...payload }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
}

export async function sendOrderEmails(order: Order) {
  const replyTo = Deno.env.get("SELLER_EMAIL");
  await send({
    to: [order.email],
    subject: `Your Glow by Grace order ${order.order_number} is confirmed`,
    html: customerEmail(order),
    text: customerText(order),
    ...(replyTo ? { reply_to: replyTo } : {}),
  });
  if (replyTo) {
    try {
      await send({
        to: [replyTo],
        subject: `New order ${order.order_number} — ${naira(order.total)}`,
        html: sellerEmail(order),
        reply_to: order.email,
      });
    } catch (err) {
      // the customer email already went out; don't resend it because the seller copy failed
      console.error("Seller notification failed", err);
    }
  }
}
