"use client";

import { useCallback, useEffect, useState } from "react";
import { Users, Loader2, Plus, X, Mail, CheckCircle, Clock, FileText, RefreshCw, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api/client";
import type { Project, WorkspaceMember, Profile, EditingTask } from "@/types/db";

type MemberWithProfile = WorkspaceMember & { profile: Profile | null };

export default function EditorManagerPage() {
  const [editors, setEditors] = useState<MemberWithProfile[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [assignments, setAssignments] = useState<EditingTask[]>([]);
  const [loading, setLoading] = useState(true);

  // Invite editor modal state
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [submittingInvite, setSubmittingInvite] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [membersData, projData, assignmentsData] = await Promise.all([
        api.get<MemberWithProfile[]>("/api/members"),
        api.get<Project[]>("/api/projects"),
        api.get<{ items: EditingTask[] }>("/api/assignments"),
      ]);

      setEditors(membersData.filter((m) => m.role === "editor"));
      setProjects(projData);
      setAssignments(assignmentsData.items || []);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to load editors.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) {
      toast.error("Please enter an email address");
      return;
    }
    setSubmittingInvite(true);
    try {
      await api.post("/api/members", {
        email: inviteEmail,
        role: "editor",
        full_name: inviteName || undefined,
      });
      toast.success(`Invitation sent to ${inviteEmail}!`);
      setInviteModalOpen(false);
      setInviteEmail("");
      setInviteName("");
      await loadData();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to invite editor.");
    } finally {
      setSubmittingInvite(false);
    }
  };

  const getEditorInitials = (editor: MemberWithProfile) => {
    const name = editor.profile?.full_name || editor.profile?.email || "Editor";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-brand-green" />
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto px-8 py-8 bg-zinc-50/50">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Page Header */}
        <div className="border-b border-zinc-200 pb-4 flex justify-between items-center text-left">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 flex items-center gap-2">
              <Users className="text-brand-green" size={28} />
              Editor Manager
            </h1>
            <p className="mt-1 text-sm font-semibold text-zinc-400">
              Manage professional video editors assigned to your workspace.
            </p>
          </div>
          <div className="flex gap-2.5">
            <button
              onClick={loadData}
              className="flex items-center gap-1 px-3 py-1.5 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-600 hover:bg-zinc-50 transition-all cursor-pointer"
            >
              <RefreshCw size={12} /> Refresh
            </button>
            <button
              onClick={() => setInviteModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-brand-green hover:bg-brand-green-hover text-white rounded-xl text-xs font-bold transition-all shadow-xs active:scale-[0.98] cursor-pointer"
            >
              <UserPlus size={14} /> Invite Editor
            </button>
          </div>
        </div>

        {editors.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-16 text-center shadow-xs">
            <Users className="mx-auto mb-3 text-zinc-300 animate-pulse" size={40} />
            <h3 className="text-base font-bold text-zinc-800">No Editors Found</h3>
            <p className="mt-1.5 text-sm font-semibold text-zinc-400 max-w-md mx-auto">
              There are no manual video editors registered in your workspace yet. Click the "Invite Editor" button above to add one.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {editors.map((editor) => {
              // Find editing tasks assigned to this editor
              const editorTasks = assignments.filter((a) => a.editor_id === editor.user_id);
              const activeTasks = editorTasks.filter((t) => t.status !== "approved" && t.status !== "completed");
              const completedTasks = editorTasks.filter((t) => t.status === "approved" || t.status === "completed");

              return (
                <div
                  key={editor.id}
                  className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs space-y-6 text-left hover:shadow-md transition-all duration-300"
                >
                  {/* Editor Info Row */}
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-brand-green/10 text-brand-green border border-brand-green/20 flex items-center justify-center font-extrabold text-base shadow-2xs select-none">
                      {getEditorInitials(editor)}
                    </div>
                    <div className="space-y-0.5">
                      <h3 className="text-lg font-bold text-zinc-900 tracking-tight">
                        {editor.profile?.full_name || "Workspace Editor"}
                      </h3>
                      <p className="text-xs font-semibold text-zinc-400 flex items-center gap-1">
                        <Mail size={12} /> {editor.profile?.email || "No email"}
                      </p>
                    </div>
                    <span className={`ml-auto text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                      editor.status === "active"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                        : "bg-amber-50 text-amber-700 border border-amber-100 animate-pulse"
                    }`}>
                      {editor.status}
                    </span>
                  </div>

                  {/* Editor Workload Metrics */}
                  <div className="grid grid-cols-2 gap-4 border-t border-b border-zinc-100 py-4">
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-extrabold text-zinc-400 uppercase tracking-wide flex items-center gap-1">
                        <Clock size={10} /> Active Work
                      </span>
                      <span className="text-2xl font-black text-zinc-800">
                        {activeTasks.length}
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-extrabold text-zinc-400 uppercase tracking-wide flex items-center gap-1">
                        <CheckCircle size={10} /> Completed
                      </span>
                      <span className="text-2xl font-black text-zinc-800">
                        {completedTasks.length}
                      </span>
                    </div>
                  </div>

                  {/* Assigned Projects List */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-extrabold text-zinc-400 uppercase tracking-wider">
                      Assigned Projects
                    </h4>
                    {editorTasks.length === 0 ? (
                      <p className="text-xs text-zinc-400 italic">No tasks currently assigned.</p>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {editorTasks.map((t) => {
                          const project = projects.find((p) => p.id === t.project_id);
                          return (
                            <div
                              key={t.id}
                              className="rounded-xl border border-zinc-200 p-3 bg-zinc-50 flex items-center justify-between text-xs transition-colors hover:bg-zinc-100"
                            >
                              <div className="space-y-1 flex-1 min-w-0 pr-3">
                                <p className="font-bold text-zinc-800 truncate">
                                  {project?.title || `Project ID: ${t.project_id.slice(0, 8)}`}
                                </p>
                                {t.instructions && (
                                  <p className="text-[10px] text-zinc-400 truncate flex items-center gap-1">
                                    <FileText size={10} /> {t.instructions}
                                  </p>
                                )}
                              </div>
                              <span className={`shrink-0 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                                t.status === "approved" || t.status === "completed"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                  : t.status === "under_review"
                                    ? "bg-blue-50 text-blue-700 border border-blue-100"
                                    : t.status === "revision_requested"
                                      ? "bg-amber-50 text-amber-700 border border-amber-100"
                                      : "bg-zinc-50 text-zinc-650 border border-zinc-150"
                              }`}>
                                {t.status.replace(/_/g, " ")}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Invite Editor Modal */}
      {inviteModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl w-full max-w-md p-6 relative animate-in zoom-in-95 duration-200 text-left">
            <button
              onClick={() => setInviteModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-600 rounded-lg cursor-pointer"
            >
              <X size={18} />
            </button>
            <h3 className="text-lg font-bold text-zinc-900 border-b border-zinc-100 pb-3 mb-4 flex items-center gap-1.5">
              <UserPlus size={18} className="text-brand-green" />
              Invite New Editor
            </h3>
            <form onSubmit={handleInvite} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wide">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 p-2.5 text-sm text-zinc-800 outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wide">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. editor@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 p-2.5 text-sm text-zinc-800 outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setInviteModalOpen(false)}
                  className="flex-1 py-2.5 border border-zinc-200 hover:bg-zinc-50 rounded-xl text-xs font-bold text-zinc-700 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingInvite}
                  className="flex-1 py-2.5 bg-brand-green hover:bg-brand-green-hover disabled:opacity-60 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  {submittingInvite ? <Loader2 size={12} className="animate-spin" /> : null}
                  Send Invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
