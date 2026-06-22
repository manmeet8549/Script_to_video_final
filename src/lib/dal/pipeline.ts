import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/dal/auth";
import { setStageStatus } from "@/lib/dal/projects";
import { resolveCredential } from "@/lib/dal/integrations";
import { uploadMedia } from "@/lib/storage/media";
import {
  getVoiceProvider,
  getVideoProvider,
  getEditProvider,
  getPublishProvider,
} from "@/lib/integrations/registry";
import type {
  EditingTask,
  PublishingTask,
  Script,
  VideoGeneration,
  VoiceGeneration,
} from "@/types/db";

// ---------------------------------------------------------------- scripts ----

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

  const voiceId =
    input.voiceId || (resolved.api.config?.default_voice_id as string) || "21m00Tcm4TlvDq8ikWAM";

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

  const audioUrl = await uploadMedia(
    `${workspaceId}/${projectId}/voice-${pending.id}.mp3`,
    result.audio,
    result.contentType ?? "audio/mpeg",
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

  return applyVideoResult(row.id, row.project_id, result.status, result.resultUrl, result.error);
}

// Shared completion handler used by both polling and the webhook route.
export async function applyVideoResult(
  videoGenId: string,
  projectId: string,
  status: "completed" | "failed",
  videoUrl?: string,
  error?: string,
): Promise<VideoGeneration> {
  const supabase = await createClient();
  const { data: updated } = await supabase
    .from("video_generations")
    .update({
      status,
      video_url: status === "completed" ? videoUrl ?? null : null,
      error: status === "failed" ? error ?? "Generation failed" : null,
    })
    .eq("id", videoGenId)
    .select("*")
    .single();

  if (status === "completed") {
    await setStageStatus(projectId, "video", "completed", { video_url: videoUrl });
    await supabase
      .from("projects")
      .update({ status: "editing", video_url: videoUrl ?? null })
      .eq("id", projectId);
  } else {
    await setStageStatus(projectId, "video", "failed");
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
    sourceVideoUrl?: string;
    settings?: Record<string, unknown>;
  },
): Promise<EditingTask> {
  const supabase = await createClient();
  const user = await getUser();

  const sourceUrl = input.sourceVideoUrl ?? (await getLatestVideo(projectId))?.video_url ?? null;

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
  const result = await provider.submitEdit(resolved.credential, {
    sourceVideoUrl: sourceUrl,
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

  const videoUrl = input.videoUrl ?? (await getLatestVideo(projectId))?.video_url ?? null;

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
  }
  return updated ?? task;
}
