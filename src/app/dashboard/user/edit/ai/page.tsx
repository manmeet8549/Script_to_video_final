"use client";

import { useCallback, useEffect, useState } from "react";
import { Sparkles, Loader2, Play, Download, RefreshCw, X } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api/client";
import SubmagicEditDrawer from "@/components/SubmagicEditDrawer";
import type { Project, EditingTask } from "@/types/db";

type ProjectWithEdit = Project & { editTask: EditingTask | null };

export default function EditWithAIPage() {
  const [projects, setProjects] = useState<ProjectWithEdit[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [pollingStates, setPollingStates] = useState<Record<string, boolean>>({});
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState<string>("");

  const handlePreviewVideo = (p: ProjectWithEdit) => {
    const url = p.editTask?.status === "completed" && p.editTask?.edited_video_url 
      ? p.editTask.edited_video_url 
      : p.video_url;
    if (url) {
      setPreviewVideoUrl(url);
      setPreviewTitle(p.title);
    } else {
      toast.error("No video available for preview");
    }
  };

  const loadProjects = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<Project[]>("/api/projects");
      // Only show projects that have a generated video (i.e. status is video_gen/editing/review/published and video_url is present)
      const eligible = data.filter(
        (p) => p.status !== "archived" && p.video_url
      );
      
      const projectsWithEdits = await Promise.all(
        eligible.map(async (p) => {
          try {
            const editTask = await api.get<EditingTask | null>(`/api/projects/${p.id}/edit`);
            return { ...p, editTask };
          } catch {
            return { ...p, editTask: null };
          }
        })
      );
      setProjects(projectsWithEdits);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to load projects.");
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshProjectAiStatus = async (projectId: string, taskId: string) => {
    setPollingStates((prev) => ({ ...prev, [projectId]: true }));
    try {
      const updatedTask = await api.get<EditingTask>(`/api/projects/${projectId}/edit?poll=1`);
      setProjects((prev) =>
        prev.map((p) => (p.id === projectId ? { ...p, editTask: updatedTask } : p))
      );
      if (updatedTask.status === "completed") {
        toast.success("AI Edit completed!");
      } else if (updatedTask.status === "rejected") {
        toast.error(`AI Edit failed: ${updatedTask.feedback || "Unknown error"}`);
      } else {
        toast.info("AI Edit is still processing.");
      }
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to refresh AI edit status.");
    } finally {
      setPollingStates((prev) => ({ ...prev, [projectId]: false }));
    }
  };

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // Auto-poll any in_progress edit tasks every 15 seconds so the user doesn't
  // have to manually click "Refresh Status" after Submagic finishes.
  useEffect(() => {
    const interval = setInterval(() => {
      setProjects((current) => {
        const inProgress = current.filter(
          (p) => p.editTask?.status === "in_progress" && p.editTask?.id
        );
        if (inProgress.length === 0) return current;
        inProgress.forEach((p) => {
          api
            .get<EditingTask>(`/api/projects/${p.id}/edit?poll=1`)
            .then((updatedTask) => {
              setProjects((prev) =>
                prev.map((pp) => (pp.id === p.id ? { ...pp, editTask: updatedTask } : pp))
              );
              if (updatedTask.status === "completed") {
                toast.success(`AI Edit completed for "${p.title}"!`);
              } else if (updatedTask.status === "rejected") {
                toast.error(`AI Edit failed: ${updatedTask.feedback || "Unknown error"}`);
              }
            })
            .catch(() => {});
        });
        return current;
      });
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleLaunchEdit = (id: string) => {
    setSelectedProjectId(id);
    setDrawerOpen(true);
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
        <div className="border-b border-zinc-200 pb-4 text-left">
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 flex items-center gap-2">
            <Sparkles className="text-brand-green" size={28} />
            AI Video Editing
          </h1>
          <p className="mt-1 text-sm font-semibold text-zinc-400">
            Apply automated captions, subtitles, and engaging visual effects to your rendered avatar videos.
          </p>
        </div>

        {projects.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-16 text-center shadow-xs">
            <Sparkles className="mx-auto mb-3 text-zinc-300 animate-pulse" size={40} />
            <h3 className="text-base font-bold text-zinc-800">No Rendered Videos Found</h3>
            <p className="mt-1.5 text-sm font-semibold text-zinc-400 max-w-md mx-auto">
              You must generate an avatar video first before applying AI post-production edits. Head to the Video Studio to start.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((p) => (
              <div
                key={p.id}
                className="group bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between"
              >
                {/* Card Top / Video Preview Placeholder */}
                <div 
                  onClick={() => handlePreviewVideo(p)}
                  className="relative aspect-video bg-zinc-900 flex items-center justify-center overflow-hidden border-b border-zinc-100 cursor-pointer group/thumb"
                >
                  {p.thumbnail_url ? (
                    <>
                      <img
                        src={p.thumbnail_url}
                        alt={p.title}
                        className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-500"
                      />
                      {/* Play Overlay */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-white/95 flex items-center justify-center shadow-lg transform scale-90 group-hover/thumb:scale-100 transition-all duration-300 text-brand-green">
                          <Play size={20} fill="currentColor" className="ml-0.5" />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-zinc-500 flex flex-col items-center gap-1.5 select-none">
                      <Play size={24} className="opacity-40" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Preview Ready</span>
                    </div>
                  )}
                  {/* Status Badge */}
                  <span className={`absolute top-3 left-3 rounded-full border px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider shadow-sm bg-white text-zinc-800 border-zinc-200`}>
                    {p.status}
                  </span>
                </div>

                {/* Card Middle / Project Info */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="text-left space-y-1">
                    <h3 className="text-base font-bold text-zinc-900 tracking-tight line-clamp-1">
                      {p.title}
                    </h3>
                    <p className="text-xs font-semibold text-zinc-400">
                      Progress: {p.progress_percent}%
                    </p>
                  </div>

                  {p.editTask ? (
                    <div className="space-y-2">
                      {p.editTask.status === "completed" && p.editTask.edited_video_url ? (
                        <div className="space-y-2">
                          <a
                            href={p.editTask.edited_video_url}
                            target="_blank"
                            rel="noreferrer"
                            className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-brand-green hover:bg-brand-green-hover text-white text-xs font-bold transition-all shadow-xs active:scale-[0.98]"
                          >
                            <Download size={14} />
                            Download AI Edit
                          </a>
                          <button
                            onClick={() => handleLaunchEdit(p.id)}
                            className="w-full py-2 rounded-xl border border-zinc-200 text-zinc-650 hover:bg-zinc-50 text-[11px] font-bold transition-all cursor-pointer"
                          >
                            Re-run AI Edit
                          </button>
                        </div>
                      ) : p.editTask.status === "in_progress" ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-zinc-100 text-zinc-500 text-xs font-semibold">
                            <Loader2 className="animate-spin text-brand-green" size={14} />
                            AI Edit processing...
                          </div>
                          <button
                            onClick={() => refreshProjectAiStatus(p.id, p.editTask!.id)}
                            disabled={pollingStates[p.id]}
                            className="w-full py-2 flex items-center justify-center gap-1.5 rounded-xl border border-zinc-200 text-zinc-655 hover:bg-zinc-50 text-[11px] font-bold transition-all disabled:opacity-50 cursor-pointer"
                          >
                            <RefreshCw size={12} className={pollingStates[p.id] ? "animate-spin" : ""} />
                            {pollingStates[p.id] ? "Checking..." : "Refresh Status"}
                          </button>
                        </div>
                      ) : p.editTask.status === "rejected" ? (
                        <div className="space-y-2">
                          <div className="text-[10px] font-bold text-red-500 bg-red-55/40 border border-red-100 rounded-xl p-2.5 text-center leading-snug">
                            Failed: {p.editTask.feedback || "Unknown error"}
                          </div>
                          <button
                            onClick={() => handleLaunchEdit(p.id)}
                            className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-brand-green hover:bg-brand-green-hover text-white text-xs font-bold transition-all shadow-xs active:scale-[0.98] cursor-pointer"
                          >
                            <Sparkles size={14} />
                            Retry AI Edit
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleLaunchEdit(p.id)}
                          className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-brand-green hover:bg-brand-green-hover text-white text-xs font-bold transition-all shadow-xs active:scale-[0.98] cursor-pointer"
                        >
                          <Sparkles size={14} />
                          Edit with AI
                        </button>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => handleLaunchEdit(p.id)}
                      className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-brand-green hover:bg-brand-green-hover text-white text-xs font-bold transition-all shadow-xs active:scale-[0.98] cursor-pointer"
                    >
                      <Sparkles size={14} />
                      Edit with AI
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedProjectId && (
        <SubmagicEditDrawer
          projectId={selectedProjectId}
          open={drawerOpen}
          onClose={() => {
            setDrawerOpen(false);
            setSelectedProjectId(null);
            loadProjects();
          }}
        />
      )}

      {/* Video Preview Modal */}
      {previewVideoUrl && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs"
          onClick={() => setPreviewVideoUrl(null)}
        >
          <div 
            className="bg-zinc-950 rounded-2xl max-w-2xl w-full shadow-2xl border border-zinc-800 flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-850 px-6 py-4">
              <h3 className="text-sm font-bold text-zinc-200 tracking-tight">
                Preview: {previewTitle}
              </h3>
              <button
                onClick={() => setPreviewVideoUrl(null)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            
            {/* Player */}
            <div className="relative aspect-video w-full bg-black flex items-center justify-center">
              <video
                src={previewVideoUrl}
                controls
                autoPlay
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
