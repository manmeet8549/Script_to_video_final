"use client";

import { useCallback, useEffect, useState } from "react";
import { UserCheck, Loader2, Play, UserPlus, FileText, Check, X, RefreshCw, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api/client";
import type { Project, WorkspaceMember, Profile, EditingTask, EditedVideo } from "@/types/db";

type MemberWithProfile = WorkspaceMember & { profile: Profile | null };

export default function SendToEditorPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [editors, setEditors] = useState<MemberWithProfile[]>([]);
  const [assignments, setAssignments] = useState<EditingTask[]>([]);
  const [loading, setLoading] = useState(true);

  // Assignment form state
  const [assigningProjectId, setAssigningProjectId] = useState<string | null>(null);
  const [selectedEditorId, setSelectedEditorId] = useState("");
  const [instructions, setInstructions] = useState("");
  const [submittingAssignment, setSubmittingAssignment] = useState(false);

  // Review state
  const [reviewingTaskId, setReviewingTaskId] = useState<string | null>(null);
  const [revisionNotes, setRevisionNotes] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [versions, setVersions] = useState<EditedVideo[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [projData, membersData, assignmentsData] = await Promise.all([
        api.get<Project[]>("/api/projects"),
        api.get<MemberWithProfile[]>("/api/members"),
        api.get<{ items: EditingTask[] }>("/api/assignments"),
      ]);

      // Only show projects that have a generated video (i.e. status is video_gen/editing/review/published and video_url is present)
      const eligibleProjects = projData.filter(
        (p) => p.status !== "archived" && p.video_url
      );
      setProjects(eligibleProjects);
      setEditors(membersData.filter((m) => m.role === "editor"));
      setAssignments(assignmentsData.items || []);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to load data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load versions for a specific assignment under review
  const loadVersions = async (taskId: string) => {
    setLoadingVersions(true);
    try {
      const res = await api.get<{ versions: EditedVideo[] }>(`/api/assignments/${taskId}/versions`);
      setVersions(res.versions || []);
    } catch {
      toast.error("Failed to load edited versions.");
    } finally {
      setLoadingVersions(false);
    }
  };

  const handleOpenReview = (task: EditingTask) => {
    setReviewingTaskId(task.id);
    setRevisionNotes("");
    loadVersions(task.id);
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningProjectId) return;
    if (!selectedEditorId) {
      toast.error("Please select an editor");
      return;
    }
    setSubmittingAssignment(true);
    try {
      const project = projects.find((p) => p.id === assigningProjectId);
      await api.post("/api/assignments", {
        project_id: assigningProjectId,
        editor_id: selectedEditorId,
        instructions: instructions || undefined,
        source_video_url: project?.video_url || undefined,
      });
      toast.success("Project assigned to editor successfully!");
      setAssigningProjectId(null);
      setSelectedEditorId("");
      setInstructions("");
      await loadData();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to assign editor.");
    } finally {
      setSubmittingAssignment(false);
    }
  };

  const handleReviewAction = async (action: "approve" | "request_revision") => {
    if (!reviewingTaskId) return;
    if (action === "request_revision" && !revisionNotes.trim()) {
      toast.error("Please enter revision notes for the editor.");
      return;
    }
    setSubmittingReview(true);
    try {
      await api.patch(`/api/assignments/${reviewingTaskId}`, {
        action,
        feedback: action === "request_revision" ? revisionNotes : undefined,
      });
      toast.success(action === "approve" ? "Edited video accepted and project completed!" : "Revision feedback sent to editor.");
      setReviewingTaskId(null);
      await loadData();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to update assignment.");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-brand-green" />
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto px-8 py-8 bg-zinc-50/50">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Page Header */}
        <div className="border-b border-zinc-200 pb-4 flex justify-between items-center text-left">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 flex items-center gap-2">
              <UserCheck className="text-brand-green" size={28} />
              Send to Professional Editor
            </h1>
            <p className="mt-1 text-sm font-semibold text-zinc-400">
              Delegate post-production to human video editors and review their drafts.
            </p>
          </div>
          <button
            onClick={loadData}
            className="flex items-center gap-1 px-3 py-1.5 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-600 hover:bg-zinc-50 transition-all cursor-pointer"
          >
            <RefreshCw size={12} /> Refresh
          </button>
        </div>

        {projects.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-16 text-center shadow-xs">
            <UserCheck className="mx-auto mb-3 text-zinc-300 animate-pulse" size={40} />
            <h3 className="text-base font-bold text-zinc-800">No Rendered Videos Found</h3>
            <p className="mt-1.5 text-sm font-semibold text-zinc-400 max-w-md mx-auto">
              You must generate an avatar video first before assigning it to a workspace editor.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((p) => {
              // Find latest assignment for this project
              const assignment = assignments.find((a) => a.project_id === p.id);
              const assignedEditor = assignment
                ? editors.find((e) => e.user_id === assignment.editor_id)
                : null;

              return (
                <div
                  key={p.id}
                  className="group bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between"
                >
                  {/* Video Thumbnail */}
                  <div className="relative aspect-video bg-zinc-900 flex items-center justify-center overflow-hidden border-b border-zinc-100">
                    {p.thumbnail_url ? (
                      <img
                        src={p.thumbnail_url}
                        alt={p.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="text-zinc-500 flex flex-col items-center gap-1.5 select-none">
                        <Play size={24} className="opacity-40" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Preview Ready</span>
                      </div>
                    )}
                    {/* Status Badge */}
                    <span className="absolute top-3 left-3 rounded-full bg-white px-2.5 py-0.5 text-[9px] font-extrabold uppercase border border-zinc-200 tracking-wider text-zinc-700 shadow-sm">
                      {p.status}
                    </span>
                  </div>

                  {/* Info Section */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="text-left space-y-1">
                      <h3 className="text-base font-bold text-zinc-900 tracking-tight line-clamp-1">
                        {p.title}
                      </h3>
                      {assignment && assignment.editor_id ? (
                        <div className="pt-1.5 space-y-1">
                          <p className="text-xs font-semibold text-zinc-500">
                            Assigned to: <span className="font-bold text-zinc-800">{assignedEditor?.profile?.full_name || assignedEditor?.profile?.email || "Workspace Editor"}</span>
                          </p>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-zinc-400">Status:</span>
                            <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                              assignment.status === "approved" || assignment.status === "completed"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                : assignment.status === "under_review"
                                  ? "bg-blue-50 text-blue-700 border-blue-100"
                                  : assignment.status === "revision_requested"
                                    ? "bg-amber-50 text-amber-700 border-amber-100"
                                    : "bg-zinc-50 text-zinc-650 border-zinc-150"
                            }`}>
                              {assignment.status.replace(/_/g, " ")}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs font-semibold text-zinc-400 italic pt-1">
                          Not assigned yet.
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    {assignment && assignment.editor_id ? (
                      assignment.status === "under_review" ? (
                        <button
                          onClick={() => handleOpenReview(assignment)}
                          className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs active:scale-[0.98] cursor-pointer"
                        >
                          <FileText size={14} />
                          Review Draft Cut
                        </button>
                      ) : (
                        <button
                          disabled
                          className="w-full py-2.5 rounded-xl bg-zinc-100 text-zinc-400 text-xs font-bold border border-zinc-200 cursor-not-allowed text-center"
                        >
                          {assignment.status === "approved" || assignment.status === "completed"
                            ? "Final Edit Approved"
                            : "Waiting for Editor"}
                        </button>
                      )
                    ) : (
                      <button
                        onClick={() => setAssigningProjectId(p.id)}
                        className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-brand-green hover:bg-brand-green-hover text-white text-xs font-bold transition-all shadow-xs active:scale-[0.98] cursor-pointer"
                      >
                        <UserPlus size={14} />
                        Assign Editor
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Assignment Modal */}
      {assigningProjectId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl w-full max-w-md p-6 relative animate-in zoom-in-95 duration-200 text-left">
            <button
              onClick={() => setAssigningProjectId(null)}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-600 rounded-lg cursor-pointer"
            >
              <X size={18} />
            </button>
            <h3 className="text-lg font-bold text-zinc-900 border-b border-zinc-100 pb-3 mb-4 flex items-center gap-1.5">
              <UserPlus size={18} className="text-brand-green" />
              Assign to Editor
            </h3>
            <form onSubmit={handleAssign} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wide">
                  Select Workspace Editor
                </label>
                {editors.length === 0 ? (
                  <p className="text-xs text-red-500 font-semibold">
                    No editors found in this workspace. Please invite an editor via the Member Settings first.
                  </p>
                ) : (
                  <select
                    required
                    value={selectedEditorId}
                    onChange={(e) => setSelectedEditorId(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 p-2.5 text-sm text-zinc-800 outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20"
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
                  Editing Instructions
                </label>
                <textarea
                  placeholder="e.g. Cut the silence in the middle, apply brand assets, and add background music."
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  rows={4}
                  className="w-full resize-none rounded-xl border border-zinc-200 p-3 text-sm text-zinc-800 outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setAssigningProjectId(null)}
                  className="flex-1 py-2.5 border border-zinc-200 hover:bg-zinc-50 rounded-xl text-xs font-bold text-zinc-700 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAssignment || editors.length === 0}
                  className="flex-1 py-2.5 bg-brand-green hover:bg-brand-green-hover disabled:opacity-60 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  {submittingAssignment ? <Loader2 size={12} className="animate-spin" /> : null}
                  Assign Work
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewingTaskId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl w-full max-w-2xl p-6 relative animate-in zoom-in-95 duration-200 text-left">
            <button
              onClick={() => setReviewingTaskId(null)}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-650 rounded-lg cursor-pointer"
            >
              <X size={18} />
            </button>
            <h3 className="text-lg font-bold text-zinc-900 border-b border-zinc-100 pb-3 mb-4 flex items-center gap-1.5">
              <FileText size={18} className="text-blue-600" />
              Review Video Draft
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {/* Left Column: Video and Versions */}
              <div className="space-y-4">
                <label className="block text-[10px] font-extrabold text-zinc-400 uppercase tracking-wide">
                  Draft Versions
                </label>
                {loadingVersions ? (
                  <div className="flex items-center justify-center py-10 text-xs text-zinc-400">
                    <Loader2 className="animate-spin mr-2" size={14} /> Loading versions...
                  </div>
                ) : versions.length === 0 ? (
                  <p className="text-xs text-zinc-400 italic">No files uploaded yet.</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {versions.map((v) => (
                      <div key={v.id} className="rounded-xl border border-zinc-200 p-3 bg-zinc-50 flex flex-col gap-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-zinc-800">Version {v.version}</span>
                          <a
                            href={v.video_url || undefined}
                            target="_blank"
                            rel="noreferrer"
                            className="text-brand-green font-bold hover:underline"
                          >
                            Open Player
                          </a>
                        </div>
                        {v.notes && <p className="text-[10px] text-zinc-500">Editor note: {v.notes}</p>}
                      </div>
                    ))}
                  </div>
                )}
                {versions.length > 0 && (
                  <div className="rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center">
                    <video src={versions[versions.length - 1]?.video_url || undefined} controls className="w-full h-full" />
                  </div>
                )}
              </div>

              {/* Right Column: Feedback and Decision */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wide">
                    Revision Notes
                  </label>
                  <textarea
                    placeholder="Provide detailed feedback if you require changes to this draft."
                    value={revisionNotes}
                    onChange={(e) => setRevisionNotes(e.target.value)}
                    rows={5}
                    className="w-full resize-none rounded-xl border border-zinc-200 p-3 text-sm text-zinc-800 outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20"
                  />
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleReviewAction("request_revision")}
                      disabled={submittingReview}
                      className="flex-1 py-2.5 border border-zinc-200 hover:bg-zinc-50 rounded-xl text-xs font-bold text-zinc-700 flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <MessageSquare size={14} />
                      Request Revision
                    </button>
                    <button
                      onClick={() => handleReviewAction("approve")}
                      disabled={submittingReview}
                      className="flex-1 py-2.5 bg-brand-green hover:bg-brand-green-hover text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Check size={14} />
                      Accept & Complete
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReviewingTaskId(null)}
                    className="py-2 text-zinc-400 hover:text-zinc-650 text-xs font-bold text-center mt-2"
                  >
                    Close Review
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
