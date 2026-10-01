import { env, HttpError } from "./http.ts";
import { db } from "./db.ts";
import { sendOrderEmails } from "./email.ts";

export async function paystack<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`https://api.paystack.co${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${env("PAYSTACK_SECRET_KEY")}`,
      "Content-Type": "application/json",
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body.status) {
    console.error("Paystack error", res.status, body);
    throw new HttpError(502, body.message ? `Payment provider: ${body.message}` : "Could not reach the payment provider.");
  }
  return body.data as T;
}

// Only allow Paystack to send shoppers back to our own site.
export function safeReturnUrl(requested: unknown): string {
  const site = new URL(env("SITE_URL"));
  const allowed = new Set([
    site.origin,
    ...(Deno.env.get("ALLOWED_ORIGINS") || "").split(",").map((s) => s.trim()).filter(Boolean),
  ]);
  try {
    const u = new URL(String(requested));
    if (allowed.has(u.origin)) return u.origin + u.pathname;
  } catch (_) { /* fall through */ }
  return `${env("SITE_URL").replace(/\/$/, "")}/order.html`;
}

type Order = { id: string; order_number: string; email: string; total: number };

export async function startPayment(order: Order, returnUrl: string) {
  const reference = `${order.order_number}-${crypto.randomUUID().slice(0, 8)}`;
  const callback = `${returnUrl}?id=${order.id}`;
  const data = await paystack<{ authorization_url: string }>("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      email: order.email,
      amount: order.total * 100,
      currency: "NGN",
      reference,
      callback_url: callback,
      metadata: {
        order_id: order.id,
        order_number: order.order_number,
        cancel_action: callback,
        custom_fields: [{ display_name: "Order", variable_name: "order_number", value: order.order_number }],
      },
    }),
  });
  const { error } = await db.from("orders").update({ payment_reference: reference }).eq("id", order.id);
  if (error) throw error;
  return { order_id: order.id, order_number: order.order_number, authorization_url: data.authorization_url };
}

type Transaction = {
  status: string;
  reference: string;
  amount: number;
  currency: string;
  channel: string;
  metadata: unknown;
};

export function transactionOrderId(tx: Transaction): string | null {
  let meta = tx.metadata as any;
  if (typeof meta === "string") {
    try { meta = JSON.parse(meta); } catch (_) { meta = null; }
  }
  return meta?.order_id || null;
}

// Records a successful Paystack transaction against its order (idempotent)
// and sends the confirmation emails exactly once.
export async function settleTransaction(tx: Transaction) {
  const orderId = transactionOrderId(tx);
  if (!orderId) throw new HttpError(400, "Transaction is not linked to an order.");
  if (tx.status !== "success" || tx.currency !== "NGN") return { paid: false, orderId };

  const { error } = await db.rpc("mark_order_paid", {
    p_order_id: orderId,
    p_reference: tx.reference,
    p_amount_kobo: tx.amount,
    p_channel: tx.channel,
  });
  if (error) throw error;

  await sendConfirmationOnce(orderId);
  return { paid: true, orderId };
}

async function sendConfirmationOnce(orderId: string) {
  // claim the email so concurrent webhook + verify calls don't both send it
  const { data: order, error } = await db
    .from("orders")
    .update({ confirmation_email_sent_at: new Date().toISOString() })
    .eq("id", orderId)
    .is("confirmation_email_sent_at", null)
    .select("*, order_items(*)")
    .maybeSingle();
  if (error) throw error;
  if (!order) return;
  try {
    await sendOrderEmails(order);
  } catch (err) {
    console.error("Confirmation email failed", err);
    await db.from("orders").update({ confirmation_email_sent_at: null }).eq("id", orderId);
  }
}
