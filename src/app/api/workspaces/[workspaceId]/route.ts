import { guard, jsonError, jsonOk, requireApiUser, parseBody } from "@/lib/api/http";
import { getWorkspaceDetail } from "@/lib/dal/workspaces";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

export async function GET(
  _request: Request,
  ctx: { params: Promise<{ workspaceId: string }> },
) {
  return guard(async () => {
    const auth = await requireApiUser();
    if (!auth.ok) return auth.response;

    const { workspaceId } = await ctx.params;
    const detail = await getWorkspaceDetail(workspaceId);
    if (!detail) return jsonError("Workspace not found", 404);

    // Only ever DISPLAY a temp password stored at invite time, gated by the
    // caller's role. Never reset a member's auth password here: resetting via
    // the admin API revokes that user's sessions — including the owner's own
    // row in this list — which logged the owner out and 401'd their next call.
    const callerRole = detail.role;

    detail.members = detail.members.map((m) => {
      const profile = m.profile ? { ...m.profile } : null;
      if (profile && profile.password_plain) {
        const canSee =
          callerRole === "owner" ||
          (callerRole === "admin" && (m.role === "user" || m.role === "editor"));
        if (!canSee) {
          delete profile.password_plain;
        }
      }
      return { ...m, profile };
    });

    return jsonOk(detail);
  });
}

const updateSchema = z.object({
  name: z.string().min(1, "Workspace name is required").max(120).optional(),
  slug: z
    .string()
    .max(60)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase kebab-case")
    .optional(),
  description: z.string().max(2000).optional(),
  subscription_tier: z.string().max(50).optional(),
  status: z.enum(["active", "suspended", "archived"]).optional(),
});

export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ workspaceId: string }> },
) {
  return guard(async () => {
    const auth = await requireApiUser();
    if (!auth.ok) return auth.response;

    const { workspaceId } = await ctx.params;
    const body = await parseBody(request, updateSchema);
    if (!body.ok) return body.response;

    const supabase = await createClient();

    // Check if user is platform owner or workspace owner
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_platform_owner")
      .eq("id", auth.user.id)
      .single();

    const { data: workspace } = await supabase
      .from("workspaces")
      .select("owner_id")
      .eq("id", workspaceId)
      .single();

    if (!workspace) {
      return jsonError("Workspace not found", 404);
    }

    const isPlatformOwner = profile?.is_platform_owner ?? false;
    const isWorkspaceOwner = workspace.owner_id === auth.user.id;

    if (!isPlatformOwner && !isWorkspaceOwner) {
      return jsonError("Insufficient permissions to update this workspace", 403);
    }

    const { data: updated, error } = await supabase
      .from("workspaces")
      .update(body.data)
      .eq("id", workspaceId)
      .select("*")
      .single();

    if (error) {
      return jsonError(error.message, 400);
    }

    return jsonOk(updated);
  });
}

