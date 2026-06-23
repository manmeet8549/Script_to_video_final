import { z } from "zod";
import { guard, jsonOk, parseBody, requireApiMember } from "@/lib/api/http";
import { createAdminClient } from "@/lib/supabase/admin";
import { broadcastNotifications } from "@/lib/dal/notifications";

const schema = z.object({
  title: z.string().min(1).max(200),
  message: z.string().max(1000).optional(),
  type: z.enum(["deadline", "deadline_reminder", "system", "mention"]).default("deadline"),
  target: z.union([
    z.literal("all"),
    z.literal("users"),
    z.literal("editors"),
    z.array(z.string().uuid()),
  ]),
  related_project_id: z.string().uuid().optional(),
});

// POST /api/notifications/broadcast — admin/owner broadcasts a notification to
// selected workspace members. Uses the service-role client to read memberships
// across RLS boundaries.
export async function POST(request: Request) {
  return guard(async () => {
    const auth = await requireApiMember(["owner", "admin"]);
    if (!auth.ok) return auth.response;

    const body = await parseBody(request, schema);
    if (!body.ok) return body.response;

    const { workspace_id } = auth.membership;
    const admin = createAdminClient();

    const { data: members } = await admin
      .from("workspace_members")
      .select("user_id, role")
      .eq("workspace_id", workspace_id)
      .eq("status", "active");

    const allMembers = members ?? [];
    const { target } = body.data;

    let userIds: string[];
    if (target === "all") {
      userIds = allMembers.map((m) => m.user_id);
    } else if (target === "users") {
      userIds = allMembers
        .filter((m) => m.role === "user" || m.role === "viewer")
        .map((m) => m.user_id);
    } else if (target === "editors") {
      userIds = allMembers
        .filter((m) => m.role === "editor")
        .map((m) => m.user_id);
    } else {
      const memberSet = new Set(allMembers.map((m) => m.user_id));
      userIds = (target as string[]).filter((id) => memberSet.has(id));
    }

    // Don't notify the sender.
    userIds = userIds.filter((id) => id !== auth.user.id);

    await broadcastNotifications({
      userIds,
      workspaceId: workspace_id,
      type: body.data.type,
      title: body.data.title,
      message: body.data.message ?? null,
      relatedProjectId: body.data.related_project_id ?? null,
    });

    return jsonOk({ count: userIds.length });
  });
}
