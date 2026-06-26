"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Calendar,
  Clock,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api/client";
import { progressFromStatus } from "@/lib/ui/project-view";
import type { Project } from "@/types/db";

type TaskStatus = "editing" | "review";


const PRIORITY_COLORS: Record<Project["priority"], string> = {
  urgent: "bg-red-50 text-red-700 border-red-100",
  high: "bg-red-50 text-red-700 border-red-100",
  medium: "bg-amber-50 text-amber-700 border-amber-100",
  low: "bg-zinc-50 text-zinc-700 border-zinc-100",
};

function fmtDeadline(iso: string | null): string {
  if (!iso) return "No deadline";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function TasksListContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("status") as TaskStatus | null) ?? "editing";

  const [activeTab, setActiveTab] = useState<TaskStatus>(initialTab);
  const [searchQuery, setSearchQuery] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<Project[]>("/api/projects");
      setProjects(data.filter((p) => p.status === "editing" || p.status === "review"));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to load tasks.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void (async () => { await load(); })();
  }, [load]);

  const handleTabChange = (tab: TaskStatus) => {
    setActiveTab(tab);
    router.replace(`/dashboard/editor/tasks?status=${tab}`);
  };

  const editingTasks = projects.filter((p) => p.status === "editing");
  const reviewTasks = projects.filter((p) => p.status === "review");

  const currentTasks = (activeTab === "editing" ? editingTasks : reviewTasks).filter((p) =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: TaskStatus) => {
    if (status === "editing") {
      return <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-100 text-[9px] font-extrabold rounded">IN PROGRESS</span>;
    }
    return <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 text-[9px] font-extrabold rounded">UNDER REVIEW</span>;
  };

  return (
    <main className="flex-1 overflow-y-auto px-8 py-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200 pb-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">Task Workspace</h1>
            <p className="text-sm font-semibold text-zinc-400">
              Manage your active editing tasks and review submissions.
            </p>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-2 select-none border-b border-zinc-250 pb-px">
          {([
            { key: "editing" as const, label: "In Progress", count: editingTasks.length, color: "text-amber-500" },
            { key: "review" as const, label: "Under Review", count: reviewTasks.length, color: "text-blue-500" },
          ]).map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={`h-11 px-4 text-xs font-bold flex items-center gap-2 transition-all border-b-2 cursor-pointer ${
                  isActive
                    ? "text-brand-green border-brand-green font-extrabold"
                    : "text-zinc-400 border-transparent hover:text-zinc-700"
                }`}
              >
                {tab.label}
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                  isActive ? "bg-brand-green-light text-brand-green" : "bg-zinc-100 text-zinc-500"
                }`}>
                  {loading ? "…" : tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div>
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 px-3 border border-zinc-200 focus:border-brand-green rounded-xl text-xs font-semibold text-zinc-900 outline-none w-64"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="animate-spin text-brand-green" />
          </div>
        ) : currentTasks.length === 0 ? (
          <div className="bg-white border border-zinc-200 rounded-2xl p-16 text-center shadow-xs">
            <span className="text-3xl block mb-2">🎉</span>
            <h3 className="text-sm font-bold text-zinc-800">No tasks in this stage</h3>
            <p className="text-xs font-semibold text-zinc-400 mt-1">
              {searchQuery ? "Try adjusting your search." : "You're all caught up!"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {currentTasks.map((p) => (
              <div
                key={p.id}
                onClick={() => router.push(`/dashboard/editor/tasks/${p.id}/edit`)}
                className="bg-white border border-zinc-200 hover:border-brand-green hover:shadow-xs rounded-2xl p-6 shadow-2xs transition-all cursor-pointer text-left space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    {getStatusBadge(p.status as TaskStatus)}
                    <span className="text-[10px] font-semibold text-zinc-400 flex items-center gap-1">
                      <Calendar size={12} />
                      {fmtDeadline(p.deadline)}
                    </span>
                  </div>

                  <h4 className="text-sm font-extrabold text-zinc-950 leading-snug pt-1">
                    {p.title}
                  </h4>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold border ${PRIORITY_COLORS[p.priority]}`}>
                      {p.priority} priority
                    </span>
                  </div>
                </div>

                {(() => { const pct = progressFromStatus(p.status); return pct > 0 && (
                  <div className="space-y-1 select-none">
                    <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                      <div style={{ width: `${pct}%` }} className="h-full bg-brand-green rounded-full" />
                    </div>
                    <span className="text-[9px] font-bold text-zinc-400 block">{pct}% complete</span>
                  </div>
                ); })()}

                <hr className="border-zinc-100" />

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] font-bold text-zinc-400 flex items-center gap-1">
                    <Clock size={10} />
                    Updated {relTime(p.updated_at)}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/dashboard/editor/tasks/${p.id}/edit`);
                    }}
                    className="h-8 px-4 bg-brand-green hover:bg-brand-green-hover text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5 active:scale-[0.98]"
                  >
                    Open Editor
                    <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

export default function EditorTasksPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 text-brand-green animate-spin" />
      </div>
    }>
      <TasksListContent />
    </Suspense>
  );
}
