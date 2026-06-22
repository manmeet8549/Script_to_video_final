import "server-only";

import type {
  EditProvider,
  JobResult,
  ProviderCredential,
  PublishProvider,
} from "@/lib/integrations/types";

// Generic HTTP adapters for AI editing and publishing services. The actual
// endpoint is taken from the workspace API config (endpointUrl), so any service
// exposing a JSON "submit + job id" contract can be plugged in without code
// changes. Swap these for a vendor-specific adapter when you wire a real
// editing/publishing provider.

type GenericResponse = {
  job_id?: string;
  id?: string;
  url?: string;
  edited_video_url?: string;
  platform_video_id?: string;
  status?: string;
  error?: string;
  message?: string;
};

function mapStatus(json: GenericResponse, httpOk: boolean): JobResult {
  if (!httpOk) {
    return { status: "failed", error: json.error || json.message || "Request failed", raw: json };
  }
  const jobId = json.job_id || json.id;
  const url = json.edited_video_url || json.url;
  const s = (json.status || (url ? "completed" : "generating")).toLowerCase();

  if (s === "completed" || s === "success" || s === "done") {
    return { status: "completed", providerJobId: jobId, resultUrl: url, raw: json };
  }
  if (s === "failed" || s === "error") {
    return { status: "failed", providerJobId: jobId, error: json.error || json.message, raw: json };
  }
  return { status: "generating", providerJobId: jobId, raw: json };
}

async function postJson(cred: ProviderCredential, path: string, payload: unknown): Promise<JobResult> {
  if (!cred.endpointUrl) {
    return { status: "failed", error: "No endpoint_url configured for this provider." };
  }
  const url = `${cred.endpointUrl.replace(/\/$/, "")}${path}`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cred.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const json = (await res.json().catch(() => ({}))) as GenericResponse;
    return mapStatus(json, res.ok);
  } catch (err) {
    return { status: "failed", error: err instanceof Error ? err.message : "Request failed" };
  }
}

export const genericEdit: EditProvider = {
  key: "generic-edit",
  submitEdit(cred, input) {
    return postJson(cred, "/edit", {
      source_video_url: input.sourceVideoUrl,
      instructions: input.instructions,
      ...input.settings,
    });
  },
};

export const genericPublish: PublishProvider = {
  key: "generic-publish",
  publish(cred, input) {
    return postJson(cred, "/publish", {
      platform: input.platform,
      video_url: input.videoUrl,
      title: input.title,
      description: input.description,
      tags: input.tags,
      thumbnail_url: input.thumbnailUrl,
      visibility: input.visibility,
      scheduled_at: input.scheduledAt,
      ...input.settings,
    });
  },
};
