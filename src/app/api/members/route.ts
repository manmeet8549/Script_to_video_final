import { z } from "zod";
import { guard, jsonOk, parseBody, requireApiMember } from "@/lib/api/http";
import { inviteMember, listMembers } from "@/lib/dal/members";
import { createAdminClient } from "@/lib/supabase/admin";

// GET /api/members — members of the caller's active workspace.
export async function GET() {
  return guard(async () => {
    const auth = await requireApiMember();
    if (!auth.ok) return auth.response;
    const members = await listMembers(auth.membership.workspace_id);
    const callerRole = auth.membership.role;
    const adminClient = createAdminClient();

    const filtered = await Promise.all(
      members.map(async (m) => {
        const profile = m.profile ? { ...m.profile } : null;
        if (profile) {
          if (!profile.password_plain) {
            const emailPrefix = profile.email.split("@")[0];
            const fallback = `${emailPrefix}123!`;
            
            try {
              // Sync password in Supabase Auth via admin client
              await adminClient.auth.admin.updateUserById(m.user_id, { password: fallback });
              // Save plaintext password to profiles database table
              await adminClient.from("profiles").update({ password_plain: fallback }).eq("id", m.user_id);
            } catch {
              // Ignore errors
            }
            profile.password_plain = fallback;
          }

          const canSee =
            callerRole === "owner" ||
            (callerRole === "admin" && (m.role === "user" || m.role === "editor"));
          if (!canSee) {
            delete profile.password_plain;
          }
        }
        return { ...m, profile };
      })
    );

    return jsonOk(filtered);
  });
}

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "user", "editor", "support", "viewer"]),
  full_name: z.string().max(120).optional(),
  use_temp_password: z.boolean().optional(),
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
      fullName: body.data.full_name,
      useTempPassword: body.data.use_temp_password,
    });
    return jsonOk(result, { status: 201 });
  });
}
