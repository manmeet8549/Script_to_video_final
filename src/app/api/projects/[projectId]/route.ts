import { z } from "zod";
import { guard, jsonError, jsonOk, parseBody, requireApiMember } from "@/lib/api/http";
import { getMemberships } from "@/lib/dal/auth";
import { deleteProject, getProject, updateProject, ProjectUpdateForbidden } from "@/lib/dal/projects";

type Ctx = { params: Promise<{ projectId: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  return guard(async () => {
    const auth = await requireApiMember();
    if (!auth.ok) return auth.response;
    const { projectId } = await ctx.params;

    const project = await getProject(projectId);
    if (!project) return jsonError("Project not found", 404);
    return jsonOk(project);
  });
}

const patchSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(4000).nullable().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  status: z
    .enum(["idea", "scripting", "voice_gen", "video_gen", "editing", "review", "published", "archived"])
    .optional(),
  assigned_to: z.string().uuid().nullable().optional(),
  deadline: z.string().datetime().nullable().optional(),
  progress_percent: z.number().int().min(0).max(100).optional(),
  thumbnail_url: z.string().url().nullable().optional(),
  video_url: z.string().url().nullable().optional(),
});

export async function PATCH(request: Request, ctx: Ctx) {
  return guard(async () => {
    const auth = await requireApiMember();
    if (!auth.ok) return auth.response;
    const { projectId } = await ctx.params;

    // getProject is RLS-scoped, so a returned row proves the caller can see this
    // project — i.e. it lives in one of their workspaces.
    const existing = await getProject(projectId);
    if (!existing) return jsonError("Project not found", 404);

    // Authorize against the project's OWN workspace (not just the active one):
    // any owner/admin/user member of it, or the assigned editor, may update.
    const roleHere = (await getMemberships()).find(
      (m) => m.workspace_id === existing.workspace_id,
    )?.role;
    const canUpdate =
      (roleHere != null && ["owner", "admin", "user"].includes(roleHere)) ||
      existing.assigned_to === auth.user.id;
    if (!canUpdate) {
      return jsonError("You don't have permission to update this project", 403);
    }

    const body = await parseBody(request, patchSchema);
    if (!body.ok) return body.response;

    try {
      const updated = await updateProject(projectId, body.data);
      return jsonOk(updated);
    } catch (err) {
      if (err instanceof ProjectUpdateForbidden) return jsonError(err.message, 403);
      throw err;
    }
  });
}

export async function DELETE(_request: Request, ctx: Ctx) {
  return guard(async () => {
    const auth = await requireApiMember(["owner", "admin", "user"]);
    if (!auth.ok) return auth.response;
    const { projectId } = await ctx.params;

    const existing = await getProject(projectId);
    if (!existing) return jsonError("Project not found", 404);

    await deleteProject(projectId);
    return jsonOk({ id: projectId });
  });
}
