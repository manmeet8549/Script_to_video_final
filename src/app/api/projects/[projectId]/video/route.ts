import { z } from "zod";
import { guard, jsonError, jsonOk, parseBody, requireApiMember } from "@/lib/api/http";
import { getProject } from "@/lib/dal/projects";
import { createVideo, getLatestVideo, pollVideo } from "@/lib/dal/pipeline";

type Ctx = { params: Promise<{ projectId: string }> };

// GET — latest video generation. Pass ?poll=1 to refresh status from the provider.
export async function GET(request: Request, ctx: Ctx) {
  return guard(async () => {
    const auth = await requireApiMember();
    if (!auth.ok) return auth.response;
    const { projectId } = await ctx.params;
    if (!(await getProject(projectId))) return jsonError("Project not found", 404);

    const latest = await getLatestVideo(projectId);
    const poll = new URL(request.url).searchParams.get("poll");
    if (poll && latest && latest.status === "generating") {
      return jsonOk(await pollVideo(auth.membership.workspace_id, latest.id));
    }
    return jsonOk(latest);
  });
}

const genSchema = z.object({
  settings: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: Request, ctx: Ctx) {
  return guard(async () => {
    const auth = await requireApiMember(["owner", "admin", "user"]);
    if (!auth.ok) return auth.response;
    const { projectId } = await ctx.params;
    if (!(await getProject(projectId))) return jsonError("Project not found", 404);

    const body = await parseBody(request, genSchema);
    if (!body.ok) return body.response;

    const video = await createVideo(auth.membership.workspace_id, projectId, {
      settings: body.data.settings,
    });
    return jsonOk(video, { status: 201 });
  });
}
