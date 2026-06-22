import "server-only";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUser } from "@/lib/dal/auth";
import type { Workspace, WorkspaceMember } from "@/types/db";

export type AcceptedInvitation = {
  workspace: Pick<Workspace, "id" | "name" | "slug">;
  role: WorkspaceMember["role"];
};

// Pending workspace invitations for the current user (memberships they have not
// yet activated). Read with the user's own session — `members_select` lets a
// user see rows where `user_id = auth.uid()` regardless of status.
export async function getPendingInvitations(): Promise<AcceptedInvitation[]> {
  const user = await getUser();
  if (!user) return [];
  const supabase = await createClient();

  const { data: members } = await supabase
    .from("workspace_members")
    .select("workspace_id, role")
    .eq("user_id", user.id)
    .eq("status", "pending");
  if (!members || members.length === 0) return [];

  const { data: workspaces } = await supabase
    .from("workspaces")
    .select("id, name, slug")
    .in(
      "id",
      members.map((m) => m.workspace_id),
    );
  const byId = new Map((workspaces ?? []).map((w) => [w.id, w]));

  return members
    .map((m) => {
      const ws = byId.get(m.workspace_id);
      return ws ? { workspace: ws, role: m.role as WorkspaceMember["role"] } : null;
    })
    .filter((x): x is AcceptedInvitation => x !== null);
}

// Finalize acceptance for the authenticated user: flip all of their pending
// memberships to active and stamp `password_changed_at`. A pending member can't
// write their own membership row under RLS (it requires an active role), so this
// runs through the service-role client after the caller's identity is verified.
export async function acceptInvitation(userId: string): Promise<AcceptedInvitation[]> {
  const admin = createAdminClient();

  const { data: pending } = await admin
    .from("workspace_members")
    .select("id, workspace_id, role")
    .eq("user_id", userId)
    .eq("status", "pending");
  if (!pending || pending.length === 0) return [];

  const { error } = await admin
    .from("workspace_members")
    .update({ status: "active", password_changed_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("status", "pending");
  if (error) throw error;

  const { data: workspaces } = await admin
    .from("workspaces")
    .select("id, name, slug")
    .in(
      "id",
      pending.map((m) => m.workspace_id),
    );
  const byId = new Map((workspaces ?? []).map((w) => [w.id, w]));

  return pending
    .map((m) => {
      const ws = byId.get(m.workspace_id);
      return ws ? { workspace: ws, role: m.role as WorkspaceMember["role"] } : null;
    })
    .filter((x): x is AcceptedInvitation => x !== null);
}
