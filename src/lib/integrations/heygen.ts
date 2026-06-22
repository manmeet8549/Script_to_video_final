import "server-only";

import type { JobResult, ProviderCredential, VideoProvider } from "@/lib/integrations/types";

// HeyGen avatar video generation (async). A create call returns a video_id;
// completion is delivered via webhook or polled via getStatus.
// Docs: https://docs.heygen.com/reference/create-an-avatar-video-v2
export const heygen: VideoProvider = {
  key: "heygen",

  async createVideo(cred: ProviderCredential, input): Promise<JobResult> {
    const base = cred.endpointUrl?.replace(/\/$/, "") || "https://api.heygen.com";
    const avatarId = (input.settings?.avatar_id as string) || (cred.config?.avatar_id as string);

    if (!avatarId) {
      return { status: "failed", error: "Missing avatar_id (set it in the video settings or API config)." };
    }

    // Prefer an existing audio track; fall back to provider TTS from script text.
    const voice = input.audioUrl
      ? { type: "audio", audio_url: input.audioUrl }
      : {
          type: "text",
          input_text: input.script ?? "",
          voice_id: (input.settings?.voice_id as string) || (cred.config?.voice_id as string),
        };

    const body = {
      video_inputs: [
        {
          character: { type: "avatar", avatar_id: avatarId, avatar_style: "normal" },
          voice,
          background:
            (input.settings?.background as Record<string, unknown>) || { type: "color", value: "#ffffff" },
        },
      ],
      dimension: (input.settings?.dimension as Record<string, number>) || { width: 1280, height: 720 },
    };

    try {
      const res = await fetch(`${base}/v2/video/generate`, {
        method: "POST",
        headers: { "X-Api-Key": cred.apiKey, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await res.json().catch(() => ({}))) as {
        data?: { video_id?: string };
        error?: unknown;
        message?: string;
      };
      if (!res.ok || !json.data?.video_id) {
        return { status: "failed", error: `HeyGen ${res.status}: ${json.message ?? JSON.stringify(json.error)}` };
      }
      return { status: "generating", providerJobId: json.data.video_id, raw: json };
    } catch (err) {
      return { status: "failed", error: err instanceof Error ? err.message : "Request failed" };
    }
  },

  async getStatus(cred: ProviderCredential, providerJobId: string): Promise<JobResult> {
    const base = cred.endpointUrl?.replace(/\/$/, "") || "https://api.heygen.com";
    try {
      const res = await fetch(
        `${base}/v1/video_status.get?video_id=${encodeURIComponent(providerJobId)}`,
        { headers: { "X-Api-Key": cred.apiKey } },
      );
      const json = (await res.json().catch(() => ({}))) as {
        data?: { status?: string; video_url?: string; duration?: number; error?: unknown };
      };
      const status = json.data?.status;
      if (status === "completed") {
        return {
          status: "completed",
          providerJobId,
          resultUrl: json.data?.video_url,
          durationSeconds: json.data?.duration,
          raw: json,
        };
      }
      if (status === "failed") {
        return { status: "failed", providerJobId, error: JSON.stringify(json.data?.error), raw: json };
      }
      return { status: "generating", providerJobId, raw: json };
    } catch (err) {
      return { status: "failed", providerJobId, error: err instanceof Error ? err.message : "Request failed" };
    }
  },
};
