import { z } from "zod";
import { guard, jsonError, jsonOk, parseBody, requireApiMember } from "@/lib/api/http";
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

    const existing = await getProject(projectId);
    if (!existing) return jsonError("Project not found", 404);

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
