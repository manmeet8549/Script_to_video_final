"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Bell,
  Calendar,
  ChevronRight,
  Clock,
  Loader2,
  Plus,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api/client";
import { mapProjectToCard, type ProjectCardView } from "@/lib/ui/project-view";
import { createClient } from "@/lib/supabase/client";
import type { Notification, Project, ProjectPriority } from "@/types/db";

function relTime(iso: string): string {
  const delta = Date.now() - new Date(iso).getTime();
  const s = Math.floor(delta / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function fmtDeadline(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 86400000);
  if (d.toDateString() === now.toDateString()) return "Today";
  if (d.toDateString() === tomorrow.toDateString()) return "Tomorrow";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function UserDashboardWelcomePage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("there");
  const [projects, setProjects] = useState<Project[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  // Create project modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectPriority, setProjectPriority] = useState<"High" | "Medium" | "Low">("Medium");
  const [isCreating, setIsCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, email")
          .eq("id", user.id)
          .single();
        const name = profile?.full_name ?? profile?.email ?? user.email ?? "";
        const firstName = name.split(/[\s@]/)[0];
        if (firstName) setDisplayName(firstName);
      }

      const [projData, notifData] = await Promise.all([
        api.get<Project[]>("/api/projects"),
        api.get<Notification[]>("/api/notifications"),
      ]);
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
    if (!projectName) {
      toast.error("Please enter a project title");
      return;
    }
    setIsCreating(true);
    try {
      const created = await api.post<Project>("/api/projects", {
        title: projectName,
        priority: projectPriority.toLowerCase() as ProjectPriority,
      });
      setProjects((prev) => [created, ...prev]);
      setShowCreateModal(false);
      setProjectName("");
      toast.success(`Project "${created.title}" created!`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to create project.");
    } finally {
      setIsCreating(false);
    }
  };

  const cards: ProjectCardView[] = projects.map(mapProjectToCard);
  const totalProjects = cards.length;
  const inProgressCount = cards.filter((p) => p.status === "In Progress" || p.status === "Overdue").length;
  const completedCount = cards.filter((p) => p.status === "Completed").length;
  const publishedCount = projects.filter((p) => p.status === "published").length;

  const continueItems = cards
    .filter((p) => p.status === "In Progress" || p.status === "Overdue")
    .slice(0, 3);

  const upcomingDeadlines = projects
    .filter((p) => p.deadline !== null && p.status !== "published" && p.status !== "archived")
    .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
    .slice(0, 3);

  const activityLog = notifications.slice(0, 3);

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-brand-green" />
      </main>
    );
  }

  return (
    <>
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl w-full max-w-md p-6 relative animate-in zoom-in-95 duration-200 text-left">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-650 rounded-lg cursor-pointer"
            >
              <X size={18} />
            </button>
            <h3 className="text-lg font-bold text-zinc-900 border-b border-zinc-100 pb-3 mb-4">
              New Video Project
            </h3>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wide">
                  Project Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Q4 Marketing Video"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full px-4 h-11 border border-zinc-200 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 rounded-xl text-sm font-semibold text-zinc-900 outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wide block">
                  Priority
                </label>
                <select
                  value={projectPriority}
                  onChange={(e) => setProjectPriority(e.target.value as "High" | "Medium" | "Low")}
                  className="w-full px-4 h-11 border border-zinc-200 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 rounded-xl text-sm font-semibold text-zinc-900 outline-none bg-white cursor-pointer"
                >
                  <option>High</option>
                  <option>Medium</option>
                  <option>Low</option>
                </select>
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

      <main className="flex-1 overflow-y-auto px-8 py-8">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
            <div className="text-left leading-normal">
              <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight">
                Welcome back, {displayName}!
              </h1>
              <p className="text-sm font-semibold text-zinc-400 mt-0.5">
                Here&apos;s what&apos;s happening with your projects
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="h-10 px-4 bg-brand-green hover:bg-brand-green-hover text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-emerald-700/10"
            >
              <Plus size={14} strokeWidth={3} />
              New Project
            </button>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: "My Projects", val: totalProjects, icon: "📁" },
              { label: "In Progress", val: inProgressCount, icon: "⏳" },
              { label: "Completed", val: completedCount, icon: "✅" },
              { label: "Published", val: publishedCount, icon: "🚀" },
            ].map((kpi, idx) => (
              <div
                key={idx}
                className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-2xs flex items-center justify-between"
              >
                <div className="space-y-1 text-left">
                  <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wide">
                    {kpi.label}
                  </span>
                  <span className="text-3xl font-extrabold text-zinc-950 block mt-1 tracking-tight">
                    {kpi.val}
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center justify-center text-lg shadow-3xs select-none">
                  {kpi.icon}
                </div>
              </div>
            ))}
          </div>

          {/* Middle Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Continue Working */}
            <div className="lg:col-span-7 bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-5">
              <div className="flex justify-between items-center border-b border-zinc-100 pb-2.5 select-none">
                <h3 className="text-sm font-extrabold text-zinc-800 uppercase tracking-wide">
                  Continue Working On
                </h3>
                <Link
                  href="/dashboard/user/projects"
                  className="text-xs font-bold text-brand-green hover:underline cursor-pointer"
                >
                  View All
                </Link>
              </div>

              {continueItems.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-sm font-semibold text-zinc-400">No projects in progress.</p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="mt-3 text-xs font-bold text-brand-green hover:underline cursor-pointer"
                  >
                    Create your first project →
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {continueItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => router.push(`/dashboard/user/projects/${item.id}`)}
                      className="border border-zinc-150 rounded-2xl p-5 flex items-center justify-between gap-6 hover:border-zinc-355 hover:shadow-2xs transition-all cursor-pointer text-left"
                    >
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <h4 className="text-xs font-extrabold text-zinc-950 truncate max-w-[220px]">
                            {item.name}
                          </h4>
                          <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-100 rounded text-[9px] font-bold">
                            {item.stage}
                          </span>
                        </div>
                        <div className="space-y-1.5 select-none">
                          <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
                            <div
                              style={{ width: `${item.progress}%` }}
                              className="h-full bg-brand-green rounded-full"
                            />
                          </div>
                          <div className="flex items-center justify-between text-[9px] font-bold text-zinc-400">
                            <span>Progress</span>
                            <span>{item.progress}% Complete</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/dashboard/user/projects/${item.id}`);
                        }}
                        className="w-8 h-8 rounded-full border border-zinc-200 hover:bg-zinc-50 flex items-center justify-center text-zinc-450 hover:text-zinc-800 shrink-0 cursor-pointer transition-colors"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Upcoming Deadlines */}
            <div className="lg:col-span-5 bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-extrabold text-zinc-800 uppercase tracking-wide border-b border-zinc-100 pb-2 select-none">
                Upcoming Deadlines
              </h3>

              {upcomingDeadlines.length === 0 ? (
                <p className="text-xs font-semibold text-zinc-400 py-4 text-center">
                  No deadlines set yet.
                </p>
              ) : (
                <div className="space-y-4 text-left select-none">
                  {upcomingDeadlines.map((p) => {
                    const label = fmtDeadline(p.deadline!);
                    const isToday = label === "Today";
                    const isTomorrow = label === "Tomorrow";
                    const borderColor = isToday
                      ? "border-l-red-500"
                      : isTomorrow
                      ? "border-l-amber-500"
                      : "border-l-zinc-300";
                    const Icon = isToday ? AlertTriangle : isTomorrow ? Clock : Calendar;
                    const iconBg = isToday
                      ? "bg-red-100 text-red-650"
                      : isTomorrow
                      ? "bg-amber-100 text-amber-650"
                      : "bg-zinc-100 text-zinc-555";
                    const labelColor = isToday
                      ? "text-red-600"
                      : isTomorrow
                      ? "text-amber-655"
                      : "text-zinc-400";

                    return (
                      <div
                        key={p.id}
                        className={`flex items-start gap-3.5 p-3.5 border border-zinc-150 border-l-4 ${borderColor} rounded-xl shadow-3xs`}
                      >
                        <div className={`w-8 h-8 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
                          <Icon size={15} />
                        </div>
                        <div className="min-w-0 flex-1 leading-tight">
                          <span className={`text-[9px] font-extrabold uppercase tracking-wider block ${labelColor}`}>
                            {label}
                          </span>
                          <h4 className="text-xs font-extrabold text-zinc-900 mt-1 truncate">{p.title}</h4>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-zinc-100 pb-3 select-none">
              <h3 className="text-sm font-extrabold text-zinc-800 uppercase tracking-wide">
                Recent Activity
              </h3>
              <Link
                href="/dashboard/user/notifications"
                className="text-xs font-bold text-brand-green hover:underline"
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
              <div className="space-y-4 relative text-left pl-2 select-none">
                <div className="absolute left-[17px] top-3.5 bottom-3.5 w-px bg-zinc-100" />
                {activityLog.map((n) => (
                  <div key={n.id} className="flex items-start gap-3.5 relative z-10">
                    <div className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 shadow-3xs ${
                      n.is_read ? "bg-zinc-50 border-zinc-200" : "bg-brand-green-light border-brand-green/20"
                    }`}>
                      <Bell size={13} className={n.is_read ? "text-zinc-400" : "text-brand-green"} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-zinc-650 leading-snug">
                        <span className="font-extrabold text-zinc-900">{n.title}</span>
                        {n.message && (
                          <span className="text-zinc-500"> — {n.message}</span>
                        )}
                      </p>
                      <span className="text-[9px] font-bold text-zinc-400 block mt-0.5">
                        {relTime(n.created_at)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
