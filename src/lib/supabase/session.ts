import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { publicSupabaseConfig } from "@/lib/env";
import type { Database } from "@/types/db";
import type { User } from "@supabase/supabase-js";

// Refreshes the Supabase auth session for an incoming request and returns the
// validated user alongside a response carrying any refreshed auth cookies.
// Designed to be called from proxy.ts (the Next 16 successor to middleware).
export async function updateSession(
  request: NextRequest,
): Promise<{ response: NextResponse; user: User | null }> {
  let response = NextResponse.next({ request });

  const { url, anonKey } = publicSupabaseConfig();

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // IMPORTANT: getUser() revalidates the token with Supabase Auth. Do not trust
  // getSession() in server code.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response, user };
}
