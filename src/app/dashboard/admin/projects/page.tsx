"use client";

import { useState, useEffect } from "react";
import { FolderKanban, Search, Plus, Filter, Calendar } from "lucide-react";
import { toast } from "sonner";
import { getStoredProjects, UserProject } from "../../../utils/storage";

export default function AdminProjectsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [projects, setProjects] = useState<UserProject[]>([]);

  useEffect(() => {
    setProjects(getStoredProjects());
  }, []);

  const filteredProjects = projects.filter((p) => {
    return (
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.creator.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.stage.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const activeCount = projects.filter((p) => p.status !== "Completed").length;

  return (
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
            onClick={() => toast.info("Create Project modal triggered via Dashboard link")}
            className="h-10 px-4 bg-brand-green hover:bg-brand-green-hover text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-emerald-700/10"
          >
            <Plus size={14} strokeWidth={3} />
            Create Project
          </button>
        </div>

        {/* Filter bar */}
        <div className="flex items-center justify-end gap-4 bg-white border border-zinc-200 p-4 rounded-2xl shadow-2xs select-none">
          <button
            onClick={() => toast.info("Opening filter options...")}
            className="h-9 px-3.5 border border-zinc-200 hover:bg-zinc-50 rounded-xl text-xs font-bold flex items-center gap-1.5 text-zinc-650 transition-all cursor-pointer"
          >
            <Filter size={12} />
            Filters
          </button>
        </div>

        {/* Projects List Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredProjects.map((p) => (
            <div
              key={p.id}
              className="bg-white border border-zinc-200 hover:border-brand-green hover:shadow-xs rounded-2xl p-5 shadow-2xs transition-all text-left space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-4">
                  <span className={`px-2 py-0.5 border rounded-[4px] text-[9px] font-extrabold uppercase tracking-wide ${
                    p.status.toLowerCase() === "completed"
                      ? "bg-brand-green-light text-brand-green border-brand-green/20"
                      : "bg-brand-green-light text-brand-green border-brand-green/10"
                  }`}>
                    {p.status}
                  </span>
                  <span className="text-[10px] font-semibold text-zinc-400 flex items-center gap-1">
                    <Calendar size={12} />
                    {p.lastUpdated || "2 hours ago"}
                  </span>
                </div>

                <h4 className="text-sm font-extrabold text-zinc-950 leading-tight">
                  {p.name}
                </h4>
                <p className="text-xs text-zinc-450">
                  Creator: <span className="font-bold text-zinc-700">{p.creator}</span>
                </p>
              </div>

              <hr className="border-zinc-100" />

              <div className="flex items-center justify-between text-[10px] font-semibold text-zinc-555">
                <div>
                  <span className="block uppercase text-[9px] text-zinc-400 font-extrabold">Active Stage</span>
                  <span className="text-zinc-800 font-bold block mt-0.5">{p.stage}</span>
                </div>
                <span className="text-[10px] font-bold text-zinc-450">
                  ID: {p.id}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
