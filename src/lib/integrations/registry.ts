import "server-only";

import { elevenLabs } from "@/lib/integrations/elevenlabs";
import { heygen } from "@/lib/integrations/heygen";
import { genericEdit, genericPublish } from "@/lib/integrations/generic";
import type {
  EditProvider,
  PublishProvider,
  VideoProvider,
  VoiceProvider,
} from "@/lib/integrations/types";

const voiceProviders: Record<string, VoiceProvider> = {
  elevenlabs: elevenLabs,
};

const videoProviders: Record<string, VideoProvider> = {
  heygen,
};

const editProviders: Record<string, EditProvider> = {
  // Any configured AI editing service falls back to the generic HTTP adapter.
  "generic-edit": genericEdit,
};

const publishProviders: Record<string, PublishProvider> = {
  "generic-publish": genericPublish,
};

export function getVoiceProvider(key: string): VoiceProvider | null {
  return voiceProviders[key] ?? null;
}

export function getVideoProvider(key: string): VideoProvider | null {
  return videoProviders[key] ?? null;
}

export function getEditProvider(key: string): EditProvider {
  return editProviders[key] ?? genericEdit;
}

export function getPublishProvider(key: string): PublishProvider {
  return publishProviders[key] ?? genericPublish;
}
