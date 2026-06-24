"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Check, Upload, Inbox } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api/client";
import type { EditingTask } from "@/types/db";

// Editor portal: assignments routed to the current editor. Accept work, then
// upload edited versions (which move the assignment into review).
export default function EditorAssignments() {
  const [items, setItems] = useState<EditingTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [urls, setUrls] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    try {
      const res = await api.get<{ items: EditingTask[] }>(`/api/assignments?mine=1`);
      setItems(res.items);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to load assignments.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const accept = async (id: string) => {
    setBusy(id);
    try {
      await api.patch(`/api/assignments/${id}`, { action: "accept" });
      toast.success("Assignment accepted.");
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to accept.");
    } finally {
      setBusy(null);
    }
  };

  const upload = async (id: string) => {
    const video_url = urls[id]?.trim();
    if (!video_url) return toast.error("Paste the edited video URL first.");
    setBusy(id);
    try {
      await api.post(`/api/assignments/${id}/versions`, { video_url });
      toast.success("Version uploaded — sent for review.");
      setUrls((u) => ({ ...u, [id]: "" }));
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to upload version.");
    } finally {
      setBusy(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-zinc-400">
        <Loader2 className="mr-2 animate-spin" size={18} /> Loading assignments…
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-16 text-center shadow-sm">
        <Inbox className="mx-auto mb-2 text-zinc-400" size={26} />
        <h3 className="text-sm font-bold text-zinc-800">No assignments yet</h3>
        <p className="mt-1 text-xs font-semibold text-zinc-400">
          Videos assigned to you for editing will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((a) => (
        <div key={a.id} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-zinc-900">Project {a.project_id.slice(0, 8)}</p>
            <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-[10px] font-bold uppercase text-zinc-600">
              {a.status.replace(/_/g, " ")}
            </span>
          </div>
          {a.instructions && <p className="mt-2 text-xs text-zinc-500">{a.instructions}</p>}
          {a.feedback && (
            <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
              Revision: {a.feedback}
            </p>
          )}
          {a.source_video_url && (
            <a
              href={a.source_video_url}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-block text-xs font-bold text-brand-green hover:underline"
            >
              View original cut →
            </a>
          )}

          <div className="mt-4">
            {a.status === "pending" ? (
              <button
                onClick={() => accept(a.id)}
                disabled={busy === a.id}
                className="flex items-center gap-1.5 rounded-xl bg-brand-green px-4 py-2 text-xs font-bold text-white hover:bg-brand-green-hover disabled:opacity-60 cursor-pointer"
              >
                <Check size={14} /> Accept Assignment
              </button>
            ) : a.status === "approved" || a.status === "completed" ? (
              <span className="text-xs font-bold text-brand-green">Approved by creator ✓</span>
            ) : (
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  value={urls[a.id] ?? ""}
                  onChange={(e) => setUrls((u) => ({ ...u, [a.id]: e.target.value }))}
                  placeholder="Edited video URL"
                  className="flex-1 rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20"
                />
                <button
                  onClick={() => upload(a.id)}
                  disabled={busy === a.id}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-zinc-200 px-4 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-50 disabled:opacity-60 cursor-pointer"
                >
                  <Upload size={14} /> Upload Version
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
