"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Search,
  Calendar,
  User,
  ArrowRight,
  ExternalLink,
  Download,
  Play,
} from "lucide-react";
import { toast } from "sonner";
import { getStoredProjects, UserProject } from "../../../utils/storage";

type CompletedTaskItem = {
  id: string;
  name: string;
  from: string;
  tag: string;
  tagBg: string;
  completedAt: string;
  length: string;
  rating?: string;
  views?: string;
};

export default function EditorCompletedPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [projects, setProjects] = useState<UserProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setProjects(getStoredProjects());
    setLoading(false);
  }, []);

  const handleDownload = (name: string) => {
    toast.success(`Starting download of final render: "${name}"`);
  };

  const getProjectTag = (p: UserProject) => {
    if (p.id === "comp-1") return "Video Render";
    if (p.id === "comp-2") return "AI Editing";
    if (p.id === "comp-3") return "Captioning";
    if (p.id === "comp-4") return "Motion Graphics";
    return p.editMethod === "AI" ? "AI Editing" : "Human Editing";
  };

  const getProjectTagBg = (p: UserProject) => {
    if (p.id === "comp-1") return "bg-emerald-50 text-emerald-700 border-emerald-100";
    if (p.id === "comp-2") return "bg-blue-50 text-blue-700 border-blue-100";
    if (p.id === "comp-3") return "bg-pink-50 text-pink-700 border-pink-100";
    if (p.id === "comp-4") return "bg-amber-50 text-amber-700 border-amber-100";
    return p.editMethod === "AI" ? "bg-blue-50 text-blue-700 border-blue-100" : "bg-emerald-50 text-emerald-700 border-emerald-100";
  };

  const completedProjects = projects.filter(p => p.status === "Completed");

  const completedTasks: CompletedTaskItem[] = completedProjects.map((p) => {
    let rating: string | undefined = undefined;
    let views: string | undefined = undefined;
    if (p.id === "comp-1") { rating = "5.0"; views = "1,200"; }
    else if (p.id === "comp-2") { rating = "4.8"; views = "340"; }
    else if (p.id === "comp-3") { rating = "5.0"; views = "4,500"; }
    else if (p.id === "comp-4") { rating = "4.9"; views = "25,400"; }

    return {
      id: p.id,
      name: p.name,
      from: p.creator || "Sarah Johnson",
      tag: getProjectTag(p),
      tagBg: getProjectTagBg(p),
      completedAt: p.dueDate ? p.dueDate.replace("Due: ", "") : "Jun 20, 2026",
      length: p.estDuration || p.duration || "2:00",
      rating: rating,
      views: views,
    };
  });

  const filteredTasks = completedTasks.filter((t) => {
    return (
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.tag.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <main className="flex-1 overflow-y-auto px-8 py-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">Completed Projects</h1>
              <span className="text-xs font-bold px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">
                {completedTasks.length} Total
              </span>
            </div>
            <p className="text-sm font-semibold text-zinc-400">
              Browse finished productions, download deliverables, and inspect metrics.
            </p>
          </div>

        </div>

        {/* Statistics Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-2xs text-left">
            <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block">
              Total Clips Completed
            </span>
            <div className="text-3xl font-extrabold text-zinc-900 mt-1 select-none flex items-center gap-2">
              {completedTasks.length} <span className="text-xs text-emerald-500 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">+4 this week</span>
            </div>
          </div>
          <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-2xs text-left">
            <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block">
              Average Client Rating
            </span>
            <div className="text-3xl font-extrabold text-zinc-900 mt-1 select-none">
              4.92<span className="text-xs text-zinc-400 font-bold"> / 5.0</span>
            </div>
          </div>
          <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-2xs text-left">
            <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block">
              Total Render Time Saved
            </span>
            <div className="text-3xl font-extrabold text-zinc-900 mt-1 select-none">
              12.4 hrs
            </div>
          </div>
        </div>

        {/* Completed Tasks Cards */}
        {filteredTasks.length === 0 ? (
          <div className="bg-white border border-zinc-200 rounded-2xl p-16 text-center shadow-xs">
            <span className="text-3xl block mb-2">🔍</span>
            <h3 className="text-sm font-bold text-zinc-800">No completed tasks found</h3>
            <p className="text-xs font-semibold text-zinc-400 mt-1">
              Try adjusting your search criteria.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredTasks.map((t) => (
              <div
                key={t.id}
                className="bg-white border border-zinc-200 hover:border-brand-green hover:shadow-xs rounded-2xl p-6 shadow-2xs transition-all text-left space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 text-[9px] font-extrabold rounded flex items-center gap-1 shadow-3xs">
                      <CheckCircle2 size={10} />
                      COMPLETED
                    </span>
                    <span className="text-[10px] font-semibold text-zinc-400 flex items-center gap-1">
                      <Calendar size={12} />
                      {t.completedAt}
                    </span>
                  </div>

                  <h4 className="text-sm font-extrabold text-zinc-950 leading-snug pt-1">
                    {t.name}
                  </h4>
                  <p className="text-xs text-zinc-450">
                    Client: <span className="font-bold text-zinc-700">{t.from}</span>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-zinc-450 select-none">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold border ${t.tagBg}`}>
                    {t.tag}
                  </span>
                  <span className="bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded font-bold">
                    Length: {t.length}
                  </span>
                  {t.rating && (
                    <span className="bg-amber-50 text-amber-600 border border-amber-100 px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5">
                      ⭐ {t.rating}
                    </span>
                  )}
                  {t.views && (
                    <span className="bg-blue-50 text-blue-650 border border-blue-100 px-1.5 py-0.5 rounded font-bold">
                      {t.views} views
                    </span>
                  )}
                </div>

                <hr className="border-zinc-100" />

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] font-bold text-zinc-400">
                    ID: {t.id.toUpperCase()}
                  </span>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDownload(t.name)}
                      className="h-8 w-8 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 hover:text-zinc-950 rounded-lg transition-all cursor-pointer flex items-center justify-center active:scale-95"
                      title="Download Deliverables"
                    >
                      <Download size={14} />
                    </button>
                    <button
                      onClick={() => toast.success(`Playing final rendering stream for: "${t.name}"`)}
                      className="h-8 px-3 bg-brand-green hover:bg-brand-green-hover text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5 active:scale-[0.98]"
                    >
                      <Play size={12} className="fill-white" />
                      View Clip
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
