"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api/client";

// Owner/admin switch for the workspace approval gate. When on, publishes are
// routed to the approval queue instead of publishing immediately.
export default function ApprovalRequiredToggle() {
  const [enabled, setEnabled] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get<{ approval_required: boolean }>(`/api/workspaces/approval`)
      .then((r) => setEnabled(r.approval_required))
      .catch(() => {});
  }, []);

  const toggle = async () => {
    const next = !enabled;
    setSaving(true);
    setEnabled(next);
    try {
      await api.patch(`/api/workspaces/approval`, { approval_required: next });
      toast.success(next ? "Approval required for publishing." : "Approval gate disabled.");
    } catch (err) {
      setEnabled(!next);
      toast.error(err instanceof ApiError ? err.message : "Failed to update setting.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div>
        <p className="text-sm font-bold text-zinc-900">Require approval before publishing</p>
        <p className="text-xs font-semibold text-zinc-400">
          Routes every publish to this queue for an owner/admin decision.
        </p>
      </div>
      <button
        onClick={toggle}
        disabled={saving}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors ${
          enabled ? "bg-brand-green" : "bg-zinc-200"
        } cursor-pointer disabled:opacity-60`}
        aria-pressed={enabled}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
            enabled ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}
