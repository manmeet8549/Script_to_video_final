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

export async function uploadMedia(
  key: string,
  bytes: ArrayBuffer | Uint8Array | Buffer,
  contentType: string,
): Promise<string> {
  const { bucket, publicUrl } = r2Config();
  const body = bytes instanceof ArrayBuffer ? new Uint8Array(bytes) : bytes;

  await client().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );

  return `${publicUrl}/${key}`;
}
