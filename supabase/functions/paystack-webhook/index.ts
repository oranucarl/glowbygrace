// Paystack calls this after every successful charge, even if the shopper
// closed the tab before returning to the site. Set its URL in
// Paystack Dashboard → Settings → API Keys & Webhooks.
import { env } from "../_shared/http.ts";
import { paystack, settleTransaction } from "../_shared/paystack.ts";

async function hmacSha512(secret: string, payload: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-512" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const raw = await req.text();
  const expected = await hmacSha512(env("PAYSTACK_SECRET_KEY"), raw);
  if (!safeEqual(expected, req.headers.get("x-paystack-signature") || "")) {
    return new Response("Invalid signature", { status: 401 });
  }

  const event = JSON.parse(raw);
  if (event.event !== "charge.success") return new Response("ignored", { status: 200 });

  try {
    // re-check with Paystack rather than trusting the webhook body alone
    const tx = await paystack(`/transaction/verify/${encodeURIComponent(event.data.reference)}`);
    await settleTransaction(tx);
    return new Response("ok", { status: 200 });
  } catch (err) {
    console.error("Webhook processing failed", err);
    // non-2xx makes Paystack retry later
    return new Response("error", { status: 500 });
  }
});
