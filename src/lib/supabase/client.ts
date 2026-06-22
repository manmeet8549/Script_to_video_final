"use client";

import { createBrowserClient } from "@supabase/ssr";
import { publicSupabaseConfig } from "@/lib/env";
import type { Database } from "@/types/db";

// Browser Supabase client (anon key, RLS-enforced). Safe in Client Components.
export function createClient() {
  const { url, anonKey } = publicSupabaseConfig();
  return createBrowserClient<Database>(url, anonKey);
}
