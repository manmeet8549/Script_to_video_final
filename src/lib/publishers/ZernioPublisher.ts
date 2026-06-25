import { S3Client, HeadObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2Config } from "@/lib/env";
import { createZernioPost } from "@/services/zernio";
import { Publisher } from "./index";

let cached: S3Client | null = null;
function getS3Client(): S3Client {
  if (cached) return cached;
  const { accountId, accessKeyId, secretAccessKey } = r2Config();
  cached = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
  return cached;
}

export class ZernioPublisher implements Publisher {
  async publish(
    videoUrl: string,
    platform: string,
    zernioAccountId: string | null,
    content: string,
    title?: string,
    scheduledFor?: string,
    apiKey?: string
  ): Promise<{ externalId: string; watchUrl?: string }> {
    let signedUrl = videoUrl;
    let isMock = false;

    // Check if we are running in a mock context or using proxy endpoints
    if (
      videoUrl.includes("mock") ||
      videoUrl.startsWith("/") ||
      !videoUrl.startsWith("http")
    ) {
      isMock = true;
    }

    if (!isMock) {
      try {
        const { bucket } = r2Config();
        const client = getS3Client();

        // 1. Extract R2 key
        let key: string | null = null;
        if (videoUrl.includes("/api/media/stream?key=")) {
          const match = videoUrl.match(/[?&]key=([^&]+)/);
          if (match && match[1]) key = decodeURIComponent(match[1]);
        } else {
          const { publicUrl } = r2Config();
          const prefix = publicUrl.replace(/\/$/, "");
          if (videoUrl.startsWith(prefix)) {
            key = decodeURIComponent(videoUrl.slice(prefix.length).replace(/^\//, ""));
          }
        }

        if (key) {
          // 2. Validate file extension
          const ext = key.split(".").pop()?.toLowerCase();
          const allowed = ["mp4", "mov", "avi", "mkv", "webm"];
          if (ext && !allowed.includes(ext)) {
            console.warn(`Unsupported file format warning: .${ext}`);
          }

          // Check if video exists in R2
          try {
            await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
          } catch (headErr) {
            console.warn(`Video key ${key} check failed on R2, using raw URL.`, headErr);
          }

          // 3. Generate 24-hour signed R2 URL
          try {
            const command = new GetObjectCommand({ Bucket: bucket, Key: key });
            signedUrl = await getSignedUrl(client, command, { expiresIn: 86400 });
          } catch (signErr) {
            console.error("Failed to generate signed URL, using raw URL instead:", signErr);
          }
        }
      } catch (err) {
        console.error("R2 signed URL resolution failed, using raw video URL:", err);
      }
    }

    // 5. Call Zernio to create the post
    if (!zernioAccountId) {
      throw new Error(`No connected account ID provided for platform: ${platform}`);
    }

    const post = await createZernioPost(
      zernioAccountId,
      platform,
      signedUrl,
      content,
      title,
      scheduledFor,
      apiKey
    );

    // 6. Return the Zernio post ID and the live post URL (if Zernio provided one)
    return { externalId: post.id, watchUrl: post.url };
  }
}
