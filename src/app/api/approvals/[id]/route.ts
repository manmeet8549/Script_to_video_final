import { z } from "zod";
import { guard, jsonError, jsonOk, parseBody, requireApiMember } from "@/lib/api/http";
import { decideApproval } from "@/lib/dal/collaboration";

type Ctx = { params: Promise<{ id: string }> };

const schema = z.object({
  decision: z.enum(["approved", "rejected", "changes_requested"]),
  feedback: z.string().max(2000).optional(),
});

// PATCH /api/approvals/[id] — owner/admin decides on a queued publish. Approving
// releases the held publishing task.
export async function PATCH(request: Request, ctx: Ctx) {
  return guard(async () => {
    const auth = await requireApiMember(["owner", "admin"]);
    if (!auth.ok) return auth.response;
    const { id } = await ctx.params;

    const body = await parseBody(request, schema);
    if (!body.ok) return body.response;

    try {
      const item = await decideApproval(
        auth.membership.workspace_id,
        id,
        body.data.decision,
        body.data.feedback,
      );
      return jsonOk(item);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to update approval";
      return jsonError(msg, msg.includes("not found") ? 404 : 500);
    }
  });
}
