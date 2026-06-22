import { z } from "zod";
import { guard, jsonError, jsonOk, parseBody, requireApiMember } from "@/lib/api/http";
import { getProject } from "@/lib/dal/projects";
import { generateVoice, getLatestVoice } from "@/lib/dal/pipeline";

type Ctx = { params: Promise<{ projectId: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  return guard(async () => {
    const auth = await requireApiMember();
    if (!auth.ok) return auth.response;
    const { projectId } = await ctx.params;
    if (!(await getProject(projectId))) return jsonError("Project not found", 404);
    return jsonOk(await getLatestVoice(projectId));
  });
}

const genSchema = z.object({
  voice_id: z.string().optional(),
  text: z.string().optional(),
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

    const voice = await generateVoice(auth.membership.workspace_id, projectId, {
      voiceId: body.data.voice_id,
      text: body.data.text,
      settings: body.data.settings,
    });
    return jsonOk(voice, { status: 201 });
  });
}
