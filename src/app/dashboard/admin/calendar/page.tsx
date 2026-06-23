"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  Loader2,
  Plus,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api/client";
import type { Profile, Project, WorkspaceMember } from "@/types/db";

type MemberRow = WorkspaceMember & { profile: Profile | null };

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAY_NAMES = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

function fmtDeadline(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) +
    " " + d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

function statusColor(status: Project["status"]): string {
  switch (status) {
    case "published": return "bg-emerald-50 text-emerald-700 border-emerald-100";
    case "editing": return "bg-blue-50 text-blue-700 border-blue-100";
    case "review": return "bg-violet-50 text-violet-700 border-violet-100";
    case "idea": return "bg-zinc-100 text-zinc-600 border-zinc-200";
    default: return "bg-amber-50 text-amber-700 border-amber-100";
  }
}

export default function AdminCalendarPage() {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [viewMode, setViewMode] = useState<"month" | "week" | "day">("month");

  const [projects, setProjects] = useState<Project[]>([]);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Deadline modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState("");
  const [deadlineDate, setDeadlineDate] = useState("");
  const [deadlineTime, setDeadlineTime] = useState("09:00");
  const [notifyTarget, setNotifyTarget] = useState<"all" | "users" | "editors">("all");
  const [notifyMessage, setNotifyMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clearingId, setClearingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [projData, memData] = await Promise.all([
        api.get<Project[]>("/api/projects"),
        api.get<MemberRow[]>("/api/members"),
      ]);
      setProjects(projData);
      setMembers(memData);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to load data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void (async () => { await load(); })();
  }, [load]);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  };

  const getProjectsForDay = (day: number) => {
    return projects.filter((p) => {
      if (!p.deadline) return false;
      const d = new Date(p.deadline);
      return d.getFullYear() === viewYear && d.getMonth() === viewMonth && d.getDate() === day;
    });
  };

  const handleSetDeadline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !deadlineDate) {
      toast.error("Please select a project and date.");
      return;
    }
    const project = projects.find((p) => p.id === selectedProject);
    if (!project) return;

    setIsSubmitting(true);
    try {
      const isoDeadline = new Date(`${deadlineDate}T${deadlineTime}:00`).toISOString();
      await api.patch(`/api/projects/${selectedProject}`, { deadline: isoDeadline });

      const friendlyDate = fmtDeadline(isoDeadline);
      const broadcastMsg = [
        `Deadline set for ${friendlyDate}.`,
        notifyMessage.trim(),
      ].filter(Boolean).join(" ");

      await api.post("/api/notifications/broadcast", {
        title: `Deadline Set: ${project.title}`,
        message: broadcastMsg,
        type: "deadline",
        target: notifyTarget,
        related_project_id: selectedProject,
      });

      toast.success(`Deadline set for "${project.title}" and team notified.`);
      setShowModal(false);
      setSelectedProject("");
      setDeadlineDate("");
      setDeadlineTime("09:00");
      setNotifyMessage("");
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to set deadline.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClearDeadline = async (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;
    setClearingId(projectId);
    try {
      await api.patch(`/api/projects/${projectId}`, { deadline: null });
      await api.post("/api/notifications/broadcast", {
        title: `Deadline Cleared: ${project.title}`,
        message: "The deadline for this project has been cleared.",
        type: "system",
        target: "all",
      });
      toast.success(`Deadline cleared for "${project.title}".`);
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to clear deadline.");
    } finally {
      setClearingId(null);
    }
  };

  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const upcomingDeadlines = projects
    .filter((p) => p.deadline !== null)
    .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
    .slice(0, 5);

  const thisMonthDeadlines = projects.filter((p) => {
    if (!p.deadline) return false;
    const d = new Date(p.deadline);
    return d.getFullYear() === viewYear && d.getMonth() === viewMonth;
  }).length;

  void members;

  return (
    <>
      {/* Deadline Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl w-full max-w-lg p-6 relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-655 rounded-lg cursor-pointer"
            >
              <X size={18} />
            </button>
            <h3 className="text-lg font-bold text-zinc-900 border-b border-zinc-100 pb-3 mb-5">
              Set Project Deadline
            </h3>
            <form onSubmit={handleSetDeadline} className="space-y-4">
              {/* Project */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-zinc-450 uppercase tracking-wide block">
                  Project
                </label>
                <select
                  required
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="w-full px-4 h-11 border border-zinc-200 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 rounded-xl text-sm font-semibold text-zinc-900 outline-none bg-white"
                >
                  <option value="">Select a project...</option>
                  {[...projects]
                    .sort((a, b) => a.title.localeCompare(b.title))
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}{p.deadline ? ` (current: ${fmtDeadline(p.deadline)})` : ""}
                      </option>
                    ))}
                </select>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-zinc-450 uppercase tracking-wide block">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={deadlineDate}
                    onChange={(e) => setDeadlineDate(e.target.value)}
                    className="w-full px-4 h-11 border border-zinc-200 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 rounded-xl text-sm font-semibold text-zinc-900 outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-zinc-450 uppercase tracking-wide block">
                    Time
                  </label>
                  <input
                    type="time"
                    value={deadlineTime}
                    onChange={(e) => setDeadlineTime(e.target.value)}
                    className="w-full px-4 h-11 border border-zinc-200 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 rounded-xl text-sm font-semibold text-zinc-900 outline-none"
                  />
                </div>
              </div>

              {/* Notify target */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-zinc-450 uppercase tracking-wide block">
                  Notify
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["all", "users", "editors"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setNotifyTarget(t)}
                      className={`h-10 text-xs font-bold border rounded-xl cursor-pointer capitalize ${
                        notifyTarget === t
                          ? "bg-brand-green text-white border-brand-green shadow-sm"
                          : "bg-white text-zinc-500 border-zinc-200 hover:bg-zinc-50"
                      }`}
                    >
                      {t === "all" ? "All Members" : t === "users" ? "Users Only" : "Editors Only"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Optional message */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-zinc-450 uppercase tracking-wide block">
                  Message (optional)
                </label>
                <div className="relative">
                  <textarea
                    value={notifyMessage}
                    maxLength={500}
                    rows={3}
                    onChange={(e) => setNotifyMessage(e.target.value)}
                    placeholder="Add context for the notification..."
                    className="w-full px-4 py-3 border border-zinc-200 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 rounded-xl text-sm font-semibold text-zinc-900 outline-none resize-none"
                  />
                  <span className="absolute right-3 bottom-2.5 text-[10px] text-zinc-400 font-semibold">
                    {notifyMessage.length}/500
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 bg-brand-green hover:bg-brand-green-hover disabled:bg-brand-green/60 text-white rounded-xl text-sm font-bold shadow-md shadow-brand-green/10 cursor-pointer flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <><Loader2 size={16} className="animate-spin" /> Setting Deadline...</>
                ) : (
                  "Set Deadline & Notify"
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Content Body */}
      <main className="flex-1 overflow-y-auto px-8 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">
                Schedule & Deadlines
              </h1>
              <p className="text-sm font-semibold text-zinc-400 leading-normal">
                Set project deadlines and notify your team instantly.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => toast.info("Calendar export coming soon.")}
                className="h-11 px-4 border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer bg-white"
              >
                <Download size={14} />
                Export
              </button>
              <button
                onClick={() => setShowModal(true)}
                className="h-11 px-5 bg-brand-green hover:bg-brand-green-hover text-white rounded-xl text-sm font-bold flex items-center gap-1.5 shadow-md shadow-brand-green/10 cursor-pointer transition-colors"
              >
                <Plus size={16} />
                Set Deadline
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 size={28} className="animate-spin text-brand-green" />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Calendar Column */}
              <div className="lg:col-span-8 space-y-6">
                {/* Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-100 pb-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { setViewMonth(now.getMonth()); setViewYear(now.getFullYear()); }}
                      className="h-8 px-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold rounded-lg cursor-pointer"
                    >
                      Today
                    </button>
                    <div className="flex border border-zinc-200 rounded-lg overflow-hidden h-8">
                      <button
                        onClick={prevMonth}
                        className="p-1.5 hover:bg-zinc-50 text-zinc-500 border-r border-zinc-200 shrink-0 cursor-pointer"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <button
                        onClick={nextMonth}
                        className="p-1.5 hover:bg-zinc-50 text-zinc-500 shrink-0 cursor-pointer"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                    <span className="text-base font-extrabold text-zinc-800 ml-2">
                      {MONTH_NAMES[viewMonth]} {viewYear}
                    </span>
                  </div>

                  <div className="flex bg-zinc-100 p-1 rounded-xl">
                    {(["month", "week", "day"] as const).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setViewMode(mode)}
                        className={`h-8 px-4 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                          viewMode === mode
                            ? "bg-white text-zinc-800 shadow-sm"
                            : "text-zinc-500 hover:text-zinc-950"
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-px bg-zinc-200 rounded-xl overflow-hidden border border-zinc-200 select-none">
                  {DAY_NAMES.map((day) => (
                    <div
                      key={day}
                      className="bg-zinc-50 py-2.5 text-center text-[10px] font-extrabold tracking-wide text-zinc-400"
                    >
                      {day}
                    </div>
                  ))}

                  {/* Empty leading cells */}
                  {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                    <div key={`empty-${i}`} className="bg-white min-h-[90px] p-2 text-[10px] font-bold text-zinc-200">
                      {/* prev month overflow */}
                    </div>
                  ))}

                  {/* Day cells */}
                  {Array.from({ length: daysInMonth }).map((_, idx) => {
                    const dayNum = idx + 1;
                    const isToday =
                      dayNum === now.getDate() &&
                      viewMonth === now.getMonth() &&
                      viewYear === now.getFullYear();
                    const dayProjects = getProjectsForDay(dayNum);

                    return (
                      <div
                        key={dayNum}
                        className="bg-white min-h-[90px] p-1.5 hover:bg-zinc-50/50 transition-colors flex flex-col"
                      >
                        <div className="flex justify-end">
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-extrabold ${
                              isToday
                                ? "bg-brand-green text-white shadow-sm"
                                : "text-zinc-800"
                            }`}
                          >
                            {dayNum}
                          </span>
                        </div>
                        <div className="space-y-1 mt-1">
                          {dayProjects.map((p) => (
                            <div
                              key={p.id}
                              className="group relative text-[9px] font-bold py-0.5 px-1.5 border-l-2 rounded-r flex items-center justify-between overflow-hidden bg-red-50 text-red-700 border-red-500"
                              title={p.title}
                            >
                              <span className="truncate">{p.title}</span>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleClearDeadline(p.id); }}
                                disabled={clearingId === p.id}
                                className="hidden group-hover:flex items-center ml-0.5 text-red-400 hover:text-red-700 cursor-pointer shrink-0"
                                title="Clear deadline"
                              >
                                {clearingId === p.id ? (
                                  <Loader2 size={8} className="animate-spin" />
                                ) : (
                                  <X size={9} strokeWidth={3} />
                                )}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Sidebar Column */}
              <div className="lg:col-span-4 space-y-6">
                {/* Upcoming Deadlines */}
                <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-sm space-y-4">
                  <div className="flex justify-between items-center border-b border-zinc-100 pb-2">
                    <h3 className="text-sm font-extrabold text-zinc-800 tracking-tight flex items-center gap-2">
                      <CalendarDays size={14} className="text-brand-green" />
                      Upcoming Deadlines
                    </h3>
                  </div>
                  {upcomingDeadlines.length === 0 ? (
                    <p className="text-xs font-semibold text-zinc-400">No upcoming deadlines.</p>
                  ) : (
                    <div className="space-y-3">
                      {upcomingDeadlines.map((p) => (
                        <div
                          key={p.id}
                          className="flex items-start gap-3 p-2.5 rounded-xl border border-zinc-100 hover:border-zinc-200 transition-colors"
                        >
                          <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-1.5 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs font-bold text-zinc-900 truncate">{p.title}</h4>
                            <span className="text-[10px] font-semibold text-zinc-400 flex items-center gap-1 mt-0.5">
                              <Clock size={10} />
                              {fmtDeadline(p.deadline!)}
                            </span>
                          </div>
                          <span
                            className={`shrink-0 px-1.5 py-0.5 border rounded text-[9px] font-extrabold uppercase ${statusColor(p.status)}`}
                          >
                            {p.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Summary */}
                <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-sm space-y-4">
                  <h3 className="text-sm font-extrabold text-zinc-800 tracking-tight border-b border-zinc-100 pb-2">
                    {MONTH_NAMES[viewMonth]} Summary
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-zinc-500">Deadlines this month</span>
                      <span className="font-extrabold text-zinc-900">{thisMonthDeadlines}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-zinc-500">Total projects</span>
                      <span className="font-extrabold text-zinc-900">{projects.length}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-zinc-500">With deadlines set</span>
                      <span className="font-extrabold text-zinc-900">
                        {projects.filter((p) => p.deadline !== null).length}
                      </span>
                    </div>
                    <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden mt-2">
                      <div
                        className="h-full bg-brand-green rounded-full transition-all"
                        style={{
                          width: projects.length > 0
                            ? `${Math.round((projects.filter((p) => p.deadline !== null).length / projects.length) * 100)}%`
                            : "0%",
                        }}
                      />
                    </div>
                    <p className="text-[10px] font-semibold text-zinc-400">
                      {projects.length > 0
                        ? `${Math.round((projects.filter((p) => p.deadline !== null).length / projects.length) * 100)}% of projects have deadlines set`
                        : "No projects yet"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
