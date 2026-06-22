"use client";

import { useState, Suspense, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Inbox,
  Loader2,
  Eye,
  Search,
  Calendar,
  User,
  ArrowRight,
  SlidersHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import { getStoredProjects, updateStoredProject, UserProject } from "../../../utils/storage";

type TaskItem = {
  id: string;
  name: string;
  from: string;
  tag: string;
  tagBg: string;
  tagText: string;
  deadline: string;
  status: "pending" | "in_progress" | "review";
  progress: number;
};

function TasksListContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get("status") || "pending";

  const [activeStatus, setActiveStatus] = useState<string>(initialStatus);
  const [searchQuery, setSearchQuery] = useState("");
  const [projects, setProjects] = useState<UserProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setProjects(getStoredProjects());
    setLoading(false);
  }, []);

  const handleStatusChange = (status: "pending" | "in_progress" | "review") => {
    setActiveStatus(status);
    router.replace(`/dashboard/editor/tasks?status=${status}`);
  };

  const handleAction = (id: string, currentStatus: string, name: string) => {
    if (currentStatus === "pending") {
      updateStoredProject(id, { stage: "Editing", progress: 85, lastUpdated: "Just now" });
      setProjects(getStoredProjects());
      toast.success(`Accepted "${name}"! Task is now In Progress.`);
    } else {
      router.push(`/dashboard/editor/tasks/${id}/edit`);
    }
  };

  const getProjectTag = (p: UserProject) => {
    if (p.id === "req-1") return "AI Editing";
    if (p.id === "req-2") return "Color Grading";
    if (p.id === "req-3") return "Motion Graphics";
    if (p.id === "ceo-address") return "Audio Enhancement";
    if (p.id === "editor-brand-refresh") return "Video Render";
    if (p.id === "app-tour") return "Captioning";
    return p.stylePreset || "Video Editing";
  };

  const getProjectTagBg = (p: UserProject) => {
    if (p.id === "req-1") return "bg-emerald-50 text-emerald-700 border-emerald-100";
    if (p.id === "req-2") return "bg-purple-50 text-purple-700 border-purple-100";
    if (p.id === "req-3") return "bg-amber-50 text-amber-700 border-amber-100";
    if (p.id === "ceo-address") return "bg-blue-50 text-blue-700 border-blue-100";
    if (p.id === "editor-brand-refresh") return "bg-indigo-50 text-indigo-700 border-indigo-100";
    if (p.id === "app-tour") return "bg-pink-50 text-pink-700 border-pink-100";
    
    if (p.priority === "High") return "bg-red-50 text-red-700 border-red-100";
    if (p.priority === "Medium") return "bg-amber-50 text-amber-700 border-amber-100";
    return "bg-zinc-50 text-zinc-700 border-zinc-100";
  };

  const editorProjects = projects.filter(p => 
    p.stage === "Video Editing" || p.stage === "Editing" || p.stage === "Under Review"
  );

  const tasks: TaskItem[] = editorProjects.map((p) => {
    let taskStatus: "pending" | "in_progress" | "review" = "pending";
    if (p.stage === "Editing") taskStatus = "in_progress";
    if (p.stage === "Under Review") taskStatus = "review";

    return {
      id: p.id,
      name: p.name,
      from: p.creator || "Sarah Johnson",
      tag: getProjectTag(p),
      tagBg: getProjectTagBg(p),
      tagText: getProjectTag(p),
      deadline: p.dueDate || "Jun 25, 5:00 PM",
      status: taskStatus,
      progress: p.progress || 0,
    };
  });

  const filteredTasks = tasks.filter((t) => {
    const matchesStatus = t.status === activeStatus;
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.from.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <span className="px-2 py-0.5 bg-red-50 text-red-700 border border-red-100 text-[9px] font-extrabold rounded">PENDING REQUEST</span>;
      case "in_progress":
        return <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-100 text-[9px] font-extrabold rounded">IN PROGRESS</span>;
      case "review":
        return <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 text-[9px] font-extrabold rounded">UNDER REVIEW</span>;
      default:
        return null;
    }
  };

  return (
    <main className="flex-1 overflow-y-auto px-8 py-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200 pb-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">Task Workspace</h1>
            <p className="text-sm font-semibold text-zinc-400">
              Manage requests, edit clips, and submit drafts for review.
            </p>
          </div>

        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-2 select-none border-b border-zinc-250 pb-px">
          {[
            { key: "pending", label: "Pending Requests", count: tasks.filter(t => t.status === "pending").length, color: "text-red-500" },
            { key: "in_progress", label: "In Progress", count: tasks.filter(t => t.status === "in_progress").length, color: "text-amber-500" },
            { key: "review", label: "Under Review", count: tasks.filter(t => t.status === "review").length, color: "text-blue-500" },
          ].map((tab) => {
            const isActive = activeStatus === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => handleStatusChange(tab.key as any)}
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
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tasks Cards List */}
        {filteredTasks.length === 0 ? (
          <div className="bg-white border border-zinc-200 rounded-2xl p-16 text-center shadow-xs">
            <span className="text-3xl block mb-2">🎉</span>
            <h3 className="text-sm font-bold text-zinc-800">No tasks in this stage</h3>
            <p className="text-xs font-semibold text-zinc-400 mt-1">
              You're all caught up! Select other stages to view items.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredTasks.map((t) => (
              <div
                key={t.id}
                onClick={() => router.push(t.status === "pending" ? "#" : `/dashboard/editor/tasks/${t.id}/edit`)}
                className="bg-white border border-zinc-200 hover:border-brand-green hover:shadow-xs rounded-2xl p-6 shadow-2xs transition-all cursor-pointer text-left space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    {getStatusBadge(t.status)}
                    <span className="text-[10px] font-semibold text-zinc-400 flex items-center gap-1">
                      <Calendar size={12} />
                      {t.deadline}
                    </span>
                  </div>

                  <h4 className="text-sm font-extrabold text-zinc-950 leading-snug pt-1">
                    {t.name}
                  </h4>
                  <p className="text-xs text-zinc-450">
                    From: <span className="font-bold text-zinc-700">{t.from}</span>
                  </p>
                </div>

                <div className="flex items-center justify-between gap-4 pt-1">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold border ${t.tagBg}`}>
                    {t.tag}
                  </span>
                  
                  {t.status !== "pending" && (
                    <div className="flex-1 max-w-[120px] select-none text-right">
                      <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden mb-1">
                        <div
                          style={{ width: `${t.progress}%` }}
                          className="h-full bg-brand-green rounded-full"
                        />
                      </div>
                      <span className="text-[9px] font-bold text-zinc-400 block">{t.progress}% complete</span>
                    </div>
                  )}
                </div>

                <hr className="border-zinc-100" />

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] font-bold text-zinc-400">
                    ID: {t.id.toUpperCase()}
                  </span>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAction(t.id, t.status, t.name);
                    }}
                    className="h-8 px-4 bg-brand-green hover:bg-brand-green-hover text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5 active:scale-[0.98]"
                  >
                    {t.status === "pending" ? (
                      <>Accept Request</>
                    ) : (
                      <>
                        Open Editor
                        <ArrowRight size={12} />
                      </>
                    )}
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
