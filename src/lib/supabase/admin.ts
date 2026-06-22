import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { publicSupabaseConfig, serviceRoleKey } from "@/lib/env";
import type { Database } from "@/types/db";

// Service-role client — BYPASSES Row Level Security. Use only in trusted
// server code (webhooks, system jobs) after you have verified authorization
// yourself. Never import this from a Client Component.
export function createAdminClient() {
  const { url } = publicSupabaseConfig();
  return createSupabaseClient<Database>(url, serviceRoleKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
