import "server-only";

import type { ProviderCredential, ScriptProvider } from "@/lib/integrations/types";
import { buildScriptMessages, callChatCompletion } from "@/lib/integrations/script-common";

// NVIDIA NIM — OpenAI-compatible chat completions. Used as the script fallback
// when no OpenAI key is configured for the workspace.
// Docs: https://docs.nvidia.com/nim/ (build.nvidia.com hosts the OpenAI-style API)
export const nvidiaNim: ScriptProvider = {
  key: "nvidia",

  generateScript(cred: ProviderCredential, input) {
    const model = (cred.config?.model as string) || "meta/llama-3.3-70b-instruct";
    return callChatCompletion(
      cred,
      "https://integrate.api.nvidia.com/v1",
      model,
      buildScriptMessages(input),
    );
  },
};
