"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Building2, Plus, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api/client";
import type { Workspace, WorkspaceRole } from "@/types/db";

type WorkspaceView = {
  id: string;
  name: string;
  owner: string;
  status: Workspace["status"];
  role: WorkspaceRole;
};

export default function OwnerWorkspacesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [workspaces, setWorkspaces] = useState<WorkspaceView[]>([]);

  const load = useCallback(async () => {
    try {
      const data = await api.get<(Workspace & { role: WorkspaceRole })[]>("/api/workspaces");
      setWorkspaces(
        data.map((w) => ({
          id: w.id,
          name: w.name,
          owner: w.role === "owner" ? "You" : w.role,
          status: w.status,
          role: w.role,
        })),
      );
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to load workspaces.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleToggleStatus = (_id: string, name: string, _currentStatus: string) => {
    toast.info(`Status management for "${name}" is available from workspace settings.`);
  };

  const filteredWorkspaces = workspaces.filter((w) => {
    return (
      w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.owner.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <main className="flex-1 overflow-y-auto px-8 py-8 bg-zinc-50/50">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
          <div className="text-left leading-normal">
            <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight flex items-center gap-2">
              All Workspaces
              <span className="text-xs font-bold px-2 py-0.5 bg-brand-green-light text-brand-green rounded-full">
                {workspaces.length} Total
              </span>
            </h1>
            <p className="text-sm font-semibold text-zinc-400 mt-0.5">
              Review and manage organizational workspaces, member capacities, and credit allocation.
            </p>
          </div>
          <Link
            href="/dashboard/owner/workspaces/new"
            className="h-10 px-4 bg-brand-green hover:bg-brand-green-hover text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-emerald-700/10"
          >
            <Plus size={14} strokeWidth={3} />
            Create Workspace
          </Link>
        </div>

        {/* Filter bar */}
        <div className="flex items-center justify-end gap-4 bg-white border border-zinc-200 p-4 rounded-2xl shadow-2xs select-none">
          <span className="text-xs font-bold text-zinc-400">Showing {filteredWorkspaces.length} of {workspaces.length}</span>
        </div>

        {/* Workspaces List Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredWorkspaces.map((w) => (
            <div
              key={w.id}
              className="bg-white border border-zinc-200 hover:border-brand-green hover:shadow-xs rounded-2xl p-5 shadow-2xs transition-all text-left space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-4">
                  <span className={`px-2 py-0.5 border rounded-[4px] text-[9px] font-extrabold uppercase tracking-wide ${
                    w.status === "active"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                      : "bg-red-50 text-red-750 border-red-100"
                  }`}>
                    {w.status}
                  </span>
                  <div className="flex items-center gap-1 text-[10px] text-zinc-400">
                    <Building2 size={12} />
                    ID: {w.id.toUpperCase()}
                  </div>
                </div>

                <Link
                  href={`/dashboard/owner/workspaces/${w.id}`}
                  className="text-sm font-extrabold text-zinc-950 leading-tight hover:text-brand-green transition-colors block"
                >
                  {w.name}
                </Link>
                <p className="text-xs text-zinc-450">
                  Owner: <span className="font-bold text-zinc-700">{w.owner}</span>
                </p>
              </div>

              <hr className="border-zinc-100" />

              <div className="flex items-center justify-between text-[10px] font-semibold text-zinc-555">
                <div className="flex gap-5">
                  <div>
                    <span className="block uppercase text-[9px] text-zinc-400 font-extrabold">Your Role</span>
                    <span className="text-zinc-800 font-bold block mt-0.5 capitalize">{w.role}</span>
                  </div>
                  <div>
                    <span className="block uppercase text-[9px] text-zinc-400 font-extrabold">Status</span>
                    <span className="text-zinc-800 font-bold block mt-0.5 capitalize">{w.status}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleStatus(w.id, w.name, w.status)}
                    className={`h-7 px-3 border text-[10px] font-bold rounded-lg transition-colors cursor-pointer ${
                      w.status === "active"
                        ? "border-red-200 hover:bg-red-50 text-red-650"
                        : "border-emerald-200 hover:bg-emerald-50 text-emerald-650"
                    }`}
                  >
                    {w.status === "active" ? "Suspend" : "Activate"}
                  </button>
                  <Link
                    href={`/dashboard/owner/workspaces/${w.id}`}
                    className="h-7 px-3 bg-brand-green hover:bg-brand-green-hover text-white text-[10px] font-bold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    Open
                    <ArrowRight size={11} strokeWidth={3} />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
