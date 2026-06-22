import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { publicSupabaseConfig } from "@/lib/env";
import type { Database } from "@/types/db";

// Server Supabase client (anon key, RLS-enforced) bound to the request cookies.
// Use inside Server Components, Route Handlers, and Server Actions.
export async function createClient() {
  const cookieStore = await cookies();
  const { url, anonKey } = publicSupabaseConfig();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // `setAll` is called from a Server Component where cookies are
          // read-only. The session is refreshed in proxy.ts instead, so this
          // is safe to ignore.
        }
      },
    },
  });
}
