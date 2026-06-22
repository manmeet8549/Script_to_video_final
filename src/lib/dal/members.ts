import "server-only";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Profile, WorkspaceMember, WorkspaceRole } from "@/types/db";

export type MemberWithProfile = WorkspaceMember & { profile: Profile | null };

// Members of a workspace, joined with their profile. Two queries to avoid
// relying on relationship metadata in the hand-authored Database types.
export async function listMembers(workspaceId: string): Promise<MemberWithProfile[]> {
  const supabase = await createClient();

  const { data: members, error } = await supabase
    .from("workspace_members")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  if (!members || members.length === 0) return [];

  const ids = members.map((m) => m.user_id);
  const { data: profiles } = await supabase.from("profiles").select("*").in("id", ids);
  const byId = new Map((profiles ?? []).map((p) => [p.id, p]));

  return members.map((m) => ({ ...m, profile: byId.get(m.user_id) ?? null }));
}

export async function updateMemberRole(
  memberId: string,
  role: WorkspaceRole,
): Promise<WorkspaceMember> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("workspace_members")
    .update({ role })
    .eq("id", memberId)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function removeMember(memberId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("workspace_members").delete().eq("id", memberId);
  if (error) throw error;
}

// Invite a member by email. If a profile already exists they are added directly;
// otherwise an auth user is created (service role) with a temporary password and
// linked as a pending member. Returns the temp password when one was generated.
export async function inviteMember(input: {
  workspaceId: string;
  email: string;
  role: WorkspaceRole;
  invitedBy: string;
}): Promise<{ member: WorkspaceMember; tempPassword?: string }> {
  const admin = createAdminClient();
  const email = input.email.trim().toLowerCase();

  // Look up an existing profile.
  const { data: existing } = await admin.from("profiles").select("id").eq("email", email).single();

  let userId = existing?.id ?? null;
  let tempPassword: string | undefined;

  if (!userId) {
    tempPassword = generateTempPassword();
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
    });
    if (createErr) throw createErr;
    userId = created.user.id;
  }

  const { data: member, error } = await admin
    .from("workspace_members")
    .insert({
      workspace_id: input.workspaceId,
      user_id: userId!,
      role: input.role,
      status: existing ? "active" : "pending",
      invited_by: input.invitedBy,
    })
    .select("*")
    .single();
  if (error) throw error;

  return { member, tempPassword };
}

function generateTempPassword(): string {
  // 16 url-safe characters.
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return Buffer.from(bytes).toString("base64url");
}
