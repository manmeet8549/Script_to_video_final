import "server-only";

import type { ProviderCredential } from "@/lib/integrations/types";

// Shared helpers for chat-completion-style script providers. OpenAI and NVIDIA
// NIM both expose the same `/chat/completions` contract, so the only thing that
// differs between them is the default base URL and model.

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

// Strip characters/markers that could be used to break out of the prompt
// (basic prompt-injection hardening). Inputs are user-supplied free text.
export function sanitizePromptInput(value: string | undefined, maxLen = 2000): string {
  if (!value) return "";
  return value
    .replace(/[`*_#]{3,}/g, " ") // markdown fences / heavy markers
    .replace(/\b(system|assistant|developer)\s*:/gi, "$1 -") // role-prefix spoofing
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLen);
}

// Translate the requested language choice into an explicit instruction for the
// LLM. Mirrors the SCRIPT-AI spec (english / hindi / hinglish), while still
// accepting free-form language labels (e.g. "English (US)").
export function languageInstruction(language?: string): string {
  const key = (language || "english").trim().toLowerCase();
  if (key.startsWith("hinglish")) {
    return "Generate the script in Romanized Hindi mixed with common English words " +
      "(transliterated text, e.g., 'Dosto, aaj is video me...'). Do not use Devanagari.";
  }
  if (key.startsWith("hindi")) {
    return "Generate the entire script in natural, conversational Hindi using the " +
      "Devanagari script.";
  }
  if (key.startsWith("english") || key === "en") {
    return "Generate the entire script content in natural, fluent English.";
  }
  return `Generate the entire script content in ${language}.`;
}

export function buildScriptMessages(input: {
  topic: string;
  tone?: string;
  language?: string;
  targetDuration?: string;
  instructions?: string;
}): ChatMessage[] {
  const topic = sanitizePromptInput(input.topic, 300);
  const instructions = sanitizePromptInput(input.instructions);

  const lines = [
    `Topic / title: ${topic}`,
    `Tone: ${sanitizePromptInput(input.tone, 60) || "Professional"}`,
    `Language directive: ${languageInstruction(input.language)}`,
  ];
  if (input.targetDuration) {
    lines.push(`Target spoken duration: ${sanitizePromptInput(input.targetDuration, 40)}`);
  }
  if (instructions) lines.push(`Additional instructions: ${instructions}`);

  return [
    {
      role: "system",
      content:
        "You are an expert short-form video scriptwriter. Write a clear, engaging, " +
        "spoken-word script ready for an AI voiceover. Structure it with [Hook], " +
        "[Body], and [Call to Action] section markers. Match the requested tone, " +
        "language, and duration. Follow the language directive exactly. Return only " +
        "the script text — no preamble, notes, or markdown fences.",
    },
    { role: "user", content: lines.join("\n") },
  ];
}

// Call an OpenAI-compatible chat-completions endpoint and return the assistant
// text. `baseUrl` should be the API root (no trailing slash, no path).
export async function callChatCompletion(
  cred: ProviderCredential,
  baseUrl: string,
  model: string,
  messages: ChatMessage[],
): Promise<{ status: "completed" | "failed"; content?: string; error?: string }> {
  const root = (cred.endpointUrl?.replace(/\/$/, "") || baseUrl).replace(/\/$/, "");
  const controller = new AbortController();
  // LLM generation regularly runs longer than the old 30s cap (large models /
  // cold starts). Keep this under the route's maxDuration so we time out with a
  // clear message instead of Vercel killing the function.
  const TIMEOUT_MS = 55000;
  let timedOut = false;
  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, TIMEOUT_MS);
  try {
    const res = await fetch(`${root}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cred.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.8,
        max_tokens: 1200,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const json = (await res.json().catch(() => ({}))) as {
      choices?: { message?: { content?: string } }[];
      error?: { message?: string } | string;
      message?: string;
    };

    if (!res.ok) {
      const detail =
        (typeof json.error === "object" ? json.error?.message : json.error) ||
        json.message ||
        `HTTP ${res.status}`;
      return { status: "failed", error: String(detail).slice(0, 300) };
    }

    const content = json.choices?.[0]?.message?.content?.trim();
    if (!content) return { status: "failed", error: "Provider returned an empty script." };
    return { status: "completed", content };
  } catch (err) {
    clearTimeout(timeoutId);
    if (timedOut) {
      return { status: "failed", error: `the model took longer than ${TIMEOUT_MS / 1000}s to respond (try a faster model)` };
    }
    return { status: "failed", error: err instanceof Error ? err.message : "Request failed" };
  }
}
