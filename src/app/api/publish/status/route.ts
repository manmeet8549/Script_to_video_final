import { guard, jsonError, jsonOk, requireApiMember } from "@/lib/api/http";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  return guard(async () => {
    const auth = await requireApiMember();
    if (!auth.ok) return auth.response;

    const supabase = await createClient();
    const { data: history, error } = await supabase
      .from("published_videos")
      .select(`
        *,
        social_accounts (
          channel_name,
          account_handle
        )
      `)
      .eq("workspace_id", auth.membership.workspace_id)
      .order("created_at", { ascending: false });

    if (error) return jsonError(error.message, 500);
    return jsonOk(history || []);
  });
}
