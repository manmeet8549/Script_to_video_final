"use client";

import { useCallback, useEffect, useState } from "react";
import { X, UserPlus, Loader2, Play, FileText, Check, MessageSquare, AlertCircle, ExternalLink, Clock } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api/client";
import type { Project, WorkspaceMember, Profile, EditingTask, EditedVideo } from "@/types/db";

type MemberWithProfile = WorkspaceMember & { profile: Profile | null };

export default function SendToEditorModal({
  projectId,
  isOpen,
  onClose,
  sourceVideoUrl,
  onApproved,
}: {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  sourceVideoUrl?: string | null;
  onApproved?: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [editors, setEditors] = useState<MemberWithProfile[]>([]);
  const [assignment, setAssignment] = useState<EditingTask | null>(null);
  const [versions, setVersions] = useState<EditedVideo[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);

  // Form states
  const [selectedEditorId, setSelectedEditorId] = useState("");
  const [instructions, setInstructions] = useState("");
  const [submittingAssignment, setSubmittingAssignment] = useState(false);

  // Review states
  const [revisionNotes, setRevisionNotes] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const loadData = useCallback(async () => {
    if (!projectId || !isOpen) return;
    setLoading(true);
    try {
      // 1. Fetch editors and assignments in parallel
      const [membersData, assignmentsData] = await Promise.all([
        api.get<MemberWithProfile[]>("/api/members"),
        api.get<{ items: EditingTask[] }>(`/api/assignments?projectId=${projectId}`),
      ]);

      const workspaceEditors = membersData.filter((m) => m.role === "editor");
      setEditors(workspaceEditors);

      const existingAssignment = assignmentsData.items?.[0] || null;
      setAssignment(existingAssignment);

      // 2. Fetch versions if assignment exists
      if (existingAssignment) {
        setLoadingVersions(true);
        try {
          const res = await api.get<{ versions: EditedVideo[] }>(
            `/api/assignments/${existingAssignment.id}/versions`
          );
          setVersions(res.versions || []);
        } catch {
          toast.error("Failed to load drafts list.");
        } finally {
          setLoadingVersions(false);
        }
      } else {
        setVersions([]);
      }
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to load assignment details.");
    } finally {
      setLoading(false);
    }
  }, [projectId, isOpen]);

  useEffect(() => {
    if (isOpen) {
      loadData();
      // Reset form states
      setSelectedEditorId("");
      setInstructions("");
      setRevisionNotes("");
    }
  }, [isOpen, loadData]);

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEditorId) {
      toast.error("Please select an editor");
      return;
    }
    setSubmittingAssignment(true);
    try {
      await api.post<EditingTask>("/api/assignments", {
        project_id: projectId,
        editor_id: selectedEditorId,
        instructions: instructions || undefined,
        source_video_url: sourceVideoUrl || undefined,
      });
      toast.success("Project assigned to professional editor!");
      await loadData();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to assign editor.");
    } finally {
      setSubmittingAssignment(false);
    }
  };

  const handleReviewAction = async (action: "approve" | "request_revision") => {
    if (!assignment) return;
    if (action === "request_revision" && !revisionNotes.trim()) {
      toast.error("Please enter revision feedback for the editor.");
      return;
    }

    setSubmittingReview(true);
    try {
      await api.patch(`/api/assignments/${assignment.id}`, {
        action,
        feedback: action === "request_revision" ? revisionNotes : undefined,
      });

      if (action === "approve") {
        toast.success("Edited video approved! Project updated.");
        if (onApproved) onApproved();
        onClose();
      } else {
        toast.success("Revision requested. Editor has been notified.");
        setRevisionNotes("");
        await loadData();
      }
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to update assignment.");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-55 flex items-center justify-center bg-black/55 backdrop-blur-xs p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl border border-zinc-200 shadow-2xl w-full max-w-2xl overflow-hidden relative animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between shrink-0">
          <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2 select-none">
            <UserPlus size={20} className="text-brand-green" />
            Send to Professional Editor
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-600 rounded-lg transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-400 gap-2">
              <Loader2 className="animate-spin text-brand-green" size={28} />
              <span className="text-sm font-semibold">Loading assignment information...</span>
            </div>
          ) : (!assignment || !assignment.editor_id) ? (
            // 1. Assign View
            <form onSubmit={handleAssign} className="space-y-5">
              <div className="bg-zinc-50 border border-zinc-150 rounded-2xl p-4 flex gap-3 text-left items-start">
                <AlertCircle size={18} className="text-brand-green shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-zinc-800">Assign Post-Production</p>
                  <p className="text-[11px] font-semibold text-zinc-500 leading-relaxed">
                    Delegate this project to a human editor in your workspace. They can download the raw voice and avatar cuts, apply premium custom designs/transitions, and upload draft cuts for your approval.
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wide">
                  Select Editor
                </label>
                {editors.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-red-250 bg-red-50/50 p-4 text-xs font-semibold text-red-700">
                    No editors are currently members of this workspace. Please invite editors in the workspace Team settings first.
                  </div>
                ) : (
                  <select
                    required
                    value={selectedEditorId}
                    onChange={(e) => setSelectedEditorId(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 p-3 text-sm text-zinc-800 bg-white outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 transition-all cursor-pointer"
                  >
                    <option value="">-- Choose Editor --</option>
                    {editors.map((e) => (
                      <option key={e.id} value={e.user_id}>
                        {e.profile?.full_name || e.profile?.email} ({e.profile?.email})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wide">
                  Instructions & Guidelines
                </label>
                <textarea
                  required
                  placeholder="Tell the editor what style you want, standard duration requirements, brand colors, caption preferences, or background track references..."
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  rows={5}
                  className="w-full resize-none rounded-xl border border-zinc-200 p-3.5 text-sm text-zinc-800 outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 transition-all"
                />
              </div>

              <div className="pt-2 flex gap-3 shrink-0">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 border border-zinc-200 hover:bg-zinc-50 rounded-xl text-xs font-bold text-zinc-700 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAssignment || editors.length === 0}
                  className="flex-1 py-3 bg-brand-green hover:bg-brand-green-hover disabled:opacity-60 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  {submittingAssignment ? <Loader2 size={14} className="animate-spin" /> : null}
                  Assign Work
                </button>
              </div>
            </form>
          ) : (
            // 2. Active Assignment Management View
            <div className="space-y-6">
              {/* Assignment status badge banner */}
              <div className="flex flex-wrap items-center justify-between gap-4 bg-zinc-50 border border-zinc-200 p-4 rounded-2xl select-none">
                <div className="text-left space-y-1">
                  <span className="text-[9px] font-extrabold text-zinc-400 uppercase tracking-wide block">
                    Assigned Editor
                  </span>
                  <span className="text-sm font-bold text-zinc-800">
                    {editors.find((e) => e.user_id === assignment.editor_id)?.profile?.full_name ||
                      editors.find((e) => e.user_id === assignment.editor_id)?.profile?.email ||
                      "Workspace Editor"}
                  </span>
                </div>
                <div className="text-right space-y-1">
                  <span className="text-[9px] font-extrabold text-zinc-400 uppercase tracking-wide block">
                    Status
                  </span>
                  <span
                    className={`inline-block text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-md border ${
                      assignment.status === "approved" || assignment.status === "completed"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                        : assignment.status === "under_review"
                          ? "bg-blue-50 text-blue-700 border-blue-100"
                          : assignment.status === "revision_requested"
                            ? "bg-amber-50 text-amber-700 border-amber-100"
                            : "bg-zinc-50 text-zinc-600 border-zinc-200"
                    }`}
                  >
                    {assignment.status.replace(/_/g, " ")}
                  </span>
                </div>
              </div>

              {/* Grid: Instructions (Left) and Draft Versions (Right) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column: Instructions history */}
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                      <FileText size={12} /> Instructions Sent
                    </span>
                    <p className="text-xs text-zinc-650 bg-zinc-50 border border-zinc-150 p-4 rounded-xl whitespace-pre-line leading-relaxed max-h-40 overflow-y-auto">
                      {assignment.instructions || "No detailed instructions provided."}
                    </p>
                  </div>

                  {assignment.feedback && (
                    <div className="rounded-xl bg-amber-50 border border-amber-150 p-4 space-y-1.5 text-left">
                      <span className="text-[9px] font-extrabold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                        <AlertCircle size={12} /> Revision Feedback
                      </span>
                      <p className="text-xs font-semibold text-amber-900 leading-relaxed whitespace-pre-line">
                        {assignment.feedback}
                      </p>
                    </div>
                  )}
                </div>

                {/* Right Column: Draft Versions */}
                <div className="space-y-4">
                  <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                    <Clock size={12} /> Draft Submissions
                  </span>

                  {loadingVersions ? (
                    <div className="flex items-center justify-center py-10 text-xs text-zinc-400">
                      <Loader2 className="animate-spin mr-2" size={14} /> Loading drafts...
                    </div>
                  ) : versions.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-zinc-200 p-8 text-center">
                      <p className="text-xs text-zinc-400 italic">No drafts uploaded by editor yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {versions.map((v) => (
                        <div
                          key={v.id}
                          className="rounded-xl border border-zinc-250 p-3 bg-zinc-55/30 hover:bg-zinc-50/70 transition-colors flex flex-col gap-1.5"
                        >
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-zinc-800">Draft Version {v.version}</span>
                            <a
                              href={v.video_url || undefined}
                              target="_blank"
                              rel="noreferrer"
                              className="text-brand-green font-bold hover:underline flex items-center gap-0.5"
                            >
                              Open Link <ExternalLink size={10} />
                            </a>
                          </div>
                          {v.notes && (
                            <p className="text-[10px] font-semibold text-zinc-500 italic bg-white border border-zinc-100 p-2 rounded-lg leading-relaxed">
                              Editor notes: {v.notes}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Video Draft Preview Player */}
              {versions.length > 0 && (
                <div className="space-y-2.5">
                  <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block">
                    Latest Draft Player (Version {versions[versions.length - 1].version})
                  </span>
                  <div className="rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center shadow-inner border border-zinc-200 max-w-lg mx-auto w-full">
                    <video
                      key={versions[versions.length - 1].id}
                      src={versions[versions.length - 1].video_url || undefined}
                      controls
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons for Review */}
              {assignment.status === "under_review" && (
                <div className="border-t border-zinc-100 pt-5 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wide">
                      Revision Feedback
                    </label>
                    <textarea
                      placeholder="Specify exactly what changes the editor needs to make (e.g. cut pace, change font sizes, adjust audio volume levels)..."
                      value={revisionNotes}
                      onChange={(e) => setRevisionNotes(e.target.value)}
                      rows={3}
                      className="w-full resize-none rounded-xl border border-zinc-200 p-3 text-sm text-zinc-800 outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 transition-all"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleReviewAction("request_revision")}
                      disabled={submittingReview}
                      className="flex-1 py-3 border border-zinc-200 hover:bg-zinc-50 rounded-xl text-xs font-bold text-zinc-700 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <MessageSquare size={14} />
                      Request Revision
                    </button>
                    <button
                      onClick={() => handleReviewAction("approve")}
                      disabled={submittingReview}
                      className="flex-1 py-3 bg-brand-green hover:bg-brand-green-hover text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-brand-green/10 active:scale-[0.98] transition-all"
                    >
                      <Check size={14} strokeWidth={3} />
                      Accept & Complete
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
