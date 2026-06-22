"use client";

import { useState, use, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Sparkles,
  FolderOpen,
  BarChart3,
  Settings,
  Plus,
  Play,
  ArrowLeft,
  ChevronDown,
  Copy,
  RotateCcw,
  FileText,
  PenTool,
  Loader2,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { getStoredProjectById, updateStoredProject } from "../../../../../utils/storage";

export default function ScriptGenPage({ params }: { params: Promise<{ projectId: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const projectId = resolvedParams.projectId;

  // Form states
  const [topic, setTopic] = useState("");
  const [selectedTone, setSelectedTone] = useState("Professional");
  const [duration, setDuration] = useState("2:30");
  const [language, setLanguage] = useState("English (US)");
  const [instructions, setInstructions] = useState("");
  
  // Generation states
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedScriptText, setGeneratedScriptText] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const [estDuration, setEstDuration] = useState("0:00");
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    const proj = getStoredProjectById(projectId);
    if (proj) {
      if (proj.topic) setTopic(proj.topic);
      else if (proj.name) setTopic(proj.name);
      if (proj.selectedTone) setSelectedTone(proj.selectedTone);
      if (proj.duration) setDuration(proj.duration);
      if (proj.language) setLanguage(proj.language);
      if (proj.instructions) setInstructions(proj.instructions);
      if (proj.generatedScriptText) setGeneratedScriptText(proj.generatedScriptText);
      if (proj.wordCount) setWordCount(proj.wordCount);
      if (proj.estDuration) setEstDuration(proj.estDuration);
    }
  }, [projectId]);

  const tones = [
    "Professional",
    "Casual",
    "Energetic",
    "Persuasive",
    "Humorous",
    "Educational",
  ];

  const handleGenerate = () => {
    if (!topic) {
      toast.error("Please enter a topic or title");
      return;
    }

    setIsGenerating(true);
    setGeneratedScriptText("");
    setWordCount(0);
    setEstDuration("0:00");

    // Simulate script generation
    setTimeout(() => {
      setIsGenerating(false);
      const mockScript = `[Hook]\nAre you ready to transform how your team creates videos? Introducing UChat Video AI.\n\n[Body]\nUChat Video is the all-in-one platform built for modern teams, agencies, and enterprises to automate video production at scale.\n\nNo more juggling five different tools. With advanced AI avatars, natural voice synthesis, and automated subtitle styling, you can go from script to screen in minutes.\n\n[Call to Action]\nStart your free 14-day trial today and experience the future of video production.`;
      
      setGeneratedScriptText(mockScript);
      setWordCount(78);
      setEstDuration("0:35");
      toast.success("Script generated successfully!");
    }, 2000);
  };

  const handleCopy = () => {
    if (!generatedScriptText) return;
    navigator.clipboard.writeText(generatedScriptText);
    setIsCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleContinue = () => {
    const currentProj = getStoredProjectById(projectId);
    const updatedProgress = Math.max(currentProj?.progress || 0, 40);
    
    updateStoredProject(projectId, {
      topic,
      selectedTone,
      duration,
      language,
      instructions,
      generatedScriptText,
      wordCount,
      estDuration,
      stage: "Avatar",
      progress: updatedProgress,
      lastUpdated: "Just now"
    });
    
    router.push(`/dashboard/user/projects/${projectId}/video`);
  };

  return (
    <main className="flex-1 overflow-y-auto px-10 py-8">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Back link */}
          <Link
            href="/dashboard/user"
            className="inline-flex items-center text-sm font-semibold text-zinc-400 hover:text-zinc-800 transition-colors"
          >
            <ArrowLeft size={16} className="mr-1.5" />
            Back to Projects
          </Link>

          {/* Heading */}
          <div className="space-y-2">
            <span className="inline-block px-3 py-1 rounded-full bg-brand-green-light text-brand-green border border-brand-green-light text-[10px] font-extrabold uppercase tracking-wider">
              Step 2 of 6: Script Generation
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">
              Generate or write your video script
            </h1>
          </div>

          {/* Configuration & Output Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Configuration Form Column */}
            <div className="bg-white rounded-2xl border border-zinc-200/80 p-6 space-y-6 shadow-sm">
              <h2 className="text-lg font-bold text-zinc-900 border-b border-zinc-100 pb-3">
                Configuration
              </h2>

              <div className="space-y-4">
                {/* Topic / Title */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide">
                    Topic / Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Q3 Product Launch Announcement"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full px-4 h-11 border border-zinc-200 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 rounded-xl text-sm font-semibold text-zinc-900 outline-none transition-all"
                  />
                </div>

                {/* Tone */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide block">
                    Tone *
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {tones.map((tone) => (
                      <button
                        key={tone}
                        type="button"
                        onClick={() => setSelectedTone(tone)}
                        className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                          selectedTone === tone
                            ? "bg-brand-green text-white border-brand-green shadow-sm"
                            : "bg-white text-zinc-500 border-zinc-200 hover:bg-zinc-55"
                        }`}
                      >
                        {tone}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Target Duration */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide">
                      Target Duration
                    </label>
                    <span className="text-sm font-extrabold text-brand-green">{duration}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="3"
                    step="1"
                    defaultValue="2"
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "1") setDuration("0:30");
                      else if (val === "2") setDuration("2:30");
                      else setDuration("5:00");
                    }}
                    className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-brand-green"
                  />
                  <div className="flex justify-between text-[10px] font-bold text-zinc-400 px-1">
                    <span>30s</span>
                    <span>5min</span>
                    <span>10min</span>
                  </div>
                </div>

                {/* Language */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide block">
                    Language
                  </label>
                  <div className="relative">
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full pl-4 pr-10 h-11 border border-zinc-200 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 rounded-xl text-sm font-semibold text-zinc-900 outline-none appearance-none bg-white transition-all cursor-pointer"
                    >
                      <option>English (US)</option>
                      <option>English (UK)</option>
                      <option>Spanish</option>
                      <option>French</option>
                      <option>German</option>
                    </select>
                    <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-zinc-400">
                      <ChevronDown size={18} />
                    </span>
                  </div>
                </div>

                {/* Additional Instructions */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide">
                    Additional Instructions
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Focus on new features, mention pricing..."
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    className="w-full p-4 border border-zinc-200 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 rounded-xl text-sm font-semibold text-zinc-900 placeholder-zinc-400 outline-none resize-none transition-all"
                  />
                </div>

                {/* Generate Button */}
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="w-full h-11 bg-brand-green hover:bg-brand-green-hover disabled:bg-brand-green/60 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.99] cursor-pointer"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Generating Script...
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      Generate Script
                    </>
                  )}
                </button>
              </div>

              {/* OR Divider */}
              <div className="relative flex items-center justify-center my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-zinc-150" />
                </div>
                <span className="relative px-4 bg-white text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  OR
                </span>
              </div>

              {/* Write Script Manually */}
              <button
                type="button"
                onClick={() => toast.info("Manual script editor selected")}
                className="w-full h-11 border border-zinc-200 hover:bg-zinc-50 rounded-xl text-sm font-bold text-zinc-700 flex items-center justify-center gap-2 transition-colors cursor-pointer active:scale-[0.99]"
              >
                <PenTool size={16} />
                Write Script Manually
              </button>
            </div>

            {/* Generated Script Column */}
            <div className="bg-white rounded-2xl border border-zinc-200/80 p-6 flex flex-col min-h-[500px] shadow-sm justify-between">
              <div className="space-y-4 flex-1 flex flex-col">
                {/* Header Actions */}
                <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                  <h2 className="text-lg font-bold text-zinc-900">Generated Script</h2>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handleCopy}
                      disabled={!generatedScriptText}
                      className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50 rounded-lg disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                      title="Copy script"
                    >
                      {isCopied ? <Check size={16} className="text-brand-green" /> : <Copy size={16} />}
                    </button>
                    <button
                      onClick={handleGenerate}
                      disabled={!generatedScriptText || isGenerating}
                      className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50 rounded-lg disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                      title="Regenerate"
                    >
                      <RotateCcw size={16} />
                    </button>
                  </div>
                </div>

                {/* Script Display Box */}
                <div className="flex-1 flex flex-col justify-center items-center">
                  {isGenerating ? (
                    <div className="space-y-4 w-full animate-pulse px-4 py-8">
                      <div className="h-4 bg-zinc-100 rounded w-1/4" />
                      <div className="h-4 bg-zinc-100 rounded w-full" />
                      <div className="h-4 bg-zinc-100 rounded w-[90%]" />
                      <div className="h-4 bg-zinc-100 rounded w-full" />
                      <div className="h-4 bg-zinc-100 rounded w-[85%]" />
                    </div>
                  ) : generatedScriptText ? (
                    <div className="w-full bg-zinc-50/50 border border-zinc-100 rounded-xl p-5 text-sm font-semibold text-zinc-800 leading-relaxed text-left whitespace-pre-line h-full min-h-[300px] overflow-y-auto">
                      {generatedScriptText}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-3.5 border border-dashed border-zinc-200 rounded-xl w-full flex-1">
                      <div className="w-12 h-12 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-400">
                        <FileText size={20} />
                      </div>
                      <span className="text-sm font-bold text-zinc-400">
                        (Generated script will appear here...)
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Metrics Bar */}
              <div className="pt-4 border-t border-zinc-100 mt-6 flex items-center justify-between">
                <div className="flex items-center gap-5 text-xs font-semibold text-zinc-400">
                  <span className="flex items-center gap-1.5">
                    Word count: <strong className="text-zinc-700">{wordCount}</strong>
                  </span>
                  <span className="flex items-center gap-1.5">
                    Est. duration: <strong className="text-zinc-700">{estDuration}</strong>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleContinue}
                  disabled={!generatedScriptText || isGenerating}
                  className="inline-flex items-center justify-center h-10 px-6 text-sm font-bold text-white bg-brand-green hover:bg-brand-green-hover disabled:bg-zinc-200 disabled:text-zinc-400 rounded-xl transition-all cursor-pointer select-none active:scale-[0.99]"
                >
                  Continue
                  <Check size={14} className="ml-1.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
  );
}
