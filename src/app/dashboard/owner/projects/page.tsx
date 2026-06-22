"use client";

import { useState, useEffect } from "react";
import { FolderKanban, Search, Plus, Filter, Calendar, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api/client";

type ProjectWithRelations = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  progress_percent: number;
  created_at: string;
  updated_at: string;
  workspaces: { name: string } | null;
  profiles: { full_name: string | null; email: string } | null;
};

export default function OwnerProjectsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [projects, setProjects] = useState<ProjectWithRelations[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const data = await api.get<ProjectWithRelations[]>("/api/projects?all=true");
      setProjects(data);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to load projects.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filteredProjects = projects.filter((p) => {
    const titleMatch = p.title.toLowerCase().includes(searchQuery.toLowerCase());
    const workspaceMatch = (p.workspaces?.name || "").toLowerCase().includes(searchQuery.toLowerCase());
    const creatorMatch = (p.profiles?.full_name || p.profiles?.email || "").toLowerCase().includes(searchQuery.toLowerCase());
    return titleMatch || workspaceMatch || creatorMatch;
  });

  return (
    <main className="flex-1 overflow-y-auto px-8 py-8 bg-zinc-50/50">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
          <div className="text-left leading-normal">
            <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight flex items-center gap-2">
              Cross-Workspace View
              <span className="text-xs font-bold px-2 py-0.5 bg-brand-green-light text-brand-green rounded-full">
                {projects.length} Total
              </span>
            </h1>
            <p className="text-sm font-semibold text-zinc-400 mt-0.5">
              Global dashboard monitoring projects across all customer environments and workspaces.
            </p>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex items-center justify-between gap-4 bg-white border border-zinc-200 p-4 rounded-2xl shadow-2xs select-none">
          <span className="text-xs font-bold text-zinc-450">
            Showing {filteredProjects.length} of {projects.length}
          </span>
          <button
            onClick={() => toast.info("Opening filter manager...")}
            className="h-9 px-3.5 border border-zinc-200 hover:bg-zinc-50 rounded-xl text-xs font-bold flex items-center gap-1.5 text-zinc-650 transition-all cursor-pointer"
          >
            <Filter size={12} />
            Filters
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-brand-green" />
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="bg-white border border-zinc-200 rounded-2xl p-10 text-center">
            <p className="text-sm font-semibold text-zinc-500">No projects found matching search query.</p>
          </div>
        ) : (
          /* Projects List Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredProjects.map((p) => {
              const isCompleted = p.status === "published" || p.status === "completed";
              return (
                <div
                  key={p.id}
                  className="bg-white border border-zinc-200 hover:border-brand-green hover:shadow-xs rounded-2xl p-5 shadow-2xs transition-all text-left space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-4">
                      <span className={`px-2 py-0.5 border rounded-[4px] text-[9px] font-extrabold uppercase tracking-wide ${
                        isCompleted
                          ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                          : "bg-brand-green-light text-brand-green border-brand-green/10"
                      }`}>
                        {p.status}
                      </span>
                      <span className="text-[10px] font-semibold text-zinc-400 flex items-center gap-1">
                        <Calendar size={12} />
                        {new Date(p.updated_at).toLocaleDateString()}
                      </span>
                    </div>

                    <h4 className="text-sm font-extrabold text-zinc-950 leading-tight">
                      {p.title}
                    </h4>
                    <div className="flex flex-col text-xs text-zinc-450 gap-0.5 mt-1.5">
                      <span>Workspace: <strong className="text-zinc-700">{p.workspaces?.name || "Unknown"}</strong></span>
                      <span>Owner: <strong className="text-zinc-500">{p.profiles?.full_name || p.profiles?.email || "Unknown"}</strong></span>
                    </div>
                  </div>

                  <hr className="border-zinc-100" />

                  <div className="flex items-center justify-between text-[10px] font-semibold text-zinc-555">
                    <div>
                      <span className="block uppercase text-[9px] text-zinc-400 font-extrabold">Active Stage</span>
                      <span className="text-zinc-800 font-bold block mt-0.5 capitalize">{p.status}</span>
                    </div>
                    <span className="text-[10px] font-bold text-zinc-450">
                      ID: {p.id.substring(0, 8).toUpperCase()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
