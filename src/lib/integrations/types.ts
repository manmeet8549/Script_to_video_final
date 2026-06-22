// Provider adapter contracts. Each third-party service (voice, video, AI
// editing, publishing) implements one of these so the rest of the app stays
// provider-agnostic. Adapters receive an already-decrypted credential.

export type ProviderCredential = {
  apiKey: string;
  apiSecret?: string | null;
  endpointUrl?: string | null;
  config?: Record<string, unknown>;
};

// A job is either resolved synchronously (status 'completed' + a result URL) or
// kicked off asynchronously (status 'generating' + a providerJobId to correlate
// with a later webhook / poll).
export type JobResult = {
  status: "completed" | "generating" | "failed";
  providerJobId?: string;
  resultUrl?: string;
  durationSeconds?: number;
  error?: string;
  raw?: unknown;
};

export interface VoiceProvider {
  readonly key: string;
  generateSpeech(
    cred: ProviderCredential,
    input: { text: string; voiceId: string; settings?: Record<string, unknown> },
  ): Promise<{ status: "completed" | "failed"; audio?: ArrayBuffer; contentType?: string; error?: string }>;
}

export interface VideoProvider {
  readonly key: string;
  createVideo(
    cred: ProviderCredential,
    input: { audioUrl?: string; script?: string; settings?: Record<string, unknown> },
  ): Promise<JobResult>;
  getStatus?(cred: ProviderCredential, providerJobId: string): Promise<JobResult>;
}

export interface EditProvider {
  readonly key: string;
  submitEdit(
    cred: ProviderCredential,
    input: { sourceVideoUrl: string; instructions?: string; settings?: Record<string, unknown> },
  ): Promise<JobResult>;
  getStatus?(cred: ProviderCredential, providerJobId: string): Promise<JobResult>;
}

export interface PublishProvider {
  readonly key: string;
  publish(
    cred: ProviderCredential,
    input: {
      platform: string;
      videoUrl: string;
      title?: string;
      description?: string;
      tags?: string[];
      thumbnailUrl?: string;
      visibility?: string;
      scheduledAt?: string;
      settings?: Record<string, unknown>;
    },
  ): Promise<JobResult>;
}
