import { z } from "zod";
import { guard, jsonError, jsonOk, parseBody, requireApiUser } from "@/lib/api/http";
import { createClient } from "@/lib/supabase/server";
import { inviteMember } from "@/lib/dal/members";

const inviteSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  role: z.enum(["admin", "user", "editor", "support", "viewer"]).default("admin"),
  full_name: z.string().max(120).optional(),
  message: z.string().max(200).optional(),
  use_temp_password: z.boolean().default(true),
});

// POST /api/workspaces/[workspaceId]/members
// Invite a member into a SPECIFIC workspace (used by the owner create-workspace
// wizard, which invites the initial admin before that workspace is the caller's
// "active" one). Caller must be an active owner/admin of that workspace.
export async function POST(
  request: Request,
  ctx: { params: Promise<{ workspaceId: string }> },
) {
  return guard(async () => {
    const auth = await requireApiUser();
    if (!auth.ok) return auth.response;

    const { workspaceId } = await ctx.params;

    // Authorize against this specific workspace. A platform owner or the
    // workspace's owner_id can always manage members (matching the workspaces
    // RLS write policy); otherwise require an active owner/admin membership row.
    const supabase = await createClient();
    const [{ data: profile }, { data: workspace }, { data: membership }] = await Promise.all([
      supabase.from("profiles").select("is_platform_owner").eq("id", auth.user.id).single(),
      supabase.from("workspaces").select("owner_id").eq("id", workspaceId).maybeSingle(),
      supabase
        .from("workspace_members")
        .select("role")
        .eq("workspace_id", workspaceId)
        .eq("user_id", auth.user.id)
        .eq("status", "active")
        .maybeSingle(),
    ]);

    const isPlatformOwner = profile?.is_platform_owner ?? false;
    const isWorkspaceOwner = workspace?.owner_id === auth.user.id;
    const isMemberAdmin = !!membership && ["owner", "admin"].includes(membership.role);

    if (!isPlatformOwner && !isWorkspaceOwner && !isMemberAdmin) {
      return jsonError("You don't have permission to invite members to this workspace", 403);
    }

    const body = await parseBody(request, inviteSchema);
    if (!body.ok) return body.response;

    // Land password-setup links on the invitation acceptance page.
    const redirectTo = new URL("/auth/accept-invite", request.url).toString();

    const result = await inviteMember({
      workspaceId,
      email: body.data.email,
      role: body.data.role,
      invitedBy: auth.user.id,
      fullName: body.data.full_name,
      useTempPassword: body.data.use_temp_password,
      redirectTo,
    });

    return jsonOk(result, { status: 201 });
  });
}
