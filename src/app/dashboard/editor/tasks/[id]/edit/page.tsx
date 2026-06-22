"use client";

import { useState, use, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Play,
  Check,
  ChevronDown,
  ChevronUp,
  X,
  Volume2,
  Mic,
  Music,
  Maximize2,
  Sparkles,
  Eye,
  Type,
  AudioLines,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { getStoredProjectById, updateStoredProject, UserProject } from "../../../../../utils/storage";

export default function EditorAIEditingPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const taskId = resolvedParams.id;

  const [project, setProject] = useState<UserProject | null>(null);
  const [loading, setLoading] = useState(true);

  // Visual states
  const [videoMode, setVideoMode] = useState<"AfterAI" | "Original">("AfterAI");
  const [selectedPreset, setSelectedPreset] = useState("Cinematic");
  const [isTextOverlayOpen, setIsTextOverlayOpen] = useState(false);
  const [isAudioTrackOpen, setIsAudioTrackOpen] = useState(true);

  // Toggles
  const [autoColor, setAutoColor] = useState(true);
  const [noiseReduction, setNoiseReduction] = useState(true);
  const [stabilization, setStabilization] = useState(false);

  // Sliders
  const [micVolume, setMicVolume] = useState(80);
  const [musicVolume, setMusicVolume] = useState(30);

  // Action states
  const [isSubmitting, setIsSubmitting] = useState(false);

  const presets = [
    { key: "Cinematic", label: "Cinematic", bg: "from-amber-600 to-emerald-800" },
    { key: "Vlog", label: "Vlog", bg: "from-zinc-100 to-zinc-350" },
    { key: "Corporate", label: "Corporate", bg: "from-slate-400 to-indigo-900" },
    { key: "Social", label: "Social", bg: "from-orange-400 via-pink-500 to-emerald-600" },
  ];

  useEffect(() => {
    const proj = getStoredProjectById(taskId);
    if (proj) {
      setProject(proj);
      if (proj.stylePreset) {
        setSelectedPreset(proj.stylePreset);
      }
    }
    setLoading(false);
  }, [taskId]);

  const handleApproveAndSend = () => {
    setIsSubmitting(true);
    toast.info("Saving changes and rendering final output...");

    setTimeout(() => {
      setIsSubmitting(false);
      updateStoredProject(taskId, {
        stage: "Captions",
        progress: 90,
        lastUpdated: "Just now"
      });
      toast.success("Project approved and sent to client!");
      router.push("/dashboard/editor"); // Redirect to editor dashboard
    }, 2000);
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* 1. Header Control Bar */}
      <header className="h-14 border-b border-zinc-200/50 bg-white px-6 flex items-center justify-between shrink-0 select-none z-50">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/editor"
            className="p-1.5 hover:bg-zinc-100 rounded-lg text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <div className="text-left leading-normal">
            <h1 className="text-xs font-extrabold text-zinc-900 block mt-[-2px]">
              {loading ? "Loading..." : `Editing: ${project?.name || "Untitled Project"}`}
            </h1>
            <span className="text-[10px] font-semibold text-zinc-400 block">
              From: {project?.creator || "Sarah Johnson"}
            </span>
          </div>
        </div>

        {/* Center Section: Auto-save */}
        <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-zinc-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Saved just now
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => toast.info("Opening full preview player...")}
            className="h-9 px-4 border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Play size={12} fill="currentColor" />
            Preview
          </button>
          <button
            onClick={handleApproveAndSend}
            disabled={isSubmitting}
            className="h-9 px-4 bg-brand-green hover:bg-brand-green-hover disabled:bg-brand-green/60 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-emerald-700/10 active:scale-[0.98] cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={12} className="animate-spin" />
                Sending...
              </>
            ) : (
              <>
                Approve & Send
                <Check size={12} strokeWidth={3} />
              </>
            )}
          </button>
        </div>
      </header>

      {/* 2. Main Workspace (Full-height split screen) */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-2 overflow-hidden h-[calc(100vh-3.5rem)]">
        {/* Left Side: Video Preview Panel */}
        <div className="bg-zinc-950 flex flex-col justify-between p-6 relative overflow-hidden select-none">
          {/* Top mode segmented control */}
          <div className="flex justify-center z-10">
            <div className="flex bg-black/60 backdrop-blur-xs p-1 rounded-xl border border-white/5">
              <button
                onClick={() => setVideoMode("AfterAI")}
                className={`h-8 px-4 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                  videoMode === "AfterAI" ? "bg-white/10 text-white font-extrabold" : "text-white/50 hover:text-white"
                }`}
              >
                After AI
              </button>
              <button
                onClick={() => setVideoMode("Original")}
                className={`h-8 px-4 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                  videoMode === "Original" ? "bg-white/10 text-white font-extrabold" : "text-white/50 hover:text-white"
                }`}
              >
                Original
              </button>
            </div>
          </div>

          {/* Video Preview Canvas */}
          <div className="flex-1 flex items-center justify-center relative my-4">
            <div
              className={`w-80 h-80 rounded-full bg-gradient-to-tr filter blur-[1px] transition-all duration-700 ${
                videoMode === "Original"
                  ? "from-zinc-800 to-zinc-700 brightness-50"
                  : selectedPreset === "Cinematic"
                  ? "from-amber-600 to-emerald-800 brightness-110 contrast-105"
                  : selectedPreset === "Vlog"
                  ? "from-zinc-200 to-zinc-350 contrast-95"
                  : selectedPreset === "Corporate"
                  ? "from-slate-400 to-indigo-900"
                  : "from-orange-400 via-pink-500 to-emerald-600 hue-rotate-15"
              }`}
            />
            {/* Overlay grid lines */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px]" />
          </div>

          {/* Playback Controls & Progress bar */}
          <div className="space-y-3 z-10 max-w-xl mx-auto w-full px-4">
            {/* Timeline progress */}
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold text-white/40">00:12</span>
              <div className="flex-1 h-1 bg-white/15 rounded-full overflow-hidden relative">
                <div className="absolute left-0 top-0 h-full w-[26%] bg-brand-green rounded-full" />
              </div>
              <span className="text-[10px] font-bold text-white/40">00:45</span>
            </div>

            {/* Icons bar */}
            <div className="flex items-center justify-between text-white/50 text-xs px-1">
              <div className="flex items-center gap-3">
                <button className="hover:text-white transition-colors cursor-pointer">
                  <Volume2 size={16} />
                </button>
                <span className="text-[10px] font-bold">CC</span>
              </div>
              <button className="hover:text-white transition-colors cursor-pointer">
                <Maximize2 size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: AI Controls Panel (Scrollable) */}
        <div className="border-l border-zinc-200/80 overflow-y-auto p-6 space-y-6">
          {/* Section 1: AI Enhancements */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wide flex items-center gap-1.5">
              <Sparkles size={14} className="text-brand-green" />
              AI Enhancements
            </h3>

            <div className="space-y-3">
              {/* Auto Color */}
              <div className="flex items-center justify-between p-3.5 border border-zinc-150 rounded-2xl shadow-2xs">
                <div className="text-left leading-normal">
                  <h4 className="text-xs font-bold text-zinc-800">Auto Color Correction</h4>
                  <p className="text-[10px] font-semibold text-zinc-400 mt-0.5">
                    Balances exposure and saturation
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAutoColor(!autoColor)}
                  className={`w-10 h-6 rounded-full p-1 transition-colors cursor-pointer ${
                    autoColor ? "bg-brand-green flex justify-end" : "bg-zinc-200 flex justify-start"
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-white shadow-sm" />
                </button>
              </div>

              {/* Noise Reduction */}
              <div className="flex items-center justify-between p-3.5 border border-zinc-150 rounded-2xl shadow-2xs">
                <div className="text-left leading-normal">
                  <h4 className="text-xs font-bold text-zinc-800">Noise Reduction</h4>
                  <p className="text-[10px] font-semibold text-zinc-400 mt-0.5">
                    Removes background static & hiss
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setNoiseReduction(!noiseReduction)}
                  className={`w-10 h-6 rounded-full p-1 transition-colors cursor-pointer ${
                    noiseReduction ? "bg-brand-green flex justify-end" : "bg-zinc-200 flex justify-start"
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-white shadow-sm" />
                </button>
              </div>

              {/* Stabilization */}
              <div className="flex items-center justify-between p-3.5 border border-zinc-150 rounded-2xl shadow-2xs">
                <div className="text-left leading-normal">
                  <h4 className="text-xs font-bold text-zinc-800">Stabilization</h4>
                  <p className="text-[10px] font-semibold text-zinc-400 mt-0.5">
                    Smooths shaky camera movement
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStabilization(!stabilization)}
                  className={`w-10 h-6 rounded-full p-1 transition-colors cursor-pointer ${
                    stabilization ? "bg-brand-green flex justify-end" : "bg-zinc-200 flex justify-start"
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-white shadow-sm" />
                </button>
              </div>
            </div>
          </div>

          {/* Section 2: Style Presets */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wide">
                Style Presets
              </h3>
              <button className="text-[10px] font-bold text-brand-green hover:underline cursor-pointer select-none">
                View All
              </button>
            </div>

            {/* Scrollable preset cards */}
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
              {presets.map((preset) => (
                <div
                  key={preset.key}
                  onClick={() => setSelectedPreset(preset.key)}
                  className={`min-w-[100px] border rounded-2xl p-2.5 flex flex-col gap-2 cursor-pointer transition-all shrink-0 ${
                    selectedPreset === preset.key
                      ? "border-brand-green bg-emerald-50/10 shadow-sm font-extrabold"
                      : "border-zinc-200 hover:bg-zinc-50"
                  }`}
                >
                  {/* Miniature canvas */}
                  <div className={`h-16 rounded-xl bg-gradient-to-tr ${preset.bg} relative overflow-hidden`}>
                    {selectedPreset === preset.key && (
                      <div className="absolute top-1.5 right-1.5 w-4.5 h-4.5 rounded-full bg-brand-green flex items-center justify-center text-white border border-white">
                        <Check size={8} strokeWidth={3} />
                      </div>
                    )}
                  </div>
                  <span className="text-[11px] text-zinc-800 text-center">{preset.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Accordions */}
          <div className="space-y-3.5 pt-2">
            {/* 1. Text Overlay */}
            <div className="border border-zinc-150 rounded-2xl overflow-hidden">
              <button
                onClick={() => setIsTextOverlayOpen(!isTextOverlayOpen)}
                className="w-full px-5 py-4 flex items-center justify-between text-zinc-800 bg-zinc-50/50 hover:bg-zinc-50/80 cursor-pointer transition-colors"
              >
                <span className="text-xs font-bold flex items-center gap-2">
                  <Type size={16} className="text-zinc-500" />
                  Text Overlay
                </span>
                {isTextOverlayOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {isTextOverlayOpen && (
                <div className="p-5 border-t border-zinc-150 bg-white space-y-4 animate-in slide-in-from-top-2">
                  <span className="text-xs text-zinc-400 font-semibold block">Overlay controls go here</span>
                </div>
              )}
            </div>

            {/* 2. Audio Track */}
            <div className="border border-zinc-150 rounded-2xl overflow-hidden">
              <button
                onClick={() => setIsAudioTrackOpen(!isAudioTrackOpen)}
                className="w-full px-5 py-4 flex items-center justify-between text-zinc-800 bg-zinc-50/50 hover:bg-zinc-50/80 cursor-pointer transition-colors"
              >
                <span className="text-xs font-bold flex items-center gap-2">
                  <AudioLines size={16} className="text-zinc-500" />
                  Audio Track
                </span>
                {isAudioTrackOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {isAudioTrackOpen && (
                <div className="p-5 border-t border-zinc-150 bg-white space-y-4 animate-in slide-in-from-top-2">
                  {/* Background Music Card */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide block">
                      Background Music
                    </span>
                    <div className="flex items-center justify-between bg-zinc-50 border border-zinc-150 rounded-xl p-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-zinc-200/50 flex items-center justify-center text-zinc-500 shrink-0">
                          <Music size={16} />
                        </div>
                        <div className="text-left">
                          <span className="text-xs font-bold text-zinc-800 block">Uplifting Acoustic.mp3</span>
                          <span className="text-[10px] font-semibold text-zinc-400 block mt-0.5">2:45 • AI Generated</span>
                        </div>
                      </div>
                      <button className="p-1.5 text-zinc-400 hover:text-zinc-600 rounded-md hover:bg-zinc-100 cursor-pointer">
                        <X size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Volume Mixer */}
                  <div className="space-y-4 pt-2">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide block">
                      Volume Mixer
                    </span>
                    <div className="space-y-3">
                      {/* Mic */}
                      <div className="flex items-center gap-4">
                        <Mic size={14} className="text-zinc-400 shrink-0" />
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={micVolume}
                          onChange={(e) => setMicVolume(Number(e.target.value))}
                          className="flex-1 h-1 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-brand-green"
                        />
                        <span className="text-xs font-bold text-zinc-500 w-8 text-right">{micVolume}%</span>
                      </div>
                      {/* Music */}
                      <div className="flex items-center gap-4">
                        <Music size={14} className="text-zinc-400 shrink-0" />
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={musicVolume}
                          onChange={(e) => setMusicVolume(Number(e.target.value))}
                          className="flex-1 h-1 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-brand-green"
                        />
                        <span className="text-xs font-bold text-zinc-500 w-8 text-right">{musicVolume}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
