import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { env } from "@/lib/env";

// A Supabase client with the secret key. It bypasses row level security, so use it
// only after checking who is asking: Stripe webhooks, invites and the contact form.
export function createAdminClient() {
  return createClient<Database>(env.supabaseUrl(), env.supabaseSecretKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
