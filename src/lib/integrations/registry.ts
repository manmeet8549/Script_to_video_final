import "server-only";

import { openai } from "@/lib/integrations/openai";
import { nvidiaNim } from "@/lib/integrations/nvidia";
import { elevenLabs } from "@/lib/integrations/elevenlabs";
import { heygen } from "@/lib/integrations/heygen";
import { submagic } from "@/lib/integrations/submagic";
import { genericEdit, genericPublish } from "@/lib/integrations/generic";
import { zernio } from "@/lib/integrations/zernio";
import type {
  EditProvider,
  PublishProvider,
  ScriptProvider,
  VideoProvider,
  VoiceProvider,
} from "@/lib/integrations/types";

const scriptProviders: Record<string, ScriptProvider> = {
  openai,
  nvidia: nvidiaNim,
};

const voiceProviders: Record<string, VoiceProvider> = {
  elevenlabs: elevenLabs,
};

const videoProviders: Record<string, VideoProvider> = {
  heygen,
};

const editProviders: Record<string, EditProvider> = {
  submagic,
  // Any other AI editing service falls back to the generic HTTP adapter.
  "generic-edit": genericEdit,
};

const publishProviders: Record<string, PublishProvider> = {
  zernio,
  "generic-publish": genericPublish,
};

export function getScriptProvider(key: string): ScriptProvider | null {
  return scriptProviders[key] ?? null;
}

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
