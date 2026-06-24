import { z } from "zod";
import { guard, jsonError, jsonOk, parseBody, requireApiMember } from "@/lib/api/http";
import { resolveCredential } from "@/lib/dal/integrations";
import { getVoiceProvider } from "@/lib/integrations/registry";

const schema = z.object({
  voice_id: z.string().min(1, "A voice is required"),
  text: z.string().max(400).optional(),
  settings: z.record(z.string(), z.unknown()).optional(),
});

const DEFAULT_PREVIEW_TEXT =
  "Hi there! This is a quick preview of how your selected voice will sound.";

// POST /api/voice/preview — synthesize a short greeting with the selected voice
// so the user can audition it before committing. Returns an ephemeral base64
// data URL (not stored in R2) and does NOT consume a voice credit.
export async function POST(request: Request) {
  return guard(async () => {
    const auth = await requireApiMember(["owner", "admin", "user"]);
    if (!auth.ok) return auth.response;

    const body = await parseBody(request, schema);
    if (!body.ok) return body.response;

    const resolved = await resolveCredential(auth.membership.workspace_id, "voice");
    if (!resolved) {
      return jsonError("No voice provider configured for this workspace.", 400);
    }
    const provider = getVoiceProvider(resolved.api.provider_key);
    if (!provider) {
      return jsonError(`Unsupported voice provider: ${resolved.api.provider_key}`, 400);
    }

    const result = await provider.generateSpeech(resolved.credential, {
      text: body.data.text || DEFAULT_PREVIEW_TEXT,
      voiceId: body.data.voice_id,
      settings: body.data.settings,
    });
    if (result.status === "failed" || !result.audio) {
      return jsonError(result.error || "Preview generation failed.", 502);
    }

    const base64 = Buffer.from(result.audio).toString("base64");
    const contentType = result.contentType ?? "audio/mpeg";
    return jsonOk({ audioUrl: `data:${contentType};base64,${base64}` });
  });
}
