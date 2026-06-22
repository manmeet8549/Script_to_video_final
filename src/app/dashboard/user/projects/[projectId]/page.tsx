"use client";

import { useState, use, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getStoredProjectById, updateStoredProject, UserProject } from "../../../../utils/storage";
import {
  Play,
  Check,
  Lock,
  ArrowLeft,
  MoreVertical,
  Plus,
  Search,
  Bell,
  Settings,
  Loader2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

export default function ProjectTimelineHubPage({ params }: { params: Promise<{ projectId: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const projectId = resolvedParams.projectId;

  const [project, setProject] = useState<UserProject | null>(null);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);

  useEffect(() => {
    const proj = getStoredProjectById(projectId);
    if (proj) {
      setProject(proj);
    }
  }, [projectId]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isGeneratingVideo) {
      interval = setInterval(() => {
        setGenerationProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsGeneratingVideo(false);
            toast.success("AI video rendering complete! Ready to edit.");
            const updated = updateStoredProject(projectId, {
              stage: "Captions",
              progress: 80,
              lastUpdated: "Just now"
            });
            if (updated) setProject(updated);
            router.push(`/dashboard/user/projects/${projectId}/edit`);
            return 100;
          }
          return prev + 20;
        });
      }, 400);
    }
    return () => clearInterval(interval);
  }, [isGeneratingVideo, projectId, router]);

  const handleGenerateVideo = () => {
    setIsGeneratingVideo(true);
    setGenerationProgress(0);
  };

  const scriptDone = project ? project.progress >= 20 : false;
  const avatarDone = project ? project.progress >= 40 : false;
  const voiceDone = project ? project.progress >= 60 : false;
  const renderDone = project ? project.progress >= 80 : false;
  const captionsDone = project ? project.progress >= 90 : false;
  const exportDone = project ? project.progress === 100 : false;

  let activeWidth = "0%";
  if (exportDone) activeWidth = "100%";
  else if (captionsDone) activeWidth = "80%";
  else if (renderDone) activeWidth = "60%";
  else if (voiceDone) activeWidth = "40%";
  else if (avatarDone) activeWidth = "20%";

  return (
    <main className="flex-1 overflow-y-auto px-10 py-8 relative">
        {/* Loading overlay */}
        {isGeneratingVideo && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-xs z-50 flex flex-col items-center justify-center space-y-4">
            <Loader2 size={40} className="animate-spin text-brand-green" />
            <h3 className="text-sm font-bold text-zinc-800">
              Generating Video... {generationProgress}%
            </h3>
            <div className="w-48 h-1.5 bg-zinc-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-green transition-all duration-300"
                style={{ width: `${generationProgress}%` }}
              />
            </div>
          </div>
        )}

        <div className="max-w-5xl mx-auto space-y-6">
          {/* Back link */}
          <Link
            href="/dashboard/user/projects"
            className="inline-flex items-center text-sm font-semibold text-zinc-400 hover:text-zinc-800 transition-colors"
          >
            <ArrowLeft size={16} className="mr-1.5" />
            Back to My Projects
          </Link>

          {/* Project Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">
                {project?.name || "Loading Project..."}
              </h1>
              <div className="flex items-center gap-3 text-xs font-semibold text-zinc-400">
                <span>Created {project?.created || "Jun 20, 2026"}</span>
                <span>•</span>
                <span>Last updated {project?.lastUpdated || "2 hours ago"}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => toast.info("Editing project metadata...")}
                className="h-9 px-4 border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Edit Details
              </button>
              <button className="p-2 border border-zinc-200 hover:bg-zinc-50 text-zinc-500 rounded-lg transition-colors cursor-pointer">
                <MoreVertical size={16} />
              </button>
            </div>
          </div>

          {/* Badge Row */}
          <div className="flex flex-wrap gap-2 select-none">
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-brand-green-light text-brand-green border border-brand-green-light text-[10px] font-extrabold uppercase tracking-wider">
              {project?.status || "In Progress"}
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-red-50 text-red-700 border border-red-100 text-[10px] font-extrabold uppercase tracking-wider">
              {project?.priority || "High"} Priority
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100 text-[10px] font-extrabold uppercase tracking-wider">
              {project?.dueDate || "Due soon"}
            </span>
          </div>

          {/* Workflow & Info Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Workflow and current stage */}
            <div className="lg:col-span-8 space-y-6">
              {/* Project Workflow Card */}
              <div className="bg-white rounded-2xl border border-zinc-200/80 p-6 shadow-sm space-y-6">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wide">
                  Project Workflow
                </h3>

                 {/* Horizontal nodes */}
                <div className="relative flex justify-between items-center w-full px-4">
                  {/* Gray background line */}
                  <div className="absolute top-[24px] left-[40px] right-[40px] h-[3px] bg-zinc-100 -z-10" />
                  
                  {/* Green active line */}
                  <div className="absolute top-[24px] left-[40px] h-[3px] bg-brand-green -z-10 transition-all duration-500" style={{ width: activeWidth }} />

                  {/* 1. Script */}
                  <div className="flex flex-col items-center gap-2 select-none cursor-pointer" onClick={() => router.push(`/dashboard/user/projects/${projectId}/script`)}>
                    {scriptDone ? (
                      <div className="w-12 h-12 rounded-full bg-brand-green border border-brand-green-hover text-white flex items-center justify-center shadow-sm">
                        <Check size={18} strokeWidth={3} />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-brand-green border border-brand-green-hover text-white flex items-center justify-center shadow-md shadow-brand-green/20 relative">
                        <div className="absolute inset-[-4px] rounded-full border border-brand-green/30 animate-ping pointer-events-none" />
                        <Play size={16} fill="currentColor" className="translate-x-[0.5px]" />
                      </div>
                    )}
                    <span className="text-[11px] font-extrabold text-zinc-800">Script</span>
                    <span className={`text-[9px] font-extrabold uppercase ${scriptDone ? "text-brand-green" : "text-zinc-550"}`}>
                      {scriptDone ? "Done" : "Active"}
                    </span>
                  </div>

                  {/* 2. Avatar */}
                  <div className="flex flex-col items-center gap-2 select-none cursor-pointer" onClick={() => scriptDone && router.push(`/dashboard/user/projects/${projectId}/video`)}>
                    {avatarDone ? (
                      <div className="w-12 h-12 rounded-full bg-brand-green border border-brand-green-hover text-white flex items-center justify-center shadow-sm">
                        <Check size={18} strokeWidth={3} />
                      </div>
                    ) : scriptDone ? (
                      <div className="w-12 h-12 rounded-full bg-brand-green border border-brand-green-hover text-white flex items-center justify-center shadow-md shadow-brand-green/20 relative">
                        <div className="absolute inset-[-4px] rounded-full border border-brand-green/30 animate-ping pointer-events-none" />
                        <Play size={16} fill="currentColor" className="translate-x-[0.5px]" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-zinc-200 border border-zinc-300 text-zinc-500 flex items-center justify-center">
                        <Lock size={16} />
                      </div>
                    )}
                    <span className="text-[11px] font-extrabold text-zinc-800">Avatar</span>
                    <span className={`text-[9px] font-extrabold uppercase ${avatarDone ? "text-brand-green" : scriptDone ? "text-zinc-550" : "text-zinc-400"}`}>
                      {avatarDone ? "Done" : scriptDone ? "Active" : "Locked"}
                    </span>
                  </div>

                  {/* 3. Audio */}
                  <div className="flex flex-col items-center gap-2 select-none cursor-pointer" onClick={() => avatarDone && router.push(`/dashboard/user/projects/${projectId}/voice`)}>
                    {voiceDone ? (
                      <div className="w-12 h-12 rounded-full bg-brand-green border border-brand-green-hover text-white flex items-center justify-center shadow-sm">
                        <Check size={18} strokeWidth={3} />
                      </div>
                    ) : avatarDone ? (
                      <div className="w-12 h-12 rounded-full bg-brand-green border border-brand-green-hover text-white flex items-center justify-center shadow-md shadow-brand-green/20 relative">
                        <div className="absolute inset-[-4px] rounded-full border border-brand-green/30 animate-ping pointer-events-none" />
                        <Play size={16} fill="currentColor" className="translate-x-[0.5px]" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-zinc-200 border border-zinc-300 text-zinc-500 flex items-center justify-center">
                        <Lock size={16} />
                      </div>
                    )}
                    <span className="text-[11px] font-extrabold text-zinc-800">Audio</span>
                    <span className={`text-[9px] font-extrabold uppercase ${voiceDone ? "text-brand-green" : avatarDone ? "text-zinc-550" : "text-zinc-400"}`}>
                      {voiceDone ? "Done" : avatarDone ? "Active" : "Locked"}
                    </span>
                  </div>

                  {/* 4. Generation */}
                  <div className="flex flex-col items-center gap-2 select-none cursor-pointer" onClick={() => voiceDone && handleGenerateVideo()}>
                    {renderDone ? (
                      <div className="w-12 h-12 rounded-full bg-brand-green border border-brand-green-hover text-white flex items-center justify-center shadow-sm">
                        <Check size={18} strokeWidth={3} />
                      </div>
                    ) : voiceDone ? (
                      <div className="w-12 h-12 rounded-full bg-brand-green border border-brand-green-hover text-white flex items-center justify-center shadow-md shadow-brand-green/20 relative">
                        <div className="absolute inset-[-4px] rounded-full border border-brand-green/30 animate-ping pointer-events-none" />
                        <Play size={16} fill="currentColor" className="translate-x-[0.5px]" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-zinc-200 border border-zinc-300 text-zinc-500 flex items-center justify-center">
                        <Lock size={16} />
                      </div>
                    )}
                    <span className="text-[11px] font-extrabold text-zinc-800">Generation</span>
                    <span className={`text-[9px] font-extrabold uppercase ${renderDone ? "text-brand-green" : voiceDone ? "text-zinc-550" : "text-zinc-400"}`}>
                      {renderDone ? "Done" : voiceDone ? "Active" : "Locked"}
                    </span>
                  </div>

                  {/* 5. Captions */}
                  <div className="flex flex-col items-center gap-2 select-none cursor-pointer" onClick={() => renderDone && router.push(`/dashboard/user/projects/${projectId}/edit`)}>
                    {captionsDone ? (
                      <div className="w-12 h-12 rounded-full bg-brand-green border border-brand-green-hover text-white flex items-center justify-center shadow-sm">
                        <Check size={18} strokeWidth={3} />
                      </div>
                    ) : renderDone ? (
                      <div className="w-12 h-12 rounded-full bg-brand-green border border-brand-green-hover text-white flex items-center justify-center shadow-md shadow-brand-green/20 relative">
                        <div className="absolute inset-[-4px] rounded-full border border-brand-green/30 animate-ping pointer-events-none" />
                        <Play size={16} fill="currentColor" className="translate-x-[0.5px]" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-zinc-200 border border-zinc-300 text-zinc-500 flex items-center justify-center">
                        <Lock size={16} />
                      </div>
                    )}
                    <span className="text-[11px] font-bold text-zinc-500">Captions</span>
                    <span className={`text-[9px] font-bold uppercase ${captionsDone ? "text-brand-green" : renderDone ? "text-zinc-550" : "text-zinc-400"}`}>
                      {captionsDone ? "Done" : renderDone ? "Active" : "Locked"}
                    </span>
                  </div>

                  {/* 6. Export */}
                  <div className="flex flex-col items-center gap-2 select-none cursor-pointer" onClick={() => captionsDone && router.push(`/dashboard/user/projects/${projectId}/publish`)}>
                    {exportDone ? (
                      <div className="w-12 h-12 rounded-full bg-brand-green border border-brand-green-hover text-white flex items-center justify-center shadow-sm">
                        <Check size={18} strokeWidth={3} />
                      </div>
                    ) : captionsDone ? (
                      <div className="w-12 h-12 rounded-full bg-brand-green border border-brand-green-hover text-white flex items-center justify-center shadow-md shadow-brand-green/20 relative">
                        <div className="absolute inset-[-4px] rounded-full border border-brand-green/30 animate-ping pointer-events-none" />
                        <Play size={16} fill="currentColor" className="translate-x-[0.5px]" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-zinc-200 border border-zinc-300 text-zinc-500 flex items-center justify-center">
                        <Lock size={16} />
                      </div>
                    )}
                    <span className="text-[11px] font-bold text-zinc-500">Export</span>
                    <span className={`text-[9px] font-bold uppercase ${exportDone ? "text-brand-green" : captionsDone ? "text-zinc-550" : "text-zinc-400"}`}>
                      {exportDone ? "Done" : captionsDone ? "Active" : "Locked"}
                    </span>
                  </div>
                </div>
              </div>              {/* Active Stage Card */}
              <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-sm overflow-hidden flex flex-col justify-between min-h-[300px]">
                <div className="h-1.5 bg-brand-green w-full" />
                <div className="p-6 space-y-6 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-extrabold text-brand-green uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles size={12} />
                      Current Stage: {project?.stage || "AI Script Gen"}
                    </h4>
                    <p className="text-zinc-650 text-sm font-semibold leading-relaxed">
                      {project?.stage === "Idea Selection" || project?.stage === "AI Script Gen"
                        ? "Start your creative workflow by defining your video topic and generating your script outline."
                        : project?.stage === "Avatar" || project?.stage === "Video Generation"
                        ? "Generate the final video preview with your selected avatar and background theme."
                        : project?.stage === "Voiceover"
                        ? "Choose the perfect AI voice model, preview, and approve the audio track."
                        : project?.stage === "Captions" || project?.stage === "Video Editing"
                        ? " Polish your video with automatic captions, style presets, or request human editor assistance."
                        : "Your video has been successfully published across connected platform channels!"}
                    </p>
                  </div>

                  {/* Audio wave preview card */}
                  <div className="bg-zinc-50 rounded-xl border border-zinc-150 p-4 flex flex-col items-center justify-center h-20 shadow-inner">
                    <div className="flex items-end justify-between w-64 h-10 select-none">
                      {[15, 30, 45, 60, 50, 80, 40, 65, 30, 70, 45, 90, 50, 75, 35, 60, 40, 50].map((h, i) => (
                        <div key={i} className="w-[3px] bg-brand-green/30 rounded-full" style={{ height: `${h}%` }} />
                      ))}
                    </div>
                  </div>

                  {/* Action button */}
                  <div className="flex justify-end pt-2">
                    {renderDone ? (
                      <button
                        onClick={() => router.push(`/dashboard/user/projects/${projectId}/edit`)}
                        className="h-11 px-8 bg-brand-green hover:bg-brand-green-hover text-white rounded-xl text-sm font-bold flex items-center justify-center shadow-md shadow-brand-green/10 hover:shadow-lg transition-all active:scale-[0.99] cursor-pointer"
                      >
                        Polish & Edit Video
                        <Sparkles size={14} className="ml-2" />
                      </button>
                    ) : voiceDone ? (
                      <button
                        onClick={handleGenerateVideo}
                        className="h-11 px-8 bg-brand-green hover:bg-brand-green-hover text-white rounded-xl text-sm font-bold flex items-center justify-center shadow-md shadow-brand-green/10 hover:shadow-lg transition-all active:scale-[0.99] cursor-pointer"
                      >
                        Generate Video Preview
                        <Play size={14} fill="currentColor" className="ml-2 translate-x-[0.5px]" />
                      </button>
                    ) : avatarDone ? (
                      <button
                        onClick={() => router.push(`/dashboard/user/projects/${projectId}/voice`)}
                        className="h-11 px-8 bg-brand-green hover:bg-brand-green-hover text-white rounded-xl text-sm font-bold flex items-center justify-center shadow-md shadow-brand-green/10 hover:shadow-lg transition-all active:scale-[0.99] cursor-pointer"
                      >
                        Choose Voiceover Model
                        <Sparkles size={14} className="ml-2" />
                      </button>
                    ) : scriptDone ? (
                      <button
                        onClick={() => router.push(`/dashboard/user/projects/${projectId}/video`)}
                        className="h-11 px-8 bg-brand-green hover:bg-brand-green-hover text-white rounded-xl text-sm font-bold flex items-center justify-center shadow-md shadow-brand-green/10 hover:shadow-lg transition-all active:scale-[0.99] cursor-pointer"
                      >
                        Configure Video Avatar
                        <Sparkles size={14} className="ml-2" />
                      </button>
                    ) : (
                      <button
                        onClick={() => router.push(`/dashboard/user/projects/${projectId}/script`)}
                        className="h-11 px-8 bg-brand-green hover:bg-brand-green-hover text-white rounded-xl text-sm font-bold flex items-center justify-center shadow-md shadow-brand-green/10 hover:shadow-lg transition-all active:scale-[0.99] cursor-pointer"
                      >
                        Start Script Generation
                        <Sparkles size={14} className="ml-2" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Project Info Sidebar */}
            <div className="lg:col-span-4 bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-sm space-y-6 select-none text-left">
              <h3 className="text-sm font-extrabold text-zinc-900 border-b border-zinc-100 pb-3 tracking-tight">
                Project Info
              </h3>

              <div className="space-y-5">
                {/* Progress bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-zinc-400">Overall Progress</span>
                    <span className="text-zinc-800">{project?.progress || 0}%</span>
                  </div>
                  <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-green rounded-full" style={{ width: `${project?.progress || 0}%` }} />
                  </div>
                </div>

                {/* Table details */}
                <div className="space-y-4 pt-1">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-zinc-400">Priority</span>
                    <span className={`font-extrabold ${project?.priority === "High" ? "text-red-700" : project?.priority === "Medium" ? "text-amber-700" : "text-zinc-550"}`}>
                      {project?.priority || "High"}
                    </span>
                  </div>
                  <hr className="border-zinc-100" />
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-zinc-400">Deadline</span>
                    <span className="text-zinc-800 font-bold">{project?.dueDate || "Due soon"}</span>
                  </div>
                  <hr className="border-zinc-100" />
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-zinc-400">Word Count</span>
                    <span className="text-zinc-800 font-bold">{project?.wordCount || 0} words</span>
                  </div>
                  <hr className="border-zinc-100" />
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-zinc-400">Est. Duration</span>
                    <span className="text-zinc-800 font-bold">{project?.estDuration || "0:00"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
  );
}
