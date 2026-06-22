"use client";

import { useState, use, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Play,
  Pause,
  Volume2,
  Download,
  ArrowLeft,
  ChevronDown,
  RotateCcw,
  Check,
  Bell,
  HelpCircle,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { getStoredProjectById, updateStoredProject, UserProject } from "../../../../../utils/storage";

export default function VoiceGenPage({ params }: { params: Promise<{ projectId: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const projectId = resolvedParams.projectId;

  const [project, setProject] = useState<UserProject | null>(null);

  // Selected Model state
  const [selectedModel, setSelectedModel] = useState("Marcus");
  const [speed, setSpeed] = useState("1.0x");
  const [pitch, setPitch] = useState("Normal");
  
  // Audio Player states
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [currentTime, setCurrentTime] = useState("0:00");
  const [playbackProgress, setPlaybackProgress] = useState(0);

  // Waveform animation height arrays
  const [waveHeights, setWaveHeights] = useState([
    10, 15, 30, 20, 25, 45, 60, 50, 40, 55, 35, 20, 30, 40, 30, 25, 45, 60,
    70, 65, 80, 50, 40, 60, 55, 40, 30, 45, 20, 35, 50, 45, 30, 20, 15, 10
  ]);

  useEffect(() => {
    const proj = getStoredProjectById(projectId);
    if (proj) {
      setProject(proj);
      if (proj.selectedVoiceModel) setSelectedModel(proj.selectedVoiceModel);
      if (proj.voiceSpeed) setSpeed(proj.voiceSpeed);
      if (proj.voicePitch) setPitch(proj.voicePitch);
    }
  }, [projectId]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        // Animate progression
        setPlaybackProgress((prev) => {
          if (prev >= 100) {
            setIsPlaying(false);
            setCurrentTime("0:00");
            return 0;
          }
          const nextVal = prev + 2;
          // Format time based on 2:34 total
          const totalSeconds = 154; // 2m 34s
          const currentSeconds = Math.floor((nextVal / 100) * totalSeconds);
          const mins = Math.floor(currentSeconds / 60);
          const secs = currentSeconds % 60;
          setCurrentTime(`${mins}:${secs < 10 ? "0" : ""}${secs}`);
          
          // Randomize heights slightly to simulate live waves
          setWaveHeights((prevHeights) =>
            prevHeights.map((h) => Math.min(Math.max(h + (Math.random() * 20 - 10), 10), 100))
          );

          return nextVal;
        });
      }, 300);
    } else {
      setPlaybackProgress(0);
      setCurrentTime("0:00");
    }

    return () => clearInterval(interval);
  }, [isPlaying]);

  const handleRegenerate = () => {
    setIsRegenerating(true);
    setIsPlaying(false);
    toast.info("Synthesizing updated voiceover track...");
    
    setTimeout(() => {
      setIsRegenerating(false);
      toast.success("Voiceover synthesized successfully!");
    }, 1500);
  };

  const handleApprove = () => {
    const currentProj = getStoredProjectById(projectId);
    const updatedProgress = Math.max(currentProj?.progress || 0, 70);

    updateStoredProject(projectId, {
      selectedVoiceModel: selectedModel,
      voiceSpeed: speed,
      voicePitch: pitch,
      stage: "Video Generation",
      progress: updatedProgress,
      lastUpdated: "Just now"
    });

    toast.success("Voiceover configuration saved!");
    router.push(`/dashboard/user/projects/${projectId}`);
  };

  return (
    <main className="flex-1 bg-zinc-50/30 overflow-y-auto px-12 py-8">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Back link */}
          <Link
            href={`/dashboard/user/projects/${projectId}/video`}
            className="inline-flex items-center text-sm font-semibold text-zinc-400 hover:text-zinc-800 transition-colors"
          >
            <ArrowLeft size={16} className="mr-1.5" />
            Back to Avatar Studio
          </Link>

          {/* Page Headers */}
          <div className="space-y-2">
            <span className="inline-block text-[10px] font-extrabold uppercase tracking-wider text-brand-green bg-brand-green-light border border-brand-green-light px-3 py-1 rounded-full">
              Step 3 of 6: Voice Generation
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">
              Choose your video's voice
            </h1>
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: Configuration Panel */}
            <div className="lg:col-span-5 bg-white border border-zinc-200/80 rounded-2xl p-6 space-y-6 shadow-sm">
              {/* Script Preview */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wide">
                    Script Preview
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-brand-green-light text-brand-green border border-brand-green-light text-[10px] font-bold">
                    {project?.wordCount || 30} words
                  </span>
                </div>
                <div className="bg-zinc-50 border border-zinc-150 rounded-xl p-4 text-xs font-semibold text-zinc-650 leading-relaxed max-h-24 overflow-y-auto text-left">
                  {project?.generatedScriptText || "Welcome to UChat Video's new onboarding series. Today, we'll walk you through setting up your first project. As you can see, the interface is designed to be intuitive and fast..."}
                </div>
              </div>

              {/* Voice Provider */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide block">
                  Voice Provider
                </label>
                <div className="relative">
                  <select className="w-full pl-4 pr-10 h-11 border border-zinc-200 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 rounded-xl text-sm font-semibold text-zinc-900 outline-none appearance-none bg-white transition-all cursor-pointer">
                    <option>ElevenLabs</option>
                    <option>Azure TTS</option>
                    <option>Google Cloud TTS</option>
                  </select>
                  <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-zinc-400">
                    <ChevronDown size={18} />
                  </span>
                </div>
              </div>

              {/* Voice Model */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide block">
                  Voice Model
                </label>
                <div className="space-y-2.5">
                  {/* Model 1: Marcus */}
                  <div
                    onClick={() => setSelectedModel("Marcus")}
                    className={`flex items-center justify-between p-3.5 border rounded-2xl cursor-pointer transition-all ${
                      selectedModel === "Marcus"
                        ? "border-brand-green bg-brand-green-light/20 shadow-sm"
                        : "border-zinc-200 hover:bg-zinc-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-brand-green-light border border-brand-green/10 flex items-center justify-center font-bold text-brand-green text-sm select-none">
                        M
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-zinc-900">Marcus</h4>
                        <p className="text-[10px] font-semibold text-zinc-400 mt-0.5">
                          Professional Male (US)
                        </p>
                      </div>
                    </div>
                    {selectedModel === "Marcus" && (
                      <div className="w-5 h-5 rounded-full bg-brand-green flex items-center justify-center text-white">
                        <Check size={12} strokeWidth={3} />
                      </div>
                    )}
                  </div>

                  {/* Model 2: Sarah */}
                  <div
                    onClick={() => setSelectedModel("Sarah")}
                    className={`flex items-center justify-between p-3.5 border rounded-2xl cursor-pointer transition-all ${
                      selectedModel === "Sarah"
                        ? "border-brand-green bg-brand-green-light/20 shadow-sm"
                        : "border-zinc-200 hover:bg-zinc-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-violet-100 border border-violet-200 flex items-center justify-center font-bold text-violet-700 text-sm select-none">
                        S
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-zinc-900">Sarah</h4>
                        <p className="text-[10px] font-semibold text-zinc-400 mt-0.5">
                          Warm Female (US)
                        </p>
                      </div>
                    </div>
                    {selectedModel === "Sarah" && (
                      <div className="w-5 h-5 rounded-full bg-brand-green flex items-center justify-center text-white">
                        <Check size={12} strokeWidth={3} />
                      </div>
                    )}
                  </div>

                  {/* Model 3: Custom */}
                  <div className="p-3.5 border border-zinc-200 rounded-2xl hover:bg-zinc-50 cursor-pointer flex items-center justify-center text-xs font-bold text-zinc-500 gap-1.5 border-dashed">
                    <span className="text-sm">+</span> Add Custom Voice
                  </div>
                </div>
              </div>

              {/* Sliders */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase">Speed</span>
                    <span className="text-xs font-bold text-zinc-700">{speed}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="3"
                    step="1"
                    defaultValue="2"
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "1") setSpeed("0.5x");
                      else if (val === "2") setSpeed("1.0x");
                      else setSpeed("2.0x");
                    }}
                    className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-brand-green"
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase">Pitch</span>
                    <span className="text-xs font-bold text-zinc-700">{pitch}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="3"
                    step="1"
                    defaultValue="2"
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "1") setPitch("Low");
                      else if (val === "2") setPitch("Normal");
                      else setPitch("High");
                    }}
                    className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-brand-green"
                  />
                </div>
              </div>

              {/* Regenerate Button */}
              <button
                onClick={handleRegenerate}
                disabled={isRegenerating}
                className="w-full h-11 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200/50 text-zinc-800 rounded-xl text-xs font-bold transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw size={14} className={isRegenerating ? "animate-spin" : ""} />
                Regenerate Voice Preview
              </button>
            </div>

            {/* Right: Audio Preview Panel */}
            <div className="lg:col-span-7 bg-white border border-zinc-200/80 rounded-2xl p-6 space-y-6 shadow-sm flex flex-col justify-between min-h-[460px]">
              <div>
                {/* Header Title */}
                <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                  <h2 className="text-lg font-bold text-zinc-900">Audio Preview</h2>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-green-light text-brand-green text-[10px] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-green" />
                    Ready to review
                  </span>
                </div>

                {/* Player Interface */}
                <div className="flex flex-col items-center justify-center py-10 space-y-6 relative">
                  {/* Big Play button */}
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="w-16 h-16 rounded-full bg-brand-green text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md shadow-brand-green/20 cursor-pointer"
                    title={isPlaying ? "Pause" : "Play"}
                  >
                    {isPlaying ? (
                      <Pause size={24} fill="currentColor" />
                    ) : (
                      <Play size={24} fill="currentColor" className="translate-x-[1.5px]" />
                    )}
                  </button>

                  {/* Waveform Visualization */}
                  <div className="flex items-end justify-between w-full max-w-md h-16 px-6">
                    {waveHeights.map((h, idx) => (
                      <div
                        key={idx}
                        className={`w-[4px] rounded-full transition-all duration-300 ${
                          isPlaying
                            ? idx / waveHeights.length <= playbackProgress / 100
                              ? "bg-brand-green"
                              : "bg-brand-green/20"
                            : "bg-zinc-200"
                        }`}
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>

                  {/* Time tracking */}
                  <div className="w-full max-w-md flex justify-between text-xs font-bold text-zinc-400 select-none">
                    <span>{currentTime}</span>
                    <span>2:34</span>
                  </div>

                  {/* Player controls */}
                  <div className="w-full max-w-md flex items-center justify-between border-t border-zinc-100 pt-4 px-2">
                    <div className="flex items-center gap-3">
                      <Volume2 size={16} className="text-zinc-400" />
                      <input
                        type="range"
                        className="w-24 h-1 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-zinc-500"
                      />
                    </div>
                    <button className="p-2 text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer" title="Download audio">
                      <Download size={18} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Details & Action Panel */}
              <div className="space-y-6">
                {/* Meta details */}
                <div className="bg-zinc-50 rounded-xl p-4 grid grid-cols-3 text-center border border-zinc-100">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-zinc-400 block uppercase">Duration</span>
                    <span className="text-sm font-extrabold text-zinc-800">2:34</span>
                  </div>
                  <div className="space-y-0.5 border-x border-zinc-200">
                    <span className="text-[10px] font-bold text-zinc-400 block uppercase">Provider</span>
                    <span className="text-sm font-extrabold text-zinc-800">ElevenLabs</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-zinc-400 block uppercase">Voice</span>
                    <span className="text-sm font-extrabold text-zinc-800">{selectedModel}</span>
                  </div>
                </div>

                {/* Footer Action buttons */}
                <div className="flex items-center justify-end gap-4">
                  <button
                    onClick={() => toast.info("Skipped preview")}
                    className="text-xs font-extrabold text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer"
                  >
                    Skip Preview
                  </button>
                  <button
                    onClick={handleApprove}
                    className="inline-flex items-center justify-center h-11 px-6 text-sm font-bold text-white bg-brand-green hover:bg-brand-green-hover rounded-xl shadow-md shadow-brand-green/10 hover:shadow-lg transition-all active:scale-[0.99] cursor-pointer"
                  >
                    Approve & Continue
                    <Check size={16} className="ml-1.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
  );
}
