"use client";

import { useState, use, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Play,
  Pause,
  ArrowLeft,
  ChevronDown,
  RotateCcw,
  Check,
  X,
  UploadCloud,
  Loader2,
  Info,
  Maximize2,
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { getStoredProjectById, updateStoredProject, UserProject } from "../../../../../utils/storage";

export default function VideoGenPage({ params }: { params: Promise<{ projectId: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const projectId = resolvedParams.projectId;

  const [project, setProject] = useState<UserProject | null>(null);

  // Configuration states
  const [selectedAvatar, setSelectedAvatar] = useState("Marcus");
  const [selectedBg, setSelectedBg] = useState("Studio");
  const [resolution, setResolution] = useState("1080p");
  const [voicePlaying, setVoicePlaying] = useState(false);

  // Preview Generation states
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPreviewGenerated, setIsPreviewGenerated] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);

  useEffect(() => {
    const proj = getStoredProjectById(projectId);
    if (proj) {
      setProject(proj);
      if (proj.selectedAvatar) setSelectedAvatar(proj.selectedAvatar);
      if (proj.selectedBg) setSelectedBg(proj.selectedBg);
      if (proj.resolution) setResolution(proj.resolution);
    }
  }, [projectId]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isGenerating) {
      interval = setInterval(() => {
        setGenerationProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsGenerating(false);
            setIsPreviewGenerated(true);
            toast.success("Video preview generated!");
            return 100;
          }
          return prev + 10;
        });
      }, 300);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  const handleGeneratePreview = () => {
    setIsGenerating(true);
    setGenerationProgress(0);
    setIsPreviewGenerated(false);
  };

  const handleApprove = () => {
    const currentProj = getStoredProjectById(projectId);
    const updatedProgress = Math.max(currentProj?.progress || 0, 60);

    updateStoredProject(projectId, {
      selectedAvatar,
      selectedBg,
      resolution,
      stage: "Voiceover",
      progress: updatedProgress,
      lastUpdated: "Just now"
    });

    toast.success("Avatar and background configurations saved!");
    router.push(`/dashboard/user/projects/${projectId}/voice`);
  };

  return (
    <main className="flex-1 bg-zinc-50/30 overflow-y-auto px-12 py-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Back link & progress indicator */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href={`/dashboard/user/projects/${projectId}/script`}
              className="inline-flex items-center text-sm font-semibold text-zinc-400 hover:text-zinc-800 transition-colors"
            >
              <ArrowLeft size={16} className="mr-1.5" />
              Back to Script
            </Link>
            <span className="text-zinc-300">|</span>
            <button
              onClick={() => {
                toast.info("Project cancelled");
                router.push("/dashboard/user/projects");
              }}
              className="flex items-center gap-1.5 text-zinc-400 hover:text-red-600 text-xs font-bold transition-colors cursor-pointer"
            >
              <X size={14} />
              Cancel Project
            </button>
          </div>
            {/* Steps indicator */}
            <div className="flex items-center gap-1.5 select-none">
              {[1, 2, 3, 4, 5, 6].map((step) => (
                <div
                  key={step}
                  className={`w-5 h-1.5 rounded-full transition-colors ${
                    step === 4
                      ? "bg-brand-green"
                      : step < 4
                      ? "bg-zinc-200"
                      : "bg-zinc-150"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Heading */}
          <div className="space-y-2">
            <span className="inline-block text-[10px] font-extrabold uppercase tracking-wider text-brand-green bg-brand-green-light border border-brand-green-light px-3 py-1 rounded-full">
              Step 4 of 6: Video Generation
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">
              Step 4 of 6: Video Generation
            </h1>
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: Settings Panel */}
            <div className="lg:col-span-5 bg-white border border-zinc-200/80 rounded-2xl p-6 space-y-5 shadow-sm">
              {/* Voiceover Confirmed banner */}
              <div className="flex items-center justify-between bg-brand-green/5 border border-brand-green/10 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setVoicePlaying(!voicePlaying)}
                    className="w-9 h-9 rounded-full bg-brand-green text-white flex items-center justify-center cursor-pointer hover:bg-brand-green-hover transition-colors"
                  >
                    {voicePlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" className="translate-x-[0.5px]" />}
                  </button>
                  <div className="text-left leading-normal">
                    <span className="text-[11px] font-extrabold text-zinc-800 block">Voiceover confirmed</span>
                    <span className="text-[9px] font-semibold text-zinc-400 block">2:34 duration</span>
                  </div>
                </div>
                <span className="text-[10px] font-extrabold text-zinc-400">0:45</span>
              </div>

              {/* Video Provider */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wide block">
                  Video Provider
                </label>
                <div className="relative">
                  <select className="w-full pl-4 pr-10 h-11 border border-zinc-200 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 rounded-xl text-sm font-semibold text-zinc-900 outline-none appearance-none bg-white transition-all cursor-pointer">
                    <option>ElevenLabs (High Quality Avatar)</option>
                    <option>HeyGen Pro</option>
                    <option>D-ID Studio</option>
                  </select>
                  <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-zinc-400">
                    <ChevronDown size={18} />
                  </span>
                </div>
              </div>

              {/* Select Avatar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wide">
                    Select Avatar
                  </label>
                  <span className="text-[10px] font-extrabold text-brand-green hover:underline cursor-pointer select-none">
                    View Library
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {/* Marcus */}
                  <div
                    onClick={() => setSelectedAvatar("Marcus")}
                    className={`border rounded-2xl p-3 flex flex-col items-center justify-center text-center cursor-pointer transition-all relative ${
                      selectedAvatar === "Marcus"
                        ? "border-brand-green bg-brand-green-light/20 shadow-sm"
                        : "border-zinc-200 hover:bg-zinc-55"
                    }`}
                  >
                    <div className="w-14 h-14 rounded-full bg-zinc-200 border border-zinc-300 flex items-center justify-center font-bold text-zinc-600 text-sm overflow-hidden select-none mb-2">
                      M
                    </div>
                    <span className="text-[11px] font-bold text-zinc-800">Marcus</span>
                    {selectedAvatar === "Marcus" && (
                      <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-brand-green flex items-center justify-center text-white">
                        <Check size={10} strokeWidth={3} />
                      </div>
                    )}
                  </div>

                  {/* Sarah */}
                  <div
                    onClick={() => setSelectedAvatar("Sarah")}
                    className={`border rounded-2xl p-3 flex flex-col items-center justify-center text-center cursor-pointer transition-all relative ${
                      selectedAvatar === "Sarah"
                        ? "border-brand-green bg-brand-green-light/20 shadow-sm"
                        : "border-zinc-200 hover:bg-zinc-55"
                    }`}
                  >
                    <div className="w-14 h-14 rounded-full bg-zinc-200 border border-zinc-300 flex items-center justify-center font-bold text-zinc-600 text-sm overflow-hidden select-none mb-2">
                      S
                    </div>
                    <span className="text-[11px] font-bold text-zinc-800">Sarah</span>
                    {selectedAvatar === "Sarah" && (
                      <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-brand-green flex items-center justify-center text-white">
                        <Check size={10} strokeWidth={3} />
                      </div>
                    )}
                  </div>

                  {/* Custom */}
                  <div className="border border-zinc-200 hover:bg-zinc-50 border-dashed rounded-2xl p-3 flex flex-col items-center justify-center text-center cursor-pointer select-none">
                    <div className="w-14 h-14 rounded-full border border-zinc-250 flex items-center justify-center text-zinc-400 font-extrabold text-lg bg-zinc-50 mb-2">
                      +
                    </div>
                    <span className="text-[11px] font-bold text-zinc-400">Custom</span>
                  </div>
                </div>
              </div>

              {/* Background Selection */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wide block">
                  Background
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {["Office", "Studio", "Outdoor"].map((bg) => (
                    <div
                      key={bg}
                      onClick={() => setSelectedBg(bg)}
                      className={`h-11 rounded-xl border flex items-center justify-center text-[10px] font-bold cursor-pointer transition-all relative ${
                        selectedBg === bg
                          ? "border-brand-green bg-brand-green-light/20 text-brand-green font-extrabold"
                          : "border-zinc-200 text-zinc-500 hover:bg-zinc-50"
                      }`}
                    >
                      {bg}
                      {selectedBg === bg && (
                        <div className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-brand-green flex items-center justify-center text-white">
                          <Check size={8} strokeWidth={3} />
                        </div>
                      )}
                    </div>
                  ))}
                  {/* Custom Palette */}
                  <div className="h-11 border border-zinc-200 border-dashed rounded-xl flex items-center justify-center text-zinc-400 hover:bg-zinc-50 cursor-pointer">
                    🎨
                  </div>
                </div>
              </div>

              {/* Resolution selection */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wide block">
                  Resolution
                </label>
                <div className="grid grid-cols-3 gap-2 bg-zinc-100 p-1 rounded-xl">
                  {["720p", "1080p", "4K"].map((res) => (
                    <button
                      key={res}
                      type="button"
                      onClick={() => setResolution(res)}
                      className={`h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        resolution === res
                          ? "bg-brand-green text-white shadow-sm"
                          : "text-zinc-500 hover:text-zinc-950"
                      }`}
                    >
                      {res}
                    </button>
                  ))}
                </div>
              </div>

              {/* Additional Assets */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wide block">
                  Additional Assets (Optional)
                </label>
                <div className="border border-dashed border-zinc-200 rounded-xl p-4 flex flex-col items-center justify-center text-center space-y-1 bg-zinc-50/50 hover:bg-zinc-50 transition-colors cursor-pointer select-none">
                  <UploadCloud size={20} className="text-zinc-400" />
                  <span className="text-[11px] font-bold text-zinc-800">Drop images or logos here</span>
                  <span className="text-[9px] font-semibold text-zinc-400">PNG, JPG up to 10MB</span>
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGeneratePreview}
                disabled={isGenerating}
                className="w-full h-11 bg-brand-green hover:bg-brand-green-hover disabled:bg-brand-green/60 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.99] cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Generating Preview...
                  </>
                ) : (
                  "Generate Preview"
                )}
              </button>
            </div>

            {/* Right: Video Preview Panel */}
            <div className="lg:col-span-7 bg-white border border-zinc-200/80 rounded-2xl p-6 space-y-6 shadow-sm flex flex-col justify-between min-h-[460px]">
              <div>
                {/* Header Title */}
                <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                  <h2 className="text-lg font-bold text-zinc-900">Video Preview</h2>
                </div>

                {/* Video Container Box */}
                <div className="bg-zinc-950 rounded-xl aspect-video overflow-hidden relative shadow-inner flex flex-col justify-center items-center m-2">
                  {isGenerating ? (
                    <div className="text-center space-y-4 w-full px-12">
                      <Loader2 size={36} className="animate-spin text-brand-green mx-auto" />
                      <span className="text-sm font-bold text-zinc-400 block">
                        Generating preview... {generationProgress}%
                      </span>
                      <div className="h-1.5 w-full bg-zinc-850 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand-green transition-all duration-300"
                          style={{ width: `${generationProgress}%` }}
                        />
                      </div>
                    </div>
                  ) : isPreviewGenerated ? (
                    <>
                      <Image
                        src="/mountain-sunset.png"
                        alt="Hiker preview generated"
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <button className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center text-white border border-white/20">
                          <Play size={20} fill="currentColor" className="translate-x-[1px]" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
                      <div className="w-14 h-14 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-650 border border-zinc-850">
                        <Play size={22} className="text-zinc-600" />
                      </div>
                      <span className="text-sm font-bold text-zinc-400">
                        Video preview will appear here
                      </span>
                    </div>
                  )}
                </div>

                {/* Stats Bar */}
                <div className="flex items-center justify-between px-3 mt-4 text-xs font-bold text-zinc-500 select-none">
                  <span className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${isPreviewGenerated ? "bg-brand-green" : "bg-zinc-400"}`} />
                    {isGenerating ? "Generating..." : isPreviewGenerated ? "Preview Generated" : "Ready to generate"}
                  </span>
                  <span>Est. Time: ~3 mins</span>
                  <span>Duration: 2:34</span>
                </div>
              </div>

              {/* Actions & Alerts */}
              <div className="space-y-4">
                {/* Buttons row */}
                <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
                  <div className="flex gap-2">
                    <button
                      disabled={!isPreviewGenerated || isGenerating}
                      className="h-10 px-4 border border-zinc-200 disabled:opacity-30 disabled:pointer-events-none hover:bg-zinc-50 text-zinc-700 text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <RotateCcw size={14} />
                      Regenerate
                    </button>
                    <button
                      disabled={!isPreviewGenerated || isGenerating}
                      className="h-10 px-4 border border-zinc-200 disabled:opacity-30 disabled:pointer-events-none hover:bg-zinc-50 text-zinc-700 text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <UploadCloud size={14} className="rotate-180" />
                      Download
                    </button>
                  </div>
                  <button
                    onClick={handleApprove}
                    disabled={!isPreviewGenerated || isGenerating}
                    className="inline-flex items-center justify-center h-10 px-6 text-sm font-bold text-white bg-brand-green hover:bg-brand-green-hover disabled:bg-zinc-200 disabled:text-zinc-400 rounded-xl shadow-md disabled:shadow-none transition-all active:scale-[0.99] cursor-pointer"
                  >
                    Approve & Continue
                    <Check size={16} className="ml-1.5" />
                  </button>
                </div>

                {/* Credit alert box */}
                <div className="bg-zinc-50 border border-zinc-150 rounded-xl p-4 flex gap-3 text-zinc-500 text-xs leading-relaxed select-none">
                  <Info size={16} className="text-zinc-400 shrink-0 mt-0.5" />
                  <span>
                    Generating a video preview will consume <strong>3 credits</strong>. You can preview the
                    audio timeline and avatar positioning without generating the full video.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
  );
}
