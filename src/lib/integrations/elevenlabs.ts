import "server-only";

import type { ProviderCredential, VoiceProvider } from "@/lib/integrations/types";

// ElevenLabs text-to-speech. Returns audio bytes synchronously.
// Docs: https://elevenlabs.io/docs/api-reference/text-to-speech
export const elevenLabs: VoiceProvider = {
  key: "elevenlabs",

  async generateSpeech(cred: ProviderCredential, input) {
    const base = cred.endpointUrl?.replace(/\/$/, "") || "https://api.elevenlabs.io";
    const modelId =
      (input.settings?.model_id as string) ||
      (cred.config?.model_id as string) ||
      "eleven_multilingual_v2";

    try {
      const res = await fetch(`${base}/v1/text-to-speech/${encodeURIComponent(input.voiceId)}`, {
        method: "POST",
        headers: {
          "xi-api-key": cred.apiKey,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text: input.text,
          model_id: modelId,
          voice_settings: {
            stability: Number(input.settings?.stability ?? 0.5),
            similarity_boost: Number(input.settings?.similarity_boost ?? 0.75),
          },
        }),
      });

      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        return { status: "failed", error: `ElevenLabs ${res.status}: ${detail.slice(0, 300)}` };
      }

      const audio = await res.arrayBuffer();
      return { status: "completed", audio, contentType: "audio/mpeg" };
    } catch (err) {
      return { status: "failed", error: err instanceof Error ? err.message : "Request failed" };
    }
  },
};
