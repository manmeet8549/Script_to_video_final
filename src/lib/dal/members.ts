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

export type InviteResult = {
  member: WorkspaceMember;
  // The generated temporary password, present only when a brand-new user was
  // provisioned with `useTempPassword` (the default).
  tempPassword?: string;
  // A Supabase action link the invitee can follow to set their own password,
  // present only when a brand-new user was invited with `useTempPassword: false`.
  setupLink?: string;
  // Whether this invitation provisioned a new auth user (vs. an existing one).
  isNewUser: boolean;
};

// Invite a member by email. If a profile already exists they are added directly
// (active); otherwise an auth user is provisioned (service role) and linked as a
// pending member. New users get either a temporary password (default) or a
// password-setup link, depending on `useTempPassword`.
//
// Throws a descriptive error when the email already belongs to a member of this
// workspace.
export async function inviteMember(input: {
  workspaceId: string;
  email: string;
  role: WorkspaceRole;
  invitedBy: string;
  fullName?: string;
  useTempPassword?: boolean;
  // Where the password-setup link should land (link flow only).
  redirectTo?: string;
}): Promise<InviteResult> {
  const admin = createAdminClient();
  const email = input.email.trim().toLowerCase();
  const useTempPassword = input.useTempPassword ?? true;
  const fullName = input.fullName?.trim() || undefined;

  // Look up an existing profile.
  const { data: existing } = await admin.from("profiles").select("id").eq("email", email).single();

  // Guard against re-inviting someone who is already on this workspace.
  if (existing) {
    const { data: dupe } = await admin
      .from("workspace_members")
      .select("id")
      .eq("workspace_id", input.workspaceId)
      .eq("user_id", existing.id)
      .maybeSingle();
    if (dupe) {
      throw new Error("This person is already a member of this workspace.");
    }
  }

  let userId = existing?.id ?? null;
  let tempPassword: string | undefined;
  let setupLink: string | undefined;
  const isNewUser = !existing;

  if (!userId) {
    if (useTempPassword) {
      tempPassword = generateTempPassword();
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: fullName ? { full_name: fullName } : undefined,
      });
      if (createErr) throw createErr;
      userId = created.user.id;
      // Store the temporary password in the profile
      await admin
        .from("profiles")
        .update({ password_plain: tempPassword })
        .eq("id", userId);
    } else {
      // Provision via an invite link: Supabase creates the auth user and returns
      // an action link the invitee follows to establish a session and set a
      // password. Email delivery (if SMTP is configured) is handled by Supabase.
      const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
        type: "invite",
        email,
        options: {
          data: fullName ? { full_name: fullName } : undefined,
          redirectTo: input.redirectTo,
        },
      });
      if (linkErr) throw linkErr;
      userId = linkData.user?.id ?? null;
      setupLink = linkData.properties?.action_link;
      if (!userId) throw new Error("Failed to provision the invited user.");
    }
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

  return { member, tempPassword, setupLink, isNewUser };
}

function generateTempPassword(): string {
  // 16 url-safe characters.
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return Buffer.from(bytes).toString("base64url");
}
