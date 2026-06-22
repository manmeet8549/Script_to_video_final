"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Clock,
  Play,
  FileCheck,
  CheckCircle,
  Bell,
  HelpCircle,
  Search,
  Settings,
  MoreVertical,
  Star,
  Trophy,
  X,
  Check,
  Calendar,
  Layers,
} from "lucide-react";
import { toast } from "sonner";
import { getStoredProjects, updateStoredProject, UserProject } from "../../utils/storage";

export default function EditorDashboardPage() {
  const router = useRouter();

  const [projects, setProjects] = useState<UserProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setProjects(getStoredProjects());
    setLoading(false);
  }, []);

  const pendingProjects = projects.filter(p => p.stage === "Video Editing");
  const inProgressProjects = projects.filter(p => p.stage === "Editing");
  const underReviewProjects = projects.filter(p => p.stage === "Under Review");
  const completedProjects = projects.filter(p => p.status === "Completed");

  const pendingCount = pendingProjects.length;
  const inProgressCount = inProgressProjects.length;
  const underReviewCount = underReviewProjects.length;
  const completedCount = completedProjects.length;

  const handleAcceptRequest = (id: string, name: string) => {
    updateStoredProject(id, { stage: "Editing", progress: 85, lastUpdated: "Just now" });
    setProjects(getStoredProjects());
    toast.success(`Request accepted and moved to In Progress: "${name}"`);
  };

  const handleDeclineRequest = (id: string, name: string) => {
    updateStoredProject(id, { editMethod: null, stage: "Idea Selection", lastUpdated: "Just now" });
    setProjects(getStoredProjects());
    toast.info(`Request declined: "${name}"`);
  };

  const handleCardTitleClick = (id: string) => {
    router.push(`/dashboard/editor/tasks/${id}/edit`);
  };

  const getProjectTag = (p: UserProject) => {
    if (p.id === "req-1") return "AI Editing";
    if (p.id === "req-2") return "Color Grading";
    if (p.id === "req-3") return "Motion Graphics";
    return p.stylePreset || "Video Editing";
  };

  const getProjectTagBg = (p: UserProject) => {
    if (p.id === "req-1") return "bg-emerald-50 text-brand-green border-emerald-100";
    if (p.id === "req-2") return "bg-purple-50 text-purple-700 border-purple-100";
    if (p.id === "req-3") return "bg-amber-50 text-amber-700 border-amber-100";
    
    if (p.priority === "High") return "bg-red-50 text-red-700 border-red-100";
    if (p.priority === "Medium") return "bg-amber-50 text-amber-700 border-amber-100";
    return "bg-zinc-50 text-zinc-750 border-zinc-100";
  };

  const requests = pendingProjects.map(p => ({
    id: p.id,
    name: p.name,
    from: p.creator || "Sarah Johnson",
    tag: getProjectTag(p),
    tagBg: getProjectTagBg(p).split(" ")[0],
    tagText: getProjectTagBg(p).split(" ").slice(1).join(" "),
    deadline: p.dueDate || "Jun 25, 5:00 PM",
  }));

  // Weekly Completion Chart Data
  const weeklyData = [
    { day: "Mon", count: 4, height: 40 },
    { day: "Tue", count: 6, height: 60 },
    { day: "Wed", count: 8, height: 80 },
    { day: "Thu", count: 5, height: 50 },
    { day: "Fri", count: 9, height: 90 },
    { day: "Sat", count: 2, height: 20 },
    { day: "Sun", count: 1, height: 10 },
  ];

  return (
    <>
      {/* Dashboard Body */}
      <main className="flex-1 overflow-y-auto px-8 py-8">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 text-left">
              Dashboard Overview
            </h1>
          </div>

          {/* KPI Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: "Pending", val: pendingCount, icon: "📁", color: "text-red-500 bg-red-50/50" },
              { label: "In Progress", val: inProgressCount, icon: "⏳", color: "text-amber-500 bg-amber-50/50" },
              { label: "Under Review", val: underReviewCount, icon: "📝", color: "text-zinc-500 bg-zinc-50" },
              { label: "Completed", val: completedCount, icon: "✅", color: "text-emerald-500 bg-emerald-50/50" },
            ].map((kpi, idx) => (
              <div
                key={idx}
                className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-all flex items-center justify-between"
              >
                <div className="space-y-1 text-left">
                  <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wide">
                    {kpi.label}
                  </span>
                  <span className="text-3xl font-extrabold text-zinc-955 block mt-1 tracking-tight">
                    {kpi.val}
                  </span>
                </div>
                <div className={`w-10 h-10 rounded-xl border border-zinc-150/45 flex items-center justify-center text-lg shadow-3xs select-none ${kpi.color}`}>
                  {kpi.icon}
                </div>
              </div>
            ))}
          </div>

          {/* Split Section: Requests (60%) vs Performance (40%) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Requests */}
            <div className="lg:col-span-7 bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-5">
              <div className="flex justify-between items-center border-b border-zinc-100 pb-2.5 select-none">
                <h3 className="text-sm font-extrabold text-zinc-800 uppercase tracking-wide">
                  New Requests
                </h3>
                <button
                  onClick={() => toast.info("Displaying all pending editor requests...")}
                  className="text-xs font-bold text-brand-green hover:underline cursor-pointer"
                >
                  View All
                </button>
              </div>

              {requests.length === 0 ? (
                <div className="py-16 text-center text-zinc-400 text-xs font-bold">
                  🎉 All pending requests accepted!
                </div>
              ) : (
                <div className="space-y-4">
                  {requests.map((req) => (
                    <div
                      key={req.id}
                      className="border border-zinc-150 rounded-2xl p-5 hover:border-zinc-350 hover:shadow-2xs transition-all text-left space-y-3.5"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1.5">
                          <span className="inline-block px-1.5 py-0.5 bg-red-50 text-red-750 border border-red-100 rounded text-[9px] font-extrabold select-none">
                            NEW REQUEST
                          </span>
                          <h4
                            onClick={() => handleCardTitleClick(req.id)}
                            className="text-xs font-extrabold text-zinc-955 hover:text-brand-green cursor-pointer transition-colors block leading-tight pt-1"
                          >
                            {req.name}
                          </h4>
                          <span className="text-[10px] font-semibold text-zinc-400 block">
                            From: {req.from} •{" "}
                            <span className={`px-1.5 py-0.25 border rounded text-[9px] font-extrabold ${req.tagBg} ${req.tagText}`}>
                              {req.tag}
                            </span>
                          </span>
                        </div>
                        
                        <span className="text-[10px] font-bold text-zinc-400 flex items-center gap-1 shrink-0 select-none">
                          <Calendar size={12} />
                          {req.deadline}
                        </span>
                      </div>

                      {/* Accept / Decline actions */}
                      <div className="flex items-center gap-2 pt-1 select-none">
                        <button
                          onClick={() => handleAcceptRequest(req.id, req.name)}
                          className="h-8 px-4 bg-brand-green hover:bg-brand-green-hover text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-[0.98]"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleDeclineRequest(req.id, req.name)}
                          className="h-8 px-4 border border-zinc-200 hover:bg-zinc-50 text-zinc-707 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: Performance Scorecard */}
            <div className="lg:col-span-5 space-y-6">
              {/* Scorecards */}
              <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm space-y-5 select-none text-left">
                <h3 className="text-sm font-extrabold text-zinc-800 uppercase tracking-wide border-b border-zinc-100 pb-2">
                  My Performance
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-zinc-50 border border-zinc-150 rounded-xl p-3.5">
                    <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wide block">
                      Avg Turnaround
                    </span>
                    <span className="text-base font-extrabold text-zinc-850 block mt-1">
                      4.2 hrs
                    </span>
                  </div>
                  <div className="bg-zinc-50 border border-zinc-150 rounded-xl p-3.5">
                    <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wide block">
                      Tasks This Week
                    </span>
                    <span className="text-base font-extrabold text-zinc-850 block mt-1">
                      12
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-zinc-50 border border-zinc-150 rounded-xl">
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-zinc-400 uppercase block">
                      Current Rating
                    </span>
                    <div className="flex items-center gap-1 pt-0.5">
                      <span className="text-base font-extrabold text-zinc-850 mr-1">4.8</span>
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={11} fill="#eab308" className="text-yellow-500" />
                      ))}
                    </div>
                  </div>
                  <div className="w-8.5 h-8.5 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-500 shadow-3xs">
                    <Trophy size={16} />
                  </div>
                </div>
              </div>

              {/* Completion line chart */}
              <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm space-y-4 select-none">
                <h3 className="text-sm font-extrabold text-zinc-800 uppercase tracking-wide border-b border-zinc-100 pb-2 text-left">
                  Tasks Completed (This Week)
                </h3>

                {/* SVG Line / Bar visualization */}
                <div className="h-28 flex items-end justify-between px-2 pt-4 relative">
                  {/* Graph grid lines */}
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-[8px] font-bold text-zinc-200 text-left pl-1 pb-1">
                    <span className="border-b border-zinc-100/50 w-full" />
                    <span className="border-b border-zinc-100/50 w-full" />
                    <span className="border-b border-zinc-100/50 w-full" />
                  </div>

                  {/* Weekly bars */}
                  <div className="flex-1 flex items-end justify-around relative z-10 h-full pb-0.5">
                    {weeklyData.map((d, idx) => (
                      <div key={idx} className="flex flex-col items-center gap-1.5 group cursor-pointer">
                        <div
                          style={{ height: `${d.height}%` }}
                          className="w-5.5 bg-brand-green/80 hover:bg-brand-green transition-all rounded-t-[3px] shadow-3xs"
                          title={`${d.count} completed`}
                        />
                        <span className="text-[9px] font-bold text-zinc-400">
                          {d.day}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
