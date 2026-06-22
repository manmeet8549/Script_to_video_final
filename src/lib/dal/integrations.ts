import "server-only";

import { createClient } from "@/lib/supabase/server";
import { encryptSecret, decryptSecret } from "@/lib/crypto/secrets";
import type { ProviderCredential } from "@/lib/integrations/types";
import type { ProviderKind, WorkspaceApi } from "@/types/db";

// Public-safe shape of a configured API (never includes the decrypted key).
export type SafeWorkspaceApi = Omit<WorkspaceApi, "api_key_encrypted" | "api_secret_encrypted"> & {
  has_secret: boolean;
};

export function toSafeApi(api: WorkspaceApi): SafeWorkspaceApi {
  const { api_key_encrypted: _k, api_secret_encrypted: secret, ...rest } = api;
  void _k;
  return { ...rest, has_secret: !!secret };
}

export async function listApis(workspaceId: string): Promise<SafeWorkspaceApi[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("workspace_apis")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(toSafeApi);
}

export async function saveApi(input: {
  workspaceId: string;
  provider: ProviderKind;
  providerKey: string;
  apiName: string;
  apiKey: string;
  apiSecret?: string | null;
  endpointUrl?: string | null;
  config?: Record<string, unknown>;
}): Promise<SafeWorkspaceApi> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("workspace_apis")
    .insert({
      workspace_id: input.workspaceId,
      provider: input.provider,
      provider_key: input.providerKey,
      api_name: input.apiName,
      api_key_encrypted: encryptSecret(input.apiKey),
      api_secret_encrypted: input.apiSecret ? encryptSecret(input.apiSecret) : null,
      endpoint_url: input.endpointUrl ?? null,
      config: input.config ?? {},
    })
    .select("*")
    .single();
  if (error) throw error;
  return toSafeApi(data);
}

export async function deleteApi(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("workspace_apis").delete().eq("id", id);
  if (error) throw error;
}

// Resolve the active provider config for a kind (optionally a specific adapter)
// and decrypt its credential for server-side use. RLS limits this to
// owner/admin reads; trigger routes call it after authorizing the caller.
export async function resolveCredential(
  workspaceId: string,
  provider: ProviderKind,
  providerKey?: string,
): Promise<{ api: WorkspaceApi; credential: ProviderCredential } | null> {
  const supabase = await createClient();
  let query = supabase
    .from("workspace_apis")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("provider", provider)
    .eq("is_active", true);
  if (providerKey) query = query.eq("provider_key", providerKey);

  const { data, error } = await query.order("created_at", { ascending: false }).limit(1);
  if (error) throw error;
  const api = data?.[0];
  if (!api) return null;

  const credential: ProviderCredential = {
    apiKey: decryptSecret(api.api_key_encrypted),
    apiSecret: api.api_secret_encrypted ? decryptSecret(api.api_secret_encrypted) : null,
    endpointUrl: api.endpoint_url,
    config: api.config,
  };
  return { api, credential };
}
