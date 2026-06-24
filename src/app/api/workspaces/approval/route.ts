import { z } from "zod";
import { guard, jsonError, jsonOk, parseBody, requireApiMember } from "@/lib/api/http";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GET /api/workspaces/approval — whether publishes require admin approval in the
// active workspace (stored in workspaces.metadata.approval_required).
export async function GET() {
  return guard(async () => {
    const auth = await requireApiMember();
    if (!auth.ok) return auth.response;

    const supabase = await createClient();
    const { data } = await supabase
      .from("workspaces")
      .select("metadata")
      .eq("id", auth.membership.workspace_id)
      .single();
    const approvalRequired = Boolean(
      (data?.metadata as Record<string, unknown> | null)?.approval_required,
    );
    return jsonOk({ approval_required: approvalRequired });
  });
}

const schema = z.object({ approval_required: z.boolean() });

// PATCH /api/workspaces/approval — owner/admin toggles the approval gate. Uses
// the service-role client after authorizing the caller (admins aren't covered by
// the owner-only workspaces RLS update policy).
export async function PATCH(request: Request) {
  return guard(async () => {
    const auth = await requireApiMember(["owner", "admin"]);
    if (!auth.ok) return auth.response;

    const body = await parseBody(request, schema);
    if (!body.ok) return body.response;

    const admin = createAdminClient();
    const { data: ws } = await admin
      .from("workspaces")
      .select("metadata")
      .eq("id", auth.membership.workspace_id)
      .single();
    if (!ws) return jsonError("Workspace not found", 404);

    const metadata = { ...(ws.metadata ?? {}), approval_required: body.data.approval_required };
    const { error } = await admin
      .from("workspaces")
      .update({ metadata })
      .eq("id", auth.membership.workspace_id);
    if (error) throw error;

    return jsonOk({ approval_required: body.data.approval_required });
  });
}
