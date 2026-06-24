"use client";

import { useEffect, useState } from "react";
import { X, Layers, Loader2, UserPlus, Check, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api/client";
import type { EditingTask, EditedVideo } from "@/types/db";

// Drawer to manage alternative cuts: lists editor assignments for the project and
// their uploaded versions, and lets the creator assign the video to an editor.
export default function VideoVersionsManager({
  projectId,
  open,
  onClose,
}: {
  projectId: string;
  open: boolean;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [assignments, setAssignments] = useState<EditingTask[]>([]);
  const [versionsByTask, setVersionsByTask] = useState<Record<string, EditedVideo[]>>({});
  const [assigning, setAssigning] = useState(false);
  const [reviewBusy, setReviewBusy] = useState<string | null>(null);
  const [revisionNotes, setRevisionNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const res = await api.get<{ items: EditingTask[] }>(`/api/assignments?projectId=${projectId}`);
        if (!active) return;
        setAssignments(res.items);
        const entries = await Promise.all(
          res.items.map(async (t) => {
            try {
              const v = await api.get<{ versions: EditedVideo[] }>(`/api/assignments/${t.id}/versions`);
              return [t.id, v.versions] as const;
            } catch {
              return [t.id, []] as const;
            }
          }),
        );
        if (active) setVersionsByTask(Object.fromEntries(entries));
      } catch {
        if (active) toast.error("Failed to load versions.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [open, projectId]);

  const assignToEditor = async () => {
    setAssigning(true);
    try {
      const task = await api.post<EditingTask>(`/api/assignments`, { project_id: projectId });
      setAssignments((prev) => [task, ...prev]);
      toast.success("Assigned to editor.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to assign.");
    } finally {
      setAssigning(false);
    }
  };

  const review = async (taskId: string, action: "approve" | "request_revision") => {
    setReviewBusy(taskId);
    try {
      await api.patch(`/api/assignments/${taskId}`, {
        action,
        feedback: action === "request_revision" ? revisionNotes[taskId] || undefined : undefined,
      });
      toast.success(action === "approve" ? "Edited video accepted." : "Revision requested.");
      setAssignments((prev) =>
        prev.map((a) =>
          a.id === taskId
            ? { ...a, status: action === "approve" ? "approved" : "revision_requested" }
            : a,
        ),
      );
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to update assignment.");
    } finally {
      setReviewBusy(null);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={onClose}>
      <div
        className="h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
          <h3 className="flex items-center gap-2 text-lg font-bold text-zinc-900">
            <Layers size={18} className="text-brand-green" />
            Manage Versions
          </h3>
          <button onClick={onClose} className="p-1 text-zinc-400 hover:text-zinc-700 cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <button
          onClick={assignToEditor}
          disabled={assigning}
          className="mt-5 flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 text-sm font-bold text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-60 cursor-pointer"
        >
          {assigning ? <Loader2 size={15} className="animate-spin" /> : <UserPlus size={15} />}
          Assign to Editor
        </button>

        <div className="mt-6 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-10 text-sm text-zinc-400">
              <Loader2 className="mr-2 animate-spin" size={16} /> Loading versions…
            </div>
          ) : assignments.length === 0 ? (
            <p className="py-10 text-center text-sm text-zinc-400">
              No editor assignments yet.
            </p>
          ) : (
            assignments.map((a) => (
              <div key={a.id} className="rounded-xl border border-zinc-200 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wide text-zinc-500">
                    Assignment
                  </span>
                  <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-[10px] font-bold text-zinc-600">
                    {a.status}
                  </span>
                </div>
                <div className="mt-3 space-y-2">
                  {(versionsByTask[a.id] ?? []).length === 0 ? (
                    <p className="text-xs text-zinc-400">No versions uploaded yet.</p>
                  ) : (
                    (versionsByTask[a.id] ?? []).map((v) => (
                      <a
                        key={v.id}
                        href={v.video_url ?? "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100"
                      >
                        <span>Version {v.version}</span>
                        <span className="text-brand-green">View</span>
                      </a>
                    ))
                  )}
                </div>

                {a.status === "under_review" && (
                  <div className="mt-3 space-y-2 border-t border-zinc-100 pt-3">
                    <input
                      value={revisionNotes[a.id] ?? ""}
                      onChange={(e) => setRevisionNotes((n) => ({ ...n, [a.id]: e.target.value }))}
                      placeholder="Revision notes (optional)…"
                      className="w-full rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => review(a.id, "approve")}
                        disabled={reviewBusy === a.id}
                        className="flex items-center gap-1.5 rounded-lg bg-brand-green px-3 py-1.5 text-[11px] font-bold text-white hover:bg-brand-green-hover disabled:opacity-60 cursor-pointer"
                      >
                        <Check size={12} /> Accept Edited Video
                      </button>
                      <button
                        onClick={() => review(a.id, "request_revision")}
                        disabled={reviewBusy === a.id}
                        className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-[11px] font-bold text-zinc-700 hover:bg-zinc-50 disabled:opacity-60 cursor-pointer"
                      >
                        <MessageSquare size={12} /> Request Revision
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
