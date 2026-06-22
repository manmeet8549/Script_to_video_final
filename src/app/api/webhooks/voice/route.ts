import { jsonError, jsonOk } from "@/lib/api/http";
import { completeVoiceByJob, verifyWebhook } from "@/lib/dal/webhooks";

// Voice provider completion webhook (for async TTS providers). ElevenLabs is
// synchronous and does not use this; included for providers that do.
export async function POST(request: Request) {
  if (!verifyWebhook(request)) return jsonError("Invalid signature", 401);

  let payload: Record<string, unknown>;
  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const data = (payload.event_data as Record<string, unknown> | undefined) ?? payload;
  const jobId =
    (data.generation_id as string) || (data.id as string) || (payload.generation_id as string);
  if (!jobId) return jsonError("Missing generation id", 422);

  const status = String(payload.event_type ?? data.status ?? "").toLowerCase();
  const failed = status.includes("fail") || status.includes("error");

  const found = await completeVoiceByJob(
    jobId,
    failed ? "failed" : "completed",
    (data.audio_url as string) || undefined,
    typeof data.duration === "number" ? (data.duration as number) : undefined,
    failed ? String(data.error ?? "Provider reported failure") : undefined,
  );

  return found ? jsonOk({ received: true }) : jsonError("Unknown job", 404);
}
