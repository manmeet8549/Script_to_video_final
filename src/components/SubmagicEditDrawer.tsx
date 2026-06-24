"use client";

import { useState } from "react";
import { X, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api/client";

// Drawer that submits an AI post-production edit (captions, effects) for the
// project's rendered video via the configured AI editing provider (Submagic).
export default function SubmagicEditDrawer({
  projectId,
  open,
  onClose,
}: {
  projectId: string;
  open: boolean;
  onClose: () => void;
}) {
  const [instructions, setInstructions] = useState(
    "Add animated subtitles, emphasize key words, and apply a clean modern caption style.",
  );
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const submit = async () => {
    setSubmitting(true);
    try {
      await api.post(`/api/projects/${projectId}/edit`, {
        edit_type: "ai",
        instructions,
      });
      toast.success("Sent to AI editor. You'll be notified when the edit is ready.");
      onClose();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to submit AI edit.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={onClose}>
      <div
        className="h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
          <h3 className="flex items-center gap-2 text-lg font-bold text-zinc-900">
            <Sparkles size={18} className="text-brand-green" />
            AI Edit with Submagic
          </h3>
          <button onClick={onClose} className="p-1 text-zinc-400 hover:text-zinc-700 cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <div className="mt-6 space-y-4">
          <label className="block text-xs font-bold uppercase tracking-wide text-zinc-400">
            Editing instructions
          </label>
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            rows={6}
            className="w-full resize-none rounded-xl border border-zinc-200 p-3 text-sm text-zinc-800 outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20"
          />
          <button
            onClick={submit}
            disabled={submitting}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-green text-sm font-bold text-white shadow-sm transition-all hover:bg-brand-green-hover active:scale-[0.99] disabled:opacity-60 cursor-pointer"
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {submitting ? "Submitting..." : "Generate AI Edit"}
          </button>
        </div>
      </div>
    </div>
  );
}
