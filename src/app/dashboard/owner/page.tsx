"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  Loader2,
  MoreVertical,
  Plus,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api/client";
import type { Notification, Workspace, WorkspaceMember } from "@/types/db";

type WorkspaceWithRole = Workspace & { role: WorkspaceMember["role"] };

export default function OwnerDashboardPage() {
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<WorkspaceWithRole[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  // Create workspace modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [newWorkspaceSlug, setNewWorkspaceSlug] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [wsData, notifData] = await Promise.all([
        api.get<WorkspaceWithRole[]>("/api/workspaces"),
        api.get<Notification[]>("/api/notifications"),
      ]);
      setWorkspaces(wsData);
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

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim() || !newWorkspaceSlug.trim()) {
      toast.error("Please fill in all workspace details.");
      return;
    }
    setIsCreating(true);
    try {
      const created = await api.post<WorkspaceWithRole>("/api/workspaces", {
        name: newWorkspaceName.trim(),
        slug: newWorkspaceSlug.trim().toLowerCase().replace(/\s+/g, "-"),
      });
      setWorkspaces((prev) => [created, ...prev]);
      setShowCreateModal(false);
      setNewWorkspaceName("");
      setNewWorkspaceSlug("");
      toast.success(`Workspace "${created.name}" provisioned!`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to create workspace.");
    } finally {
      setIsCreating(false);
    }
  };

  const totalWorkspaces = workspaces.length;
  const activeWorkspaces = workspaces.filter((ws) => ws.status === "active").length;
  const suspendedWorkspaces = workspaces.filter((ws) => ws.status === "suspended");
  const archivedWorkspaces = workspaces.filter((ws) => ws.status === "archived");
  const attentionWorkspaces = [...suspendedWorkspaces, ...archivedWorkspaces].slice(0, 5);
  const unreadNotifs = notifications.filter((n) => !n.is_read).length;

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-brand-green" />
      </main>
    );
  }

  return (
    <>
      {/* Create Workspace Modal */}
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
              Create New Workspace
            </h3>
            <form onSubmit={handleCreateWorkspace} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wide">
                  Workspace Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pixel Studio"
                  value={newWorkspaceName}
                  onChange={(e) => {
                    setNewWorkspaceName(e.target.value);
                    setNewWorkspaceSlug(e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""));
                  }}
                  className="w-full px-4 h-11 border border-zinc-200 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 rounded-xl text-sm font-semibold text-zinc-900 outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wide block">
                  Workspace Slug
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. pixel-studio"
                  value={newWorkspaceSlug}
                  onChange={(e) => setNewWorkspaceSlug(e.target.value)}
                  className="w-full px-4 h-11 border border-zinc-200 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 rounded-xl text-sm font-semibold text-zinc-900 outline-none bg-zinc-50/50"
                />
              </div>
              <button
                type="submit"
                disabled={isCreating}
                className="w-full h-11 bg-brand-green hover:bg-brand-green-hover disabled:bg-brand-green/60 text-white rounded-xl text-sm font-bold shadow-md shadow-emerald-700/10 cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isCreating ? (
                  <><Loader2 size={16} className="animate-spin" /> Provisioning...</>
                ) : (
                  "Create Workspace"
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      <main className="flex-1 overflow-y-auto px-8 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 text-left">
              Owner Dashboard
            </h1>
            <button
              onClick={load}
              className="text-xs font-bold text-brand-green hover:underline cursor-pointer"
            >
              Refresh
            </button>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                label: "Workspaces",
                val: totalWorkspaces,
                sub: `${activeWorkspaces} active`,
                color: "bg-brand-green-light text-brand-green border-brand-green/10",
              },
              {
                label: "Suspended",
                val: suspendedWorkspaces.length,
                sub: suspendedWorkspaces.length > 0 ? "Needs attention" : "All clear",
                color: suspendedWorkspaces.length > 0
                  ? "bg-red-50 text-red-700 border-red-100"
                  : "bg-zinc-50 text-zinc-500 border-zinc-200",
              },
              {
                label: "Archived",
                val: archivedWorkspaces.length,
                sub: "inactive",
                color: "bg-zinc-50 text-zinc-500 border-zinc-200",
              },
              {
                label: "Notifications",
                val: unreadNotifs,
                sub: unreadNotifs > 0 ? "unread" : "all read",
                color: unreadNotifs > 0
                  ? "bg-amber-50 text-amber-700 border-amber-100"
                  : "bg-zinc-50 text-zinc-500 border-zinc-200",
              },
            ].map((kpi, idx) => (
              <div
                key={idx}
                className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-2xs flex flex-col items-start gap-1 text-left"
              >
                <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wide">
                  {kpi.label}
                </span>
                <span className="text-3xl font-extrabold text-zinc-900 tracking-tight mt-1">
                  {kpi.val}
                </span>
                <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold border mt-2 ${kpi.color}`}>
                  {kpi.sub}
                </span>
              </div>
            ))}
          </div>

          {/* Main Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Workspaces Requiring Attention */}
            <div className="lg:col-span-12 bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3 select-none">
                <h3 className="text-sm font-extrabold text-zinc-800 uppercase tracking-wide">
                  Workspaces Requiring Attention
                </h3>
                <button
                  onClick={() => router.push("/dashboard/owner/workspaces")}
                  className="text-xs font-bold text-brand-green hover:underline cursor-pointer flex items-center gap-0.5"
                >
                  View All <ChevronRight size={14} />
                </button>
              </div>

              {attentionWorkspaces.length === 0 ? (
                <p className="text-sm font-semibold text-zinc-400 py-6 text-center">
                  All workspaces are operating normally. ✅
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs font-semibold text-zinc-800">
                    <thead>
                      <tr className="border-b border-zinc-200 text-zinc-400 font-extrabold select-none">
                        <th className="py-2.5 uppercase tracking-wider">Workspace</th>
                        <th className="py-2.5 uppercase tracking-wider">Status</th>
                        <th className="py-2.5 text-right" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {attentionWorkspaces.map((ws) => (
                        <tr key={ws.id} className="hover:bg-zinc-50/50">
                          <td className="py-3 text-left">
                            <span className="font-extrabold block text-zinc-900">{ws.name}</span>
                            <span className="text-[10px] text-zinc-400 block mt-0.5">/{ws.slug}</span>
                          </td>
                          <td className="py-3">
                            <span className={`px-2 py-0.5 border rounded-[4px] text-[10px] font-extrabold capitalize ${
                              ws.status === "suspended"
                                ? "bg-red-50 text-red-700 border-red-100"
                                : "bg-zinc-100 text-zinc-600 border-zinc-200"
                            }`}>
                              {ws.status}
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            <button
                              onClick={() => router.push(`/dashboard/owner/workspaces/${ws.id}`)}
                              className="p-1.5 text-zinc-400 hover:text-zinc-600 rounded-lg cursor-pointer"
                            >
                              <MoreVertical size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Workspaces Grid */}
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3 select-none">
              <h3 className="text-sm font-extrabold text-zinc-800 uppercase tracking-wide">
                Your Workspaces
              </h3>
              <button
                onClick={() => setShowCreateModal(true)}
                className="h-9 px-4 bg-brand-green hover:bg-brand-green-hover text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
              >
                <Plus size={14} strokeWidth={3} />
                Create Workspace
              </button>
            </div>

            {workspaces.length === 0 ? (
              <div className="bg-white border border-zinc-200 rounded-2xl p-16 text-center shadow-xs">
                <p className="text-sm font-semibold text-zinc-400">No workspaces yet.</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-3 text-xs font-bold text-brand-green hover:underline cursor-pointer"
                >
                  Create your first workspace →
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {workspaces.map((ws) => (
                  <div
                    key={ws.id}
                    onClick={() => router.push(`/dashboard/owner/workspaces/${ws.id}`)}
                    className="bg-white border border-zinc-200 hover:border-brand-green hover:shadow-xs rounded-2xl p-6 shadow-2xs transition-all cursor-pointer text-left space-y-4 flex flex-col justify-between"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-sm font-extrabold text-zinc-955 block">{ws.name}</h4>
                        <span className="text-[10px] text-zinc-450 block mt-0.5">/{ws.slug}</span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-[4px] text-[9px] font-extrabold uppercase border ${
                          ws.status === "active"
                            ? "bg-brand-green-light text-brand-green border-brand-green/10"
                            : ws.status === "suspended"
                            ? "bg-red-50 text-red-750 border-red-100 animate-pulse"
                            : "bg-zinc-100 text-zinc-450 border-zinc-200"
                        }`}
                      >
                        {ws.status}
                      </span>
                    </div>

                    <hr className="border-zinc-100" />

                    <div className="grid grid-cols-2 text-xs font-semibold text-zinc-700">
                      <div className="border-r border-zinc-100 pr-2">
                        <span className="text-[9px] text-zinc-400 block uppercase font-extrabold">Role</span>
                        <span className="text-zinc-800 font-extrabold mt-0.5 block capitalize">{ws.role}</span>
                      </div>
                      <div className="pl-4">
                        <span className="text-[9px] text-zinc-400 block uppercase font-extrabold">Created</span>
                        <span className="text-zinc-800 font-extrabold mt-0.5 block">
                          {new Date(ws.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/dashboard/owner/workspaces/${ws.id}`);
                      }}
                      className="w-full h-9 border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      Manage Workspace <ChevronRight size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
