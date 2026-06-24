"use client";

import { useRef, useState } from "react";
import { Play, Pause, Download } from "lucide-react";

function fmt(seconds: number): string {
  if (!Number.isFinite(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

// Lightweight audio player around a real <audio> element. Used for voice
// previews and the committed narration track in the pipeline wizard.
export default function AudioPlayer({
  src,
  downloadName,
}: {
  src: string;
  downloadName?: string;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);

  const toggle = () => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) el.pause();
    else el.play().catch(() => {});
  };

  return (
    <div className="w-full rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <audio
        ref={audioRef}
        src={src}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onLoadStart={() => {
          setPlaying(false);
          setCurrent(0);
        }}
      />
      <div className="flex items-center gap-3">
        <button
          onClick={toggle}
          className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-brand-green text-white shadow-sm transition-transform hover:scale-105 active:scale-95 cursor-pointer"
          title={playing ? "Pause" : "Play"}
        >
          {playing ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="translate-x-[1px]" />}
        </button>
        <div className="flex-1">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-200">
            <div
              className="h-full bg-brand-green transition-all"
              style={{ width: duration ? `${(current / duration) * 100}%` : "0%" }}
            />
          </div>
          <div className="mt-1 flex justify-between text-[11px] font-bold text-zinc-400">
            <span>{fmt(current)}</span>
            <span>{fmt(duration)}</span>
          </div>
        </div>
        {downloadName && (
          <a
            href={src}
            download={downloadName}
            className="p-2 text-zinc-400 transition-colors hover:text-zinc-700"
            title="Download audio"
          >
            <Download size={18} />
          </a>
        )}
      </div>
    </div>
  );
}
