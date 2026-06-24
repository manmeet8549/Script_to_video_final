"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, XCircle, MessageSquare, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api/client";
import type { ApprovalItem } from "@/types/db";

// Admin approval queue: lists queued publishes and lets an owner/admin approve
// (releases the held publish), reject, or request changes.
export default function ApprovalQueueSection() {
  const [items, setItems] = useState<ApprovalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    try {
      const res = await api.get<{ items: ApprovalItem[] }>(`/api/approvals?status=pending`);
      setItems(res.items);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to load approvals.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const decide = async (
    id: string,
    decision: "approved" | "rejected" | "changes_requested",
  ) => {
    setBusy(id);
    try {
      await api.patch(`/api/approvals/${id}`, { decision, feedback: feedback[id] || undefined });
      toast.success(
        decision === "approved" ? "Approved — publishing released." : "Decision recorded.",
      );
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to update approval.");
    } finally {
      setBusy(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-zinc-400">
        <Loader2 className="mr-2 animate-spin" size={18} /> Loading approval queue…
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-16 text-center shadow-sm">
        <CheckCircle2 className="mx-auto mb-2 text-brand-green" size={28} />
        <h3 className="text-sm font-bold text-zinc-800">Nothing awaiting approval</h3>
        <p className="mt-1 text-xs font-semibold text-zinc-400">
          Publishes that require approval will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.id} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-zinc-900">Publish request</p>
              <p className="text-[11px] font-semibold text-zinc-400">
                Project {item.project_id?.slice(0, 8)} · {new Date(item.created_at).toLocaleString()}
              </p>
            </div>
            <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-700">
              Pending
            </span>
          </div>

          <input
            value={feedback[item.id] ?? ""}
            onChange={(e) => setFeedback((f) => ({ ...f, [item.id]: e.target.value }))}
            placeholder="Optional feedback…"
            className="mt-4 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20"
          />

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={() => decide(item.id, "approved")}
              disabled={busy === item.id}
              className="flex items-center gap-1.5 rounded-xl bg-brand-green px-4 py-2 text-xs font-bold text-white hover:bg-brand-green-hover disabled:opacity-60 cursor-pointer"
            >
              <CheckCircle2 size={14} /> Approve
            </button>
            <button
              onClick={() => decide(item.id, "changes_requested")}
              disabled={busy === item.id}
              className="flex items-center gap-1.5 rounded-xl border border-zinc-200 px-4 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-50 disabled:opacity-60 cursor-pointer"
            >
              <MessageSquare size={14} /> Request Changes
            </button>
            <button
              onClick={() => decide(item.id, "rejected")}
              disabled={busy === item.id}
              className="flex items-center gap-1.5 rounded-xl border border-red-200 px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-60 cursor-pointer"
            >
              <XCircle size={14} /> Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
