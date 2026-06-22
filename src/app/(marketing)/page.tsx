import Link from "next/link";
import Image from "next/image";
import {
  Sparkles,
  ArrowRight,
  Play,
  Film,
  Sparkle,
  Sliders,
  AudioLines,
  Smile,
  Mic,
  Maximize2,
} from "lucide-react";

export default function MarketingPage() {
  return (
    <div className="relative overflow-hidden min-h-screen py-16 md:py-24">
      {/* Background spotlights */}
      <div className="glow-spotlight right-[-100px] top-[100px]" />
      <div className="glow-spotlight-yellow right-[100px] top-[200px]" />
      <div className="glow-spotlight left-[-150px] bottom-[100px]" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Content */}
          <div className="lg:col-span-5 space-y-8 text-left">
            {/* AI Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 text-[10px] md:text-xs font-bold tracking-wider uppercase select-none animate-fade-in">
              <Sparkles size={12} className="text-emerald-700" />
              AI-Powered Video Platform
            </div>

            {/* Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-zinc-900 leading-[1.1] md:leading-[1.05]">
              Create Professional <br className="hidden md:inline" />
              Videos at Scale
            </h1>

            {/* Subhead */}
            <p className="text-zinc-500 text-base md:text-lg leading-relaxed font-medium max-w-xl">
              Automate your video production workflow with AI. From script to screen in minutes,
              maintaining your brand's earthy professional aesthetic.
            </p>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <Link
                href="/auth/register"
                id="cta-start-trial"
                className="inline-flex items-center justify-center h-12 px-8 text-sm font-extrabold text-white bg-brand-green hover:bg-brand-green-hover rounded-xl shadow-lg shadow-emerald-700/10 transition-all hover:translate-y-[-1px] active:translate-y-[0]"
              >
                Start Free Trial
                <ArrowRight size={16} className="ml-2" />
              </Link>
              <Link
                href="#demo"
                id="cta-watch-demo"
                className="inline-flex items-center justify-center h-12 px-8 text-sm font-extrabold text-zinc-800 bg-zinc-100/60 hover:bg-zinc-200/60 border border-zinc-200/50 rounded-xl transition-all hover:translate-y-[-1px] active:translate-y-[0]"
              >
                Watch Demo
                <Play size={14} fill="currentColor" className="ml-2 translate-y-[0.5px]" />
              </Link>
            </div>

            {/* Divider line */}
            <hr className="border-zinc-200/80" />

            {/* Trusted Teams */}
            <div className="space-y-3 pt-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 select-none block">
                Trusted by Innovative Teams
              </span>
              <div className="flex flex-wrap items-center gap-x-8 gap-y-4 text-sm font-extrabold text-zinc-400 select-none">
                <span className="hover:text-zinc-600 transition-colors">ACME Corp</span>
                <span className="hover:text-zinc-600 transition-colors">Globex</span>
                <span className="hover:text-zinc-600 transition-colors">Soylent</span>
                <span className="hover:text-zinc-600 transition-colors">Initech</span>
                <span className="hover:text-zinc-600 transition-colors">Umbrella</span>
              </div>
            </div>
          </div>

          {/* Right Column: Visual Mockup */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center">
            {/* The Main Mockup App Window */}
            <div className="w-full max-w-2xl bg-white rounded-2xl border border-zinc-200/80 shadow-2xl shadow-zinc-800/10 overflow-hidden transform lg:rotate-[2deg] hover:rotate-0 transition-all duration-500 hover:scale-[1.01]">
              {/* Mockup Header/Titlebar */}
              <div className="h-10 border-b border-zinc-150 bg-zinc-50 px-4 flex items-center justify-between select-none">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400" />
                </div>
                <div className="text-[10px] font-bold text-zinc-400 tracking-wide uppercase">
                  UChat Video Editor Pro
                </div>
                <Maximize2 size={12} className="text-zinc-300" />
              </div>

              {/* Mockup App Interface */}
              <div className="grid grid-cols-12 h-[340px] bg-zinc-50 text-zinc-800">
                {/* 1. Left Sidebar Navigation */}
                <div className="col-span-2 bg-white border-r border-zinc-150 flex flex-col justify-between py-4 items-center">
                  <div className="flex flex-col gap-5 w-full px-2">
                    <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-zinc-50 border border-zinc-100 text-zinc-800 hover:bg-zinc-100 transition-colors cursor-pointer select-none">
                      <Film size={16} className="text-brand-green" />
                      <span className="text-[8px] font-bold">Video</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 p-2 rounded-lg text-zinc-400 hover:bg-zinc-50 hover:text-zinc-700 transition-colors cursor-pointer select-none">
                      <Sparkle size={16} />
                      <span className="text-[8px] font-semibold">Effects</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 p-2 rounded-lg text-zinc-400 hover:bg-zinc-50 hover:text-zinc-700 transition-colors cursor-pointer select-none">
                      <Sliders size={16} />
                      <span className="text-[8px] font-semibold">Timeline</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 p-2 rounded-lg text-zinc-400 hover:bg-zinc-50 hover:text-zinc-700 transition-colors cursor-pointer select-none">
                      <Mic size={16} />
                      <span className="text-[8px] font-semibold">Voice</span>
                    </div>
                  </div>
                  <div className="w-7 h-7 rounded-full bg-brand-green-light border border-brand-green/20 flex items-center justify-center text-brand-green text-[10px] font-bold cursor-pointer hover:bg-brand-green hover:text-white transition-colors">
                    JD
                  </div>
                </div>

                {/* 2. Main Editing Preview / Timeline */}
                <div className="col-span-6 flex flex-col h-full bg-zinc-50">
                  {/* Video Preview */}
                  <div className="flex-1 bg-zinc-900 m-3 rounded-lg overflow-hidden relative shadow-inner flex items-center justify-center">
                    <Image
                      src="/mountain-sunset.png"
                      alt="Scenic sunset hiker preview"
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover opacity-90"
                      priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                    {/* Tiny Play indicator */}
                    <div className="absolute bottom-2.5 left-2.5 px-2 py-1 rounded bg-black/60 backdrop-blur-xs text-[8px] font-bold text-white tracking-widest flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      00:14 / 01:30
                    </div>
                  </div>

                  {/* Timeline Tracks */}
                  <div className="h-[120px] bg-white border-t border-zinc-150 p-2 space-y-1.5 overflow-hidden">
                    {/* Track 1: Script */}
                    <div className="flex items-center gap-2">
                      <span className="text-[8px] font-bold text-zinc-400 w-10">Script</span>
                      <div className="flex-1 h-5 rounded bg-brand-green-light border border-brand-green/10 flex items-center px-2">
                        <span className="text-[8px] font-bold text-brand-green truncate">
                          Automate your video production workflow...
                        </span>
                      </div>
                    </div>
                    {/* Track 2: Video Clips */}
                    <div className="flex items-center gap-2">
                      <span className="text-[8px] font-bold text-zinc-400 w-10">Video</span>
                      <div className="flex-1 flex gap-1 h-5">
                        <div className="w-[45%] h-full rounded bg-emerald-700/10 border border-emerald-700/20 flex items-center justify-between px-2 text-emerald-800">
                          <span className="text-[8px] font-bold truncate">hiker_standing.mp4</span>
                        </div>
                        <div className="w-[30%] h-full rounded bg-emerald-600/10 border border-emerald-600/20 flex items-center justify-between px-2 text-emerald-700">
                          <span className="text-[8px] font-bold truncate">sunset_landscape.mp4</span>
                        </div>
                        <div className="w-[20%] h-full rounded bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between px-2 text-emerald-600" />
                      </div>
                    </div>
                    {/* Track 3: Audio/Voice */}
                    <div className="flex items-center gap-2">
                      <span className="text-[8px] font-bold text-zinc-400 w-10">Voice</span>
                      <div className="flex-1 h-5 rounded bg-violet-500/10 border border-violet-500/20 flex items-center justify-between px-2 text-violet-700">
                        <div className="flex items-center gap-1 w-full">
                          <AudioLines size={10} className="shrink-0" />
                          <span className="text-[8px] font-bold truncate">Voiceover-EarthyEnglish.wav</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Right Settings Bar */}
                <div className="col-span-4 bg-white border-l border-zinc-150 p-3 flex flex-col gap-4 overflow-y-auto">
                  {/* AI Script prompt */}
                  <div className="space-y-1">
                    <label className="text-[8px] font-extrabold uppercase tracking-wide text-zinc-400">
                      AI Script
                    </label>
                    <textarea
                      disabled
                      value="Create a marketing video explaining how UChat Video helps modern teams make professional videos at scale."
                      className="w-full text-[9px] font-semibold p-2 border border-zinc-200 rounded-md bg-zinc-50 resize-none h-14 focus:outline-none"
                    />
                  </div>

                  {/* Voice Settings */}
                  <div className="space-y-2">
                    <label className="text-[8px] font-extrabold uppercase tracking-wide text-zinc-400 block">
                      Voice Settings
                    </label>
                    <div className="space-y-1.5">
                      <div>
                        <span className="text-[8px] font-bold text-zinc-500">AI Voice Type</span>
                        <div className="w-full text-[9px] font-semibold px-2 py-1 border border-zinc-200 roundedbg-zinc-50 flex justify-between items-center bg-zinc-50">
                          Earthy & Professional
                        </div>
                      </div>
                      <div>
                        <span className="text-[8px] font-bold text-zinc-500">Voice Name</span>
                        <div className="w-full text-[9px] font-semibold px-2 py-1 border border-zinc-200 roundedbg-zinc-50 flex justify-between items-center bg-zinc-50">
                          Sarah (US Warm)
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Waveform graphic */}
                  <div className="flex-1 bg-zinc-50 border border-zinc-100 rounded-lg p-2 flex flex-col justify-between">
                    <span className="text-[8px] font-bold text-zinc-400">Audio Waveform</span>
                    <div className="flex items-end justify-between h-8 px-1">
                      {[30, 60, 45, 80, 50, 95, 40, 75, 60, 90, 70, 85, 30, 65, 45, 75, 50].map(
                        (h, idx) => (
                          <div
                            key={idx}
                            className="w-[3px] bg-brand-green rounded-full"
                            style={{ height: `${h}%` }}
                          />
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Overlapping Skeletal Underlay Cards */}
            <div className="w-[92%] mt-[-10px] space-y-2.5 z-0 select-none">
              <div className="bg-brand-green-light border border-brand-green/10 rounded-xl px-5 py-3 shadow-md flex items-center justify-between text-xs transition-colors hover:bg-emerald-50/50">
                <span className="font-extrabold text-brand-green flex items-center gap-1.5">
                  <Sparkles size={14} />
                  Voice generation completed.
                </span>
                <span className="font-bold text-zinc-400 text-[10px]">100% synced</span>
              </div>
              <div className="bg-zinc-100/90 border border-zinc-200/50 rounded-xl px-5 py-3 shadow-md flex items-center justify-between text-xs">
                <span className="font-bold text-zinc-700">Subtitles auto-generated.</span>
                <span className="font-bold text-zinc-400 text-[10px]">99 languages</span>
              </div>
              <div className="bg-orange-50 border border-orange-100 rounded-xl px-5 py-3 shadow-md flex items-center justify-between text-xs">
                <span className="font-bold text-orange-800 flex items-center gap-1.5">
                  <Smile size={14} className="text-orange-600" />
                  Earthy warm aesthetic applied.
                </span>
                <span className="font-bold text-orange-400 text-[10px]">active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
