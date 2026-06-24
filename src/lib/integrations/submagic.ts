import "server-only";

import type { EditProvider, JobResult, ProviderCredential } from "@/lib/integrations/types";

// Submagic AI editing / auto-captioning. A submit returns a project id; the
// edited video arrives via webhook or is polled with getStatus.
// Docs: https://submagic.notion.site/Submagic-API (x-api-key auth).
const DEFAULT_BASE = "https://api.submagic.co/v1";

type SubmagicProject = {
  id?: string;
  projectId?: string;
  status?: string;
  outputUrl?: string;
  downloadUrl?: string;
  videoUrl?: string;
  error?: string;
  message?: string;
};

function mapProject(json: SubmagicProject, httpOk: boolean): JobResult {
  if (!httpOk) {
    return { status: "failed", error: json.error || json.message || "Submagic request failed", raw: json };
  }
  const jobId = json.id || json.projectId;
  const url = json.outputUrl || json.downloadUrl || json.videoUrl;
  const s = (json.status || (url ? "completed" : "processing")).toLowerCase();

  if (s === "completed" || s === "done" || s === "success") {
    return { status: "completed", providerJobId: jobId, resultUrl: url, raw: json };
  }
  if (s === "failed" || s === "error") {
    return { status: "failed", providerJobId: jobId, error: json.error || json.message, raw: json };
  }
  return { status: "generating", providerJobId: jobId, raw: json };
}

export const submagic: EditProvider = {
  key: "submagic",

  async submitEdit(cred: ProviderCredential, input): Promise<JobResult> {
    const base = cred.endpointUrl?.replace(/\/$/, "") || DEFAULT_BASE;
    try {
      const res = await fetch(`${base}/projects`, {
        method: "POST",
        headers: { "x-api-key": cred.apiKey, "Content-Type": "application/json" },
        body: JSON.stringify({
          title: (input.settings?.title as string) || "AI Edit",
          language: (input.settings?.language as string) || "en",
          videoUrl: input.sourceVideoUrl,
          templateName: (input.settings?.template as string) || (cred.config?.template as string),
          ...input.settings,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as SubmagicProject;
      return mapProject(json, res.ok);
    } catch (err) {
      return { status: "failed", error: err instanceof Error ? err.message : "Request failed" };
    }
  },

  async getStatus(cred: ProviderCredential, providerJobId: string): Promise<JobResult> {
    const base = cred.endpointUrl?.replace(/\/$/, "") || DEFAULT_BASE;
    try {
      const res = await fetch(`${base}/projects/${encodeURIComponent(providerJobId)}`, {
        headers: { "x-api-key": cred.apiKey },
      });
      const json = (await res.json().catch(() => ({}))) as SubmagicProject;
      return mapProject(json, res.ok);
    } catch (err) {
      return { status: "failed", providerJobId, error: err instanceof Error ? err.message : "Request failed" };
    }
  },
};
