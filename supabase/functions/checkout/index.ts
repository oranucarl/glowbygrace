// Creates an order from the shopper's bag and starts a Paystack payment.
// Prices, stock and delivery fees are always read from the database here —
// nothing the browser sends about money is trusted.
//
// POST { items: [{product_id, length, color?, qty}], zone_id, customer: {...}, save_details, return_url }
//   -> { order_id, order_number, authorization_url }
// POST { order_id, return_url }   (retry payment for an unpaid order)
//   -> { order_id, order_number, authorization_url }
import { handle, json, HttpError } from "../_shared/http.ts";
import { db, requireUser } from "../_shared/db.ts";
import { safeReturnUrl, startPayment } from "../_shared/paystack.ts";

const text = (v: unknown, field: string, max = 200, required = true) => {
  const s = typeof v === "string" ? v.trim() : "";
  if (required && !s) throw new HttpError(400, `Please enter your ${field}.`);
  if (s.length > max) throw new HttpError(400, `Your ${field} is too long.`);
  return s;
};

type Line = { product_id: string; length: string; color: string | null; qty: number };

async function priceLines(lines: Line[]) {
  const ids = [...new Set(lines.map((l) => l.product_id))];
  const { data: variants, error } = await db
    .from("product_variants")
    .select("id, product_id, length, price, stock, products!inner(name, active, model_url, colors)")
    .in("product_id", ids);
  if (error) throw error;

  return lines.map((l) => {
    const v = (variants as any[]).find((x) => x.product_id === l.product_id && x.length === l.length);
    if (!v || !v.products.active) {
      throw new HttpError(409, "An item in your bag is no longer available. Please remove it and try again.");
    }
    const colors: string[] = v.products.colors || [];
    if (colors.length && !colors.includes(l.color || "")) {
      throw new HttpError(409, `Please choose a colour for ${v.products.name} — available: ${colors.join(", ")}.`);
    }
    if (v.stock !== null && v.stock < l.qty) {
      throw new HttpError(
        409,
        v.stock === 0
          ? `${v.products.name} (${v.length}) has just sold out. Please remove it from your bag.`
          : `Only ${v.stock} of ${v.products.name} (${v.length}) left. Please reduce the quantity.`,
      );
    }
    return {
      product_id: v.product_id,
      variant_id: v.id,
      product_name: v.products.name,
      length: v.length,
      color: colors.length ? l.color : null,
      unit_price: v.price,
      quantity: l.qty,
      line_total: v.price * l.qty,
      image_url: v.products.model_url,
    };
  });
}

Deno.serve(handle(async (req) => {
  const user = await requireUser(req);
  const body = await req.json().catch(() => ({}));
  const returnUrl = safeReturnUrl(body.return_url);

  // ---- retry payment for an existing unpaid order ----
  if (body.order_id) {
    const { data: order } = await db
      .from("orders")
      .select("id, order_number, email, total, status, user_id, order_items(product_id, length, color, quantity)")
      .eq("id", body.order_id)
      .maybeSingle();
    if (!order || order.user_id !== user.id) throw new HttpError(404, "Order not found.");
    if (order.status !== "pending_payment") throw new HttpError(409, "This order is no longer awaiting payment.");
    await priceLines(order.order_items.map((i: any) => ({ product_id: i.product_id, length: i.length, color: i.color, qty: i.quantity })));
    return json(await startPayment(order, returnUrl));
  }

  // ---- new order ----
  if (!user.email) throw new HttpError(400, "Your account has no email address.");
  const c = body.customer || {};
  const customer = {
    customer_name: text(c.name, "full name", 120),
    phone: text(c.phone, "phone number", 30),
    address: text(c.address, "delivery address", 300),
    city: text(c.city, "city / area", 80),
    state: text(c.state, "state", 40),
    notes: text(c.notes, "note", 500, false) || null,
  };
  if (!/^[+\d][\d\s-]{6,}$/.test(customer.phone)) throw new HttpError(400, "Please enter a valid phone number.");

  if (!Array.isArray(body.items) || !body.items.length) throw new HttpError(400, "Your bag is empty.");
  if (body.items.length > 50) throw new HttpError(400, "Too many items in one order.");
  const merged = new Map<string, Line>();
  for (const raw of body.items) {
    const qty = Number(raw?.qty);
    const color = typeof raw?.color === "string" && raw.color.trim() ? raw.color.trim().slice(0, 60) : null;
    if (typeof raw?.product_id !== "string" || typeof raw?.length !== "string" || !Number.isInteger(qty) || qty < 1 || qty > 20) {
      throw new HttpError(400, "Your bag contains an invalid item.");
    }
    const key = `${raw.product_id}|${raw.length}|${color || ""}`;
    const prev = merged.get(key);
    merged.set(key, { product_id: raw.product_id, length: raw.length, color, qty: (prev?.qty || 0) + qty });
  }
  const items = await priceLines([...merged.values()]);
  // stock is per length, so the same length in two colours must fit together
  const perVariant = new Map<string, number>();
  for (const i of items) perVariant.set(i.variant_id, (perVariant.get(i.variant_id) || 0) + i.quantity);
  const { data: stockRows } = await db.from("product_variants").select("id, stock").in("id", [...perVariant.keys()]);
  for (const r of stockRows || []) {
    if (r.stock !== null && (perVariant.get(r.id) || 0) > r.stock) {
      throw new HttpError(409, `Only ${r.stock} left of one of the lengths in your bag. Please reduce the quantity.`);
    }
  }

  const { data: zone } = await db.from("delivery_zones").select("id, name, fee").eq("id", body.zone_id).eq("active", true).maybeSingle();
  if (!zone) throw new HttpError(400, "Please choose a delivery option.");

  const subtotal = items.reduce((s, i) => s + i.line_total, 0);
  const { data: order, error } = await db
    .from("orders")
    .insert({
      user_id: user.id,
      email: user.email,
      ...customer,
      delivery_zone_id: zone.id,
      delivery_zone_name: zone.name,
      subtotal,
      delivery_fee: zone.fee,
      total: subtotal + zone.fee,
    })
    .select("id, order_number, email, total")
    .single();
  if (error) throw error;

  const { error: itemsError } = await db.from("order_items").insert(items.map((i) => ({ ...i, order_id: order.id })));
  if (itemsError) {
    await db.from("orders").delete().eq("id", order.id);
    throw itemsError;
  }

  if (body.save_details) {
    await db.from("profiles").update({
      full_name: customer.customer_name,
      phone: customer.phone,
      address: customer.address,
      city: customer.city,
      state: customer.state,
      delivery_zone_id: zone.id,
    }).eq("id", user.id);
  }

  try {
    return json(await startPayment(order, returnUrl));
  } catch (err) {
    // don't leave an orphan order behind if Paystack couldn't start the payment
    await db.from("orders").delete().eq("id", order.id);
    throw err;
  }
}));
