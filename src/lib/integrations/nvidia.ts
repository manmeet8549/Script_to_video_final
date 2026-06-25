import "server-only";

import type { ProviderCredential, ScriptProvider } from "@/lib/integrations/types";
import { buildScriptMessages, callChatCompletion } from "@/lib/integrations/script-common";

// NVIDIA NIM — OpenAI-compatible chat completions. Used as the script fallback
// when no OpenAI key is configured for the workspace.
// Docs: https://docs.nvidia.com/nim/ (build.nvidia.com hosts the OpenAI-style API)
export const nvidiaNim: ScriptProvider = {
  key: "nvidia",

  generateScript(cred: ProviderCredential, input) {
    // Default to a small, fast model so script generation returns well within
    // the request timeout. Override per-workspace via config.model for quality.
    const model = (cred.config?.model as string) || "meta/llama-3.1-8b-instruct";
    return callChatCompletion(
      cred,
      "https://integrate.api.nvidia.com/v1",
      model,
      buildScriptMessages(input),
    );
  },
};
