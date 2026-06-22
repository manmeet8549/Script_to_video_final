import { z } from "zod";
import { guard, jsonError, jsonOk, parseBody, requireApiMember } from "@/lib/api/http";
import { getProject } from "@/lib/dal/projects";
import { getLatestScript, saveScript } from "@/lib/dal/pipeline";

type Ctx = { params: Promise<{ projectId: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  return guard(async () => {
    const auth = await requireApiMember();
    if (!auth.ok) return auth.response;
    const { projectId } = await ctx.params;
    if (!(await getProject(projectId))) return jsonError("Project not found", 404);
    return jsonOk(await getLatestScript(projectId));
  });
}

const saveSchema = z.object({
  content: z.string().min(1, "Script content is required"),
  tone: z.string().max(40).optional(),
  language: z.string().max(20).optional(),
  ai_generated: z.boolean().optional(),
});

export async function POST(request: Request, ctx: Ctx) {
  return guard(async () => {
    const auth = await requireApiMember(["owner", "admin", "user"]);
    if (!auth.ok) return auth.response;
    const { projectId } = await ctx.params;
    if (!(await getProject(projectId))) return jsonError("Project not found", 404);

    const body = await parseBody(request, saveSchema);
    if (!body.ok) return body.response;

    const script = await saveScript(projectId, {
      content: body.data.content,
      tone: body.data.tone,
      language: body.data.language,
      aiGenerated: body.data.ai_generated,
    });
    return jsonOk(script, { status: 201 });
  });
}
