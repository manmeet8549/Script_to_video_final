import { z } from "zod";
import { guard, jsonOk, parseBody, requireApiMember } from "@/lib/api/http";
import { removeMember, updateMemberRole } from "@/lib/dal/members";

type Ctx = { params: Promise<{ memberId: string }> };

const patchSchema = z.object({
  role: z.enum(["admin", "user", "editor", "support", "viewer"]),
});

export async function PATCH(request: Request, ctx: Ctx) {
  return guard(async () => {
    const auth = await requireApiMember(["owner", "admin"]);
    if (!auth.ok) return auth.response;
    const { memberId } = await ctx.params;

    const body = await parseBody(request, patchSchema);
    if (!body.ok) return body.response;

    const member = await updateMemberRole(memberId, body.data.role);
    return jsonOk(member);
  });
}

export async function DELETE(_request: Request, ctx: Ctx) {
  return guard(async () => {
    const auth = await requireApiMember(["owner", "admin"]);
    if (!auth.ok) return auth.response;
    const { memberId } = await ctx.params;

    await removeMember(memberId);
    return jsonOk({ id: memberId });
  });
}
