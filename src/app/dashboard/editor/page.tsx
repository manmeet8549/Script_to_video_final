"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle,
  Clock,
  Loader2,
  Star,
  Trophy,
} from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api/client";
import type { Notification, Project } from "@/types/db";

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function fmtDeadline(iso: string | null): string {
  if (!iso) return "No deadline";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const PRIORITY_COLORS: Record<Project["priority"], string> = {
  urgent: "bg-red-50 text-red-700 border-red-100",
  high: "bg-red-50 text-red-700 border-red-100",
  medium: "bg-amber-50 text-amber-700 border-amber-100",
  low: "bg-zinc-50 text-zinc-700 border-zinc-100",
};

export default function EditorDashboardPage() {
  const router = useRouter();

  const [projects, setProjects] = useState<Project[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
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

  const editingTasks = projects.filter((p) => p.status === "editing");
  const reviewTasks = projects.filter((p) => p.status === "review");
  const completedTasks = projects.filter((p) => p.status === "published");

  const recentActivity = notifications.slice(0, 5);

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-brand-green" />
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto px-8 py-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 text-left">
            Dashboard Overview
          </h1>
          <button
            onClick={load}
            className="text-xs font-bold text-brand-green hover:underline cursor-pointer"
          >
            Refresh
          </button>
        </div>

        {/* KPI Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: "In Progress", val: editingTasks.length, icon: "⏳", color: "text-amber-500 bg-amber-50/50" },
            { label: "Under Review", val: reviewTasks.length, icon: "📝", color: "text-zinc-500 bg-zinc-50" },
            { label: "Completed", val: completedTasks.length, icon: "✅", color: "text-emerald-500 bg-emerald-50/50" },
            { label: "Notifications", val: notifications.filter((n) => !n.is_read).length, icon: "🔔", color: "text-blue-500 bg-blue-50/50" },
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

        {/* Split Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Active Tasks */}
          <div className="lg:col-span-7 bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex justify-between items-center border-b border-zinc-100 pb-2.5 select-none">
              <h3 className="text-sm font-extrabold text-zinc-800 uppercase tracking-wide">
                Active Tasks
              </h3>
              <button
                onClick={() => router.push("/dashboard/editor/tasks")}
                className="text-xs font-bold text-brand-green hover:underline cursor-pointer"
              >
                View All
              </button>
            </div>

            {editingTasks.length === 0 ? (
              <div className="py-12 text-center">
                <CheckCircle size={32} className="text-brand-green mx-auto mb-2" />
                <p className="text-sm font-bold text-zinc-600">No active editing tasks.</p>
                <p className="text-xs font-semibold text-zinc-400 mt-1">
                  Check back when new projects are assigned.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {editingTasks.slice(0, 4).map((p) => (
                  <div
                    key={p.id}
                    onClick={() => router.push(`/dashboard/editor/tasks/${p.id}/edit`)}
                    className="border border-zinc-150 rounded-2xl p-5 hover:border-zinc-350 hover:shadow-2xs transition-all text-left space-y-3 cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <span className={`inline-block px-1.5 py-0.5 border rounded text-[9px] font-extrabold ${PRIORITY_COLORS[p.priority]}`}>
                          {p.priority.toUpperCase()}
                        </span>
                        <h4 className="text-xs font-extrabold text-zinc-900 leading-tight block pt-0.5">
                          {p.title}
                        </h4>
                      </div>
                      <span className="text-[10px] font-semibold text-zinc-400 shrink-0">
                        {fmtDeadline(p.deadline)}
                      </span>
                    </div>

                    {p.progress_percent > 0 && (
                      <div className="space-y-1 select-none">
                        <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${p.progress_percent}%` }}
                            className="h-full bg-brand-green rounded-full"
                          />
                        </div>
                        <div className="flex justify-between text-[9px] font-bold text-zinc-400">
                          <span>Progress</span>
                          <span>{p.progress_percent}%</span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-end pt-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/dashboard/editor/tasks/${p.id}/edit`);
                        }}
                        className="h-8 px-4 bg-brand-green hover:bg-brand-green-hover text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        Open Editor <ArrowRight size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Performance + Activity */}
          <div className="lg:col-span-5 space-y-6">
            {/* Performance Scorecard */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm space-y-5 select-none text-left">
              <h3 className="text-sm font-extrabold text-zinc-800 uppercase tracking-wide border-b border-zinc-100 pb-2">
                My Performance
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-zinc-50 border border-zinc-150 rounded-xl p-3.5">
                  <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wide block">
                    Tasks in Queue
                  </span>
                  <span className="text-base font-extrabold text-zinc-850 block mt-1">
                    {editingTasks.length + reviewTasks.length}
                  </span>
                </div>
                <div className="bg-zinc-50 border border-zinc-150 rounded-xl p-3.5">
                  <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wide block">
                    Completed
                  </span>
                  <span className="text-base font-extrabold text-zinc-850 block mt-1">
                    {completedTasks.length}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-zinc-50 border border-zinc-150 rounded-xl">
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-zinc-400 uppercase block">Rating</span>
                  <div className="flex items-center gap-1 pt-0.5">
                    <span className="text-base font-extrabold text-zinc-850 mr-1">4.8</span>
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={11} fill="#eab308" className="text-yellow-500" />
                    ))}
                  </div>
                </div>
                <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-500">
                  <Trophy size={16} />
                </div>
              </div>
            </div>

            {/* Recent Notifications */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-zinc-100 pb-2">
                <h3 className="text-sm font-extrabold text-zinc-800 uppercase tracking-wide">
                  Recent Activity
                </h3>
                <button
                  onClick={() => router.push("/dashboard/editor/notifications")}
                  className="text-xs font-bold text-brand-green hover:underline cursor-pointer"
                >
                  View All
                </button>
              </div>

              {recentActivity.length === 0 ? (
                <p className="text-xs font-semibold text-zinc-400 py-4 text-center">No recent activity.</p>
              ) : (
                <div className="space-y-3 text-left">
                  {recentActivity.map((n) => (
                    <div key={n.id} className="flex items-start gap-3">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border ${
                        n.is_read ? "bg-zinc-50 border-zinc-200" : "bg-brand-green-light border-brand-green/20"
                      }`}>
                        <Clock size={12} className={n.is_read ? "text-zinc-400" : "text-brand-green"} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-zinc-900 truncate">{n.title}</h4>
                        <span className="text-[9px] font-semibold text-zinc-400 block mt-0.5">
                          {relTime(n.created_at)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
