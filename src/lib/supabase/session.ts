import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { publicSupabaseConfig } from "@/lib/env";
import { primaryRole } from "@/lib/auth/roles";
import type { Database, WorkspaceRole } from "@/types/db";
import type { SupabaseClient, User } from "@supabase/supabase-js";

type ProxySupabase = SupabaseClient<Database>;

// Refreshes the Supabase auth session for an incoming request and returns the
// validated user alongside a response carrying any refreshed auth cookies.
// Designed to be called from proxy.ts (the Next 16 successor to middleware).
// The Supabase client is returned too so the proxy can authorize the request
// (resolve the caller's active role) without standing up a second client.
export async function updateSession(
  request: NextRequest,
): Promise<{ response: NextResponse; user: User | null; supabase: ProxySupabase }> {
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

  return { response, user, supabase };
}

// Resolve the role the user is currently acting under, mirroring the DAL's
// getActiveMembership: prefer the cookie-selected workspace, otherwise fall
// back to their highest-privilege active membership. Returns null when the user
// has no active membership (e.g. an invitation that hasn't been accepted yet).
export async function resolveActiveRole(
  supabase: ProxySupabase,
  userId: string,
  activeWorkspaceId: string | undefined,
): Promise<WorkspaceRole | null> {
  const { data } = await supabase
    .from("workspace_members")
    .select("workspace_id, role")
    .eq("user_id", userId)
    .eq("status", "active");

  if (!data || data.length === 0) return null;

  if (activeWorkspaceId) {
    const match = data.find((m) => m.workspace_id === activeWorkspaceId);
    if (match) return match.role;
  }

  const best = primaryRole(data.map((m) => m.role));
  return data.find((m) => m.role === best)?.role ?? data[0].role;
}
