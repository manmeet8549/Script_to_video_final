"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Film,
  Users,
  CalendarDays,
  Bell,
  Settings,
  Plus,
  Search,
  ChevronDown,
  Clock,
  CheckCircle,
  FileCheck,
  MoreHorizontal,
  ChevronRight,
  TrendingUp,
  X,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

type ProjectAttention = {
  id: string;
  name: string;
  projectId: string;
  user: string;
  userAvatar: string;
  userBg: string;
  stage: string;
  stuckFor: string;
};

export default function AdminDashboardPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectUser, setProjectUser] = useState("Sarah J.");
  const [projectStage, setProjectStage] = useState("Script");
  const [isCreating, setIsCreating] = useState(false);

  // Client states for KPIs (to support real-time creation increments)
  const [totalProjects, setTotalProjects] = useState(24);
  const [totalUsers, setTotalUsers] = useState(5);
  const [publishedCount, setPublishedCount] = useState(8);

  const [attentionProjects, setAttentionProjects] = useState<ProjectAttention[]>([
    {
      id: "1",
      name: "CEO End of Year Address",
      projectId: "PRJ-092",
      user: "Sarah J.",
      userAvatar: "S",
      userBg: "bg-emerald-500",
      stage: "Video Editing",
      stuckFor: "3 Days",
    },
    {
      id: "2",
      name: "Product Launch Teaser",
      projectId: "PRJ-104",
      user: "Mike K.",
      userAvatar: "M",
      userBg: "bg-blue-500",
      stage: "Script",
      stuckFor: "1 Day",
    },
  ]);

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName) {
      toast.error("Please enter a project name");
      return;
    }

    setIsCreating(true);
    toast.info("Initializing workspace assets...");

    setTimeout(() => {
      setIsCreating(false);
      setTotalProjects((prev) => prev + 1);
      setShowNewProjectModal(false);
      setProjectName("");
      toast.success(`Project "${projectName}" created successfully!`);
    }, 1500);
  };

  const handleSendReminder = (userName: string, projName: string) => {
    toast.success(`Sent reminder notification to ${userName} regarding "${projName}"`);
  };

  // Donut chart parameters
  // Total = 24
  // Idea: 4 (16.7%), Script: 6 (25.0%), Voice: 3 (12.5%), Video: 4 (16.7%), Publish: 7 (29.2%)
  const segments = [
    { key: "Idea", value: 4, color: "#d4d4d8", strokeDash: "31.4 188.5", rotate: -90 }, // zinc-300
    { key: "Script", value: 6, color: "#22c55e", strokeDash: "47.1 188.5", rotate: -30 }, // green-500
    { key: "Voice", value: 3, color: "#a27b5c", strokeDash: "23.6 188.5", rotate: 60 }, // custom brown
    { key: "Video", value: 4, color: "#eab308", strokeDash: "31.4 188.5", rotate: 105 }, // yellow-500
    { key: "Publish", value: 7, color: "#10b981", strokeDash: "55.0 188.5", rotate: 165 }, // emerald-500
  ];

  return (
    <>
      {/* Create Project Modal */}
      {showNewProjectModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl w-full max-w-md p-6 relative animate-in zoom-in-95 duration-200 text-left">
            <button
              onClick={() => setShowNewProjectModal(false)}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-600 rounded-lg cursor-pointer"
            >
              <X size={18} />
            </button>
            <h3 className="text-lg font-bold text-zinc-900 border-b border-zinc-100 pb-3 mb-4">
              Create New Project
            </h3>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wide">
                  Project Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Q3 Sales Overview"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full px-4 h-11 border border-zinc-200 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 rounded-xl text-sm font-semibold text-zinc-900 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wide block">
                    Owner
                  </label>
                  <select
                    value={projectUser}
                    onChange={(e) => setProjectUser(e.target.value)}
                    className="w-full px-4 h-11 border border-zinc-200 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 rounded-xl text-sm font-semibold text-zinc-900 outline-none bg-white cursor-pointer"
                  >
                    <option>Sarah J.</option>
                    <option>Mike K.</option>
                    <option>David M.</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wide block">
                    Initial Stage
                  </label>
                  <select
                    value={projectStage}
                    onChange={(e) => setProjectStage(e.target.value)}
                    className="w-full px-4 h-11 border border-zinc-200 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 rounded-xl text-sm font-semibold text-zinc-900 outline-none bg-white cursor-pointer"
                  >
                    <option>Idea</option>
                    <option>Script</option>
                    <option>Voiceover</option>
                    <option>Video Studio</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={isCreating}
                className="w-full h-11 bg-brand-green hover:bg-brand-green-hover disabled:bg-brand-green/60 text-white rounded-xl text-sm font-bold shadow-md shadow-emerald-700/10 cursor-pointer flex items-center justify-center gap-1.5 pt-0.5"
              >
                {isCreating ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Creating Project...
                  </>
                ) : (
                  <>Create Project</>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Dashboard Content */}
      <main className="flex-1 overflow-y-auto px-8 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 text-left">
              Dashboard
            </h1>
            <button
              onClick={() => setShowNewProjectModal(true)}
              className="h-10 px-4 bg-brand-green hover:bg-brand-green-hover text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-emerald-700/10"
            >
              <Plus size={14} strokeWidth={3} />
              New Project
            </button>
          </div>

          {/* KPI Cards row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                label: "Total Users",
                val: totalUsers,
                sub: "+1",
                subColor: "text-emerald-500 bg-emerald-55 border-emerald-100",
                icon: "👥",
              },
              {
                label: "Editors",
                val: 2,
                sub: "-0",
                subColor: "text-zinc-400 bg-zinc-50 border-zinc-150",
                icon: "✏️",
              },
              {
                label: "Projects This Month",
                val: totalProjects,
                sub: "+12%",
                subColor: "text-emerald-500 bg-emerald-55 border-emerald-100",
                icon: "📁",
              },
              {
                label: "Published",
                val: publishedCount,
                sub: "+3",
                subColor: "text-emerald-500 bg-emerald-55 border-emerald-100",
                icon: "🚀",
              },
            ].map((kpi, idx) => (
              <div
                key={idx}
                className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-all flex items-center justify-between"
              >
                <div className="space-y-1.5 text-left">
                  <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block">
                    {kpi.label}
                  </span>
                  <div className="flex items-baseline gap-2.5">
                    <span className="text-3xl font-extrabold text-zinc-900 tracking-tight">
                      {kpi.val}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${kpi.subColor}`}
                    >
                      {kpi.sub}
                    </span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center justify-center text-lg shadow-2xs select-none">
                  {kpi.icon}
                </div>
              </div>
            ))}
          </div>

          {/* Split layout: Left (Projects status & stuck) vs Right (Deadlines & Activity) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column (60% width) */}
            <div className="lg:col-span-7 space-y-8">
              {/* 1. Projects Status (Donut) */}
              <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                  <h3 className="text-sm font-extrabold text-zinc-800 tracking-tight uppercase tracking-wide">
                    Projects Status
                  </h3>
                  <button className="p-1.5 text-zinc-400 hover:text-zinc-650 rounded-lg cursor-pointer">
                    <MoreHorizontal size={16} />
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-around gap-6">
                  {/* SVG Donut chart */}
                  <div className="relative w-40 h-40 shrink-0">
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      {segments.map((seg, idx) => (
                        <circle
                          key={idx}
                          cx="50"
                          cy="50"
                          r="30"
                          fill="transparent"
                          stroke={seg.color}
                          strokeWidth="10"
                          strokeDasharray={seg.strokeDash}
                          transform={`rotate(${seg.rotate} 50 50)`}
                          className="transition-all duration-300 hover:stroke-[12] cursor-pointer"
                        >
                          {mounted && <title>{seg.key}: {seg.value}</title>}
                        </circle>
                      ))}
                    </svg>
                    {/* Inside details */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center select-none">
                      <span className="text-2xl font-extrabold text-zinc-900 tracking-tight">
                        {totalProjects}
                      </span>
                      <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block mt-[-2px]">
                        Active
                      </span>
                    </div>
                  </div>

                  {/* Breakdown list */}
                  <div className="grid grid-cols-2 gap-4 text-xs font-bold text-zinc-700 min-w-[200px]">
                    {segments.map((seg, idx) => (
                      <div
                        key={idx}
                        onClick={() => toast.info(`Filtered view of ${seg.key} stage`)}
                        className="flex items-center justify-between p-2 hover:bg-zinc-50 border border-transparent hover:border-zinc-200 rounded-xl transition-all cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: seg.color }}
                          />
                          {seg.key}
                        </span>
                        <span className="text-zinc-400 font-semibold ml-2">({seg.value})</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 2. Projects Needing Attention Table */}
              <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                  <h3 className="text-sm font-extrabold text-zinc-800 tracking-tight uppercase tracking-wide">
                    Projects Needing Attention
                  </h3>
                  <button
                    onClick={() => toast.info("Refreshing attention tracker...")}
                    className="text-xs font-bold text-brand-green hover:underline cursor-pointer"
                  >
                    Refresh list
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs font-semibold text-zinc-800">
                    <thead>
                      <tr className="border-b border-zinc-200 text-zinc-400 font-extrabold select-none pb-2">
                        <th className="py-2.5 uppercase tracking-wider">Project</th>
                        <th className="py-2.5 uppercase tracking-wider">User</th>
                        <th className="py-2.5 uppercase tracking-wider">Stage</th>
                        <th className="py-2.5 uppercase tracking-wider text-center">Stuck For</th>
                        <th className="py-2.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-105 animate-in fade-in-50 duration-300">
                      {attentionProjects.map((p) => (
                        <tr key={p.id} className="hover:bg-zinc-50/50">
                          <td className="py-3">
                            <span className="font-extrabold block text-zinc-900">
                              {p.name}
                            </span>
                            <span className="text-[10px] text-zinc-400 block mt-0.5">
                              ID: {p.projectId}
                            </span>
                          </td>
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-6 h-6 rounded-full ${p.userBg} text-white flex items-center justify-center font-bold text-[10px] select-none`}
                              >
                                {p.userAvatar}
                              </div>
                              <span className="text-zinc-650">{p.user}</span>
                            </div>
                          </td>
                          <td className="py-3">
                            <span className="px-2 py-0.5 bg-zinc-100 rounded text-[10px] font-bold text-zinc-600">
                              {p.stage}
                            </span>
                          </td>
                          <td className="py-3 text-center">
                            <span className="px-2 py-0.5 bg-red-50 border border-red-150 text-red-650 rounded-[4px] text-[10px] font-extrabold">
                              {p.stuckFor}
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            <button
                              onClick={() => handleSendReminder(p.user, p.name)}
                              className="h-7 px-3 border border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300 text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                            >
                              Send Ping
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right Column (40% width) */}
            <div className="lg:col-span-5 space-y-8">
              {/* 1. Upcoming Deadlines */}
              <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-zinc-100 pb-2">
                  <h3 className="text-sm font-extrabold text-zinc-800 uppercase tracking-wide">
                    Upcoming Deadlines
                  </h3>
                  <Link
                    href="/dashboard/admin/calendar"
                    className="text-xs font-bold text-brand-green hover:underline cursor-pointer flex items-center gap-0.5"
                  >
                    View Calendar
                    <ChevronRight size={14} />
                  </Link>
                </div>

                <div className="space-y-4 text-left">
                  {/* Today */}
                  <div className="space-y-2">
                    <span className="text-[9px] font-extrabold text-zinc-400 uppercase tracking-wider block">
                      Today
                    </span>
                    <div className="flex items-start gap-3 p-3 rounded-xl border border-zinc-150 border-l-4 border-l-red-500 shadow-2xs hover:shadow-xs transition-all">
                      <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center text-red-500 shrink-0 select-none">
                        🎬
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-bold text-zinc-900 truncate">Q3 Marketing Anthem</h4>
                        <span className="text-[10px] font-semibold text-zinc-400 block mt-0.5">
                          Final Video Render due 2:00 PM
                        </span>
                      </div>
                      <div className="w-6 h-6 rounded-full bg-emerald-600 border border-white text-white flex items-center justify-center text-[9px] font-bold shrink-0 shadow-2xs select-none">
                        S
                      </div>
                    </div>
                  </div>

                  {/* Tomorrow */}
                  <div className="space-y-2">
                    <span className="text-[9px] font-extrabold text-zinc-400 uppercase tracking-wider block">
                      Tomorrow
                    </span>
                    <div className="flex items-start gap-3 p-3 rounded-xl border border-zinc-150 border-l-4 border-l-amber-500 shadow-2xs hover:shadow-xs transition-all">
                      <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0 select-none">
                        🎤
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-bold text-zinc-900 truncate">Platform Explainer Voice</h4>
                        <span className="text-[10px] font-semibold text-zinc-400 block mt-0.5">
                          AI script review due 10:00 AM
                        </span>
                      </div>
                      <div className="w-6 h-6 rounded-full bg-violet-650 border border-white text-white flex items-center justify-center text-[9px] font-bold shrink-0 shadow-2xs select-none">
                        E
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Platform Activity Logs */}
              <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-zinc-100 pb-2">
                  <h3 className="text-sm font-extrabold text-zinc-800 uppercase tracking-wide">
                    Platform Activity Logs
                  </h3>
                  <button
                    onClick={() => toast.info("Opening full log visualizer...")}
                    className="text-xs font-bold text-brand-green hover:underline cursor-pointer"
                  >
                    View All
                  </button>
                </div>

                <div className="space-y-4 relative before:absolute before:inset-y-1 before:left-3.5 before:w-0.5 before:bg-zinc-100 select-none text-left">
                  {/* Log 1 */}
                  <div className="flex items-start gap-3 relative z-10">
                    <div className="w-6.5 h-6.5 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-brand-green shrink-0 shadow-3xs">
                      <CheckCircle size={12} strokeWidth={2.5} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-zinc-900">Project Published</h4>
                      <p className="text-[10px] font-semibold text-zinc-500 mt-0.5">
                        &quot;CEO End of Year Address&quot; successfully published to YouTube channel.
                      </p>
                      <span className="text-[9px] font-semibold text-zinc-400 block mt-0.5">
                        15 minutes ago
                      </span>
                    </div>
                  </div>

                  {/* Log 2 */}
                  <div className="flex items-start gap-3 relative z-10">
                    <div className="w-6.5 h-6.5 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-550 shrink-0 shadow-3xs">
                      <FileCheck size={12} strokeWidth={2.5} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-zinc-900">Script Approved</h4>
                      <p className="text-[10px] font-semibold text-zinc-500 mt-0.5">
                        Mike K. approved the script for &quot;Product Teaser&quot;.
                      </p>
                      <span className="text-[9px] font-semibold text-zinc-400 block mt-0.5">
                        2 hours ago
                      </span>
                    </div>
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
