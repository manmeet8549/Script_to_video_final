"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api/client";
import { mapProjectToCard, type ProjectCardView } from "@/lib/ui/project-view";
import type { Project, ProjectPriority } from "@/types/db";
import {
  Plus,
  MoreVertical,
  X,
  Loader2,
  UserCheck,
  Clapperboard,
  Share2,
} from "lucide-react";
import { toast } from "sonner";
import SendToEditorModal from "@/components/SendToEditorModal";



export default function UserProjectsPage() {
  const router = useRouter();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "active" | "completed" | "drafts">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Form states
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectPriority, setNewProjectPriority] = useState<"High" | "Medium" | "Low">("Medium");
  const [newProjectStage, setNewProjectStage] = useState("AI Script Gen");
  const [isCreating, setIsCreating] = useState(false);

  // Dropdown card menu & Send to Editor Modal state
  const [activeMenuProjectId, setActiveMenuProjectId] = useState<string | null>(null);
  const [selectedProjectForEditor, setSelectedProjectForEditor] = useState<{ id: string; videoUrl?: string | null } | null>(null);

  // Projects list state
  const [projects, setProjects] = useState<ProjectCardView[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadProjects = useCallback(async () => {
    try {
      const data = await api.get<Project[]>("/api/projects");
      setProjects(data.map(mapProjectToCard));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to load projects.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName) {
      toast.error("Please enter a project name");
      return;
    }

    setIsCreating(true);
    toast.info("Scaffolding pipeline tracks and voice configurations...");

    try {
      await api.post<Project>("/api/projects", {
        title: newProjectName,
        priority: newProjectPriority.toLowerCase() as ProjectPriority,
      });
      await loadProjects();
      setShowCreateModal(false);
      setNewProjectName("");
      toast.success(`Project "${newProjectName}" successfully initialized!`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to create project.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleCardClick = (id: string) => {
    router.push(`/dashboard/user/projects/${id}`);
  };

  const filteredProjects = projects.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesTab = true;
    if (activeTab === "active") {
      matchesTab = p.status === "In Progress" || p.status === "Overdue";
    } else if (activeTab === "completed") {
      matchesTab = p.status === "Completed";
    } else if (activeTab === "drafts") {
      matchesTab = p.status === "Draft";
    }

    return matchesSearch && matchesTab;
  });

  return (
    <>
      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl w-full max-w-md p-6 relative animate-in zoom-in-95 duration-200 text-left">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-605 rounded-lg cursor-pointer"
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
                  placeholder="e.g. June Product Walkthrough"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full px-4 h-11 border border-zinc-200 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 rounded-xl text-sm font-semibold text-zinc-900 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wide block">
                    Priority
                  </label>
                  <select
                    value={newProjectPriority}
                    onChange={(e) => setNewProjectPriority(e.target.value as any)}
                    className="w-full px-4 h-11 border border-zinc-200 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 rounded-xl text-sm font-semibold text-zinc-900 outline-none bg-white cursor-pointer"
                  >
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wide block">
                    Target Stage
                  </label>
                  <select
                    value={newProjectStage}
                    onChange={(e) => setNewProjectStage(e.target.value)}
                    className="w-full px-4 h-11 border border-zinc-200 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 rounded-xl text-sm font-semibold text-zinc-900 outline-none bg-white cursor-pointer"
                  >
                    <option>AI Script Gen</option>
                    <option>Voiceover</option>
                    <option>Video Studio</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={isCreating}
                className="w-full h-11 bg-brand-green hover:bg-brand-green-hover disabled:bg-brand-green/60 text-white rounded-xl text-sm font-bold shadow-md shadow-brand-green/10 cursor-pointer flex items-center justify-center gap-1.5 pt-0.5"
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

      {/* Content Body */}
      <main className="flex-1 overflow-y-auto px-8 py-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
            <div className="text-left leading-normal">
              <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight">My Projects</h1>
              <p className="text-sm font-semibold text-zinc-400 mt-0.5">
                Manage and track your AI video generation projects.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Create CTA */}
              <button
                onClick={() => setShowCreateModal(true)}
                className="h-10 px-4 bg-brand-green hover:bg-brand-green-hover text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-brand-green/10"
              >
                <Plus size={14} strokeWidth={3} />
                Create New
              </button>
            </div>
          </div>

          {/* Tabbed filters */}
          <div className="flex items-center gap-2 select-none border-b border-zinc-250 pb-px">
            {[
              { key: "all", label: "All Projects" },
              { key: "active", label: "Active" },
              { key: "completed", label: "Completed" },
              { key: "drafts", label: "Drafts" },
            ].map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`h-10 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                    isActive
                      ? "text-brand-green border-brand-green font-extrabold"
                      : "text-zinc-400 border-transparent hover:text-zinc-700"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Projects Grid cards list */}
          {isLoading ? (
            <div className="bg-white border border-zinc-200 rounded-2xl p-16 text-center shadow-xs flex items-center justify-center gap-2 text-zinc-400">
              <Loader2 size={18} className="animate-spin" />
              <span className="text-sm font-bold">Loading projects…</span>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="bg-white border border-zinc-200 rounded-2xl p-16 text-center shadow-xs">
              <span className="text-3xl block mb-2">📁</span>
              <h3 className="text-sm font-bold text-zinc-800">No projects found</h3>
              <p className="text-xs font-semibold text-zinc-400 mt-1">
                Try adjusting your search filters or create a new project.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((p) => (
                <div
                  key={p.id}
                  onClick={() => handleCardClick(p.id)}
                  className="relative bg-white border border-zinc-200 hover:border-brand-green hover:shadow-xs rounded-2xl p-5 shadow-2xs transition-all cursor-pointer text-left space-y-4 flex flex-col justify-between"
                >
                  {/* Header: Title & ellipsis menu */}
                  <div className="flex items-start justify-between gap-4">
                    <h4 className="text-sm font-extrabold text-zinc-900 line-clamp-2 leading-tight">
                      {p.name}
                    </h4>
                    <div className="relative shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuProjectId(activeMenuProjectId === p.id ? null : p.id);
                        }}
                        className="p-1 text-zinc-400 hover:text-zinc-600 rounded cursor-pointer transition-colors"
                      >
                        <MoreVertical size={16} />
                      </button>

                      {activeMenuProjectId === p.id && (
                        <>
                          <div
                            className="fixed inset-0 z-10 cursor-default"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuProjectId(null);
                            }}
                          />
                          <div
                            className="absolute right-0 mt-1 w-48 rounded-xl border border-zinc-200 bg-white py-1.5 shadow-lg z-20 text-left animate-in fade-in slide-in-from-top-1 duration-100"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => {
                                setActiveMenuProjectId(null);
                                router.push(`/dashboard/user/projects/${p.id}`);
                              }}
                              className="w-full px-4 py-2.5 hover:bg-zinc-50 text-xs font-bold text-zinc-700 flex items-center gap-2 transition-colors cursor-pointer"
                            >
                              <Clapperboard size={14} className="text-zinc-400" />
                              Open Video Studio
                            </button>
                            {p.videoUrl && (
                              <button
                                onClick={() => {
                                  setActiveMenuProjectId(null);
                                  setSelectedProjectForEditor({ id: p.id, videoUrl: p.videoUrl });
                                }}
                                className="w-full px-4 py-2.5 hover:bg-zinc-50 text-xs font-bold text-zinc-700 flex items-center gap-2 transition-colors cursor-pointer border-t border-zinc-100"
                              >
                                <UserCheck size={14} className="text-brand-green" />
                                Send to Editor
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setActiveMenuProjectId(null);
                                router.push(`/dashboard/user/projects/${p.id}/publish`);
                              }}
                              className="w-full px-4 py-2.5 hover:bg-zinc-50 text-xs font-bold text-zinc-700 flex items-center gap-2 transition-colors cursor-pointer border-t border-zinc-100"
                            >
                              <Share2 size={14} className="text-zinc-400" />
                              Publish Video
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Priority & Status Badges */}
                  <div className="flex flex-wrap items-center gap-2 select-none">
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

                  <hr className="border-zinc-100" />

                  {/* Stage & Due Date metrics */}
                  <div className="grid grid-cols-2 text-[10px] font-semibold text-zinc-555 select-none">
                    <div>
                      <span className="block uppercase text-[9px] text-zinc-400 font-extrabold">Stage</span>
                      <span className="text-zinc-800 font-bold block mt-0.5">{p.stage}</span>
                    </div>
                    <div>
                      <span className="block uppercase text-[9px] text-zinc-400 font-extrabold">Due Date</span>
                      <span className="text-zinc-800 font-bold block mt-0.5">{p.dueDate}</span>
                    </div>
                  </div>

                  {/* Progress tracking bar */}
                  <div className="space-y-1.5 select-none">
                    <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${p.progress}%` }}
                        className={`h-full rounded-full transition-all duration-500 ${
                          p.status === "Overdue"
                            ? "bg-red-500"
                            : p.status === "Completed"
                            ? "bg-brand-green"
                            : "bg-brand-green"
                        }`}
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
      <SendToEditorModal
        projectId={selectedProjectForEditor?.id ?? ""}
        isOpen={selectedProjectForEditor !== null}
        onClose={() => setSelectedProjectForEditor(null)}
        sourceVideoUrl={selectedProjectForEditor?.videoUrl}
        onApproved={loadProjects}
      />
    </>
  );
}
