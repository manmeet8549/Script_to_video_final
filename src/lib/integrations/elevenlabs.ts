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

    const outputFormat = (input.settings?.output_format as string) || "mp3_44100_128";
    const url = `${base}/v1/text-to-speech/${encodeURIComponent(input.voiceId)}?output_format=${encodeURIComponent(outputFormat)}`;

    try {
      const stability = input.settings?.stability !== undefined ? Number(input.settings.stability) : 0.5;
      const similarityBoost = input.settings?.similarity_boost !== undefined ? Number(input.settings.similarity_boost) : 0.75;
      const style = input.settings?.style !== undefined ? Number(input.settings.style) : 0.0;
      const useSpeakerBoost = input.settings?.use_speaker_boost !== undefined ? Boolean(input.settings.use_speaker_boost) : true;
      const speed = input.settings?.speed !== undefined ? Number(input.settings.speed) : 1.0;

      const res = await fetch(url, {
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
            stability,
            similarity_boost: similarityBoost,
            style,
            use_speaker_boost: useSpeakerBoost,
            speed,
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

  // Confirm the voice id is accessible with this API key before spending a TTS
  // call (a 404 here means the saved voice was deleted or belongs to a key the
  // workspace no longer has — the pipeline falls back to a premium default).
  async verifyVoice(cred: ProviderCredential, voiceId: string): Promise<boolean> {
    const base = cred.endpointUrl?.replace(/\/$/, "") || "https://api.elevenlabs.io";
    try {
      const res = await fetch(`${base}/v1/voices/${encodeURIComponent(voiceId)}`, {
        headers: { "xi-api-key": cred.apiKey },
      });
      return res.ok;
    } catch {
      return false;
    }
  },
};
