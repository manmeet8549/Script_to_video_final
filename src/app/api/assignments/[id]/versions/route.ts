import { z } from "zod";
import { guard, jsonError, jsonOk, parseBody, requireApiMember } from "@/lib/api/http";
import { addEditedVersion, getAssignment, listVersions } from "@/lib/dal/collaboration";

type Ctx = { params: Promise<{ id: string }> };

// GET /api/assignments/[id]/versions — all uploaded edited cuts for an assignment.
export async function GET(_request: Request, ctx: Ctx) {
  return guard(async () => {
    const auth = await requireApiMember();
    if (!auth.ok) return auth.response;
    const { id } = await ctx.params;
    if (!(await getAssignment(id))) return jsonError("Assignment not found", 404);
    return jsonOk({ versions: await listVersions(id) });
  });
}

const schema = z.object({
  video_url: z.string().min(1, "An edited video URL is required"),
  notes: z.string().max(2000).optional(),
  r2_key: z.string().optional(),
});

// POST /api/assignments/[id]/versions — editor uploads a new edited version,
// moving the assignment into review.
export async function POST(request: Request, ctx: Ctx) {
  return guard(async () => {
    const auth = await requireApiMember(["owner", "admin", "editor"]);
    if (!auth.ok) return auth.response;
    const { id } = await ctx.params;
    if (!(await getAssignment(id))) return jsonError("Assignment not found", 404);

    const body = await parseBody(request, schema);
    if (!body.ok) return body.response;

    const version = await addEditedVersion(id, {
      videoUrl: body.data.video_url,
      notes: body.data.notes,
      r2Key: body.data.r2_key,
    });
    return jsonOk(version, { status: 201 });
  });
}
