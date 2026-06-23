"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AtSign,
  Bell,
  CalendarDays,
  CheckCircle,
  ChevronRight,
  Loader2,
  MoreHorizontal,
  PenTool,
  Plus,
  Share2,
  ShieldAlert,
  UserPlus,
  X,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api/client";
import type { Notification, Profile, Project, WorkspaceMember } from "@/types/db";

type MemberRow = WorkspaceMember & { profile: Profile | null };

const AVATAR_COLORS = [
  "bg-emerald-500", "bg-blue-500", "bg-violet-500", "bg-amber-500", "bg-pink-500",
];

function relTime(iso: string): string {
  const delta = Date.now() - new Date(iso).getTime();
  const s = Math.floor(delta / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

function notifIcon(type: Notification["type"]) {
  switch (type) {
    case "deadline":
    case "deadline_reminder":
      return { icon: CalendarDays, bg: "bg-amber-50 border-amber-100", color: "text-amber-600" };
    case "edit_request":
    case "edit_complete":
    case "edit_rejected":
      return { icon: PenTool, bg: "bg-blue-50 border-blue-100", color: "text-blue-600" };
    case "publish_complete":
    case "publish_failed":
      return { icon: Share2, bg: "bg-violet-50 border-violet-100", color: "text-violet-600" };
    case "stage_complete":
      return { icon: CheckCircle, bg: "bg-emerald-50 border-emerald-100", color: "text-emerald-600" };
    case "invite":
      return { icon: UserPlus, bg: "bg-emerald-50 border-emerald-100", color: "text-emerald-600" };
    case "mention":
      return { icon: AtSign, bg: "bg-zinc-50 border-zinc-200", color: "text-zinc-500" };
    default:
      return { icon: ShieldAlert, bg: "bg-red-50 border-red-100", color: "text-red-600" };
  }
}

function stageLabel(status: Project["status"]): string {
  const map: Record<Project["status"], string> = {
    idea: "Idea",
    scripting: "Script",
    voice_gen: "Voice",
    video_gen: "Video",
    editing: "Editing",
    review: "Review",
    published: "Published",
    archived: "Archived",
  };
  return map[status] ?? status;
}

function buildDonut(projects: Project[]) {
  const CIRC = 188.5; // 2π×30
  const buckets = [
    { key: "Idea", color: "#d4d4d8", filter: (p: Project) => p.status === "idea" },
    { key: "Script", color: "#22c55e", filter: (p: Project) => p.status === "scripting" },
    { key: "Voice", color: "#a27b5c", filter: (p: Project) => p.status === "voice_gen" },
    { key: "Video", color: "#eab308", filter: (p: Project) => p.status === "video_gen" },
    { key: "Editing", color: "#f97316", filter: (p: Project) => p.status === "editing" || p.status === "review" },
    { key: "Published", color: "#10b981", filter: (p: Project) => p.status === "published" },
  ];

  const total = projects.length || 1;
  let cumAngle = -90;

  return buckets.map((b) => {
    const count = projects.filter(b.filter).length;
    const pct = count / total;
    const dash = pct * CIRC;
    const rotate = cumAngle;
    cumAngle += pct * 360;
    return { ...b, count, strokeDash: `${dash.toFixed(1)} ${CIRC}`, rotate };
  });
}

export default function AdminDashboardPage() {
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  // New project modal
  const [showNewProject, setShowNewProject] = useState(false);
  const [projTitle, setProjTitle] = useState("");
  const [projPriority, setProjPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");
  const [projDeadline, setProjDeadline] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const load = useCallback(async () => {
    try {
      const [memData, projData, notifData] = await Promise.all([
        api.get<MemberRow[]>("/api/members"),
        api.get<Project[]>("/api/projects"),
        api.get<Notification[]>("/api/notifications"),
      ]);
      setMembers(memData);
      setProjects(projData);
      setNotifications(notifData);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to load dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void (async () => { await load(); })();
  }, [load]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projTitle.trim()) {
      toast.error("Please enter a project title.");
      return;
    }
    setIsCreating(true);
    try {
      const payload: Record<string, unknown> = { title: projTitle.trim(), priority: projPriority };
      if (projDeadline) payload.deadline = new Date(`${projDeadline}T09:00:00`).toISOString();
      const created = await api.post<Project>("/api/projects", payload);
      setProjects((prev) => [created, ...prev]);
      setShowNewProject(false);
      setProjTitle("");
      setProjPriority("medium");
      setProjDeadline("");
      toast.success(`Project "${created.title}" created!`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to create project.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleSendPing = async (project: Project) => {
    try {
      await api.post("/api/notifications/broadcast", {
        title: `Reminder: ${project.title}`,
        message: "Please update your project status.",
        type: "system",
        target: "all",
      });
      toast.success("Reminder sent to all workspace members.");
    } catch {
      toast.error("Failed to send reminder.");
    }
  };

  const now = new Date();

  // KPIs
  const totalUsers = members.filter((m) => m.role === "user" || m.role === "viewer").length;
  const totalEditors = members.filter((m) => m.role === "editor").length;
  const thisMonth = projects.filter(
    (p) => new Date(p.created_at).getMonth() === now.getMonth() &&
           new Date(p.created_at).getFullYear() === now.getFullYear()
  ).length;
  const published = projects.filter((p) => p.status === "published").length;

  // Donut
  const segments = buildDonut(projects);

  // Attention projects (not published/archived, deadline within 7 days or stuck >2 days)
  const attentionProjects = projects
    .filter((p) => p.status !== "published" && p.status !== "archived")
    .filter((p) => {
      const stuckMs = now.getTime() - new Date(p.updated_at).getTime();
      const stuckDays = stuckMs / (1000 * 60 * 60 * 24);
      if (stuckDays > 2) return true;
      if (p.deadline) {
        const daysLeft = (new Date(p.deadline).getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        if (daysLeft < 7) return true;
      }
      return false;
    })
    .slice(0, 5);

  // Upcoming deadlines
  const upcomingDeadlines = projects
    .filter((p) => p.deadline !== null)
    .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
    .slice(0, 3);

  // Activity log
  const activityLog = notifications.slice(0, 5);

  const assignedAvatar = (assignedTo: string | null, idx: number) => {
    if (!assignedTo) return null;
    const member = members.find((m) => m.user_id === assignedTo);
    const letter = (member?.profile?.full_name ?? member?.profile?.email ?? "?")
      .slice(0, 1).toUpperCase();
    return { letter, color: AVATAR_COLORS[idx % AVATAR_COLORS.length] };
  };

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-brand-green" />
      </main>
    );
  }

  return (
    <>
      {/* New Project Modal */}
      {showNewProject && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl w-full max-w-md p-6 relative animate-in zoom-in-95 duration-200 text-left">
            <button
              onClick={() => setShowNewProject(false)}
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
                  value={projTitle}
                  onChange={(e) => setProjTitle(e.target.value)}
                  className="w-full px-4 h-11 border border-zinc-200 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 rounded-xl text-sm font-semibold text-zinc-900 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wide block">
                    Priority
                  </label>
                  <select
                    value={projPriority}
                    onChange={(e) => setProjPriority(e.target.value as "low" | "medium" | "high" | "urgent")}
                    className="w-full px-4 h-11 border border-zinc-200 focus:border-brand-green rounded-xl text-sm font-semibold text-zinc-900 outline-none bg-white cursor-pointer"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wide block">
                    Deadline (optional)
                  </label>
                  <input
                    type="date"
                    value={projDeadline}
                    onChange={(e) => setProjDeadline(e.target.value)}
                    className="w-full px-4 h-11 border border-zinc-200 focus:border-brand-green rounded-xl text-sm font-semibold text-zinc-900 outline-none"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isCreating}
                className="w-full h-11 bg-brand-green hover:bg-brand-green-hover disabled:bg-brand-green/60 text-white rounded-xl text-sm font-bold shadow-md shadow-emerald-700/10 cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isCreating ? (
                  <><Loader2 size={16} className="animate-spin" /> Creating...</>
                ) : (
                  "Create Project"
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
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 text-left">Dashboard</h1>
            <button
              onClick={() => setShowNewProject(true)}
              className="h-10 px-4 bg-brand-green hover:bg-brand-green-hover text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-emerald-700/10"
            >
              <Plus size={14} strokeWidth={3} />
              New Project
            </button>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                label: "Total Users",
                val: totalUsers,
                sub: `${members.length} members`,
                subColor: "text-emerald-500 bg-emerald-50 border-emerald-100",
                icon: "👥",
              },
              {
                label: "Editors",
                val: totalEditors,
                sub: totalEditors === 0 ? "None yet" : "active",
                subColor: "text-zinc-400 bg-zinc-50 border-zinc-150",
                icon: "✏️",
              },
              {
                label: "Projects This Month",
                val: thisMonth,
                sub: `${projects.length} total`,
                subColor: "text-emerald-500 bg-emerald-50 border-emerald-100",
                icon: "📁",
              },
              {
                label: "Published",
                val: published,
                sub: projects.length > 0 ? `${Math.round((published / projects.length) * 100)}%` : "0%",
                subColor: "text-emerald-500 bg-emerald-50 border-emerald-100",
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
                    <span className="text-3xl font-extrabold text-zinc-900 tracking-tight">{kpi.val}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${kpi.subColor}`}>
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

          {/* Main layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left column */}
            <div className="lg:col-span-7 space-y-8">
              {/* Donut chart */}
              <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                  <h3 className="text-sm font-extrabold text-zinc-800 uppercase tracking-wide">
                    Projects Status
                  </h3>
                  <button className="p-1.5 text-zinc-400 hover:text-zinc-650 rounded-lg cursor-pointer">
                    <MoreHorizontal size={16} />
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-around gap-6">
                  <div className="relative w-40 h-40 shrink-0">
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      {segments.map((seg, idx) =>
                        seg.count === 0 ? null : (
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
                            <title>{seg.key}: {seg.count}</title>
                          </circle>
                        )
                      )}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center select-none">
                      <span className="text-2xl font-extrabold text-zinc-900 tracking-tight">
                        {projects.length}
                      </span>
                      <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">
                        Total
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs font-bold text-zinc-700 min-w-[200px]">
                    {segments.map((seg, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 hover:bg-zinc-50 border border-transparent hover:border-zinc-200 rounded-xl transition-all cursor-pointer"
                        onClick={() => toast.info(`${seg.key}: ${seg.count} project${seg.count !== 1 ? "s" : ""}`)}
                      >
                        <span className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
                          {seg.key}
                        </span>
                        <span className="text-zinc-400 font-semibold ml-2">({seg.count})</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Attention table */}
              <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                  <h3 className="text-sm font-extrabold text-zinc-800 uppercase tracking-wide">
                    Projects Needing Attention
                  </h3>
                  <button
                    onClick={load}
                    className="text-xs font-bold text-brand-green hover:underline cursor-pointer"
                  >
                    Refresh
                  </button>
                </div>

                {attentionProjects.length === 0 ? (
                  <p className="text-sm font-semibold text-zinc-400 py-4 text-center">
                    All projects are on track. 🎉
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs font-semibold text-zinc-800">
                      <thead>
                        <tr className="border-b border-zinc-200 text-zinc-400 font-extrabold">
                          <th className="py-2.5 uppercase tracking-wider">Project</th>
                          <th className="py-2.5 uppercase tracking-wider">Stage</th>
                          <th className="py-2.5 uppercase tracking-wider text-center">Updated</th>
                          <th className="py-2.5 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-105">
                        {attentionProjects.map((p) => (
                          <tr key={p.id} className="hover:bg-zinc-50/50">
                            <td className="py-3">
                              <span className="font-extrabold block text-zinc-900 truncate max-w-[160px]">
                                {p.title}
                              </span>
                              <span className="text-[10px] text-zinc-400 block mt-0.5 capitalize">
                                {p.priority} priority
                              </span>
                            </td>
                            <td className="py-3">
                              <span className="px-2 py-0.5 bg-zinc-100 rounded text-[10px] font-bold text-zinc-600">
                                {stageLabel(p.status)}
                              </span>
                            </td>
                            <td className="py-3 text-center">
                              <span className="px-2 py-0.5 bg-red-50 border border-red-150 text-red-650 rounded-[4px] text-[10px] font-extrabold">
                                {relTime(p.updated_at)}
                              </span>
                            </td>
                            <td className="py-3 text-right">
                              <button
                                onClick={() => handleSendPing(p)}
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
                )}
              </div>
            </div>

            {/* Right column */}
            <div className="lg:col-span-5 space-y-8">
              {/* Upcoming Deadlines */}
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

                {upcomingDeadlines.length === 0 ? (
                  <p className="text-xs font-semibold text-zinc-400">No deadlines set yet.</p>
                ) : (
                  <div className="space-y-3 text-left">
                    {upcomingDeadlines.map((p, idx) => {
                      const avatar = assignedAvatar(p.assigned_to, idx);
                      const d = new Date(p.deadline!);
                      const isToday =
                        d.toDateString() === now.toDateString();
                      const isTomorrow =
                        d.toDateString() === new Date(now.getTime() + 86400000).toDateString();
                      const label = isToday ? "Today" : isTomorrow ? "Tomorrow" : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                      const borderColor = isToday ? "border-l-red-500" : isTomorrow ? "border-l-amber-500" : "border-l-zinc-300";

                      return (
                        <div key={p.id} className={`flex items-start gap-3 p-3 rounded-xl border border-zinc-150 border-l-4 ${borderColor} shadow-2xs hover:shadow-xs transition-all`}>
                          <div className="w-8 h-8 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-400 shrink-0 select-none">
                            🎬
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs font-bold text-zinc-900 truncate">{p.title}</h4>
                            <span className="text-[10px] font-semibold text-zinc-400 block mt-0.5">
                              {label} · {d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                          {avatar && (
                            <div
                              className={`w-6 h-6 rounded-full ${avatar.color} border border-white text-white flex items-center justify-center text-[9px] font-bold shrink-0 shadow-2xs select-none`}
                            >
                              {avatar.letter}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Activity Log */}
              <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-zinc-100 pb-2">
                  <h3 className="text-sm font-extrabold text-zinc-800 uppercase tracking-wide">
                    Platform Activity
                  </h3>
                  <Link
                    href="/dashboard/admin/notifications"
                    className="text-xs font-bold text-brand-green hover:underline cursor-pointer"
                  >
                    View All
                  </Link>
                </div>

                {activityLog.length === 0 ? (
                  <div className="flex items-center gap-2 py-4">
                    <Bell size={16} className="text-zinc-300" />
                    <p className="text-xs font-semibold text-zinc-400">No recent activity.</p>
                  </div>
                ) : (
                  <div className="space-y-4 relative before:absolute before:inset-y-1 before:left-3.5 before:w-0.5 before:bg-zinc-100 select-none text-left">
                    {activityLog.map((n) => {
                      const { icon: Icon, bg, color } = notifIcon(n.type);
                      return (
                        <div key={n.id} className="flex items-start gap-3 relative z-10">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border ${bg}`}>
                            <Icon size={12} className={color} />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-zinc-900">{n.title}</h4>
                            {n.message && (
                              <p className="text-[10px] font-semibold text-zinc-500 mt-0.5 line-clamp-2">
                                {n.message}
                              </p>
                            )}
                            <span className="text-[9px] font-semibold text-zinc-400 block mt-0.5">
                              {relTime(n.created_at)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
