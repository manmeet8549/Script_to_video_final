import "server-only";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUser } from "@/lib/dal/auth";
import { listMembers, type MemberWithProfile } from "@/lib/dal/members";
import { listProjects } from "@/lib/dal/projects";
import { slugify, uniqueSlug } from "@/lib/utils/slug";
import type { Project, Workspace, WorkspaceMember } from "@/types/db";

export type WorkspaceWithRole = Workspace & { role: WorkspaceMember["role"] };

export type WorkspaceDetail = {
  workspace: Workspace;
  role: WorkspaceMember["role"];
  members: MemberWithProfile[];
  projects: Project[];
};

// Workspaces the current user can see, annotated with their role. RLS already
// restricts visibility. Done as two queries to avoid depending on relationship
// metadata in the hand-authored Database types.
export async function listWorkspaces(): Promise<WorkspaceWithRole[]> {
  const user = await getUser();
  if (!user) return [];
  const supabase = await createClient();

  const { data: memberships, error: mErr } = await supabase
    .from("workspace_members")
    .select("workspace_id, role")
    .eq("user_id", user.id)
    .eq("status", "active");
  if (mErr) throw mErr;
  if (!memberships || memberships.length === 0) return [];

  const roleByWs = new Map(memberships.map((m) => [m.workspace_id, m.role]));

  const { data: workspaces, error: wErr } = await supabase
    .from("workspaces")
    .select("*")
    .in("id", Array.from(roleByWs.keys()));
  if (wErr) throw wErr;

  return (workspaces ?? []).map((ws) => ({
    ...ws,
    role: roleByWs.get(ws.id) as WorkspaceMember["role"],
  }));
}

// Whether a workspace slug is free. Checked with the service-role client so the
// answer reflects ALL workspaces (a slug may belong to one the caller can't see
// under RLS). The slug is a global unique key, so this is a safe trusted read.
export async function isSlugAvailable(rawSlug: string): Promise<{ available: boolean; normalized: string }> {
  const normalized = slugify(rawSlug);
  if (!normalized) return { available: false, normalized };
  const admin = createAdminClient();
  const { data } = await admin.from("workspaces").select("id").eq("slug", normalized).maybeSingle();
  return { available: !data, normalized };
}

export async function getWorkspace(id: string): Promise<Workspace | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("workspaces").select("*").eq("id", id).single();
  return data ?? null;
}

// Full view of a single workspace the current user belongs to: the workspace
// row, the caller's role in it, its members, and its projects. RLS restricts
// all of these to workspaces the user is a member of, so a non-member sees
// null. Returns null when the workspace is missing or inaccessible.
export async function getWorkspaceDetail(id: string): Promise<WorkspaceDetail | null> {
  const user = await getUser();
  if (!user) return null;
  const supabase = await createClient();

  const { data: membership } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", id)
    .eq("user_id", user.id)
    .eq("status", "active")
    .single();
  if (!membership) return null;

  const workspace = await getWorkspace(id);
  if (!workspace) return null;

  const [members, projects] = await Promise.all([listMembers(id), listProjects(id)]);

  return {
    workspace,
    role: membership.role as WorkspaceMember["role"],
    members,
    projects,
  };
}

// Create a workspace owned by the current user and add them as an 'owner'
// member. Relies on RLS (owner_id must equal auth.uid()).
export async function createWorkspace(input: {
  name: string;
  slug?: string;
  description?: string;
  subscription_tier?: string;
}): Promise<Workspace> {
  const user = await getUser();
  if (!user) throw new Error("Not authenticated");
  const supabase = await createClient();

  const slug = input.slug ? input.slug : uniqueSlug(input.name);

  const { data: workspace, error } = await supabase
    .from("workspaces")
    .insert({
      name: input.name,
      slug,
      owner_id: user.id,
      description: input.description ?? null,
      subscription_tier: input.subscription_tier ?? "basic",
    })
    .select("*")
    .single();
  if (error) throw error;

  const { error: memberError } = await supabase.from("workspace_members").insert({
    workspace_id: workspace.id,
    user_id: user.id,
    role: "owner",
    status: "active",
  });
  if (memberError) throw memberError;

  return workspace;
}
