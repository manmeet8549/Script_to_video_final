"use client";

import { useState } from "react";
import { X, Sparkles, Loader2, Languages, Sliders, Volume2, Video, Scissors, Check, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api/client";

const POPULAR_TEMPLATES = [
  { id: "Hormozi 1", name: "Hormozi Bold", desc: "Dynamic yellow text, high-contrast emoji overlays, dynamic pop animation.", previewColor: "from-amber-400 to-amber-500" },
  { id: "Devin", name: "Devin Modern", desc: "Sleek and clean lettering, neon green highlights, ideal for tech/dev videos.", previewColor: "from-emerald-400 to-teal-500" },
  { id: "Beast", name: "Beast Impact", desc: "Slanted high-energy text, thick black outline, YouTube viral aesthetic.", previewColor: "from-red-500 to-orange-500" },
  { id: "Ali", name: "Ali Minimal", desc: "Elegant sans-serif, minimal overlays, modern documentary pacing.", previewColor: "from-zinc-600 to-zinc-800" },
];

const OTHER_TEMPLATES = [
  "Matt", "Jess", "Jack", "Nick", "Laura", "Kelly 2", "Caleb", "Kendrick", 
  "Lewis", "Doug", "Carlos", "Luke", "Leila", "Mark", "Sara", "Daniel", 
  "Dan 2", "Hormozi 2", "Hormozi 3", "Hormozi 4", "Hormozi 5", "Dan", 
  "Tayo", "Ella", "Tracy", "Jason", "William", "Leon", "Maya", 
  "Karl", "Iman", "Umi", "David", "Noah", "Gstaad", "Malta", "Nema", "seth"
];

const LANGUAGES = [
  { code: "en", name: "English (US/UK)" },
  { code: "es", name: "Spanish (Español)" },
  { code: "fr", name: "French (Français)" },
  { code: "de", name: "German (Deutsch)" },
  { code: "it", name: "Italian (Italiano)" },
  { code: "pt", name: "Portuguese (Português)" },
  { code: "nl", name: "Dutch (Nederlands)" },
  { code: "ja", name: "Japanese (日本語)" },
  { code: "ko", name: "Korean (한국어)" },
  { code: "hi", name: "Hindi (हिन्दी)" },
];

export default function SubmagicEditDrawer({
  projectId,
  open,
  onClose,
}: {
  projectId: string;
  open: boolean;
  onClose: () => void;
}) {
  const [templateName, setTemplateName] = useState("Hormozi 1");
  const [language, setLanguage] = useState("en");
  const [magicZooms, setMagicZooms] = useState(true);
  const [magicBrolls, setMagicBrolls] = useState(false);
  const [magicBrollsPercentage, setMagicBrollsPercentage] = useState(50);
  const [removeSilence, setRemoveSilence] = useState(true);
  const [silencePace, setSilencePace] = useState("fast");
  const [removeBadTakes, setRemoveBadTakes] = useState(true);
  const [cleanAudio, setCleanAudio] = useState(false);
  const [instructions, setInstructions] = useState(
    "Add animated subtitles, emphasize key words, and apply a clean modern caption style."
  );
  
  const [submitting, setSubmitting] = useState(false);
  const [customTemplateActive, setCustomTemplateActive] = useState(false);

  if (!open) return null;

  const handleTemplateSelect = (id: string) => {
    setTemplateName(id);
    setCustomTemplateActive(false);
  };

  const handleCustomTemplateSelect = (val: string) => {
    setTemplateName(val);
    setCustomTemplateActive(true);
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      await api.post(`/api/projects/${projectId}/edit`, {
        edit_type: "ai",
        instructions,
        settings: {
          templateName,
          language,
          magicZooms,
          magicBrolls,
          magicBrollsPercentage: magicBrolls ? magicBrollsPercentage : undefined,
          removeSilencePace: removeSilence ? silencePace : undefined,
          removeBadTakes,
          cleanAudio,
        },
      });
      toast.success("Sent to Submagic AI editor. You'll be notified when the edit is ready.");
      onClose();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to submit AI edit.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/45 backdrop-blur-xs select-none" onClick={onClose}>
      <div
        className="h-full w-full max-w-lg overflow-y-auto bg-white p-6 shadow-2xl flex flex-col justify-between text-left animate-in slide-in-from-right duration-250"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 pb-4 shrink-0">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-bold text-zinc-900">
              <Sparkles size={18} className="text-brand-green" />
              AI Edit with Submagic
            </h3>
            <p className="text-[11px] font-semibold text-zinc-400 mt-0.5">
              Customize AI auto-captions, pacing, and post-production effects.
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-lg hover:bg-zinc-50 transition-colors cursor-pointer">
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto py-5 space-y-6 pr-1">
          {/* Section 1: Template Name */}
          <div className="space-y-3">
            <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wide flex items-center gap-1.5">
              <Wand2 size={13} className="text-brand-green" /> Caption Style Template
            </label>
            
            {/* Visual grid for popular templates */}
            <div className="grid grid-cols-2 gap-3">
              {POPULAR_TEMPLATES.map((tpl) => {
                const isSelected = !customTemplateActive && templateName === tpl.id;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => handleTemplateSelect(tpl.id)}
                    className={`relative rounded-xl border p-3 flex flex-col text-left justify-between h-[105px] transition-all duration-200 cursor-pointer ${
                      isSelected 
                        ? "border-brand-green bg-emerald-50/20 ring-2 ring-brand-green/10" 
                        : "border-zinc-200 hover:border-zinc-350 hover:bg-zinc-50/50"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className={`h-4 w-12 rounded-md bg-gradient-to-r ${tpl.previewColor} block opacity-85`} />
                      {isSelected && (
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-brand-green text-white">
                          <Check size={10} strokeWidth={3} />
                        </span>
                      )}
                    </div>
                    <div className="mt-2 space-y-0.5">
                      <p className="text-xs font-bold text-zinc-800">{tpl.name}</p>
                      <p className="text-[10px] font-semibold leading-snug text-zinc-400 line-clamp-2">{tpl.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Dropdown for other templates */}
            <div className="pt-1.5">
              <select
                value={customTemplateActive ? templateName : ""}
                onChange={(e) => {
                  if (e.target.value) {
                    handleCustomTemplateSelect(e.target.value);
                  } else {
                    handleTemplateSelect("Hormozi 1");
                  }
                }}
                className={`w-full rounded-xl border p-2.5 text-xs font-bold outline-none cursor-pointer transition-all ${
                  customTemplateActive
                    ? "border-brand-green bg-emerald-50/20 text-brand-green"
                    : "border-zinc-200 text-zinc-500 bg-white hover:border-zinc-300"
                }`}
              >
                <option value="">-- Or Choose Another Style --</option>
                {OTHER_TEMPLATES.map((name) => (
                  <option key={name} value={name}>
                    {name} Style
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Section 2: Language & Transcription */}
          <div className="space-y-2">
            <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wide flex items-center gap-1.5">
              <Languages size={13} className="text-brand-green" /> Transcription Language
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 p-2.5 text-xs text-zinc-800 bg-white outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 transition-all cursor-pointer"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>

          {/* Divider */}
          <hr className="border-zinc-100" />

          {/* Section 3: Smart Trimming & Cuts */}
          <div className="space-y-4">
            <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wide flex items-center gap-1.5">
              <Scissors size={13} className="text-brand-green" /> Smart Pacing & Trimming
            </label>
            
            <div className="space-y-3.5">
              {/* Silence Trimming Toggle */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-zinc-800">Remove Silences</span>
                    <span className="text-[10px] font-semibold text-zinc-400 block">Cut quiet pauses to increase pacing and retention.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={removeSilence}
                    onChange={(e) => setRemoveSilence(e.target.checked)}
                    className="h-4.5 w-9 rounded-full bg-zinc-200 border-none text-brand-green cursor-pointer focus:ring-0 checked:bg-brand-green transition-colors accent-brand-green"
                  />
                </div>

                {/* Pace Selection (only shown when silence removal is active) */}
                {removeSilence && (
                  <div className="pl-4 border-l-2 border-brand-green/30 py-1 flex items-center gap-2 select-none animate-in fade-in zoom-in-95 duration-150">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Pace:</span>
                    <div className="flex rounded-lg border border-zinc-200 p-0.5 bg-zinc-55/30">
                      {["slow", "medium", "fast"].map((pace) => (
                        <button
                          key={pace}
                          type="button"
                          onClick={() => setSilencePace(pace)}
                          className={`px-2.5 py-1 rounded-md text-[10px] font-bold capitalize transition-all cursor-pointer ${
                            silencePace === pace
                              ? "bg-white text-zinc-805 shadow-xs border border-zinc-200"
                              : "text-zinc-400 hover:text-zinc-600"
                          }`}
                        >
                          {pace}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Remove Bad Takes Toggle */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-zinc-800">Trim Bad Takes</span>
                  <span className="text-[10px] font-semibold text-zinc-400 block">Automatically detect and trim stutters or repeats.</span>
                </div>
                <input
                  type="checkbox"
                  checked={removeBadTakes}
                  onChange={(e) => setRemoveBadTakes(e.target.checked)}
                  className="h-4.5 w-9 rounded-full bg-zinc-200 border-none text-brand-green cursor-pointer focus:ring-0 checked:bg-brand-green transition-colors accent-brand-green"
                />
              </div>
            </div>
          </div>

          {/* Divider */}
          <hr className="border-zinc-100" />

          {/* Section 4: AI Visuals & Audio Enhancements */}
          <div className="space-y-4">
            <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wide flex items-center gap-1.5">
              <Sliders size={13} className="text-brand-green" /> Visual & Audio FX
            </label>

            <div className="space-y-3.5">
              {/* Clean Audio */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-zinc-800 flex items-center gap-1">
                    Clean Audio <Volume2 size={13} className="text-brand-green" />
                  </span>
                  <span className="text-[10px] font-semibold text-zinc-400 block">Remove background noise and echo, and boost vocals.</span>
                </div>
                <input
                  type="checkbox"
                  checked={cleanAudio}
                  onChange={(e) => setCleanAudio(e.target.checked)}
                  className="h-4.5 w-9 rounded-full bg-zinc-200 border-none text-brand-green cursor-pointer focus:ring-0 checked:bg-brand-green transition-colors accent-brand-green"
                />
              </div>

              {/* Magic Zooms */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-zinc-800 flex items-center gap-1">
                    Magic Zooms <Video size={13} className="text-brand-green" />
                  </span>
                  <span className="text-[10px] font-semibold text-zinc-400 block">Auto-zoom at key emphasis points and topic shifts.</span>
                </div>
                <input
                  type="checkbox"
                  checked={magicZooms}
                  onChange={(e) => setMagicZooms(e.target.checked)}
                  className="h-4.5 w-9 rounded-full bg-zinc-200 border-none text-brand-green cursor-pointer focus:ring-0 checked:bg-brand-green transition-colors accent-brand-green"
                />
              </div>

              {/* Magic B-rolls Toggle */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-zinc-800">Overlay Magic B-rolls</span>
                    <span className="text-[10px] font-semibold text-zinc-400 block">AI overlay of relevant stock footage matching spoken transcript.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={magicBrolls}
                    onChange={(e) => setMagicBrolls(e.target.checked)}
                    className="h-4.5 w-9 rounded-full bg-zinc-200 border-none text-brand-green cursor-pointer focus:ring-0 checked:bg-brand-green transition-colors accent-brand-green"
                  />
                </div>

                {/* B-roll Density (only shown when magic B-rolls is active) */}
                {magicBrolls && (
                  <div className="pl-4 border-l-2 border-brand-green/30 py-1 space-y-1.5 animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                      <span>B-roll Density:</span>
                      <span className="text-brand-green">{magicBrollsPercentage}%</span>
                    </div>
                    <input
                      type="range"
                      min="25"
                      max="100"
                      step="25"
                      value={magicBrollsPercentage}
                      onChange={(e) => setMagicBrollsPercentage(parseInt(e.target.value))}
                      className="w-full h-1 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-brand-green"
                    />
                    <div className="flex justify-between text-[9px] font-bold text-zinc-400">
                      <span>25% (Low)</span>
                      <span>50% (Med)</span>
                      <span>75% (High)</span>
                      <span>100% (Max)</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Divider */}
          <hr className="border-zinc-100" />

          {/* Section 5: Custom Instructions */}
          <div className="space-y-2">
            <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wide">
              Additional Instructions
            </label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={4}
              placeholder="Tell the AI any specific words to highlight, caption placement offsets, or brand requirements..."
              className="w-full resize-none rounded-xl border border-zinc-200 p-3 text-xs text-zinc-800 outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20"
            />
          </div>
        </div>

        {/* Footer CTA */}
        <div className="border-t border-zinc-150 pt-4 shrink-0 flex gap-3 select-none">
          <button
            onClick={onClose}
            className="flex-1 py-3 border border-zinc-200 hover:bg-zinc-50 rounded-xl text-xs font-bold text-zinc-700 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={submitting}
            className="flex-1 py-3 bg-brand-green hover:bg-brand-green-hover disabled:opacity-60 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-brand-green/10"
          >
            {submitting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Sparkles size={14} />
                Generate AI Edit
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
