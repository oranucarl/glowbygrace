// Called by the order page when Paystack sends the shopper back.
// Confirms the transaction directly with Paystack before marking the order paid.
//
// POST { order_id, reference? } -> { paid, status, payment_status? }
import { handle, json, HttpError } from "../_shared/http.ts";
import { db, isAdmin, requireUser } from "../_shared/db.ts";
import { paystack, settleTransaction, transactionOrderId } from "../_shared/paystack.ts";

Deno.serve(handle(async (req) => {
  const user = await requireUser(req);
  const body = await req.json().catch(() => ({}));

  const { data: order } = await db
    .from("orders")
    .select("id, user_id, status, paid_at, payment_reference")
    .eq("id", body.order_id)
    .maybeSingle();
  if (!order || (order.user_id !== user.id && !(await isAdmin(user)))) throw new HttpError(404, "Order not found.");
  if (order.paid_at) return json({ paid: true, status: order.status });

  const reference = typeof body.reference === "string" && body.reference ? body.reference : order.payment_reference;
  if (!reference) return json({ paid: false, status: order.status });

  const tx = await paystack(`/transaction/verify/${encodeURIComponent(reference)}`);
  if (transactionOrderId(tx) !== order.id) throw new HttpError(400, "This payment does not belong to this order.");

  const result = await settleTransaction(tx);
  const { data: fresh } = await db.from("orders").select("status").eq("id", order.id).single();
  return json({ paid: result.paid, status: fresh?.status, payment_status: tx.status });
}));
