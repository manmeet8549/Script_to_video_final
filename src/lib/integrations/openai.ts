import "server-only";

import type { ProviderCredential, ScriptProvider } from "@/lib/integrations/types";
import { buildScriptMessages, callChatCompletion } from "@/lib/integrations/script-common";

// OpenAI Chat Completions for script generation — the primary script provider.
// Docs: https://platform.openai.com/docs/api-reference/chat
export const openai: ScriptProvider = {
  key: "openai",

  generateScript(cred: ProviderCredential, input) {
    const model = (cred.config?.model as string) || "gpt-4o-mini";
    return callChatCompletion(cred, "https://api.openai.com/v1", model, buildScriptMessages(input));
  },
};
