import { NextRequest, NextResponse } from "next/server";
import { S3Client, GetObjectCommand, NoSuchKey } from "@aws-sdk/client-s3";
import { guard, jsonError, requireApiMember } from "@/lib/api/http";
import { r2Config } from "@/lib/env";

// GET /api/media/stream?key=<storageKey>
// Proxies R2 objects through the Next.js server so the browser never makes a
// direct TLS connection to *.r2.dev (which requires public-access to be enabled
// in the Cloudflare dashboard and can hit cipher-mismatch errors).
export async function GET(request: NextRequest) {
  return guard(async () => {
    const auth = await requireApiMember();
    if (!auth.ok) return auth.response;

    const key = new URL(request.url).searchParams.get("key") ?? "";
    if (!key || key.includes("..") || key.startsWith("/")) {
      return jsonError("Invalid key", 400);
    }

    const { accountId, accessKeyId, secretAccessKey, bucket } = r2Config();
    const s3 = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    });

    let obj;
    try {
      obj = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    } catch (err) {
      if (err instanceof NoSuchKey) return jsonError("Media not found", 404);
      throw err;
    }

    if (!obj.Body) return jsonError("Media not found", 404);

    const bytes = await (obj.Body as { transformToByteArray(): Promise<Uint8Array> }).transformToByteArray();

    return new NextResponse(Buffer.from(bytes), {
      headers: {
        "Content-Type": obj.ContentType ?? "audio/mpeg",
        "Cache-Control": "private, max-age=3600",
        ...(obj.ContentLength != null ? { "Content-Length": String(obj.ContentLength) } : {}),
      },
    });
  });
}
