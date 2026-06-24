import "server-only";

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { r2Config } from "@/lib/env";

// Cloudflare R2 (S3-compatible) storage for generated media (audio/video).
// Returns a public URL served from the bucket's public r2.dev domain.

let cached: S3Client | null = null;

function client(): S3Client {
  if (cached) return cached;
  const { accountId, accessKeyId, secretAccessKey } = r2Config();
  cached = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
  return cached;
}

// Build the public r2.dev / custom-domain URL for an object key. Used for assets
// that must be reachable by third-party services (e.g. HeyGen fetching the
// narration audio for lipsync), which cannot authenticate against the internal
// /api/media/stream proxy.
export function publicMediaUrl(key: string): string {
  const { publicUrl } = r2Config();
  return `${publicUrl}/${key.split("/").map(encodeURIComponent).join("/")}`;
}

export function toProxyUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("/") || url.startsWith("data:")) return url;
  try {
    const { publicUrl } = r2Config();
    const prefix = publicUrl.replace(/\/$/, "");
    if (url.startsWith(prefix)) {
      const key = decodeURIComponent(url.slice(prefix.length).replace(/^\//, ""));
      return `/api/media/stream?key=${encodeURIComponent(key)}`;
    }
  } catch {}
  return url;
}

export async function uploadMedia(
  key: string,
  bytes: ArrayBuffer | Uint8Array | Buffer,
  contentType: string,
  options?: { public?: boolean },
): Promise<string> {
  const { bucket } = r2Config();
  const body = bytes instanceof ArrayBuffer ? new Uint8Array(bytes) : bytes;

  await client().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );

  // Public objects (consumed by external providers) return the bucket's public
  // URL; everything else returns an internal proxy URL so browsers never hit
  // *.r2.dev directly (which requires public-access opt-in and can fail with
  // TLS errors).
  return options?.public
    ? publicMediaUrl(key)
    : `/api/media/stream?key=${encodeURIComponent(key)}`;
}
