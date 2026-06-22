import { z } from "zod";
import { guard, jsonOk, parseBody, requireApiMember } from "@/lib/api/http";
import { inviteMember, listMembers } from "@/lib/dal/members";

// GET /api/members — members of the caller's active workspace.
export async function GET() {
  return guard(async () => {
    const auth = await requireApiMember();
    if (!auth.ok) return auth.response;
    return jsonOk(await listMembers(auth.membership.workspace_id));
  });
}

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "user", "editor", "support", "viewer"]),
});

// POST /api/members — invite a member (owner/admin only).
export async function POST(request: Request) {
  return guard(async () => {
    const auth = await requireApiMember(["owner", "admin"]);
    if (!auth.ok) return auth.response;

    const body = await parseBody(request, inviteSchema);
    if (!body.ok) return body.response;

    const result = await inviteMember({
      workspaceId: auth.membership.workspace_id,
      email: body.data.email,
      role: body.data.role,
      invitedBy: auth.user.id,
    });
    return jsonOk(result, { status: 201 });
  });
}
