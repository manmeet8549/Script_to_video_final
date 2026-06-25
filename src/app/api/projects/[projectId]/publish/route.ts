import { z } from "zod";
import { guard, jsonError, jsonOk, parseBody, requireApiMember } from "@/lib/api/http";
import { getProject } from "@/lib/dal/projects";
import { createPublishTask } from "@/lib/dal/pipeline";

type Ctx = { params: Promise<{ projectId: string }> };

const schema = z.object({
  platform: z.string().min(1),
  title: z.string().max(200).optional(),
  description: z.string().max(8000).optional(),
  tags: z.array(z.string()).optional(),
  // Accept any string — the server converts to a public URL via toPublicUrl()
  // before passing to the provider, so proxy paths (/api/media/stream?key=...)
  // and R2 keys are all valid inputs here.
  thumbnail_url: z.string().optional(),
  visibility: z.enum(["public", "unlisted", "private"]).optional(),
  scheduled_at: z.string().datetime({ offset: true }).optional(),
  video_url: z.string().optional(),
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

    const task = await createPublishTask(auth.membership.workspace_id, projectId, {
      platform: body.data.platform,
      title: body.data.title,
      description: body.data.description,
      tags: body.data.tags,
      thumbnailUrl: body.data.thumbnail_url,
      visibility: body.data.visibility,
      scheduledAt: body.data.scheduled_at,
      videoUrl: body.data.video_url,
      settings: body.data.settings,
    });
    return jsonOk(task, { status: 201 });
  });
}
