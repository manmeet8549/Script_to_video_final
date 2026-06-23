import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ACTIVE_WORKSPACE_COOKIE, primaryRole } from "@/lib/auth/roles";
import type { Profile, WorkspaceMember, WorkspaceRole } from "@/types/db";
import type { User } from "@supabase/supabase-js";

// Re-exported from the shared (client-safe) roles module so existing importers
// of `@/lib/dal/auth` keep working.
export { ACTIVE_WORKSPACE_COOKIE };

// Validated auth user for the current request (deduped per render pass).
export const getUser = cache(async (): Promise<User | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

export const getProfile = cache(async (): Promise<Profile | null> => {
  const user = await getUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  return data ?? null;
});

// All active memberships for the current user.
export const getMemberships = cache(async (): Promise<WorkspaceMember[]> => {
  const user = await getUser();
  if (!user) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("workspace_members")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "active");
  return data ?? [];
});

// Whether the user has at least one membership that is not yet active (an
// invitation they haven't accepted). Used to tell a freshly-invited member
// apart from a brand-new platform owner who has no memberships at all.
export const hasPendingMembership = cache(async (): Promise<boolean> => {
  const user = await getUser();
  if (!user) return false;
  const supabase = await createClient();
  const { count } = await supabase
    .from("workspace_members")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .neq("status", "active");
  return (count ?? 0) > 0;
});

// Resolve the "current" workspace: the cookie-selected one if the user still
// belongs to it, otherwise their highest-privilege membership.
export const getActiveMembership = cache(async (): Promise<WorkspaceMember | null> => {
  const memberships = await getMemberships();
  if (memberships.length === 0) return null;

  const cookieStore = await cookies();
  const selected = cookieStore.get(ACTIVE_WORKSPACE_COOKIE)?.value;
  if (selected) {
    const match = memberships.find((m) => m.workspace_id === selected);
    if (match) return match;
  }

  const best = primaryRole(memberships.map((m) => m.role));
  return memberships.find((m) => m.role === best) ?? memberships[0];
});

export async function getCurrentRole(): Promise<WorkspaceRole | null> {
  const membership = await getActiveMembership();
  return membership?.role ?? null;
}

// Page guard: redirect to login when unauthenticated.
export async function requireUser(): Promise<User> {
  const user = await getUser();
  if (!user) redirect("/auth/login");
  return user;
}

// Page guard: ensure the user has an active workspace membership (optionally
// with one of the given roles), redirecting otherwise.
export async function requireMembership(roles?: WorkspaceRole[]): Promise<WorkspaceMember> {
  await requireUser();
  const membership = await getActiveMembership();
  if (!membership) redirect("/dashboard");
  if (roles && !roles.includes(membership.role)) redirect("/dashboard");
  return membership;
}
