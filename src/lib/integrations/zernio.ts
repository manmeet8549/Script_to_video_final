import "server-only";

import type { PublishProvider, JobResult, ProviderCredential } from "@/lib/integrations/types";
import { toPublicUrl } from "@/lib/storage/media";

export const zernio: PublishProvider = {
  key: "zernio",
  async publish(cred: ProviderCredential, input): Promise<JobResult> {
    const base = cred.endpointUrl?.replace(/\/$/, "") || "https://zernio.com/api/v1";
    try {
      const publicUrl = toPublicUrl(input.videoUrl) || input.videoUrl;

      // Zernio Unified API creates posts via POST /posts
      const res = await fetch(`${base}/posts`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${cred.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: input.description || "",
          platforms: [input.platform], // Zernio expects an array of platforms
          mediaUrls: [publicUrl],
          title: input.title || undefined,
          scheduledFor: input.scheduledAt || undefined,
          ...input.settings,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        return {
          status: "failed",
          error: json.message || json.error || "Zernio publishing failed",
          raw: json,
        };
      }

      const jobId = json.id || json.postId;
      const s = (json.status || "completed").toLowerCase();

      if (s === "published" || s === "completed" || s === "success") {
        return {
          status: "completed",
          providerJobId: jobId,
          resultUrl: json.mediaUrls?.[0] || publicUrl,
          raw: json,
        };
      }
      if (s === "failed" || s === "error") {
        return {
          status: "failed",
          providerJobId: jobId,
          error: json.message || json.error || "Post creation failed",
          raw: json,
        };
      }

      return {
        status: "generating",
        providerJobId: jobId,
        raw: json,
      };
    } catch (err) {
      return {
        status: "failed",
        error: err instanceof Error ? err.message : "Zernio request failed",
      };
    }
  },
};
