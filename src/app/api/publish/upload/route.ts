import { z } from "zod";
import { guard, jsonError, jsonOk, parseBody, requireApiMember } from "@/lib/api/http";
import { createClient } from "@/lib/supabase/server";
import { recordCreditUsage, getWallet } from "@/lib/dal/credits";
import { resolveCredential } from "@/lib/dal/integrations";
import { getPublisherForPlatform } from "@/lib/publishers";
import { toPublicUrl } from "@/lib/storage/media";

const uploadSchema = z.object({
  projectId: z.string().uuid().optional(),
  videoUrl: z.string().optional(),
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

    const body = await parseBody(request, uploadSchema);
    if (!body.ok) return body.response;

    const { projectId, videoUrl: reqVideoUrl, targets } = body.data;
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
      return jsonError(
        "No video URL could be resolved. Provide a videoUrl or finished project.",
        400
      );
    }

    // Convert proxy url to public R2 url
    const publicVideoUrl = toPublicUrl(resolvedVideoUrl) || resolvedVideoUrl;

    // 2. Check publish credits
    const wallet = await getWallet(auth.membership.workspace_id);
    if (wallet.publish_credits < targets.length) {
      return jsonError("Insufficient publish credits. Please purchase more credits.", 402);
    }

    // 3. Verify selected accounts belong to this workspace
    const accountIds = targets.map((t) => t.socialAccountId);
    const { data: accounts, error: accErr } = await supabase
      .from("social_accounts")
      .select("*")
      .eq("workspace_id", auth.membership.workspace_id)
      .in("id", accountIds);

    if (accErr) return jsonError(accErr.message, 500);
    if (!accounts || accounts.length < accountIds.length) {
      return jsonError(
        "One or more selected accounts were not found or belong to another workspace.",
        400
      );
    }

    // Resolve workspace integrations credential for publishing (Zernio)
    const resolved = await resolveCredential(auth.membership.workspace_id, "publishing");
    const apiKey = resolved?.credential?.apiKey || process.env.ZERNIO_API_KEY || "test_key";

    const results = [];

    // 4. Publish to each platform
    for (const target of targets) {
      const account = accounts.find((a) => a.id === target.socialAccountId)!;

      // 5. Create PublishedVideo row
      const { data: publishedVideo, error: pubErr } = await supabase
        .from("published_videos")
        .insert({
          workspace_id: auth.membership.workspace_id,
          project_id: projectId || null,
          video_url: publicVideoUrl,
          platform: target.platform,
          social_account_id: target.socialAccountId,
          status: "Preparing video...",
          title: target.title || null,
          description: target.content,
          tags: target.tags || null,
        })
        .select("*")
        .single();

      if (pubErr) {
        console.error("Failed to insert published video record:", pubErr);
        continue;
      }

      try {
        const publisher = getPublisherForPlatform(target.platform);

        // Update status to publishing
        await supabase
          .from("published_videos")
          .update({ status: "publishing" })
          .eq("id", publishedVideo.id);

        const result = await publisher.publish(
          publicVideoUrl,
          target.platform,
          account.zernio_account_id,
          target.content,
          target.title,
          undefined,
          apiKey
        );

        // Update status to success. Prefer the real live URL Zernio returns;
        // fall back to a best-effort link only if none was provided.
        const watchUrl =
          result.watchUrl ||
          (target.platform === "youtube"
            ? `https://youtube.com/watch?v=${result.externalId}`
            : `https://www.${target.platform}.com/post/${result.externalId}`);

        const { data: finalPublishedVideo } = await supabase
          .from("published_videos")
          .update({
            status: "published",
            external_post_id: result.externalId,
            published_at: new Date().toISOString(),
            watch_url: watchUrl,
          })
          .eq("id", publishedVideo.id)
          .select("*")
          .single();

        // 6. Deduct credits
        await recordCreditUsage(auth.membership.workspace_id, "publish", {
          projectId: projectId || null,
          reason: `Published to ${target.platform} via account ${account.channel_name}`,
        });

        results.push(finalPublishedVideo || publishedVideo);
      } catch (err) {
        console.error(`Publishing to ${target.platform} failed:`, err);
        const errMsg = err instanceof Error ? err.message : String(err);

        const { data: finalPublishedVideo } = await supabase
          .from("published_videos")
          .update({
            status: "failed",
            error: errMsg,
          })
          .eq("id", publishedVideo.id)
          .select("*")
          .single();

        results.push(finalPublishedVideo || publishedVideo);
      }
    }

    return jsonOk(results);
  });
}
