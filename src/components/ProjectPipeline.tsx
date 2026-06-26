"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Loader2,
  Check,
  Copy,
  Download,
  ExternalLink,
  RotateCcw,
  Wand2,
  Layers,
  Volume2,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api/client";
import AudioPlayer from "@/components/AudioPlayer";
import SubmagicEditDrawer from "@/components/SubmagicEditDrawer";
import VideoVersionsManager from "@/components/VideoVersionsManager";
import SendToEditorModal from "@/components/SendToEditorModal";


type Voice = { id: string; name: string; description?: string; gender?: string };
type Avatar = { id: string; name: string; preview_image_url: string; preview_video_url?: string; description?: string };

// Format slider seconds as "M:SS minutes" for display and the script prompt.
function fmtDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")} minutes`;
}

const STEPS = ["Idea", "Script", "Voice", "Avatar", "Export"] as const;
const ASPECTS: { id: "16:9" | "9:16" | "1:1"; label: string; box: string }[] = [
  { id: "16:9", label: "Landscape", box: "aspect-video" },
  { id: "9:16", label: "Portrait", box: "aspect-[9/16]" },
  { id: "1:1", label: "Square", box: "aspect-square" },
];

export default function ProjectPipeline({ projectId }: { projectId: string }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);

  // Step 1 — idea
  const [topic, setTopic] = useState("");
  const [audience, setAudience] = useState("");
  const [tone, setTone] = useState("Educational, Optimistic");
  const [durationSec, setDurationSec] = useState(60); // 0:10–5:00, default 1:00
  const [language, setLanguage] = useState<"english" | "hindi" | "hinglish">("english");
  const [generatingScript, setGeneratingScript] = useState(false);
  const [scriptIsManual, setScriptIsManual] = useState(false);

  // Step 2 — script
  const [script, setScript] = useState("");

  // Step 3 — voice
  const [voices, setVoices] = useState<Voice[]>([]);
  const [voiceId, setVoiceId] = useState("");
  const [stability, setStability] = useState(0.5);
  const [similarity, setSimilarity] = useState(0.75);
  const [style, setStyle] = useState(0);
  const [speakerBoost, setSpeakerBoost] = useState(true);
  const [speed, setSpeed] = useState(1.0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [generatingVoice, setGeneratingVoice] = useState(false);

  // Step 4 — avatar
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [avatarId, setAvatarId] = useState("");
  const [customAvatar, setCustomAvatar] = useState("");
  const [aspect, setAspect] = useState<"16:9" | "9:16" | "1:1">("16:9");
  const [generatingVideo, setGeneratingVideo] = useState(false);

  // Step 5 — export
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [submagicOpen, setSubmagicOpen] = useState(false);
  const [versionsOpen, setVersionsOpen] = useState(false);
  const [sendToEditorOpen, setSendToEditorOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const voiceSettings = useCallback(
    () => ({
      stability,
      similarity_boost: similarity,
      style,
      use_speaker_boost: speakerBoost,
      speed,
    }),
    [stability, similarity, style, speakerBoost, speed],
  );


  // Lazy-load catalogs when their step is reached.
  useEffect(() => {
    if (step !== 3 || voices.length) return;
    api
      .get<{ voices: Voice[] }>(`/api/voice/voices?projectId=${projectId}`)
      .then((res) => {
        setVoices(res.voices);
        if (!voiceId && res.voices[0]) setVoiceId(res.voices[0].id);
      })
      .catch(() => {});
  }, [step, projectId, voices.length, voiceId]);

  useEffect(() => {
    if (step !== 4 || avatars.length) return;
    api
      .get<{ avatars: Avatar[] }>(`/api/video/avatars?projectId=${projectId}`)
      .then((res) => {
        setAvatars(res.avatars);
        if (!avatarId && res.avatars[0]) setAvatarId(res.avatars[0].id);
      })
      .catch(() => {});
  }, [step, projectId, avatars.length, avatarId]);

  // ---- actions ---------------------------------------------------------------
  const generateScript = async () => {
    if (!topic.trim()) return toast.error("Describe your concept first.");
    setGeneratingScript(true);
    try {
      await api.patch(`/api/projects/${projectId}`, { status: "scripting" });
      const res = await api.post<{ content: string; wordCount: number }>(`/api/script/generate`, {
        topic,
        tone,
        language,
        target_duration: fmtDuration(durationSec),
        instructions: audience ? `Target audience: ${audience}` : undefined,
      });
      setScript(res.content);
      setStep(2);
      toast.success("Script generated!");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Script generation failed.");
    } finally {
      setGeneratingScript(false);
    }
  };

  const saveScriptAndContinue = async () => {
    if (!script.trim()) return toast.error("Script is empty.");
    try {
      await api.post(`/api/projects/${projectId}/script`, {
        content: script,
        tone,
        language: language === "english" ? "en" : language,
        ai_generated: !scriptIsManual,
      });
      setStep(3);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to save script.");
    }
  };

  const generatePreview = async () => {
    if (!voiceId) return toast.error("Pick a voice first.");
    setPreviewing(true);
    setPreviewUrl(null);
    try {
      const res = await api.post<{ audioUrl: string }>(`/api/voice/preview`, {
        voice_id: voiceId,
        settings: voiceSettings(),
      });
      setPreviewUrl(res.audioUrl);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Preview failed.");
    } finally {
      setPreviewing(false);
    }
  };

  const generateVoice = async () => {
    if (!voiceId) return toast.error("Pick a voice first.");
    setGeneratingVoice(true);
    try {
      const res = await api.post<{ audio_url: string }>(`/api/projects/${projectId}/voice`, {
        voice_id: voiceId,
        text: script,
        settings: voiceSettings(),
      });
      if (!res.audio_url) throw new Error("No audio returned.");
      setAudioUrl(res.audio_url);
      toast.success("Audio created successfully.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Voice generation failed.");
    } finally {
      setGeneratingVoice(false);
    }
  };

  const verifyCustomAvatar = async () => {
    if (!customAvatar.trim()) return;
    try {
      const res = await api.get<{ avatar: Avatar }>(
        `/api/video/avatars?projectId=${projectId}&id=${encodeURIComponent(customAvatar.trim())}`,
      );
      setAvatars((prev) => [res.avatar, ...prev.filter((a) => a.id !== res.avatar.id)]);
      setAvatarId(res.avatar.id);
      toast.success(`Verified avatar: ${res.avatar.name}`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Avatar ID could not be verified.");
    }
  };

  const pollStatus = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const res = await api.get<{ status: string; videoUrl: string | null; error?: string | null }>(
          `/api/video/status?projectId=${projectId}`,
        );
        if (res.status === "completed" && res.videoUrl) {
          if (pollRef.current) clearInterval(pollRef.current);
          setVideoUrl(res.videoUrl);
          setGeneratingVideo(false);
          setStep(5);
          toast.success("Video rendering complete!");
        } else if (res.status === "failed") {
          if (pollRef.current) clearInterval(pollRef.current);
          setGeneratingVideo(false);
          toast.error(res.error || "Video generation failed.");
        }
      } catch {
        /* keep polling */
      }
    }, 10000);
  }, [projectId]);

  // ---- initial load: hydrate from the DB and resume at the right step --------
  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const [projectRow, scriptRow, voiceRow, videoRow] = await Promise.all([
          api.get<{ video_url?: string | null; status?: string } | null>(`/api/projects/${projectId}`),
          api.get<{ content?: string; word_count?: number } | null>(`/api/projects/${projectId}/script`),
          api.get<{ audio_url?: string; voice_id?: string; status?: string } | null>(`/api/projects/${projectId}/voice`),
          api.get<{ video_url?: string; status?: string } | null>(`/api/projects/${projectId}/video`),
        ]);
        if (!active) return;

        if (scriptRow?.content) setScript(scriptRow.content);
        if (voiceRow?.audio_url && voiceRow.status === "completed") setAudioUrl(voiceRow.audio_url);
        if (voiceRow?.voice_id) setVoiceId(voiceRow.voice_id);
        
        const activeVideoUrl = projectRow?.video_url || (videoRow?.status === "completed" ? videoRow?.video_url : null);
        if (activeVideoUrl) setVideoUrl(activeVideoUrl);

        if (activeVideoUrl) setStep(5);
        else if (voiceRow?.audio_url && voiceRow.status === "completed") {
          setStep(4);
          if (videoRow?.status === "generating") {
            setGeneratingVideo(true);
            pollStatus();
          }
        }
        else if (scriptRow?.content) setStep(3);
        else setStep(1);
      } catch {
        // New project with no artifacts yet — start at step 1.
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [projectId, pollStatus, refreshTrigger]);

  const generateVideo = async () => {
    if (!avatarId) return toast.error("Select an avatar first.");
    setGeneratingVideo(true);
    try {
      await api.post(`/api/video/generate`, {
        project_id: projectId,
        avatar_id: avatarId,
        aspect_ratio: aspect,
        voice_id: voiceId || undefined,
      });
      toast.info("Generating avatar video with HeyGen…");
      pollStatus();
    } catch (err) {
      setGeneratingVideo(false);
      toast.error(err instanceof ApiError ? err.message : "Failed to start video generation.");
    }
  };

  const downloadVideo = async () => {
    if (!videoUrl) return;
    try {
      const res = await fetch(videoUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `video-${projectId}.mp4`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      window.open(videoUrl, "_blank");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-zinc-400">
        <Loader2 className="mr-2 animate-spin" size={20} /> Loading pipeline…
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stepper */}
      <div className="flex items-center justify-between">
        {STEPS.map((label, i) => {
          const idx = i + 1;
          const done = idx < step;
          const active = idx === step;
          return (
            <div key={label} className="flex flex-1 items-center">
              <button
                onClick={() => idx <= step && setStep(idx)}
                disabled={idx > step}
                className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                  done
                    ? "bg-brand-green text-white"
                    : active
                      ? "bg-brand-green text-white ring-4 ring-brand-green/20"
                      : "bg-zinc-200 text-zinc-500"
                } ${idx <= step ? "cursor-pointer" : "cursor-not-allowed"}`}
              >
                {done ? <Check size={15} strokeWidth={3} /> : idx}
              </button>
              <span className={`ml-2 text-xs font-bold ${active ? "text-zinc-900" : "text-zinc-400"}`}>
                {label}
              </span>
              {i < STEPS.length - 1 && (
                <div className={`mx-3 h-[3px] flex-1 rounded-full ${idx < step ? "bg-brand-green" : "bg-zinc-100"}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* STEP 1 — Idea */}
      {step === 1 && (
        <div className="space-y-5 rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-zinc-900">Describe your video</h2>
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wide text-zinc-400">Concept / Topic</label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              rows={4}
              placeholder="What is this video about?"
              className="w-full resize-none rounded-xl border border-zinc-200 p-3 text-sm outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Target Audience" value={audience} onChange={setAudience} placeholder="Tech Enthusiasts" />
            <Field label="Tone / Style" value={tone} onChange={setTone} placeholder="Educational" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wide text-zinc-400">Est. Duration</label>
              <span className="rounded-full bg-brand-green-light px-2.5 py-0.5 text-xs font-bold text-brand-green tabular-nums">
                {fmtDuration(durationSec)}
              </span>
            </div>
            <input
              type="range"
              min={10}
              max={300}
              step={10}
              value={durationSec}
              onChange={(e) => setDurationSec(Number(e.target.value))}
              className="w-full accent-brand-green cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-bold text-zinc-400">
              <span>0:10</span>
              <span>5:00</span>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wide text-zinc-400">Language</label>
            <div className="flex gap-2">
              {(["english", "hindi", "hinglish"] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setLanguage(l)}
                  className={`rounded-lg border px-4 py-2 text-xs font-bold capitalize transition-colors ${
                    language === l ? "border-brand-green bg-brand-green-light text-brand-green" : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                  } cursor-pointer`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={generateScript}
              disabled={generatingScript}
              className="flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-green px-8 text-sm font-bold text-white shadow-sm transition-all hover:bg-brand-green-hover active:scale-[0.99] disabled:opacity-60 cursor-pointer"
            >
              {generatingScript ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              {generatingScript ? "Generating…" : "Generate Script"}
            </button>
            <span className="text-xs text-zinc-350 select-none">or</span>
            <button
              type="button"
              onClick={() => { setScript(""); setScriptIsManual(true); setStep(2); }}
              className="flex h-11 items-center justify-center gap-2 rounded-xl border border-zinc-200 px-6 text-sm font-bold text-zinc-600 hover:bg-zinc-50 hover:border-zinc-300 transition-colors cursor-pointer"
            >
              Write manually
            </button>
          </div>
        </div>
      )}

      {/* STEP 2 — Script review */}
      {step === 2 && (
        <div className="space-y-4 rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-zinc-900">{scriptIsManual ? "Write your script" : "Review your script"}</h2>
            <span className="rounded-full bg-brand-green-light px-2.5 py-0.5 text-[10px] font-bold text-brand-green">
              {script.trim().split(/\s+/).filter(Boolean).length} words
            </span>
          </div>
          <textarea
            value={script}
            onChange={(e) => setScript(e.target.value)}
            rows={14}
            className="w-full resize-none rounded-xl border border-zinc-200 p-4 font-mono text-sm leading-relaxed outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20"
          />
          <div className="flex items-center justify-between">
            <div className="flex gap-3">
              <button
                onClick={() => { navigator.clipboard.writeText(script); toast.success("Copied"); }}
                className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-zinc-800 cursor-pointer"
              >
                <Copy size={14} /> Copy
              </button>
              <button
                onClick={generateScript}
                disabled={generatingScript}
                className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-zinc-800 cursor-pointer"
              >
                <RotateCcw size={14} className={generatingScript ? "animate-spin" : ""} /> Regenerate
              </button>
            </div>
            <button
              onClick={saveScriptAndContinue}
              className="flex h-11 items-center gap-2 rounded-xl bg-brand-green px-6 text-sm font-bold text-white shadow-sm hover:bg-brand-green-hover active:scale-[0.99] cursor-pointer"
            >
              Continue to Voice <Sparkles size={14} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3 — Voice */}
      {step === 3 && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="space-y-5 rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm lg:col-span-7">
            <h2 className="text-lg font-bold text-zinc-900">Choose a voice</h2>
            <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
              {voices.length === 0 && (
                <p className="rounded-xl border border-dashed border-zinc-200 py-6 text-center text-xs text-zinc-400">
                  No voices found. Configure an ElevenLabs key in workspace API settings.
                </p>
              )}
              {voices.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setVoiceId(v.id)}
                  className={`flex w-full items-center justify-between rounded-2xl border p-3.5 text-left transition-all ${
                    voiceId === v.id ? "border-brand-green bg-brand-green-light/20" : "border-zinc-200 hover:bg-zinc-50"
                  } cursor-pointer`}
                >
                  <div>
                    <p className="text-xs font-bold text-zinc-900">{v.name}</p>
                    <p className="text-[10px] font-semibold text-zinc-400">{v.description || v.gender}</p>
                  </div>
                  {voiceId === v.id && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-green text-white">
                      <Check size={12} strokeWidth={3} />
                    </span>
                  )}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Slider label="Stability" value={stability} onChange={setStability} />
              <Slider label="Clarity / Similarity" value={similarity} onChange={setSimilarity} />
              <Slider label="Style" value={style} onChange={setStyle} />
              <Slider label="Speed" value={speed} min={0.5} max={2} onChange={setSpeed} />
            </div>
            <label className="flex items-center gap-2 text-xs font-bold text-zinc-600">
              <input type="checkbox" checked={speakerBoost} onChange={(e) => setSpeakerBoost(e.target.checked)} className="accent-brand-green" />
              Speaker boost
            </label>
            <button
              onClick={generatePreview}
              disabled={previewing}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-700 hover:bg-zinc-50 disabled:opacity-60 cursor-pointer"
            >
              {previewing ? <Loader2 size={14} className="animate-spin" /> : <Volume2 size={14} />}
              Generate Preview
            </button>
          </div>

          <div className="flex flex-col justify-between space-y-5 rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm lg:col-span-5">
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-zinc-900">Audio</h2>
              {previewUrl && (
                <div>
                  <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-zinc-400">Preview</p>
                  <AudioPlayer src={previewUrl} />
                </div>
              )}
              {audioUrl && (
                <div>
                  <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-brand-green">
                    <Check size={12} strokeWidth={3} /> Audio created successfully
                  </p>
                  <AudioPlayer src={audioUrl} downloadName={`voice-${projectId}.mp3`} />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <button
                onClick={generateVoice}
                disabled={generatingVoice}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-green text-sm font-bold text-white shadow-sm hover:bg-brand-green-hover active:scale-[0.99] disabled:opacity-60 cursor-pointer"
              >
                {generatingVoice ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
                {generatingVoice ? "Synthesizing…" : "Generate Voice"}
              </button>
              <button
                onClick={() => setStep(4)}
                disabled={!audioUrl}
                className="h-11 w-full rounded-xl border border-zinc-200 text-sm font-bold text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 cursor-pointer"
              >
                Continue to Video
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4 — Avatar */}
      {step === 4 && (
        <div className="space-y-5 rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-zinc-900">Select an avatar</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {avatars.map((a) => (
              <button
                key={a.id}
                onClick={() => setAvatarId(a.id)}
                className={`overflow-hidden rounded-xl border text-left transition-all ${
                  avatarId === a.id ? "border-brand-green ring-2 ring-brand-green/30" : "border-zinc-200 hover:border-zinc-300"
                } cursor-pointer`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={a.preview_image_url} alt={a.name} className="h-28 w-full object-contain bg-zinc-50" />
                <div className="p-2">
                  <p className="truncate text-[11px] font-bold text-zinc-800">{a.name}</p>
                  <p className="truncate text-[9px] font-semibold text-zinc-400">{a.description}</p>
                </div>
              </button>
            ))}
          </div>

          {avatarId && (
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 flex flex-col md:flex-row gap-4 items-center transition-all">
              {(() => {
                const selected = avatars.find((a) => a.id === avatarId);
                if (!selected) return null;
                return (
                  <>
                    <div className="w-full md:w-56 aspect-video md:aspect-[4/3] rounded-xl overflow-hidden bg-zinc-50 flex-shrink-0 shadow-sm border border-zinc-200">
                      {selected.preview_video_url ? (
                        <video
                          key={selected.id}
                          src={selected.preview_video_url}
                          controls
                          className="h-full w-full object-contain bg-black"
                          poster={selected.preview_image_url}
                        />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={selected.preview_image_url}
                          alt={selected.name}
                          className="h-full w-full object-contain"
                        />
                      )}
                    </div>
                    <div className="flex-1 text-center md:text-left space-y-1.5">
                      <p className="text-sm font-bold text-zinc-900">Selected Avatar: {selected.name}</p>
                      <p className="text-xs text-zinc-500">{selected.description}</p>
                      {selected.preview_video_url ? (
                        <p className="text-[10px] text-zinc-400 font-medium leading-relaxed">
                          Play the preview video to review this avatar's visual appearance and natural movement.
                        </p>
                      ) : (
                        <p className="text-[10px] text-zinc-400 font-medium leading-relaxed">
                          No preview video available. A static image is shown.
                        </p>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              value={customAvatar}
              onChange={(e) => setCustomAvatar(e.target.value)}
              placeholder="Custom HeyGen avatar ID"
              className="flex-1 rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20"
            />
            <button onClick={verifyCustomAvatar} className="rounded-xl border border-zinc-200 px-4 py-2.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50 cursor-pointer">
              Verify
            </button>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wide text-zinc-400">Aspect ratio</label>
            <div className="flex gap-2">
              {ASPECTS.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setAspect(a.id)}
                  className={`rounded-lg border px-4 py-2 text-xs font-bold transition-colors ${
                    aspect === a.id ? "border-brand-green bg-brand-green-light text-brand-green" : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                  } cursor-pointer`}
                >
                  {a.label} ({a.id})
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={generateVideo}
            disabled={generatingVideo}
            className="flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-green px-8 text-sm font-bold text-white shadow-sm hover:bg-brand-green-hover active:scale-[0.99] disabled:opacity-60 cursor-pointer"
          >
            {generatingVideo ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {generatingVideo ? "Rendering… (this can take a few minutes)" : "Generate Avatar Video with HeyGen"}
          </button>
        </div>
      )}

      {/* STEP 5 — Export */}
      {step === 5 && (
        <div className="space-y-5 rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-zinc-900">Your video is ready</h2>
          {videoUrl ? (
            <div className={`mx-auto w-full max-w-2xl overflow-hidden rounded-xl bg-black ${ASPECTS.find((a) => a.id === aspect)?.box}`}>
              <video src={videoUrl} controls className="h-full w-full" />
            </div>
          ) : (
            <p className="text-sm text-zinc-400">No rendered video found.</p>
          )}
          <div className="flex flex-wrap gap-3">
            <button onClick={downloadVideo} className="flex items-center gap-1.5 rounded-xl bg-brand-green px-4 py-2.5 text-xs font-bold text-white hover:bg-brand-green-hover cursor-pointer">
              <Download size={14} /> Download
            </button>
            <button
              onClick={() => { if (videoUrl) { navigator.clipboard.writeText(videoUrl); toast.success("Link copied"); } }}
              className="flex items-center gap-1.5 rounded-xl border border-zinc-200 px-4 py-2.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50 cursor-pointer"
            >
              <Copy size={14} /> Copy Link
            </button>
            <a href={videoUrl ?? "#"} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 rounded-xl border border-zinc-200 px-4 py-2.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50">
              <ExternalLink size={14} /> Open in New Tab
            </a>
            <button onClick={() => setSubmagicOpen(true)} className="flex items-center gap-1.5 rounded-xl border border-zinc-200 px-4 py-2.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50 cursor-pointer">
              <Wand2 size={14} /> AI Edit with Submagic
            </button>
            <button onClick={() => setSendToEditorOpen(true)} className="flex items-center gap-1.5 rounded-xl border border-zinc-200 px-4 py-2.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50 cursor-pointer">
              <UserCheck size={14} /> Send to Editor
            </button>
            <button onClick={() => setVersionsOpen(true)} className="flex items-center gap-1.5 rounded-xl border border-zinc-200 px-4 py-2.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50 cursor-pointer">
              <Layers size={14} /> Manage Versions
            </button>
            <Link
              href={`/dashboard/user/projects/${projectId}/publish`}
              className="flex items-center gap-1.5 rounded-xl border border-zinc-200 px-4 py-2.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50"
            >
              <ExternalLink size={14} /> Publish
            </Link>
          </div>
        </div>
      )}

      <SubmagicEditDrawer projectId={projectId} open={submagicOpen} onClose={() => setSubmagicOpen(false)} />
      <VideoVersionsManager projectId={projectId} open={versionsOpen} onClose={() => setVersionsOpen(false)} />
      <SendToEditorModal
        projectId={projectId}
        isOpen={sendToEditorOpen}
        onClose={() => setSendToEditorOpen(false)}
        sourceVideoUrl={videoUrl}
        onApproved={() => setRefreshTrigger((prev) => prev + 1)}
      />
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold uppercase tracking-wide text-zinc-400">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20"
      />
    </div>
  );
}

function Slider({
  label,
  value,
  onChange,
  min = 0,
  max = 1,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase text-zinc-400">{label}</span>
        <span className="text-xs font-bold text-zinc-700">{value.toFixed(2)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={0.05}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-zinc-200 accent-brand-green"
      />
    </div>
  );
}
