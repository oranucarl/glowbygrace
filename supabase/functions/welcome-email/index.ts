// Sends the welcome email once per account. Called by the database
// (trigger on_auth_user_verified) with a shared secret, not by browsers.
import { env } from "../_shared/http.ts";
import { db } from "../_shared/db.ts";
import { sendWelcomeEmail } from "../_shared/email.ts";

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  if (!safeEqual(req.headers.get("x-welcome-secret") || "", env("WELCOME_HOOK_SECRET"))) {
    return new Response("Unauthorized", { status: 401 });
  }
  const { user_id } = await req.json().catch(() => ({}));
  if (typeof user_id !== "string") return new Response("Bad request", { status: 400 });

  // claim it first so a retry can't send a second welcome
  const { data: profile, error } = await db
    .from("profiles")
    .update({ welcome_email_sent_at: new Date().toISOString() })
    .eq("id", user_id)
    .is("welcome_email_sent_at", null)
    .select("email, full_name")
    .maybeSingle();
  if (error) {
    console.error(error);
    return new Response("error", { status: 500 });
  }
  if (!profile || !profile.email) return new Response("already sent", { status: 200 });

  try {
    await sendWelcomeEmail({ email: profile.email, name: profile.full_name || "" });
    return new Response("sent", { status: 200 });
  } catch (err) {
    console.error("Welcome email failed", err);
    await db.from("profiles").update({ welcome_email_sent_at: null }).eq("id", user_id);
    return new Response("error", { status: 500 });
  }
});
