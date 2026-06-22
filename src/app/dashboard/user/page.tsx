"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getStoredProjects, saveStoredProjects, getStoredPosts, UserProject } from "../../utils/storage";
import {
  Video,
  LayoutDashboard,
  FolderOpen,
  Plus,
  Library,
  BarChart3,
  Users,
  Settings,
  AlertTriangle,
  Clock,
  Calendar,
  Mic,
  CloudUpload,
  ChevronRight,
  HelpCircle,
  User,
  X,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

type ContinueItem = {
  id: string;
  name: string;
  stage: string;
  progress: number;
  updatedAgo: string;
};

export default function UserDashboardWelcomePage() {
  const router = useRouter();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectPriority, setProjectPriority] = useState<"High" | "Medium" | "Low">("Medium");
  const [isCreating, setIsCreating] = useState(false);

  // Dynamic state values
  const [projects, setProjects] = useState<UserProject[]>([]);
  const [postsCount, setPostsCount] = useState(3);

  useEffect(() => {
    setProjects(getStoredProjects());
    setPostsCount(getStoredPosts().length);
  }, []);

  const totalProjects = projects.length;
  const inProgressCount = projects.filter((p) => p.status === "In Progress" || p.status === "Overdue").length;
  const completedCount = projects.filter((p) => p.status === "Completed").length;

  const continueItems: ContinueItem[] = projects
    .filter((p) => p.status === "In Progress" || p.status === "Draft" || p.status === "Overdue")
    .slice(0, 3)
    .map((p) => ({
      id: p.id,
      name: p.name,
      stage: p.stage.toUpperCase(),
      progress: p.progress,
      updatedAgo: `Updated ${p.lastUpdated}`,
    }));

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName) {
      toast.error("Please enter a project title");
      return;
    }

    setIsCreating(true);
    toast.info("Scaffolding workspaces...");

    setTimeout(() => {
      setIsCreating(false);
      const newId = projectName.toLowerCase().replace(/\s+/g, "-");
      const newProj: UserProject = {
        id: newId,
        name: projectName,
        projectId: `PRJ-${String(projects.length + 1).padStart(3, "0")}`,
        priority: projectPriority,
        priorityColor:
          projectPriority === "High"
            ? "bg-red-50 text-red-700 border-red-100"
            : projectPriority === "Medium"
            ? "bg-amber-50 text-amber-700 border-amber-100"
            : "bg-zinc-100 text-zinc-655 border-zinc-200",
        status: "In Progress",
        statusColor: "bg-zinc-100 text-zinc-800",
        stage: "AI Script Gen",
        dueDate: "Due: Jun 30",
        progress: 0,
        created: "Jun 22, 2026",
        lastUpdated: "Just now",
        creator: "Sarah J."
      };

      const updated = [newProj, ...projects];
      setProjects(updated);
      saveStoredProjects(updated);
      setShowCreateModal(false);
      setProjectName("");
      toast.success(`Project "${projectName}" successfully initialized!`);
    }, 1500);
  };

  return (
    <>
      {/* Create Project Modal */}
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
                  onChange={(e) => setProjectPriority(e.target.value as any)}
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
                className="w-full h-11 bg-brand-green hover:bg-brand-green-hover disabled:bg-brand-green/60 text-white rounded-xl text-sm font-bold shadow-md shadow-emerald-700/10 cursor-pointer flex items-center justify-center gap-1.5 pt-0.5"
              >
                {isCreating ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Initializing...
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
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
            <div className="text-left leading-normal">
              <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight">Welcome back, Sarah!</h1>
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
              { label: "My Projects", val: totalProjects, icon: "📁", bg: "bg-white" },
              { label: "In Progress", val: inProgressCount, icon: "⏳", bg: "bg-white" },
              { label: "Completed", val: completedCount, icon: "✅", bg: "bg-white" },
              { label: "Published", val: postsCount, icon: "🚀", bg: "bg-white" },
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

          {/* Middle Grid Section: Continue Working (60%) & Upcoming Deadlines (40%) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Continue Working */}
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

                      {/* Progress Bar */}
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
                      className="w-8 h-8 rounded-full border border-zinc-200 hover:bg-zinc-50 flex items-center justify-center text-zinc-450 hover:text-zinc-800 shrink-0 cursor-pointer transition-colors shadow-3xs"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Deadlines */}
            <div className="lg:col-span-5 bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-extrabold text-zinc-800 uppercase tracking-wide border-b border-zinc-100 pb-2 select-none">
                Upcoming Deadlines
              </h3>

              <div className="space-y-4 text-left select-none">
                {/* Today */}
                <div className="flex items-start gap-3.5 p-3.5 border border-zinc-150 border-l-4 border-l-red-500 bg-red-50/20 rounded-xl shadow-3xs">
                  <div className="w-8.5 h-8.5 rounded-xl bg-red-100 text-red-650 flex items-center justify-center shrink-0">
                    <AlertTriangle size={16} />
                  </div>
                  <div className="min-w-0 flex-1 leading-tight">
                    <span className="text-[9px] font-extrabold text-red-600 uppercase tracking-wider block">
                      Due Today
                    </span>
                    <h4 className="text-xs font-extrabold text-zinc-900 mt-1">Final Cut: Q3 Promo</h4>
                    <p className="text-[10px] font-semibold text-zinc-400 mt-1 leading-normal">
                      Submit to marketing team for final review before launch.
                    </p>
                  </div>
                </div>

                {/* This Week */}
                <div className="flex items-start gap-3.5 p-3.5 border border-zinc-150 border-l-4 border-l-amber-500 bg-amber-50/20 rounded-xl shadow-3xs">
                  <div className="w-8.5 h-8.5 rounded-xl bg-amber-100 text-amber-650 flex items-center justify-center shrink-0">
                    <Clock size={16} />
                  </div>
                  <div className="min-w-0 flex-1 leading-tight">
                    <span className="text-[9px] font-extrabold text-amber-655 uppercase tracking-wider block">
                      This Week (Thu)
                    </span>
                    <h4 className="text-xs font-extrabold text-zinc-900 mt-1">Voiceover Recording</h4>
                    <p className="text-[10px] font-semibold text-zinc-400 mt-1 leading-normal">
                      Studio session booked for 2 PM with client.
                    </p>
                  </div>
                </div>

                {/* Next Week */}
                <div className="flex items-start gap-3.5 p-3.5 border border-zinc-150 border-l-4 border-l-zinc-350 bg-zinc-50/50 rounded-xl shadow-3xs">
                  <div className="w-8.5 h-8.5 rounded-xl bg-zinc-100 text-zinc-555 flex items-center justify-center shrink-0">
                    <Calendar size={16} />
                  </div>
                  <div className="min-w-0 flex-1 leading-tight">
                    <span className="text-[9px] font-extrabold text-zinc-400 uppercase tracking-wider block">
                      Next Week
                    </span>
                    <h4 className="text-xs font-extrabold text-zinc-900 mt-1">Draft Review: Series B</h4>
                    <p className="text-[10px] font-semibold text-zinc-400 mt-1 leading-normal">
                      Initial rough cut presentation to stakeholders.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Row: Recent Activity */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold text-zinc-800 uppercase tracking-wide border-b border-zinc-100 pb-3 select-none">
              Recent Activity
            </h3>

            <div className="space-y-4 relative text-left pl-2 select-none">
              <div className="absolute left-[17px] top-3.5 bottom-3.5 w-px bg-zinc-100" />

              {/* Activity 1 */}
              <div className="flex items-start gap-3.5 relative z-10">
                <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-150 flex items-center justify-center text-emerald-650 shrink-0 shadow-3xs">
                  <Mic size={14} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-zinc-650 leading-snug">
                    You completed voice recording for <span className="font-extrabold text-zinc-900">Q3 Promo</span>
                  </p>
                  <span className="text-[9px] font-bold text-zinc-400 block mt-0.5">2 hours ago</span>
                </div>
              </div>

              {/* Activity 2 */}
              <div className="flex items-start gap-3.5 relative z-10">
                <div className="w-8 h-8 rounded-full bg-brand-green-light border border-brand-green/20 flex items-center justify-center text-brand-green shrink-0 shadow-3xs">
                  <CloudUpload size={14} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-zinc-650 leading-snug">
                    Team member uploaded 4 new raw assets to <span className="font-extrabold text-zinc-900">Product Launch Teaser</span>
                  </p>
                  <span className="text-[9px] font-bold text-zinc-400 block mt-0.5">Yesterday, 4:30 PM</span>
                </div>
              </div>

              {/* Activity 3 */}
              <div className="flex items-start gap-3.5 relative z-10">
                <div className="w-8 h-8 rounded-full bg-zinc-50 border border-zinc-150 flex items-center justify-center text-zinc-450 shrink-0 shadow-3xs">
                  <Calendar size={14} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-zinc-655 leading-snug">
                    You created a new project: <span className="font-extrabold text-zinc-900">Social Media Snippets Vol 2</span>
                  </p>
                  <span className="text-[9px] font-bold text-zinc-400 block mt-0.5">Oct 24, 2023</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
