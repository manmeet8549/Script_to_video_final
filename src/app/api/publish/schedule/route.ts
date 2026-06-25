import { z } from "zod";
import { guard, jsonError, jsonOk, parseBody, requireApiMember } from "@/lib/api/http";
import { createClient } from "@/lib/supabase/server";
import { toPublicUrl } from "@/lib/storage/media";

const scheduleSchema = z.object({
  projectId: z.string().uuid().optional(),
  videoUrl: z.string().optional(),
  scheduledAt: z.string().datetime({ offset: true }).optional(),
  targets: z
    .array(
      z.object({
        platform: z.string(),
        socialAccountId: z.string().uuid(),
        content: z.string(),
        title: z.string().optional(),
        tags: z.array(z.string()).optional(),
      })
    )
    .min(1),
});

export async function POST(request: Request) {
  return guard(async () => {
    const auth = await requireApiMember();
    if (!auth.ok) return auth.response;

    const body = await parseBody(request, scheduleSchema);
    if (!body.ok) return body.response;

    const { projectId, videoUrl: reqVideoUrl, scheduledAt, targets } = body.data;
    const supabase = await createClient();

    // 1. Resolve video URL
    let resolvedVideoUrl = reqVideoUrl || null;
    if (!resolvedVideoUrl && projectId) {
      const { data: project } = await supabase
        .from("projects")
        .select("video_url")
        .eq("id", projectId)
        .single();
      resolvedVideoUrl = project?.video_url || null;
    }

    if (!resolvedVideoUrl) {
      return jsonError("No video URL could be resolved.", 400);
    }

    const publicVideoUrl = toPublicUrl(resolvedVideoUrl) || resolvedVideoUrl;

    // 2. Check if workspace requires approval
    const { data: workspace } = await supabase
      .from("workspaces")
      .select("metadata")
      .eq("id", auth.membership.workspace_id)
      .single();

    const approvalRequired = Boolean(
      (workspace?.metadata as Record<string, unknown> | null)?.approval_required
    );

    // 3. Verify accounts
    const accountIds = targets.map((t) => t.socialAccountId);
    const { data: accounts, error: accErr } = await supabase
      .from("social_accounts")
      .select("*")
      .eq("workspace_id", auth.membership.workspace_id)
      .in("id", accountIds);

    if (accErr) return jsonError(accErr.message, 500);
    if (!accounts || accounts.length < accountIds.length) {
      return jsonError("One or more selected accounts were not found.", 400);
    }

    const results = [];

    for (const target of targets) {
      const account = accounts.find((a) => a.id === target.socialAccountId)!;

      // Determine initial status:
      // If approval is required, status is 'review'
      // Otherwise, status is 'scheduled'
      const status = approvalRequired ? "review" : "scheduled";

      const { data: publishedVideo, error: pubErr } = await supabase
        .from("published_videos")
        .insert({
          workspace_id: auth.membership.workspace_id,
          project_id: projectId || null,
          video_url: publicVideoUrl,
          platform: target.platform,
          social_account_id: target.socialAccountId,
          status,
          title: target.title || null,
          description: target.content,
          tags: target.tags || null,
          scheduled_at: scheduledAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        })
        .select("*")
        .single();

      if (pubErr) {
        console.error("Failed to schedule video:", pubErr);
        continue;
      }

      // If approval is required, insert into the approval items queue
      if (approvalRequired) {
        await supabase.from("approval_items").insert({
          workspace_id: auth.membership.workspace_id,
          project_id: projectId || null,
          status: "pending",
          requested_by: auth.user.id,
          feedback: `Publish to ${target.platform} via account ${account.channel_name}`,
        });
      }

      results.push(publishedVideo);
    }

    return jsonOk(results);
  });
}
