"use client";

import { useState, use, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Play,
  Check,
  ArrowLeft,
  Sparkles,
  User,
  PenTool,
  Loader2,
  Bell,
  HelpCircle,
  Video,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { getStoredProjectById, updateStoredProject, UserProject } from "../../../../../utils/storage";

export default function SendForEditingPage({ params }: { params: Promise<{ projectId: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const projectId = resolvedParams.projectId;

  const [project, setProject] = useState<UserProject | null>(null);

  const [selectedMethod, setSelectedMethod] = useState<"AI" | "Human" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [aiInstructions, setAiInstructions] = useState("");
  const [stylePreset, setStylePreset] = useState("Cinematic");
  const [humanInstructions, setHumanInstructions] = useState("");
  const [selectedEditor, setSelectedEditor] = useState("David");
  const [priority, setPriority] = useState("Normal");

  useEffect(() => {
    const proj = getStoredProjectById(projectId);
    if (proj) {
      setProject(proj);
      if (proj.editMethod) setSelectedMethod(proj.editMethod);
      if (proj.aiInstructions) setAiInstructions(proj.aiInstructions);
      if (proj.stylePreset) setStylePreset(proj.stylePreset);
      if (proj.humanInstructions) setHumanInstructions(proj.humanInstructions);
      if (proj.selectedEditor) setSelectedEditor(proj.selectedEditor);
    }
  }, [projectId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    setTimeout(() => {
      setIsSubmitting(false);

      const isAI = selectedMethod === "AI";
      const nextStage = isAI ? "Export" : "Video Editing";
      const nextProgress = isAI ? 90 : 85;

      updateStoredProject(projectId, {
        editMethod: selectedMethod,
        aiInstructions: isAI ? aiInstructions : undefined,
        stylePreset: isAI ? stylePreset : undefined,
        humanInstructions: !isAI ? humanInstructions : undefined,
        selectedEditor: !isAI ? selectedEditor : undefined,
        stage: nextStage,
        progress: nextProgress,
        status: "In Progress",
        lastUpdated: "Just now"
      });

      toast.success(isAI ? "AI editing request complete!" : "Project submitted to human editor.");
      router.push(`/dashboard/user/projects/${projectId}`);
    }, 2000);
  };

  return (
    <main className="flex-1 bg-zinc-50/30 overflow-y-auto px-12 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Back link */}
          <Link
            href={`/dashboard/user/projects/${projectId}`}
            className="inline-flex items-center text-sm font-semibold text-zinc-400 hover:text-zinc-800 transition-colors"
          >
            <ArrowLeft size={16} className="mr-1.5" />
            Back to Projects
          </Link>

          {/* Page Headers */}
          <div className="space-y-2">
            <span className="inline-block text-[10px] font-extrabold uppercase tracking-wider text-brand-green bg-brand-green-light border border-brand-green-light px-3 py-1 rounded-full">
              Step 5 of 6
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">
              Send for Editing
            </h1>
            <p className="text-zinc-500 text-sm font-semibold">
              Choose how you want your generated video polished and finalized.
            </p>
          </div>

          {/* Top Video Preview Card */}
          <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 shadow-sm space-y-4">
            <div className="bg-zinc-950 rounded-xl aspect-video overflow-hidden relative shadow-inner flex items-center justify-center max-h-[300px]">
              <Image
                src="/mountain-sunset.png"
                alt="Scenic sunset hiker preview"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover opacity-80"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <button className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center text-white border border-white/20">
                  <Play size={20} fill="currentColor" className="translate-x-[1px]" />
                </button>
              </div>
            </div>
            {/* Status bar */}
            <div className="bg-brand-green/5 border border-brand-green/10 rounded-xl px-4 py-3 flex items-center gap-3 text-xs font-bold text-brand-green">
              <div className="w-5 h-5 rounded-full bg-brand-green flex items-center justify-center text-white shrink-0">
                <Check size={12} strokeWidth={3} />
              </div>
              Generation complete. Your raw video is ready for editing.
            </div>
          </div>

          {/* Choice Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 select-none">
            {/* 1. AI Editing */}
            <div
              className={`bg-white rounded-2xl border p-6 flex flex-col justify-between h-96 shadow-sm transition-all hover:shadow-md ${
                selectedMethod === "AI"
                  ? "border-brand-green bg-brand-green-light/20 ring-1 ring-brand-green/30"
                  : "border-zinc-200"
              }`}
            >
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 rounded-full bg-brand-green-light border border-brand-green/10 flex items-center justify-center text-brand-green">
                    <Sparkles size={22} />
                  </div>
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-brand-green-light text-brand-green text-[9px] font-extrabold uppercase tracking-wider">
                    Fastest
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="text-lg font-extrabold text-zinc-900">AI Editing</h3>
                  <span className="text-[10px] font-semibold text-zinc-400 block">
                    Powered by Subagic
                  </span>
                </div>

                {/* Bullets */}
                <ul className="space-y-2 text-xs font-bold text-zinc-600">
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-brand-green shrink-0" />
                    Automatic color correction
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-brand-green shrink-0" />
                    Noise reduction & stabilization
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-brand-green shrink-0" />
                    Smart cuts & pacing adjustments
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-brand-green shrink-0" />
                    Instant turnaround (under 5 mins)
                  </li>
                </ul>
              </div>

              <button
                type="button"
                onClick={() => setSelectedMethod("AI")}
                className={`w-full h-11 rounded-xl text-sm font-bold border transition-colors cursor-pointer active:scale-[0.99] flex items-center justify-center ${
                  selectedMethod === "AI"
                    ? "bg-brand-green border-brand-green text-white shadow-sm"
                    : "border-brand-green text-brand-green hover:bg-brand-green-light/35"
                }`}
              >
                Select AI Editing
              </button>
            </div>

            {/* 2. Human Editor */}
            <div
              className={`bg-white rounded-2xl border p-6 flex flex-col justify-between h-96 shadow-sm transition-all hover:shadow-md ${
                selectedMethod === "Human"
                  ? "border-zinc-700 bg-zinc-50/10 ring-1 ring-zinc-700/30"
                  : "border-zinc-200"
              }`}
            >
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 rounded-full bg-zinc-50 border border-zinc-200 flex items-center justify-center text-zinc-500">
                    <PenTool size={20} />
                  </div>
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-500 text-[9px] font-extrabold uppercase tracking-wider">
                    Expert Touch
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="text-lg font-extrabold text-zinc-900">Human Editor</h3>
                  <span className="text-[10px] font-semibold text-zinc-400 block">
                    Professional touch by our experts
                  </span>
                </div>

                {/* Bullets */}
                <ul className="space-y-2 text-xs font-bold text-zinc-600">
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-zinc-400 shrink-0" />
                    Custom creative direction
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-zinc-400 shrink-0" />
                    Complex transitions & visual effects
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-zinc-400 shrink-0" />
                    Text overlays & motion graphics
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-zinc-400 shrink-0" />
                    Bespoke music & sound design
                  </li>
                </ul>
              </div>

              <button
                type="button"
                onClick={() => setSelectedMethod("Human")}
                className={`w-full h-11 rounded-xl text-sm font-bold border transition-colors cursor-pointer active:scale-[0.99] flex items-center justify-center ${
                  selectedMethod === "Human"
                    ? "bg-zinc-800 border-zinc-800 text-white shadow-sm"
                    : "border-zinc-300 text-zinc-700 hover:bg-zinc-50"
                }`}
              >
                Select Human Editor
              </button>
            </div>
          </div>

          {/* Dynamic Forms (collapsible beneath choice cards) */}
          {selectedMethod && (
            <div className="bg-white rounded-2xl border border-zinc-200/80 p-6 shadow-md transition-all animate-in slide-in-from-top-4 duration-300">
              <form onSubmit={handleSubmit} className="space-y-5">
                {selectedMethod === "AI" ? (
                  <>
                    <h3 className="text-base font-bold text-zinc-900 border-b border-zinc-150 pb-2 flex items-center gap-2">
                      <Sparkles size={18} className="text-brand-green" />
                      Configure AI Editor Settings
                    </h3>
                    <div className="space-y-4">
                      {/* Style Preset */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-zinc-400 uppercase block">
                          Style Preset
                        </label>
                        <div className="relative">
                          <select
                            value={stylePreset}
                            onChange={(e) => setStylePreset(e.target.value)}
                            className="w-full pl-4 pr-10 h-11 border border-zinc-200 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 rounded-xl text-sm font-semibold text-zinc-900 outline-none appearance-none bg-white transition-all cursor-pointer"
                          >
                            <option>Cinematic</option>
                            <option>Vlog style</option>
                            <option>Corporate clean</option>
                            <option>Social vibrant</option>
                          </select>
                          <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-zinc-400">
                            <ChevronDown size={18} />
                          </span>
                        </div>
                      </div>

                      {/* Instructions */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-zinc-400 uppercase">
                          Instructions for AI (e.g. caption formatting)
                        </label>
                        <textarea
                          rows={4}
                          placeholder="e.g., apply cinematic filters, auto-stabilize raw clips..."
                          value={aiInstructions}
                          onChange={(e) => setAiInstructions(e.target.value)}
                          className="w-full p-4 border border-zinc-200 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 rounded-xl text-sm font-semibold text-zinc-900 placeholder-zinc-400 outline-none resize-none transition-all"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <h3 className="text-base font-bold text-zinc-900 border-b border-zinc-150 pb-2 flex items-center gap-2">
                      <User size={18} className="text-zinc-700" />
                      Request Professional Human Editor
                    </h3>
                    <div className="space-y-4">
                      {/* Select Editor */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-zinc-400 uppercase block">
                          Select Editor
                        </label>
                        <div className="relative">
                          <select
                            value={selectedEditor}
                            onChange={(e) => setSelectedEditor(e.target.value)}
                            className="w-full pl-4 pr-10 h-11 border border-zinc-200 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 rounded-xl text-sm font-semibold text-zinc-900 outline-none appearance-none bg-white transition-all cursor-pointer"
                          >
                            <option value="David">David Chen (Active workload: 2 tasks)</option>
                            <option value="Alice">Alice Sterling (Active workload: 1 task)</option>
                            <option value="James">James Miller (Active workload: 4 tasks)</option>
                          </select>
                          <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-zinc-400">
                            <ChevronDown size={18} />
                          </span>
                        </div>
                      </div>

                      {/* Priority */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-zinc-400 uppercase block">
                          Priority
                        </label>
                        <div className="flex gap-4">
                          {["Normal", "Urgent"].map((p) => (
                            <label key={p} className="flex items-center gap-2 text-sm font-semibold text-zinc-700 cursor-pointer">
                              <input
                                type="radio"
                                name="priority"
                                checked={priority === p}
                                onChange={() => setPriority(p)}
                                className="w-4 h-4 accent-zinc-700 cursor-pointer"
                              />
                              {p}
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Instructions */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-zinc-400 uppercase">
                          Editing Instructions
                        </label>
                        <textarea
                          rows={4}
                          required
                          placeholder="Please align visual cuts to the audio peaks, add text overlays for key hooks..."
                          value={humanInstructions}
                          onChange={(e) => setHumanInstructions(e.target.value)}
                          className="w-full p-4 border border-zinc-200 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 rounded-xl text-sm font-semibold text-zinc-900 placeholder-zinc-400 outline-none resize-none transition-all"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Submit button row */}
                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`h-11 px-8 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      selectedMethod === "AI"
                        ? "bg-brand-green hover:bg-brand-green-hover shadow-brand-green/10"
                        : "bg-zinc-800 hover:bg-zinc-900"
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Sending...
                      </>
                    ) : selectedMethod === "AI" ? (
                      "Send to AI Editor"
                    ) : (
                      "Send to Editor"
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>
  );
}
