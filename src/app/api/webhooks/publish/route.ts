import { jsonError, jsonOk } from "@/lib/api/http";
import { completePublishByJob, verifyWebhook } from "@/lib/dal/webhooks";

// Publishing provider completion webhook.
export async function POST(request: Request) {
  if (!verifyWebhook(request)) return jsonError("Invalid signature", 401);

  let payload: Record<string, unknown>;
  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const data = (payload.event_data as Record<string, unknown> | undefined) ?? payload;
  const jobId = (data.job_id as string) || (data.id as string) || (payload.job_id as string);
  if (!jobId) return jsonError("Missing job id", 422);

  const status = String(payload.event_type ?? data.status ?? "").toLowerCase();
  const failed = status.includes("fail") || status.includes("error");

  const found = await completePublishByJob(
    jobId,
    failed ? "failed" : "completed",
    (data.platform_video_id as string) || (data.url as string) || undefined,
    failed ? String(data.error ?? "Provider reported failure") : undefined,
  );

  return found ? jsonOk({ received: true }) : jsonError("Unknown job", 404);
}
