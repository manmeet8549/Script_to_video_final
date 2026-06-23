"use client";

import { useCallback, useEffect, useState } from "react";
import { FolderKanban, Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api/client";
import { mapProjectToCard, type ProjectCardView } from "@/lib/ui/project-view";
import type { Project, ProjectPriority } from "@/types/db";

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<ProjectCardView[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [projTitle, setProjTitle] = useState("");
  const [projPriority, setProjPriority] = useState<ProjectPriority>("medium");
  const [isCreating, setIsCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<Project[]>("/api/projects");
      setProjects(data.map(mapProjectToCard));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to load projects.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void (async () => { await load(); })();
  }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projTitle.trim()) {
      toast.error("Please enter a project title.");
      return;
    }
    setIsCreating(true);
    try {
      const created = await api.post<Project>("/api/projects", {
        title: projTitle.trim(),
        priority: projPriority,
      });
      setProjects((prev) => [mapProjectToCard(created), ...prev]);
      setShowCreateModal(false);
      setProjTitle("");
      setProjPriority("medium");
      toast.success(`Project "${created.title}" created!`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to create project.");
    } finally {
      setIsCreating(false);
    }
  };

  const filtered = projects.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.stage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeCount = projects.filter((p) => p.status !== "Completed").length;

  return (
    <>
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl w-full max-w-md p-6 relative animate-in zoom-in-95 duration-200 text-left">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-600 rounded-lg cursor-pointer"
            >
              <X size={18} />
            </button>
            <h3 className="text-lg font-bold text-zinc-900 border-b border-zinc-100 pb-3 mb-4">
              Create New Project
            </h3>
            <form onSubmit={handleCreate} className="space-y-4">
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
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wide block">
                  Priority
                </label>
                <select
                  value={projPriority}
                  onChange={(e) => setProjPriority(e.target.value as ProjectPriority)}
                  className="w-full px-4 h-11 border border-zinc-200 focus:border-brand-green rounded-xl text-sm font-semibold text-zinc-900 outline-none bg-white cursor-pointer"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={isCreating}
                className="w-full h-11 bg-brand-green hover:bg-brand-green-hover disabled:bg-brand-green/60 text-white rounded-xl text-sm font-bold shadow-md cursor-pointer flex items-center justify-center gap-1.5"
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

      <main className="flex-1 overflow-y-auto px-8 py-8 bg-zinc-50/50">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
            <div className="text-left leading-normal">
              <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight flex items-center gap-2">
                All Projects
                <span className="text-xs font-bold px-2 py-0.5 bg-brand-green-light text-brand-green rounded-full">
                  {activeCount} Active
                </span>
              </h1>
              <p className="text-sm font-semibold text-zinc-400 mt-0.5">
                Review and monitor workspace video campaigns and pipelines.
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="h-10 px-4 bg-brand-green hover:bg-brand-green-hover text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-emerald-700/10"
            >
              <Plus size={14} strokeWidth={3} />
              Create Project
            </button>
          </div>

          <div className="flex items-center justify-between bg-white border border-zinc-200 p-4 rounded-2xl shadow-2xs">
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 px-3 border border-zinc-200 focus:border-brand-green rounded-xl text-xs font-semibold text-zinc-900 outline-none w-60"
            />
            <span className="text-xs font-bold text-zinc-400">
              {loading ? "Loading…" : `${filtered.length} project${filtered.length !== 1 ? "s" : ""}`}
            </span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={28} className="animate-spin text-brand-green" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white border border-zinc-200 rounded-2xl p-16 text-center shadow-xs">
              <FolderKanban size={32} className="text-zinc-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-zinc-800">No projects found</h3>
              <p className="text-xs font-semibold text-zinc-400 mt-1">
                Create a project to get started.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filtered.map((p) => (
                <div
                  key={p.id}
                  className="bg-white border border-zinc-200 hover:border-brand-green hover:shadow-xs rounded-2xl p-5 shadow-2xs transition-all text-left space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-4">
                      <span
                        className={`px-2 py-0.5 border rounded-[4px] text-[9px] font-extrabold uppercase tracking-wide ${p.priorityColor}`}
                      >
                        {p.priority} Priority
                      </span>
                      <span
                        className={`px-2 py-0.5 border rounded-[4px] text-[9px] font-extrabold uppercase tracking-wide ${p.statusColor}`}
                      >
                        {p.status}
                      </span>
                    </div>

                    <h4 className="text-sm font-extrabold text-zinc-950 leading-tight">
                      {p.name}
                    </h4>
                  </div>

                  <hr className="border-zinc-100" />

                  <div className="flex items-center justify-between text-[10px] font-semibold text-zinc-555">
                    <div>
                      <span className="block uppercase text-[9px] text-zinc-400 font-extrabold">Stage</span>
                      <span className="text-zinc-800 font-bold block mt-0.5">{p.stage}</span>
                    </div>
                    <div className="text-right">
                      <span className="block uppercase text-[9px] text-zinc-400 font-extrabold">Due Date</span>
                      <span className="text-zinc-800 font-bold block mt-0.5">{p.dueDate}</span>
                    </div>
                  </div>

                  <div className="space-y-1 select-none">
                    <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${p.progress}%` }}
                        className="h-full bg-brand-green rounded-full"
                      />
                    </div>
                    <div className="flex items-center justify-between text-[9px] font-bold text-zinc-400">
                      <span>Progress</span>
                      <span>{p.progress}% Complete</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
