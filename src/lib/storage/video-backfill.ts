import "server-only";

import { uploadMedia } from "@/lib/storage/media";

export type StoredVideo = {
  videoUrl: string;
  thumbnailUrl: string | null;
  r2Key: string;
  thumbnailR2Key: string | null;
  fileSizeBytes: number;
};

// Download a finished render (and optional thumbnail) from the provider's hosted
// URL and re-upload both to R2 under a stable, workspace-scoped key. Pure storage
// work — callers persist the returned metadata with their own DB client. Returns
// null if the video download/upload fails, so callers can fall back to the
// provider URL rather than leaving the project stuck.
export async function fetchAndStoreVideo(
  workspaceId: string,
  projectId: string,
  providerVideoUrl: string,
  thumbnailUrl?: string | null,
  customKey?: string,
): Promise<StoredVideo | null> {
  try {
    const res = await fetch(providerVideoUrl);
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();

    const r2Key = customKey || `videos/${workspaceId}/${projectId}.mp4`;
    const videoUrl = await uploadMedia(r2Key, buf, "video/mp4");

    let thumbnailR2Key: string | null = null;
    let storedThumbUrl: string | null = null;
    if (thumbnailUrl) {
      try {
        const tRes = await fetch(thumbnailUrl);
        if (tRes.ok) {
          const tBuf = await tRes.arrayBuffer();
          thumbnailR2Key = customKey
            ? `${customKey.replace(/\.[^/.]+$/, "")}-thumbnail.jpg`
            : `videos/${workspaceId}/${projectId}-thumbnail.jpg`;
          storedThumbUrl = await uploadMedia(thumbnailR2Key, tBuf, "image/jpeg");
        }
      } catch {
        // Thumbnail is best-effort; ignore failures.
      }
    }

    return {
      videoUrl,
      thumbnailUrl: storedThumbUrl,
      r2Key,
      thumbnailR2Key,
      fileSizeBytes: buf.byteLength,
    };
  } catch {
    return null;
  }
}
