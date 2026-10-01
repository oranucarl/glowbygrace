import { createClient, type User } from "npm:@supabase/supabase-js@2";
import { env, HttpError } from "./http.ts";

// Service-role client: bypasses row level security, so only use it server-side.
export const db = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), {
  auth: { persistSession: false, autoRefreshToken: false },
});

export async function requireUser(req: Request): Promise<User> {
  const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  if (token) {
    const { data, error } = await db.auth.getUser(token);
    if (!error && data.user) return data.user;
  }
  throw new HttpError(401, "Please sign in to continue.");
}

export async function isAdmin(user: User): Promise<boolean> {
  const { data } = await db.from("admins").select("email").eq("email", (user.email || "").toLowerCase()).maybeSingle();
  return !!data;
}
