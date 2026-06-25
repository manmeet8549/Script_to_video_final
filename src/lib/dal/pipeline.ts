import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/dal/auth";
import { setStageStatus } from "@/lib/dal/projects";
import { resolveCredential } from "@/lib/dal/integrations";
import { uploadMedia, toPublicUrl } from "@/lib/storage/media";
import { fetchAndStoreVideo } from "@/lib/storage/video-backfill";
import { recordCreditUsage, addStorageUsage } from "@/lib/dal/credits";
import {
  getScriptProvider,
  getVoiceProvider,
  getVideoProvider,
  getEditProvider,
  getPublishProvider,
} from "@/lib/integrations/registry";

// A safe premium default to recover to when a saved ElevenLabs voice id is no
// longer accessible (ElevenLabs "Rachel").
const DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM";

async function workspaceIdForProject(projectId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select("workspace_id")
    .eq("id", projectId)
    .single();
  return data?.workspace_id ?? null;
}
import type {
  EditingTask,
  PublishingTask,
  Script,
  VideoGeneration,
  VoiceGeneration,
} from "@/types/db";

// ---------------------------------------------------------------- scripts ----

// The configured AI provider accepted the request but rejected/failed it (bad
// key, exhausted quota, no model access, timeout). It's a provider/config
// problem the workspace owner can fix — not a platform bug — so routes map this
// to 502 rather than an opaque 500.
export class ScriptProviderError extends Error {
  constructor(detail: string) {
    super(`The AI script provider rejected the request: ${detail}. Check the script API key, billing, and model in workspace API settings.`);
    this.name = "ScriptProviderError";
  }
}

// Generate a script with the workspace's configured AI provider. OpenAI is the
// priority provider; if no active OpenAI key is configured, fall back to NVIDIA
// NIM. Returns the generated text plus which provider produced it. Does not
// persist — callers decide whether to save the result.
export async function generateScriptText(
  workspaceId: string,
  input: {
    topic: string;
    tone?: string;
    language?: string;
    targetDuration?: string;
    instructions?: string;
  },
): Promise<{ content: string; wordCount: number; providerKey: string }> {
  // Priority: OpenAI → NVIDIA NIM.
  const resolved =
    (await resolveCredential(workspaceId, "script", "openai")) ??
    (await resolveCredential(workspaceId, "script", "nvidia"));

  if (!resolved) {
    throw new Error(
      "No script provider configured. Add an OpenAI (or NVIDIA NIM) API key in the workspace API settings.",
    );
  }

  const provider = getScriptProvider(resolved.api.provider_key);
  if (!provider) {
    throw new Error(`Unsupported script provider: ${resolved.api.provider_key}`);
  }

  const result = await provider.generateScript(resolved.credential, input);
  if (result.status === "failed" || !result.content) {
    throw new ScriptProviderError(result.error || "no script returned");
  }

  const wordCount = result.content.trim().split(/\s+/).filter(Boolean).length;
  return { content: result.content, wordCount, providerKey: resolved.api.provider_key };
}

export async function getLatestScript(projectId: string): Promise<Script | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("scripts")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(1);
  return data?.[0] ?? null;
}

export async function saveScript(
  projectId: string,
  input: { content: string; tone?: string; language?: string; aiGenerated?: boolean },
): Promise<Script> {
  const user = await getUser();
  const supabase = await createClient();
  const words = input.content.trim().split(/\s+/).filter(Boolean).length;

  const { data, error } = await supabase
    .from("scripts")
    .insert({
      project_id: projectId,
      content: input.content,
      tone: input.tone ?? "professional",
      language: input.language ?? "en",
      word_count: words,
      estimated_duration: Math.round(words / 2.5), // ~150 wpm
      ai_generated: input.aiGenerated ?? false,
      created_by: user?.id ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;

  await setStageStatus(projectId, "script", "completed", { word_count: words });
  await supabase.from("projects").update({ status: "voice_gen" }).eq("id", projectId);

  // Track-only credit accounting for AI generations.
  if (input.aiGenerated) {
    const workspaceId = await workspaceIdForProject(projectId);
    if (workspaceId) {
      await recordCreditUsage(workspaceId, "script", {
        projectId,
        reason: "Script generation",
      });
    }
  }
  return data;
}

// ------------------------------------------------------------------ voice ----

export async function getLatestVoice(projectId: string): Promise<VoiceGeneration | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("voice_generations")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(1);
  return data?.[0] ?? null;
}

// Generate a voiceover with the workspace's configured voice provider. Voice
// providers (e.g. ElevenLabs) return audio synchronously; we upload it to
// Storage and persist a completed generation row.
export async function generateVoice(
  workspaceId: string,
  projectId: string,
  input: { voiceId?: string; text?: string; settings?: Record<string, unknown> },
): Promise<VoiceGeneration> {
  const supabase = await createClient();

  const text = input.text ?? (await getLatestScript(projectId))?.content;
  if (!text) throw new Error("No script text available to synthesize.");

  const resolved = await resolveCredential(workspaceId, "voice");
  if (!resolved) throw new Error("No voice provider configured for this workspace.");

  const provider = getVoiceProvider(resolved.api.provider_key);
  if (!provider) throw new Error(`Unsupported voice provider: ${resolved.api.provider_key}`);

  let voiceId =
    input.voiceId || (resolved.api.config?.default_voice_id as string) || DEFAULT_VOICE_ID;

  // Verify the voice id is reachable before spending a TTS call; recover to a
  // premium default if the saved voice was deleted or is otherwise inaccessible.
  if (provider.verifyVoice) {
    const accessible = await provider.verifyVoice(resolved.credential, voiceId);
    if (!accessible && voiceId !== DEFAULT_VOICE_ID) {
      voiceId = DEFAULT_VOICE_ID;
    }
  }

  // Insert a pending row first so the UI can reflect in-flight state.
  const { data: pending, error: insErr } = await supabase
    .from("voice_generations")
    .insert({
      project_id: projectId,
      voice_provider: resolved.api.provider_key,
      voice_id: voiceId,
      status: "generating",
      settings: input.settings ?? {},
    })
    .select("*")
    .single();
  if (insErr) throw insErr;

  await setStageStatus(projectId, "voice", "in_progress");

  const result = await provider.generateSpeech(resolved.credential, {
    text,
    voiceId,
    settings: input.settings,
  });

  if (result.status === "failed" || !result.audio) {
    const { data: failed } = await supabase
      .from("voice_generations")
      .update({ status: "failed", error: result.error ?? "Generation failed" })
      .eq("id", pending.id)
      .select("*")
      .single();
    await setStageStatus(projectId, "voice", "failed");
    return failed ?? pending;
  }

  // Upload to a PUBLIC R2 URL so the downstream video provider (HeyGen) can fetch
  // the narration for lipsync — it cannot authenticate against the proxy route.
  const audioUrl = await uploadMedia(
    `${workspaceId}/${projectId}/voice-${pending.id}.mp3`,
    result.audio,
    result.contentType ?? "audio/mpeg",
    { public: true },
  );

  const { data: completed, error: updErr } = await supabase
    .from("voice_generations")
    .update({ status: "completed", audio_url: audioUrl })
    .eq("id", pending.id)
    .select("*")
    .single();
  if (updErr) throw updErr;

  await setStageStatus(projectId, "voice", "completed", { audio_url: audioUrl });
  await supabase.from("projects").update({ status: "video_gen" }).eq("id", projectId);
  await recordCreditUsage(workspaceId, "voice", { projectId, reason: "Voice synthesis" });
  return completed;
}

// ------------------------------------------------------------------ video ----

export async function getLatestVideo(projectId: string): Promise<VideoGeneration | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("video_generations")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(1);
  return data?.[0] ?? null;
}

// Kick off avatar video generation (async). Completion arrives via webhook
// (/api/webhooks/video) or polling (pollVideo).
export async function createVideo(
  workspaceId: string,
  projectId: string,
  input: { settings?: Record<string, unknown> },
): Promise<VideoGeneration> {
  const supabase = await createClient();

  const resolved = await resolveCredential(workspaceId, "video");
  if (!resolved) throw new Error("No video provider configured for this workspace.");

  const provider = getVideoProvider(resolved.api.provider_key);
  if (!provider) throw new Error(`Unsupported video provider: ${resolved.api.provider_key}`);

  const voice = await getLatestVoice(projectId);
  const script = await getLatestScript(projectId);

  const { data: pending, error: insErr } = await supabase
    .from("video_generations")
    .insert({
      project_id: projectId,
      voice_generation_id: voice?.id ?? null,
      video_provider: resolved.api.provider_key,
      status: "generating",
      settings: input.settings ?? {},
    })
    .select("*")
    .single();
  if (insErr) throw insErr;

  await setStageStatus(projectId, "video", "in_progress");

  const result = await provider.createVideo(resolved.credential, {
    audioUrl: voice?.audio_url ?? undefined,
    script: script?.content,
    settings: input.settings,
  });

  const patch =
    result.status === "failed"
      ? { status: "failed" as const, error: result.error ?? "Generation failed" }
      : { status: "generating" as const, provider_job_id: result.providerJobId };

  const { data: updated } = await supabase
    .from("video_generations")
    .update(patch)
    .eq("id", pending.id)
    .select("*")
    .single();

  if (result.status === "failed") await setStageStatus(projectId, "video", "failed");
  return updated ?? pending;
}

// Poll a provider for an in-flight video and persist completion.
export async function pollVideo(workspaceId: string, videoGenId: string): Promise<VideoGeneration> {
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("video_generations")
    .select("*")
    .eq("id", videoGenId)
    .single();
  if (!row) throw new Error("Video generation not found");
  if (row.status !== "generating" || !row.provider_job_id) return row;

  const resolved = await resolveCredential(workspaceId, "video", row.video_provider);
  if (!resolved) return row;
  const provider = getVideoProvider(resolved.api.provider_key);
  if (!provider?.getStatus) return row;

  const result = await provider.getStatus(resolved.credential, row.provider_job_id);
  if (result.status === "generating") return row;

  return applyVideoResult(row.id, row.project_id, {
    status: result.status,
    videoUrl: result.resultUrl,
    thumbnailUrl: result.thumbnailUrl,
    durationSeconds: result.durationSeconds,
    error: result.error,
  });
}

// Shared completion handler for the poller path (user session present, RLS-safe).
// On success it back-fills the render into R2 (so playback/storage stays on our
// own bucket) and records the video credit + storage usage. The webhook path
// uses the parallel handler in `lib/dal/webhooks.ts`.
export async function applyVideoResult(
  videoGenId: string,
  projectId: string,
  result: {
    status: "completed" | "failed";
    videoUrl?: string;
    thumbnailUrl?: string;
    durationSeconds?: number;
    error?: string;
  },
): Promise<VideoGeneration> {
  const supabase = await createClient();

  if (result.status === "failed") {
    const { data: failed } = await supabase
      .from("video_generations")
      .update({ status: "failed", error: result.error ?? "Generation failed", video_url: null })
      .eq("id", videoGenId)
      .select("*")
      .single();
    await setStageStatus(projectId, "video", "failed");
    return failed!;
  }

  const { data: row } = await supabase
    .from("video_generations")
    .select("*")
    .eq("id", videoGenId)
    .single();
  const dimension = (row?.settings?.dimension as { width?: number; height?: number }) ?? {};
  const workspaceId = await workspaceIdForProject(projectId);

  // Back-fill the provider render into R2; fall back to the provider URL if the
  // download/upload fails so the project never gets stuck.
  let stored = null as Awaited<ReturnType<typeof fetchAndStoreVideo>>;
  if (result.videoUrl && workspaceId) {
    stored = await fetchAndStoreVideo(workspaceId, projectId, result.videoUrl, result.thumbnailUrl);
  }

  const finalVideoUrl = stored?.videoUrl ?? result.videoUrl ?? null;
  const finalThumbUrl = stored?.thumbnailUrl ?? result.thumbnailUrl ?? null;

  const { data: updated } = await supabase
    .from("video_generations")
    .update({
      status: "completed",
      video_url: finalVideoUrl,
      thumbnail_url: finalThumbUrl,
      r2_key: stored?.r2Key ?? null,
      thumbnail_r2_key: stored?.thumbnailR2Key ?? null,
      file_size_bytes: stored?.fileSizeBytes ?? null,
      duration_seconds: result.durationSeconds ? Math.round(result.durationSeconds) : null,
      width: dimension.width ?? null,
      height: dimension.height ?? null,
    })
    .eq("id", videoGenId)
    .select("*")
    .single();

  await setStageStatus(projectId, "video", "completed", { video_url: finalVideoUrl });
  await supabase
    .from("projects")
    .update({ status: "editing", video_url: finalVideoUrl, thumbnail_url: finalThumbUrl })
    .eq("id", projectId);

  if (workspaceId) {
    await recordCreditUsage(workspaceId, "video", { projectId, reason: "Avatar video render" });
    if (stored?.fileSizeBytes) await addStorageUsage(workspaceId, stored.fileSizeBytes);
  }
  return updated!;
}

// ------------------------------------------------------------------- edit ----

export async function createEditTask(
  workspaceId: string,
  projectId: string,
  input: {
    editType: "ai" | "manual";
    instructions?: string;
    editorId?: string | null;
    sourceVideoUrl?: string | null;
    settings?: Record<string, unknown>;
  },
): Promise<EditingTask> {
  const supabase = await createClient();
  const user = await getUser();

  // Resolve the source video URL. Priority:
  //   1. Caller-supplied URL
  //   2. Latest video_generation row (pipeline-generated videos)
  //   3. projects.video_url (user-uploaded videos, which have no video_generation row)
  const videoGenUrl = (await getLatestVideo(projectId))?.video_url ?? null;
  let projectVideoUrl: string | null = null;
  if (!input.sourceVideoUrl && !videoGenUrl) {
    const { data: proj } = await supabase
      .from("projects")
      .select("video_url")
      .eq("id", projectId)
      .single();
    projectVideoUrl = proj?.video_url ?? null;
  }
  const sourceUrl = input.sourceVideoUrl ?? videoGenUrl ?? projectVideoUrl;

  const { data: task, error } = await supabase
    .from("editing_tasks")
    .insert({
      project_id: projectId,
      requested_by: user?.id ?? null,
      editor_id: input.editType === "manual" ? input.editorId ?? null : null,
      edit_type: input.editType,
      status: input.editType === "manual" ? "pending" : "in_progress",
      instructions: input.instructions ?? null,
      source_video_url: sourceUrl,
    })
    .select("*")
    .single();
  if (error) throw error;

  await setStageStatus(projectId, "editing", "in_progress");
  await supabase.from("projects").update({ status: "editing" }).eq("id", projectId);

  if (input.editType !== "ai") return task;

  // AI editing: submit to the configured editing provider.
  const resolved = await resolveCredential(workspaceId, "editing");
  if (!resolved || !sourceUrl) {
    const reason = !sourceUrl ? "No source video to edit." : "No AI editing provider configured.";
    const { data: failed } = await supabase
      .from("editing_tasks")
      .update({ status: "rejected", feedback: reason })
      .eq("id", task.id)
      .select("*")
      .single();
    return failed ?? task;
  }

  const provider = getEditProvider(resolved.api.provider_key);
  const publicSourceUrl = toPublicUrl(sourceUrl);
  const result = await provider.submitEdit(resolved.credential, {
    sourceVideoUrl: publicSourceUrl || sourceUrl,
    instructions: input.instructions,
    settings: input.settings,
  });

  const patch =
    result.status === "completed"
      ? {
          status: "completed" as const,
          edited_video_url: result.resultUrl ?? null,
          edit_provider: resolved.api.provider_key,
          completed_at: new Date().toISOString(),
        }
      : result.status === "failed"
        ? { status: "rejected" as const, feedback: result.error ?? "Edit failed" }
        : { status: "in_progress" as const, provider_job_id: result.providerJobId, edit_provider: resolved.api.provider_key };

  const { data: updated } = await supabase
    .from("editing_tasks")
    .update(patch)
    .eq("id", task.id)
    .select("*")
    .single();
  return updated ?? task;
}

// ---------------------------------------------------------------- publish ----

export async function createPublishTask(
  workspaceId: string,
  projectId: string,
  input: {
    platform: string;
    title?: string;
    description?: string;
    tags?: string[];
    thumbnailUrl?: string;
    visibility?: "public" | "unlisted" | "private";
    scheduledAt?: string;
    videoUrl?: string;
    settings?: Record<string, unknown>;
  },
): Promise<PublishingTask> {
  const supabase = await createClient();
  const user = await getUser();

  // Resolve a public URL: prefer the caller-supplied value, fall back to the
  // latest video generation row. Either may be a proxy path
  // (/api/media/stream?key=…) — convert to a public R2 URL so external
  // providers (Zernio, etc.) can actually reach the file.
  const rawVideoUrl = input.videoUrl ?? (await getLatestVideo(projectId))?.video_url ?? null;
  const videoUrl = toPublicUrl(rawVideoUrl) ?? rawVideoUrl;

  const { data: task, error } = await supabase
    .from("publishing_tasks")
    .insert({
      project_id: projectId,
      platform: input.platform,
      status: input.scheduledAt ? "scheduled" : "publishing",
      scheduled_at: input.scheduledAt ?? null,
      title: input.title ?? null,
      description: input.description ?? null,
      tags: input.tags ?? null,
      thumbnail_url: input.thumbnailUrl ?? null,
      visibility: input.visibility ?? "public",
      created_by: user?.id ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;

  await setStageStatus(projectId, "publish", "in_progress");

  // Scheduled posts are published later by a job; nothing more to do now.
  if (input.scheduledAt) return task;

  // If the workspace requires approval, route the post to the admin approval
  // queue instead of publishing immediately. It is released once approved.
  const { data: workspace } = await supabase
    .from("workspaces")
    .select("metadata")
    .eq("id", workspaceId)
    .single();
  const approvalRequired = Boolean(
    (workspace?.metadata as Record<string, unknown> | null)?.approval_required,
  );
  if (approvalRequired) {
    await supabase
      .from("approval_items")
      .insert({
        workspace_id: workspaceId,
        project_id: projectId,
        publishing_task_id: task.id,
        status: "pending",
        requested_by: user?.id ?? null,
      });
    const { data: held } = await supabase
      .from("publishing_tasks")
      .update({ status: "draft" })
      .eq("id", task.id)
      .select("*")
      .single();
    await supabase.from("projects").update({ status: "review" }).eq("id", projectId);
    return held ?? task;
  }

  const resolved = await resolveCredential(workspaceId, "publishing");
  if (!resolved || !videoUrl) {
    const reason = !videoUrl ? "No video to publish." : "No publishing provider configured.";
    const { data: failed } = await supabase
      .from("publishing_tasks")
      .update({ status: "failed", error: reason })
      .eq("id", task.id)
      .select("*")
      .single();
    return failed ?? task;
  }

  const provider = getPublishProvider(resolved.api.provider_key);
  const result = await provider.publish(resolved.credential, {
    platform: input.platform,
    videoUrl,
    title: input.title,
    description: input.description,
    tags: input.tags,
    thumbnailUrl: input.thumbnailUrl,
    visibility: input.visibility,
    settings: input.settings,
  });

  const patch =
    result.status === "completed"
      ? {
          status: "published" as const,
          published_at: new Date().toISOString(),
          platform_video_id: result.resultUrl ?? result.providerJobId ?? null,
          publish_provider: resolved.api.provider_key,
        }
      : result.status === "failed"
        ? { status: "failed" as const, error: result.error ?? "Publish failed" }
        : { status: "publishing" as const, provider_job_id: result.providerJobId, publish_provider: resolved.api.provider_key };

  const { data: updated } = await supabase
    .from("publishing_tasks")
    .update(patch)
    .eq("id", task.id)
    .select("*")
    .single();

  if (result.status === "completed") {
    await setStageStatus(projectId, "publish", "completed");
    await supabase.from("projects").update({ status: "published" }).eq("id", projectId);
    await recordCreditUsage(workspaceId, "publish", {
      projectId,
      reason: `Publish to ${input.platform}`,
    });
    try {
      const { notifyAdminsOnPublish } = require("@/lib/dal/notifications");
      await notifyAdminsOnPublish(workspaceId, projectId);
    } catch (err) {
      console.error("Failed to notify admins of publish completion:", err);
    }
  }
  return updated ?? task;
}

// Publish a previously-held task (released from the approval queue). Mirrors the
// non-approval branch of createPublishTask. Returns the updated task.
export async function publishApprovedTask(
  workspaceId: string,
  publishingTaskId: string,
): Promise<PublishingTask> {
  const supabase = await createClient();
  const { data: task } = await supabase
    .from("publishing_tasks")
    .select("*")
    .eq("id", publishingTaskId)
    .single();
  if (!task) throw new Error("Publishing task not found");

  const videoUrl = (await getLatestVideo(task.project_id))?.video_url ?? null;
  const resolved = await resolveCredential(workspaceId, "publishing");
  if (!resolved || !videoUrl) {
    const reason = !videoUrl ? "No video to publish." : "No publishing provider configured.";
    const { data: failed } = await supabase
      .from("publishing_tasks")
      .update({ status: "failed", error: reason })
      .eq("id", task.id)
      .select("*")
      .single();
    return failed ?? task;
  }

  const provider = getPublishProvider(resolved.api.provider_key);
  const result = await provider.publish(resolved.credential, {
    platform: task.platform,
    videoUrl,
    title: task.title ?? undefined,
    description: task.description ?? undefined,
    tags: task.tags ?? undefined,
    thumbnailUrl: task.thumbnail_url ?? undefined,
    visibility: task.visibility,
  });

  const patch =
    result.status === "completed"
      ? {
          status: "published" as const,
          published_at: new Date().toISOString(),
          platform_video_id: result.resultUrl ?? result.providerJobId ?? null,
          publish_provider: resolved.api.provider_key,
        }
      : result.status === "failed"
        ? { status: "failed" as const, error: result.error ?? "Publish failed" }
        : {
            status: "publishing" as const,
            provider_job_id: result.providerJobId,
            publish_provider: resolved.api.provider_key,
          };

  const { data: updated } = await supabase
    .from("publishing_tasks")
    .update(patch)
    .eq("id", task.id)
    .select("*")
    .single();

  if (result.status === "completed") {
    await setStageStatus(task.project_id, "publish", "completed");
    await supabase.from("projects").update({ status: "published" }).eq("id", task.project_id);
    await recordCreditUsage(workspaceId, "publish", {
      projectId: task.project_id,
      reason: `Publish to ${task.platform}`,
    });
    try {
      const { notifyAdminsOnPublish } = require("@/lib/dal/notifications");
      await notifyAdminsOnPublish(workspaceId, task.project_id);
    } catch (err) {
      console.error("Failed to notify admins of approved publish:", err);
    }
  }
  return updated ?? task;
}

export async function getLatestEditTask(projectId: string): Promise<EditingTask | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("editing_tasks")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(1);
  return (data?.[0] as EditingTask | undefined) ?? null;
}

export async function pollEditing(workspaceId: string, editTaskId: string): Promise<EditingTask> {
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("editing_tasks")
    .select("*")
    .eq("id", editTaskId)
    .single();
  if (!row) throw new Error("Editing task not found");
  if (row.status !== "in_progress" || !row.provider_job_id || !row.edit_provider) return row as EditingTask;

  const resolved = await resolveCredential(workspaceId, "editing", row.edit_provider);
  if (!resolved) return row as EditingTask;
  const provider = getEditProvider(resolved.api.provider_key);
  if (!provider?.getStatus) return row as EditingTask;

  const result = await provider.getStatus(resolved.credential, row.provider_job_id);
  if (result.status === "generating") return row as EditingTask;

  let finalVideoUrl = result.resultUrl ?? null;
  if (result.status === "completed" && result.resultUrl) {
    try {
      const customKey = `videos/${workspaceId}/${row.project_id}-edited-${row.id}.mp4`;
      const stored = await fetchAndStoreVideo(workspaceId, row.project_id, result.resultUrl, null, customKey);
      if (stored?.videoUrl) {
        finalVideoUrl = stored.videoUrl;
      }
    } catch (err) {
      console.error("Failed to backfill edited video to R2:", err);
    }
  }

  if (result.status === "completed" && finalVideoUrl) {
    try {
      await supabase
        .from("projects")
        .update({ video_url: finalVideoUrl })
        .eq("id", row.project_id);
      await setStageStatus(row.project_id, "editing", "completed", {
        edited_video_url: finalVideoUrl,
      });
    } catch (err) {
      console.error("Failed to update project active video url:", err);
    }
  }

  const patch =
    result.status === "completed"
      ? {
          status: "completed" as const,
          edited_video_url: finalVideoUrl,
          completed_at: new Date().toISOString(),
        }
      : result.status === "failed"
        ? { status: "rejected" as const, feedback: result.error ?? "Edit failed" }
        : { status: "in_progress" as const };

  const { data: updated } = await supabase
    .from("editing_tasks")
    .update(patch)
    .eq("id", row.id)
    .select("*")
    .single();

  if (result.status === "completed" && row.requested_by) {
    try {
      const { createNotification } = require("@/lib/dal/notifications");
      const { getProject } = require("@/lib/dal/projects");
      const project = await getProject(row.project_id);
      const title = project?.title || "your project";
      await createNotification({
        userId: row.requested_by,
        workspaceId,
        type: "edit_complete",
        title: "AI Edit Completed",
        message: `Submagic AI edit is complete for project "${title}".`,
        relatedProjectId: row.project_id,
        relatedTaskId: row.id,
        actionUrl: `/dashboard/user/edit/ai`,
      });
    } catch (err) {
      console.error("Failed to notify user of completed AI edit:", err);
    }
  }

  return (updated ?? row) as EditingTask;
}
