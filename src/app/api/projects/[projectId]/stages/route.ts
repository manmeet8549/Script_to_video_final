import { z } from "zod";
import { guard, jsonError, jsonOk, parseBody, requireApiMember } from "@/lib/api/http";
import { getProject, getProjectStages, setStageStatus } from "@/lib/dal/projects";

type Ctx = { params: Promise<{ projectId: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  return guard(async () => {
    const auth = await requireApiMember();
    if (!auth.ok) return auth.response;
    const { projectId } = await ctx.params;

    const project = await getProject(projectId);
    if (!project) return jsonError("Project not found", 404);
    return jsonOk(await getProjectStages(projectId));
  });
}

const patchSchema = z.object({
  stage_name: z.enum(["idea", "script", "voice", "video", "editing", "review", "publish"]),
  status: z.enum(["pending", "in_progress", "completed", "failed", "skipped"]),
  output_data: z.record(z.string(), z.unknown()).optional(),
});

export async function PATCH(request: Request, ctx: Ctx) {
  return guard(async () => {
    const auth = await requireApiMember();
    if (!auth.ok) return auth.response;
    const { projectId } = await ctx.params;

    const project = await getProject(projectId);
    if (!project) return jsonError("Project not found", 404);

    const body = await parseBody(request, patchSchema);
    if (!body.ok) return body.response;

    const stage = await setStageStatus(
      projectId,
      body.data.stage_name,
      body.data.status,
      body.data.output_data,
    );
    return jsonOk(stage);
  });
}
