"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Coins, Plus } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api/client";
import type { CreditKind, CreditTransaction, CreditWallet } from "@/types/db";

const KINDS: { key: CreditKind; label: string; col: keyof CreditWallet }[] = [
  { key: "script", label: "Script", col: "script_credits" },
  { key: "voice", label: "Voice", col: "voice_credits" },
  { key: "video", label: "Video", col: "video_credits" },
  { key: "publish", label: "Publish", col: "publish_credits" },
];

// Per-workspace credit wallet: balances, a grant control (owner/admin), and the
// recent transaction ledger. Track-only accounting — balances are informational.
export default function CreditsPanel({ canGrant = false }: { canGrant?: boolean }) {
  const [wallet, setWallet] = useState<CreditWallet | null>(null);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [granting, setGranting] = useState<CreditKind | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await api.get<{ wallet: CreditWallet; transactions: CreditTransaction[] }>(
        `/api/credits`,
      );
      setWallet(res.wallet);
      setTransactions(res.transactions);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to load credits.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const grant = async (kind: CreditKind) => {
    setGranting(kind);
    try {
      const res = await api.post<{ wallet: CreditWallet }>(`/api/credits`, { kind, amount: 50 });
      setWallet(res.wallet);
      toast.success(`Granted 50 ${kind} credits.`);
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to grant credits.");
    } finally {
      setGranting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-zinc-400">
        <Loader2 className="mr-2 animate-spin" size={18} /> Loading credits…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {KINDS.map(({ key, label, col }) => (
          <div key={key} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-zinc-400">
              <Coins size={14} className="text-brand-green" />
              <span className="text-[10px] font-bold uppercase tracking-wide">{label}</span>
            </div>
            <p className="mt-2 text-2xl font-extrabold text-zinc-900">
              {wallet ? (wallet[col] as number) : 0}
            </p>
            {canGrant && (
              <button
                onClick={() => grant(key)}
                disabled={granting === key}
                className="mt-3 flex items-center gap-1 text-[11px] font-bold text-brand-green hover:underline disabled:opacity-60 cursor-pointer"
              >
                {granting === key ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                Grant 50
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-bold text-zinc-900">Recent activity</h3>
        <div className="mt-3 divide-y divide-zinc-100">
          {transactions.length === 0 ? (
            <p className="py-6 text-center text-xs text-zinc-400">No transactions yet.</p>
          ) : (
            transactions.map((t) => (
              <div key={t.id} className="flex items-center justify-between py-2.5 text-xs">
                <div>
                  <span className="font-bold capitalize text-zinc-800">{t.kind}</span>
                  <span className="ml-2 text-zinc-400">{t.reason}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`font-bold ${t.amount < 0 ? "text-red-600" : "text-brand-green"}`}>
                    {t.amount > 0 ? "+" : ""}
                    {t.amount}
                  </span>
                  <span className="text-zinc-400">{new Date(t.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
