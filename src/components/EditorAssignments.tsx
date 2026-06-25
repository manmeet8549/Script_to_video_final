"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Check, Upload, Inbox, Play, FileText, AlertCircle, Clock, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api/client";
import type { EditingTask } from "@/types/db";

export default function EditorAssignments({ statusFilter }: { statusFilter?: string }) {
  const [allAssignments, setAllAssignments] = useState<EditingTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  
  // Custom states for file upload
  const [activeTab, setActiveTab] = useState<Record<string, "upload" | "link">>({});
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File | null>>({});
  const [uploadingState, setUploadingState] = useState<Record<string, boolean>>({});

  const handleUploadFile = async (id: string, file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("assignmentId", id);

    const res = await fetch("/api/media/upload", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Upload failed (${res.status})`);
    }

    const payload = await res.json();
    return payload.data.url;
  };

  const load = useCallback(async () => {
    try {
      const res = await api.get<{ items: EditingTask[] }>(`/api/assignments?mine=1`);
      setAllAssignments(res.items || []);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to load assignments.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const items = allAssignments.filter((a) => {
    if (!statusFilter) return true;
    if (statusFilter === "pending") {
      return a.status === "pending";
    }
    if (statusFilter === "in_progress") {
      return a.status === "in_progress" || a.status === "revision_requested";
    }
    if (statusFilter === "under_review") {
      return a.status === "under_review";
    }
    if (statusFilter === "completed") {
      return a.status === "approved" || a.status === "completed";
    }
    return true;
  });

  const accept = async (id: string) => {
    setBusy(id);
    try {
      await api.patch(`/api/assignments/${id}`, { action: "accept" });
      toast.success("Assignment accepted! Move to In Progress.");
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to accept assignment.");
    } finally {
      setBusy(null);
    }
  };

  const submitVersion = async (id: string) => {
    const tab = activeTab[id] || "upload";
    const version_notes = notes[id]?.trim();
    let video_url = "";

    setBusy(id);
    try {
      if (tab === "upload") {
        const file = selectedFiles[id];
        if (!file) {
          toast.error("Please select a video file to upload first.");
          setBusy(null);
          return;
        }

        setUploadingState((prev) => ({ ...prev, [id]: true }));
        try {
          video_url = await handleUploadFile(id, file);
        } catch (uploadErr) {
          toast.error(uploadErr instanceof Error ? uploadErr.message : "Failed to upload video file.");
          setUploadingState((prev) => ({ ...prev, [id]: false }));
          setBusy(null);
          return;
        }
        setUploadingState((prev) => ({ ...prev, [id]: false }));
      } else {
        video_url = urls[id]?.trim() || "";
        if (!video_url) {
          toast.error("Please paste the edited video URL.");
          setBusy(null);
          return;
        }
      }

      await api.post(`/api/assignments/${id}/versions`, {
        video_url,
        notes: version_notes || undefined,
      });

      toast.success("Edited video version submitted for review!");
      setUrls((u) => ({ ...u, [id]: "" }));
      setNotes((n) => ({ ...n, [id]: "" }));
      setSelectedFiles((f) => ({ ...f, [id]: null }));
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to submit edited cut.");
    } finally {
      setBusy(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-zinc-400 gap-2">
        <Loader2 className="animate-spin text-brand-green" size={24} />
        <span className="text-xs font-semibold">Loading assignments...</span>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-16 text-center shadow-xs">
        <Inbox className="mx-auto mb-3 text-zinc-300 animate-pulse" size={40} />
        <h3 className="text-base font-bold text-zinc-800">No Assignments Found</h3>
        <p className="mt-1.5 text-sm font-semibold text-zinc-400 max-w-sm mx-auto">
          You don't have any editing tasks assigned to you in this workspace yet. When new tasks are assigned, they will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left">
      {items.map((a) => (
        <div
          key={a.id}
          className="rounded-2xl border border-zinc-200 bg-white shadow-xs overflow-hidden hover:shadow-md transition-all duration-300"
        >
          {/* Header Row */}
          <div className="px-6 py-4 bg-zinc-50 border-b border-zinc-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-green shadow-xs animate-ping" />
              <p className="text-sm font-bold text-zinc-800">
                Project Code: <span className="font-mono text-xs text-zinc-500 bg-zinc-200/60 px-1.5 py-0.5 rounded-md">{a.project_id.slice(0, 8)}</span>
              </p>
            </div>
            <span className={`text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border shadow-2xs ${
              a.status === "approved" || a.status === "completed"
                ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                : a.status === "under_review"
                  ? "bg-blue-50 text-blue-700 border-blue-100"
                  : a.status === "revision_requested"
                    ? "bg-amber-50 text-amber-700 border-amber-100"
                    : "bg-zinc-50 text-zinc-600 border-zinc-200"
            }`}>
              {a.status.replace(/_/g, " ")}
            </span>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Left Column: Info & Notes */}
            <div className="space-y-4">
              <div className="space-y-1">
                <span className="text-[9px] font-extrabold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText size={12} /> Creator Instructions
                </span>
                <p className="text-sm text-zinc-650 bg-zinc-50/50 border border-zinc-100 p-3.5 rounded-xl whitespace-pre-line leading-relaxed">
                  {a.instructions || "No custom instructions provided. Just optimize the video quality and pacing."}
                </p>
              </div>

              {a.feedback && (
                <div className="rounded-xl bg-amber-50 border border-amber-150 p-4 space-y-1.5">
                  <span className="text-[9px] font-extrabold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertCircle size={12} /> Revision Feedback
                  </span>
                  <p className="text-xs font-semibold text-amber-900 leading-relaxed">
                    {a.feedback}
                  </p>
                </div>
              )}

              {a.source_video_url && (
                <div className="pt-2">
                  <a
                    href={a.source_video_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-green hover:underline bg-brand-green/5 border border-brand-green/10 hover:bg-brand-green/10 px-3.5 py-2 rounded-xl transition-all"
                  >
                    <Play size={12} /> View Raw Source Video →
                  </a>
                </div>
              )}
            </div>

            {/* Right Column: Actions Form */}
            <div className="space-y-4 border-t border-zinc-100 pt-6 md:border-t-0 md:pt-0">
              <span className="text-[9px] font-extrabold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Clock size={12} /> Assignment Actions
              </span>

              {a.status === "pending" ? (
                <div className="space-y-3 bg-zinc-50 border border-zinc-150 p-5 rounded-2xl text-center">
                  <p className="text-xs font-semibold text-zinc-500">
                    A creator has assigned this video project to you. Accept the work to unlock file upload features.
                  </p>
                  <button
                    onClick={() => accept(a.id)}
                    disabled={busy === a.id}
                    className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-brand-green py-2.5 text-xs font-bold text-white hover:bg-brand-green-hover shadow-xs transition-all active:scale-[0.98] cursor-pointer"
                  >
                    {busy === a.id ? <Loader2 size={12} className="animate-spin" /> : null}
                    Accept & Start Editing
                  </button>
                </div>
              ) : a.status === "approved" || a.status === "completed" ? (
                <div className="flex flex-col items-center justify-center py-10 bg-emerald-50/40 border border-emerald-100 rounded-2xl text-center">
                  <CheckCircle size={32} className="text-emerald-500 mb-2" />
                  <p className="text-sm font-bold text-emerald-800">Job Approved & Completed</p>
                  <p className="text-[10px] font-semibold text-emerald-600 mt-0.5">
                    Your final edit was approved by the creator. Great job!
                  </p>
                </div>
              ) : (
                <div className="space-y-4 bg-zinc-50/40 border border-zinc-150 p-5 rounded-2xl">
                  {a.status === "under_review" && (
                    <div className="text-[10px] font-bold text-blue-600 bg-blue-50/50 border border-blue-100 p-3 rounded-xl mb-2 text-center select-none">
                      Your latest cut is currently under review by the creator. You can still upload a new version below if you made updates.
                    </div>
                  )}

                  {/* Tab Selector */}
                  <div className="flex border border-zinc-200 rounded-xl p-0.5 bg-zinc-55/30 select-none">
                    <button
                      type="button"
                      onClick={() => setActiveTab((t) => ({ ...t, [a.id]: "upload" }))}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold text-center cursor-pointer transition-all ${
                        (activeTab[a.id] || "upload") === "upload"
                          ? "bg-white text-zinc-800 shadow-3xs"
                          : "text-zinc-450 hover:text-zinc-700"
                      }`}
                    >
                      Upload File
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab((t) => ({ ...t, [a.id]: "link" }))}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold text-center cursor-pointer transition-all ${
                        activeTab[a.id] === "link"
                          ? "bg-white text-zinc-800 shadow-3xs"
                          : "text-zinc-450 hover:text-zinc-700"
                      }`}
                    >
                      Paste Video Link
                    </button>
                  </div>

                  <div className="space-y-3">
                    {(activeTab[a.id] || "upload") === "upload" ? (
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-extrabold text-zinc-400 uppercase tracking-wide">
                          Upload Video File
                        </label>
                        {selectedFiles[a.id] ? (
                          <div className="border border-zinc-200 rounded-xl p-3 bg-white flex items-center justify-between gap-3 shadow-3xs select-none">
                            <div className="min-w-0 flex items-center gap-2">
                              <Play size={14} className="text-brand-green shrink-0" />
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-zinc-800 truncate max-w-[180px]">
                                  {selectedFiles[a.id]?.name}
                                </p>
                                <p className="text-[9px] font-bold text-zinc-400">
                                  {((selectedFiles[a.id]?.size || 0) / (1024 * 1024)).toFixed(2)} MB
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setSelectedFiles((f) => ({ ...f, [a.id]: null }))}
                              className="text-[10px] font-bold text-red-500 hover:text-red-700 cursor-pointer"
                            >
                              Remove
                            </button>
                          </div>
                        ) : (
                          <label className="border-2 border-dashed border-zinc-200 rounded-xl py-6 px-4 flex flex-col items-center justify-center gap-1.5 bg-white cursor-pointer hover:border-brand-green/50 hover:bg-emerald-50/10 transition-colors text-center select-none">
                            <Upload size={20} className="text-zinc-355" />
                            <span className="text-xs font-bold text-zinc-700">Choose video file to upload</span>
                            <span className="text-[10px] font-semibold text-zinc-400">MP4, MOV, or WEBM</span>
                            <input
                              type="file"
                              accept="video/*"
                              className="hidden"
                              onChange={(e) => setSelectedFiles((f) => ({ ...f, [a.id]: e.target.files?.[0] ?? null }))}
                            />
                          </label>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <label className="text-[9px] font-extrabold text-zinc-400 uppercase tracking-wide">
                          Paste Edited Video URL
                        </label>
                        <input
                          value={urls[a.id] ?? ""}
                          onChange={(e) => setUrls((u) => ({ ...u, [a.id]: e.target.value }))}
                          placeholder="e.g. https://my-bucket.s3.com/edited.mp4"
                          className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20"
                        />
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="text-[9px] font-extrabold text-zinc-400 uppercase tracking-wide">
                        Version Notes (Optional)
                      </label>
                      <textarea
                        value={notes[a.id] ?? ""}
                        onChange={(e) => setNotes((n) => ({ ...n, [a.id]: e.target.value }))}
                        placeholder="e.g. Added background music, synced audio, and synced animated subtitles."
                        rows={2}
                        className="w-full resize-none rounded-xl border border-zinc-200 bg-white p-3 text-sm outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20"
                      />
                    </div>

                    <button
                      onClick={() => submitVersion(a.id)}
                      disabled={busy === a.id || uploadingState[a.id]}
                      className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-white py-2.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50 shadow-2xs transition-all active:scale-[0.98] disabled:opacity-60 cursor-pointer"
                    >
                      {busy === a.id || uploadingState[a.id] ? (
                        <>
                          <Loader2 size={12} className="animate-spin" />
                          {uploadingState[a.id] ? "Uploading Video..." : "Submitting..."}
                        </>
                      ) : (
                        <>
                          <Upload size={12} />
                          Submit Edited Cut
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
