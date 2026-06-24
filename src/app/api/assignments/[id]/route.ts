import { z } from "zod";
import { guard, jsonError, jsonOk, parseBody, requireApiMember } from "@/lib/api/http";
import { approveAssignment, getAssignment, setAssignmentStatus } from "@/lib/dal/collaboration";

type Ctx = { params: Promise<{ id: string }> };

const schema = z.object({
  action: z.enum(["accept", "request_revision", "approve", "reject"]),
  feedback: z.string().max(2000).optional(),
});

// PATCH /api/assignments/[id] — editor accepts work; creator requests a revision,
// accepts (approve), or rejects.
export async function PATCH(request: Request, ctx: Ctx) {
  return guard(async () => {
    const auth = await requireApiMember(["owner", "admin", "user", "editor"]);
    if (!auth.ok) return auth.response;
    const { id } = await ctx.params;

    const body = await parseBody(request, schema);
    if (!body.ok) return body.response;

    if (!(await getAssignment(id))) return jsonError("Assignment not found", 404);

    switch (body.data.action) {
      case "accept":
        return jsonOk(await setAssignmentStatus(id, "in_progress"));
      case "request_revision":
        return jsonOk(
          await setAssignmentStatus(id, "revision_requested", { feedback: body.data.feedback ?? null }),
        );
      case "reject":
        return jsonOk(
          await setAssignmentStatus(id, "rejected", { feedback: body.data.feedback ?? null }),
        );
      case "approve":
        return jsonOk(await approveAssignment(id));
    }
  });
}
