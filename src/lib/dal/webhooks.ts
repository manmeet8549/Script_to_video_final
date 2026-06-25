import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { webhookSecret } from "@/lib/env";
import { fetchAndStoreVideo } from "@/lib/storage/video-backfill";
import { recordCreditUsage, addStorageUsage } from "@/lib/dal/credits";

// Webhooks run without a user session, so all DB work here uses the service-role
// client. Authenticity is established by a shared-secret header (when configured).

export function verifyWebhook(request: Request): boolean {
  const expected = webhookSecret();
  if (!expected) return true; // no secret configured → accept (dev mode)
  const provided =
    request.headers.get("x-webhook-secret") ||
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  return provided === expected;
}

const STAGE_PROGRESS_WEIGHTS = 7; // pipeline stages

async function recomputeProgress(projectId: string) {
  const admin = createAdminClient();
  const { data: stages } = await admin
    .from("project_stages")
    .select("status")
    .eq("project_id", projectId);
  const completed = (stages ?? []).filter((s) => s.status === "completed").length;
  await admin
    .from("projects")
    .update({ progress_percent: Math.round((completed / STAGE_PROGRESS_WEIGHTS) * 100) })
    .eq("id", projectId);
}

async function markStage(
  projectId: string,
  stage: "voice" | "video" | "publish",
  status: "completed" | "failed",
) {
  const admin = createAdminClient();
  await admin
    .from("project_stages")
    .update({
      status,
      completed_at: status === "completed" ? new Date().toISOString() : null,
    })
    .eq("project_id", projectId)
    .eq("stage_name", stage);
  await recomputeProgress(projectId);
}

export async function completeVideoByJob(
  providerJobId: string,
  status: "completed" | "failed",
  videoUrl?: string,
  error?: string,
  thumbnailUrl?: string,
  durationSeconds?: number,
): Promise<boolean> {
  const admin = createAdminClient();
  const { data: row } = await admin
    .from("video_generations")
    .select("*")
    .eq("provider_job_id", providerJobId)
    .limit(1)
    .single();
  if (!row) return false;

  if (status === "failed") {
    await admin
      .from("video_generations")
      .update({ status: "failed", video_url: null, error: error ?? "Generation failed" })
      .eq("id", row.id);
    await markStage(row.project_id, "video", "failed");
    return true;
  }

  // Resolve the owning workspace, then back-fill the render into R2.
  const { data: project } = await admin
    .from("projects")
    .select("workspace_id")
    .eq("id", row.project_id)
    .single();
  const workspaceId = project?.workspace_id as string | undefined;
  const dimension = (row.settings?.dimension as { width?: number; height?: number }) ?? {};

  const stored =
    videoUrl && workspaceId
      ? await fetchAndStoreVideo(workspaceId, row.project_id, videoUrl, thumbnailUrl)
      : null;
  const finalVideoUrl = stored?.videoUrl ?? videoUrl ?? null;
  const finalThumbUrl = stored?.thumbnailUrl ?? thumbnailUrl ?? null;

  await admin
    .from("video_generations")
    .update({
      status: "completed",
      video_url: finalVideoUrl,
      thumbnail_url: finalThumbUrl,
      r2_key: stored?.r2Key ?? null,
      thumbnail_r2_key: stored?.thumbnailR2Key ?? null,
      file_size_bytes: stored?.fileSizeBytes ?? null,
      duration_seconds: durationSeconds ? Math.round(durationSeconds) : null,
      width: dimension.width ?? null,
      height: dimension.height ?? null,
    })
    .eq("id", row.id);

  await markStage(row.project_id, "video", "completed");
  await admin
    .from("projects")
    .update({ status: "editing", video_url: finalVideoUrl, thumbnail_url: finalThumbUrl })
    .eq("id", row.project_id);

  if (workspaceId) {
    await recordCreditUsage(workspaceId, "video", {
      projectId: row.project_id,
      reason: "Avatar video render",
    });
    if (stored?.fileSizeBytes) await addStorageUsage(workspaceId, stored.fileSizeBytes);
  }
  return true;
}

export async function completeVoiceByJob(
  providerJobId: string,
  status: "completed" | "failed",
  audioUrl?: string,
  durationSeconds?: number,
  error?: string,
): Promise<boolean> {
  const admin = createAdminClient();
  const { data: row } = await admin
    .from("voice_generations")
    .select("*")
    .eq("provider_job_id", providerJobId)
    .limit(1)
    .single();
  if (!row) return false;

  await admin
    .from("voice_generations")
    .update({
      status,
      audio_url: status === "completed" ? audioUrl ?? null : null,
      duration: durationSeconds ? Math.round(durationSeconds) : null,
      error: status === "failed" ? error ?? "Generation failed" : null,
    })
    .eq("id", row.id);

  await markStage(row.project_id, "voice", status);
  return true;
}

export async function completePublishByJob(
  providerJobId: string,
  status: "completed" | "failed",
  platformVideoId?: string,
  error?: string,
): Promise<boolean> {
  const admin = createAdminClient();
  const { data: row } = await admin
    .from("publishing_tasks")
    .select("*")
    .eq("provider_job_id", providerJobId)
    .limit(1)
    .single();
  if (!row) return false;

  await admin
    .from("publishing_tasks")
    .update({
      status: status === "completed" ? "published" : "failed",
      published_at: status === "completed" ? new Date().toISOString() : null,
      platform_video_id: platformVideoId ?? null,
      error: status === "failed" ? error ?? "Publish failed" : null,
    })
    .eq("id", row.id);

  if (status === "completed") {
    await markStage(row.project_id, "publish", "completed");
    await admin.from("projects").update({ status: "published" }).eq("id", row.project_id);
    try {
      const { notifyAdminsOnPublish } = require("@/lib/dal/notifications");
      await notifyAdminsOnPublish(null, row.project_id);
    } catch (err) {
      console.error("Failed to notify admins of webhook publish:", err);
    }
  }
  return true;
}
