import { jsonError, jsonOk } from "@/lib/api/http";
import { completeVideoByJob, verifyWebhook } from "@/lib/dal/webhooks";

// Video provider completion webhook. Tolerant of differing payload shapes
// (HeyGen-style { event_type, event_data: { video_id, url } } and generic
// { video_id, status, url }).
export async function POST(request: Request) {
  if (!verifyWebhook(request)) return jsonError("Invalid signature", 401);

  let payload: Record<string, unknown>;
  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const data = (payload.event_data as Record<string, unknown> | undefined) ?? payload;
  const jobId = (data.video_id as string) || (data.id as string) || (payload.video_id as string);
  if (!jobId) return jsonError("Missing video id", 422);

  const eventType = String(payload.event_type ?? data.status ?? "").toLowerCase();
  const failed = eventType.includes("fail") || eventType.includes("error");
  const url = (data.url as string) || (data.video_url as string) || undefined;

  const found = await completeVideoByJob(
    jobId,
    failed ? "failed" : "completed",
    url,
    failed ? String(data.error ?? "Provider reported failure") : undefined,
  );

  return found ? jsonOk({ received: true }) : jsonError("Unknown job", 404);
}
