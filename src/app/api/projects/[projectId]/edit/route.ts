import { z } from "zod";
import { guard, jsonError, jsonOk, parseBody, requireApiMember } from "@/lib/api/http";
import { getProject } from "@/lib/dal/projects";
import { createEditTask, getLatestEditTask, pollEditing } from "@/lib/dal/pipeline";

type Ctx = { params: Promise<{ projectId: string }> };

// GET /api/projects/[projectId]/edit?poll=1 — get latest edit task status, optionally polling
export async function GET(request: Request, ctx: Ctx) {
  return guard(async () => {
    const auth = await requireApiMember();
    if (!auth.ok) return auth.response;
    const { projectId } = await ctx.params;
    if (!(await getProject(projectId))) return jsonError("Project not found", 404);

    const latest = await getLatestEditTask(projectId);
    const poll = new URL(request.url).searchParams.get("poll");
    if (poll && latest && latest.status === "in_progress" && latest.edit_type === "ai") {
      return jsonOk(await pollEditing(auth.membership.workspace_id, latest.id));
    }
    return jsonOk(latest);
  });
}

const schema = z.object({
  edit_type: z.enum(["ai", "manual"]),
  instructions: z.string().max(4000).optional(),
  editor_id: z.string().uuid().nullable().optional(),
  source_video_url: z.string().optional().nullable(),
  settings: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: Request, ctx: Ctx) {
  return guard(async () => {
    const auth = await requireApiMember(["owner", "admin", "user"]);
    if (!auth.ok) return auth.response;
    const { projectId } = await ctx.params;
    if (!(await getProject(projectId))) return jsonError("Project not found", 404);

    const body = await parseBody(request, schema);
    if (!body.ok) return body.response;

    const task = await createEditTask(auth.membership.workspace_id, projectId, {
      editType: body.data.edit_type,
      instructions: body.data.instructions,
      editorId: body.data.editor_id,
      sourceVideoUrl: body.data.source_video_url,
      settings: body.data.settings,
    });
    return jsonOk(task, { status: 201 });
  });
}
