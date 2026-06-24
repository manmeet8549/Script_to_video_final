import "server-only";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUser } from "@/lib/dal/auth";
import type { CreditKind, CreditTransaction, CreditWallet } from "@/types/db";

// Track-only credit accounting (per workspace). Spends are logged and balances
// are decremented for visibility, but generation is never blocked — balances may
// go negative. Mutations use the service-role client (like resolveCredential) so
// they succeed regardless of the caller's RLS role during a generation request.

const COLUMN: Record<CreditKind, keyof CreditWallet> = {
  script: "script_credits",
  voice: "voice_credits",
  video: "video_credits",
  publish: "publish_credits",
};

// Lazily create (and return) the wallet row for a workspace.
export async function ensureWallet(workspaceId: string): Promise<CreditWallet> {
  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("credit_wallets")
    .select("*")
    .eq("workspace_id", workspaceId)
    .maybeSingle();
  if (existing) return existing;

  const { data, error } = await admin
    .from("credit_wallets")
    .insert({ workspace_id: workspaceId })
    .select("*")
    .single();
  if (error) {
    // A concurrent request may have inserted first; re-read.
    const { data: race } = await admin
      .from("credit_wallets")
      .select("*")
      .eq("workspace_id", workspaceId)
      .single();
    if (race) return race;
    throw error;
  }
  return data;
}

export async function getWallet(workspaceId: string): Promise<CreditWallet> {
  return ensureWallet(workspaceId);
}

// Record usage of a credit kind. amount is the number of credits consumed
// (default 1); pass a negative amount to grant. Returns the updated wallet.
export async function recordCreditUsage(
  workspaceId: string,
  kind: CreditKind,
  opts: { projectId?: string | null; amount?: number; reason?: string } = {},
): Promise<CreditWallet> {
  const amount = opts.amount ?? 1;
  const admin = createAdminClient();
  const wallet = await ensureWallet(workspaceId);

  const column = COLUMN[kind];
  const current = (wallet[column] as number) ?? 0;
  const next = current - amount;

  const patch: Partial<CreditWallet> = { [column]: next };
  const { data: updated, error: updErr } = await admin
    .from("credit_wallets")
    .update(patch)
    .eq("workspace_id", workspaceId)
    .select("*")
    .single();
  if (updErr) throw updErr;

  const user = await getUser();
  await admin.from("credit_transactions").insert({
    workspace_id: workspaceId,
    project_id: opts.projectId ?? null,
    kind,
    amount: -amount,
    balance_after: next,
    reason: opts.reason ?? null,
    created_by: user?.id ?? null,
  });

  return updated;
}

// Increment a workspace's recorded storage usage (best-effort; never throws into
// the caller's critical path).
export async function addStorageUsage(workspaceId: string, bytes: number): Promise<void> {
  if (!bytes) return;
  const admin = createAdminClient();
  const wallet = await ensureWallet(workspaceId);
  await admin
    .from("credit_wallets")
    .update({ storage_used_bytes: (wallet.storage_used_bytes ?? 0) + bytes })
    .eq("workspace_id", workspaceId);
}

export async function listTransactions(
  workspaceId: string,
  limit = 50,
): Promise<CreditTransaction[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("credit_transactions")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}
