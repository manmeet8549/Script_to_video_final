import { z } from "zod";
import { guard, jsonError, jsonOk, parseBody, requireApiMember } from "@/lib/api/http";
import { generateScriptText, ScriptProviderError } from "@/lib/dal/pipeline";

// LLM generation can run well past the default function limit; give Vercel
// headroom so a slow model finishes instead of the function being killed.
export const maxDuration = 60;

const generateSchema = z.object({
  topic: z.string().min(1, "A topic or title is required").max(300),
  tone: z.string().max(40).optional(),
  language: z.string().max(40).optional(),
  target_duration: z.string().max(20).optional(),
  instructions: z.string().max(2000).optional(),
});

// POST /api/script/generate — generate a video script with the active
// workspace's configured AI provider (OpenAI priority, NVIDIA NIM fallback).
export async function POST(request: Request) {
  return guard(async () => {
    const auth = await requireApiMember(["owner", "admin", "user"]);
    if (!auth.ok) return auth.response;

    const body = await parseBody(request, generateSchema);
    if (!body.ok) return body.response;

    try {
      const result = await generateScriptText(auth.membership.workspace_id, {
        topic: body.data.topic,
        tone: body.data.tone,
        language: body.data.language,
        targetDuration: body.data.target_duration,
        instructions: body.data.instructions,
      });
      return jsonOk(result, { status: 201 });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Script generation failed";
      // Provider not configured is a client-fixable condition → 400.
      const isConfig = msg.includes("No script provider") || msg.includes("Unsupported script provider");
      if (isConfig) return jsonError(msg, 400);
      // The provider accepted but failed the request (bad key/quota/model) → 502.
      if (err instanceof ScriptProviderError) return jsonError(msg, 502);
      // Anything else is a genuine server fault.
      return jsonError(msg, 500);
    }
  });
}
