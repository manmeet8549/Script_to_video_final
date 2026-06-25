"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Users,
  FolderKanban,
  LogIn,
  Loader2,
  Calendar,
  Plug,
  Key,
  Trash2,
  Plus,
  AlertCircle,
  Copy,
  CheckCircle2,
  Eye,
  EyeOff,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api/client";
import type {
  Workspace,
  WorkspaceMember,
  WorkspaceRole,
  Project,
  Profile,
} from "@/types/db";

type MemberWithProfile = WorkspaceMember & { profile: Profile | null };
type SafeWorkspaceApi = {
  id: string;
  workspace_id: string;
  provider: "script" | "voice" | "video" | "editing" | "publishing";
  provider_key: string;
  api_name: string;
  is_active: boolean;
  endpoint_url: string | null;
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

type WorkspaceDetail = {
  workspace: Workspace;
  role: WorkspaceRole;
  members: MemberWithProfile[];
  projects: Project[];
};

type InviteResult = {
  member: WorkspaceMember;
  tempPassword?: string;
  setupLink?: string;
  isNewUser: boolean;
};

export default function OwnerWorkspaceDetailPage() {
  const params = useParams<{ workspaceId: string }>();
  const router = useRouter();
  const workspaceId = params.workspaceId;

  const [detail, setDetail] = useState<WorkspaceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showPasswordId, setShowPasswordId] = useState<string | null>(null);
  const [selectedMemberForProfile, setSelectedMemberForProfile] = useState<MemberWithProfile | null>(null);
  const [showModalPassword, setShowModalPassword] = useState(false);

  // API integrations states
  const [apis, setApis] = useState<SafeWorkspaceApi[]>([]);
  const [loadingApis, setLoadingApis] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newApiName, setNewApiName] = useState("");
  const [newApiKey, setNewApiKey] = useState("");
  const [newApiSecret, setNewApiSecret] = useState("");
  const [newProvider, setNewProvider] = useState<"script" | "voice" | "video" | "editing" | "publishing">("script");
  const [newProviderKey, setNewProviderKey] = useState("openai");
  const [isSubmittingApi, setIsSubmittingApi] = useState(false);

  // Add Member form state
  const [showAddMemberForm, setShowAddMemberForm] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<WorkspaceRole>("admin");
  const [isSubmittingMember, setIsSubmittingMember] = useState(false);
  const [successInvite, setSuccessInvite] = useState<{
    email: string;
    role: string;
    tempPassword?: string;
    setupLink?: string;
    isNewUser: boolean;
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<WorkspaceDetail>(`/api/workspaces/${workspaceId}`);
      setDetail(data);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to load workspace.");
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  const loadApis = useCallback(async () => {
    setLoadingApis(true);
    try {
      const data = await api.get<SafeWorkspaceApi[]>(`/api/workspaces/${workspaceId}/integrations`);
      setApis(data);
    } catch (err) {
      toast.error("Failed to load workspace API integrations.");
    } finally {
      setLoadingApis(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    load();
    loadApis();
  }, [load, loadApis]);

  const handleSwitch = async () => {
    setSwitching(true);
    try {
      await api.post("/api/workspaces/active", { workspace_id: workspaceId });
      toast.success("Switched to this workspace.");
      router.push("/dashboard/admin");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to switch workspace.");
      setSwitching(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!detail) return;
    const currentStatus = detail.workspace.status;
    const nextStatus = currentStatus === "active" ? "suspended" : "active";
    if (
      !confirm(
        `Are you sure you want to ${
          nextStatus === "suspended" ? "suspend" : "activate"
        } workspace "${detail.workspace.name}"?`,
      )
    ) {
      return;
    }
    setUpdatingStatus(true);
    try {
      const updated = await api.patch<Workspace>(`/api/workspaces/${workspaceId}`, {
        status: nextStatus,
      });
      toast.success(
        `Workspace "${detail.workspace.name}" has been ${
          nextStatus === "suspended" ? "suspended" : "activated"
        }.`,
      );
      setDetail({
        ...detail,
        workspace: updated,
      });
    } catch (err) {
      toast.error(
        err instanceof ApiError
          ? err.message
          : "Failed to update workspace status.",
      );
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleProviderChange = (prov: "script" | "voice" | "video" | "editing" | "publishing") => {
    setNewProvider(prov);
    switch (prov) {
      case "script":
        setNewProviderKey("openai");
        break;
      case "voice":
        setNewProviderKey("elevenlabs");
        break;
      case "video":
        setNewProviderKey("heygen");
        break;
      case "editing":
        setNewProviderKey("submagic");
        break;
      case "publishing":
        setNewProviderKey("zernio");
        break;
    }
  };

  const handleDeleteApi = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to revoke "${name}" API connection?`)) return;
    try {
      await api.del(`/api/integrations/${id}`);
      toast.success(`API connection "${name}" successfully revoked.`);
      setApis(apis.filter((a) => a.id !== id));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to revoke API connection.");
    }
  };

  const handleAddApi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newApiName || !newApiKey) {
      toast.error("Please fill in API connection name and API key.");
      return;
    }
    setIsSubmittingApi(true);
    try {
      const newConn = await api.post<SafeWorkspaceApi>(`/api/workspaces/${workspaceId}/integrations`, {
        provider: newProvider,
        provider_key: newProviderKey,
        api_name: newApiName,
        api_key: newApiKey,
        api_secret: newApiSecret || undefined,
      });
      toast.success(`API integration "${newApiName}" added successfully!`);
      setApis([...apis, newConn]);
      setNewApiName("");
      setNewApiKey("");
      setNewApiSecret("");
      setShowAddForm(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to add API integration.");
    } finally {
      setIsSubmittingApi(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberEmail) {
      toast.error("Please enter email address.");
      return;
    }
    setIsSubmittingMember(true);
    setSuccessInvite(null);
    try {
      const res = await api.post<InviteResult>(`/api/workspaces/${workspaceId}/members`, {
        email: newMemberEmail.trim(),
        role: newMemberRole,
        full_name: newMemberName.trim() || undefined,
        use_temp_password: true,
      });

      toast.success(`Member "${newMemberEmail}" successfully invited!`);

      // Update local members list
      const newMember: MemberWithProfile = {
        ...res.member,
        profile: {
          id: res.member.user_id,
          email: newMemberEmail.trim().toLowerCase(),
          full_name: newMemberName.trim() || null,
          avatar_url: null,
          phone: null,
          is_platform_owner: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      };

      if (detail) {
        setDetail({
          ...detail,
          members: [...detail.members, newMember]
        });
      }

      setSuccessInvite({
        email: newMemberEmail.trim(),
        role: newMemberRole,
        tempPassword: res.tempPassword,
        setupLink: res.setupLink,
        isNewUser: res.isNewUser,
      });

      // Clear fields
      setNewMemberEmail("");
      setNewMemberName("");
      setNewMemberRole("admin");
      setShowAddMemberForm(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to invite workspace member.");
    } finally {
      setIsSubmittingMember(false);
    }
  };

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center bg-zinc-50/50">
        <Loader2 size={28} className="animate-spin text-brand-green" />
      </main>
    );
  }

  if (!detail) {
    return (
      <main className="flex-1 overflow-y-auto px-8 py-8 bg-zinc-50/50">
        <div className="max-w-5xl mx-auto space-y-6">
          <Link
            href="/dashboard/owner/workspaces"
            className="inline-flex items-center text-sm font-semibold text-zinc-400 hover:text-zinc-800 transition-colors"
          >
            <ArrowLeft size={16} className="mr-1.5" />
            Back to Workspaces
          </Link>
          <div className="bg-white border border-zinc-200 rounded-2xl p-10 text-center">
            <p className="text-sm font-semibold text-zinc-500">
              This workspace could not be found or you don&apos;t have access to it.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const { workspace, role, members, projects } = detail;

  return (
    <main className="flex-1 overflow-y-auto px-8 py-8 bg-zinc-50/50">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Back link */}
        <Link
          href="/dashboard/owner/workspaces"
          className="inline-flex items-center text-sm font-semibold text-zinc-400 hover:text-zinc-800 transition-colors"
        >
          <ArrowLeft size={16} className="mr-1.5" />
          Back to Workspaces
        </Link>

        {/* Header */}
        <div className="flex items-start justify-between border-b border-zinc-200 pb-5 gap-4">
          <div className="text-left leading-normal space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight">
                {workspace.name}
              </h1>
              <span
                className={`px-2 py-0.5 border rounded-[4px] text-[9px] font-extrabold uppercase tracking-wide ${
                  workspace.status === "active"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                    : "bg-red-50 text-red-750 border-red-100"
                }`}
              >
                {workspace.status}
              </span>
            </div>
            <p className="text-sm font-semibold text-zinc-400">
              {workspace.description || "No description provided."}
            </p>
            <div className="flex items-center gap-4 text-[11px] font-semibold text-zinc-400 pt-1">
              <span className="flex items-center gap-1">
                <Building2 size={12} /> {workspace.slug}
              </span>
              <span className="flex items-center gap-1">
                <Calendar size={12} /> Created{" "}
                {new Date(workspace.created_at).toLocaleDateString()}
              </span>
              <span className="capitalize">
                Your role: <strong className="text-zinc-700">{role}</strong>
              </span>
            </div>
          </div>

          <div className="flex gap-2 shrink-0">
            <button
              onClick={handleToggleStatus}
              disabled={updatingStatus}
              className={`h-10 px-4 border text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs ${
                workspace.status === "active"
                  ? "border-red-200 hover:bg-red-50 text-red-650"
                  : "border-emerald-200 hover:bg-emerald-50 text-emerald-650"
              }`}
            >
              {updatingStatus ? (
                <Loader2 size={14} className="animate-spin" />
              ) : workspace.status === "active" ? (
                "Suspend Workspace"
              ) : (
                "Activate Workspace"
              )}
            </button>
            <button
              onClick={handleSwitch}
              disabled={switching}
              className="h-10 px-4 bg-brand-green hover:bg-brand-green-hover disabled:bg-brand-green/60 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-emerald-700/10"
            >
              {switching ? <Loader2 size={14} className="animate-spin" /> : <LogIn size={14} />}
              Switch to this workspace
            </button>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-2xs">
            <div className="flex items-center gap-2 text-[10px] font-extrabold text-zinc-400 uppercase tracking-wide">
              <Users size={12} /> Members
            </div>
            <p className="text-2xl font-extrabold text-zinc-900 mt-1">{members.length}</p>
          </div>
          <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-2xs">
            <div className="flex items-center gap-2 text-[10px] font-extrabold text-zinc-400 uppercase tracking-wide">
              <FolderKanban size={12} /> Projects
            </div>
            <p className="text-2xl font-extrabold text-zinc-900 mt-1">{projects.length}</p>
          </div>
          <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-2xs">
            <div className="flex items-center gap-2 text-[10px] font-extrabold text-zinc-400 uppercase tracking-wide">
              Tier
            </div>
            <p className="text-2xl font-extrabold text-zinc-900 mt-1 capitalize">
              {workspace.subscription_tier}
            </p>
          </div>
        </div>

        {/* Members */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-zinc-900 flex items-center gap-2">
              <Users size={18} /> Members
            </h2>
            <button
              onClick={() => {
                setShowAddMemberForm(!showAddMemberForm);
                setSuccessInvite(null);
              }}
              className="h-8 px-3 bg-brand-green hover:bg-brand-green-hover text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Plus size={14} strokeWidth={3} />
              Add Member
            </button>
          </div>

          {successInvite && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-left space-y-3">
              <div className="flex items-center gap-2 text-emerald-800 font-extrabold text-sm">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                Member Invited Successfully!
              </div>
              <p className="text-xs text-emerald-700 font-medium">
                An invitation has been created for <strong className="text-emerald-900">{successInvite.email}</strong> as a <span className="capitalize">{successInvite.role}</span>.
              </p>

              <div className="bg-white border border-emerald-100 rounded-xl p-4 space-y-3">
                {/* Accept Invite Link */}
                <div className="space-y-1">
                  <span className="text-[9px] font-extrabold uppercase tracking-wide text-zinc-400">
                    Invitation Link (share with admin/member)
                  </span>
                  <div className="flex items-center justify-between gap-2 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2">
                    <code className="text-xs font-mono text-zinc-700 truncate select-all">
                      {`${typeof window !== "undefined" ? window.location.origin : ""}/auth/accept-invite?email=${encodeURIComponent(successInvite.email)}&workspace=${encodeURIComponent(workspace.name)}&role=${encodeURIComponent(successInvite.role === "admin" ? "Administrator" : successInvite.role)}`}
                    </code>
                    <button
                      type="button"
                      onClick={() => {
                        const url = `${typeof window !== "undefined" ? window.location.origin : ""}/auth/accept-invite?email=${encodeURIComponent(successInvite.email)}&workspace=${encodeURIComponent(workspace.name)}&role=${encodeURIComponent(successInvite.role === "admin" ? "Administrator" : successInvite.role)}`;
                        navigator.clipboard?.writeText(url).then(
                          () => toast.success("Invitation link copied!"),
                          () => toast.error("Copy failed")
                        );
                      }}
                      className="text-zinc-400 hover:text-brand-green transition-colors shrink-0 cursor-pointer"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                </div>

                {/* Temporary Password */}
                {successInvite.tempPassword && (
                  <div className="space-y-1 border-t border-zinc-100 pt-3">
                    <span className="text-[9px] font-extrabold uppercase tracking-wide text-zinc-400">
                      Temporary Password
                    </span>
                    <div className="flex items-center justify-between gap-2 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2">
                      <code className="text-xs font-mono text-zinc-700 truncate select-all">
                        {successInvite.tempPassword}
                      </code>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard?.writeText(successInvite.tempPassword!).then(
                            () => toast.success("Temporary password copied!"),
                            () => toast.error("Copy failed")
                          );
                        }}
                        className="text-zinc-400 hover:text-brand-green transition-colors shrink-0 cursor-pointer"
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                    <p className="text-[10px] font-semibold text-amber-600 mt-1 leading-snug">
                      ⚠️ Please share this password securely with the user. They will be forced to change it on their first login.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setSuccessInvite(null)}
                  className="h-8 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {showAddMemberForm && !successInvite && (
            <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm text-left">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wide border-b border-zinc-100 pb-2 mb-4">
                Invite Workspace Member
              </h3>
              <form onSubmit={handleAddMember} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-zinc-400 uppercase">Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="admin@company.com"
                      value={newMemberEmail}
                      onChange={(e) => setNewMemberEmail(e.target.value)}
                      className="w-full px-3 h-10 border border-zinc-200 rounded-lg text-xs font-semibold outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green/20 transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-zinc-400 uppercase">Full Name (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. John Doe"
                      value={newMemberName}
                      onChange={(e) => setNewMemberName(e.target.value)}
                      className="w-full px-3 h-10 border border-zinc-200 rounded-lg text-xs font-semibold outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green/20 transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-zinc-400 uppercase">Workspace Role</label>
                    <select
                      value={newMemberRole}
                      onChange={(e) => setNewMemberRole(e.target.value as WorkspaceRole)}
                      className="w-full px-3 h-10 border border-zinc-200 rounded-lg text-xs font-semibold outline-none bg-white"
                    >
                      <option value="admin">Administrator</option>
                      <option value="user">User (Video Creator)</option>
                      <option value="editor">Editor (Video Editor)</option>
                      <option value="support">Support Agent</option>
                      <option value="viewer">Viewer</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddMemberForm(false);
                      setSuccessInvite(null);
                    }}
                    className="h-9 px-4 border border-zinc-200 hover:bg-zinc-50 rounded-lg text-xs font-bold transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingMember}
                    className="h-9 px-5 bg-brand-green hover:bg-brand-green-hover disabled:bg-brand-green/60 text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer"
                  >
                    {isSubmittingMember ? "Inviting..." : "Send Invitation"}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white border border-zinc-200 rounded-2xl divide-y divide-zinc-100 overflow-hidden">
            {members.length === 0 && (
              <p className="px-5 py-4 text-sm font-semibold text-zinc-400">No members yet.</p>
            )}
            {members.map((m) => (
              <div key={m.id} className="px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-brand-green flex items-center justify-center font-bold text-xs text-white shrink-0">
                    {(m.profile?.full_name ?? m.profile?.email ?? "?")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-zinc-900 truncate">
                      {m.profile?.full_name ?? m.profile?.email ?? "Unknown user"}
                    </p>
                    <p className="text-[11px] text-zinc-400 truncate">{m.profile?.email}</p>
                    {m.profile?.password_plain && (
                      <div className="flex items-center gap-1.5 mt-1 text-[10px]">
                        <span className="text-zinc-400 font-bold">PW:</span>
                        <code className="font-mono text-zinc-700 bg-zinc-100 px-1 rounded">
                          {showPasswordId === m.id ? m.profile.password_plain : "••••••••"}
                        </code>
                        <button
                          type="button"
                          onClick={() => setShowPasswordId(showPasswordId === m.id ? null : m.id)}
                          className="text-zinc-400 hover:text-zinc-650 cursor-pointer"
                        >
                          {showPasswordId === m.id ? <EyeOff size={10} /> : <Eye size={10} />}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-extrabold uppercase tracking-wide px-2 py-0.5 bg-zinc-100 text-zinc-600 rounded capitalize">
                    {m.role}
                  </span>
                  <button
                    onClick={() => setSelectedMemberForProfile(m)}
                    className="px-2.5 py-1 border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-[10px] font-bold rounded-lg cursor-pointer transition-all"
                  >
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Projects */}
        <section className="space-y-3">
          <h2 className="text-lg font-extrabold text-zinc-900 flex items-center gap-2">
            <FolderKanban size={18} /> Projects
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.length === 0 && (
              <div className="bg-white border border-zinc-200 rounded-2xl px-5 py-4 md:col-span-2">
                <p className="text-sm font-semibold text-zinc-400">
                  No projects in this workspace yet.
                </p>
              </div>
            )}
            {projects.map((p) => (
              <div
                key={p.id}
                className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-2xs text-left space-y-2"
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="px-2 py-0.5 border border-brand-green/10 bg-brand-green-light text-brand-green rounded-[4px] text-[9px] font-extrabold uppercase tracking-wide">
                    {p.status}
                  </span>
                  <span className="text-[10px] font-semibold text-zinc-400">
                    {p.progress_percent}%
                  </span>
                </div>
                <h4 className="text-sm font-extrabold text-zinc-950 leading-tight">{p.title}</h4>
                {p.description && (
                  <p className="text-xs text-zinc-450 line-clamp-2">{p.description}</p>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* API Connections */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-zinc-900 flex items-center gap-2">
              <Plug size={18} /> API Connections
            </h2>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="h-8 px-3 bg-brand-green hover:bg-brand-green-hover text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Plus size={14} strokeWidth={3} />
              Add Connection
            </button>
          </div>

          {showAddForm && (
            <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm text-left">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wide border-b border-zinc-100 pb-2 mb-4">
                Add Workspace API Integration
              </h3>
              <form onSubmit={handleAddApi} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-zinc-400 uppercase">Provider Type</label>
                    <select
                      value={newProvider}
                      onChange={(e) => handleProviderChange(e.target.value as typeof newProvider)}
                      className="w-full px-3 h-10 border border-zinc-200 rounded-lg text-xs font-semibold outline-none bg-white"
                    >
                      <option value="script">Script AI (Generation)</option>
                      <option value="voice">Voice AI (Text-to-Speech)</option>
                      <option value="video">Video AI (Avatars)</option>
                      <option value="editing">AI Editing</option>
                      <option value="publishing">Publishing (Socials)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-zinc-400 uppercase">Service Adapter</label>
                    <select
                      value={newProviderKey}
                      onChange={(e) => setNewProviderKey(e.target.value)}
                      className="w-full px-3 h-10 border border-zinc-200 rounded-lg text-xs font-semibold outline-none bg-white"
                    >
                      {newProvider === "script" && (
                        <>
                          <option value="openai">OpenAI (priority)</option>
                          <option value="nvidia">NVIDIA NIM (fallback)</option>
                        </>
                      )}
                      {newProvider === "voice" && (
                        <option value="elevenlabs">ElevenLabs</option>
                      )}
                      {newProvider === "video" && (
                        <option value="heygen">HeyGen</option>
                      )}
                      {newProvider === "editing" && (
                        <option value="submagic">Submagic</option>
                      )}
                      {newProvider === "publishing" && (
                        <>
                          <option value="zernio">Zernio</option>
                          <option value="youtube">YouTube API</option>
                          <option value="tiktok">TikTok API</option>
                          <option value="meta">Meta API (FB/IG)</option>
                        </>
                      )}
                    </select>
                    {newProvider === "script" && (
                      <p className="text-[10px] font-semibold text-zinc-400 leading-snug pt-0.5">
                        OpenAI is used first. If no OpenAI key is set, scripts fall back to NVIDIA NIM.
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-zinc-400 uppercase">Connection Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Production ElevenLabs"
                      value={newApiName}
                      onChange={(e) => setNewApiName(e.target.value)}
                      className="w-full px-3 h-10 border border-zinc-200 rounded-lg text-xs font-semibold outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-zinc-400 uppercase">API Key / Credential</label>
                    <input
                      type="password"
                      required
                      placeholder="Enter API key"
                      value={newApiKey}
                      onChange={(e) => setNewApiKey(e.target.value)}
                      className="w-full px-3 h-10 border border-zinc-200 rounded-lg text-xs font-semibold outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-zinc-400 uppercase">API Secret (Optional)</label>
                    <input
                      type="password"
                      placeholder="Enter secret if required"
                      value={newApiSecret}
                      onChange={(e) => setNewApiSecret(e.target.value)}
                      className="w-full px-3 h-10 border border-zinc-200 rounded-lg text-xs font-semibold outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="h-9 px-4 border border-zinc-200 hover:bg-zinc-50 rounded-lg text-xs font-bold transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingApi}
                    className="h-9 px-5 bg-brand-green hover:bg-brand-green-hover disabled:bg-brand-green/60 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                  >
                    {isSubmittingApi ? "Connecting..." : "Save Connection"}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white border border-zinc-200 rounded-2xl divide-y divide-zinc-100 overflow-hidden text-left">
            {loadingApis ? (
              <div className="p-5 flex items-center justify-center">
                <Loader2 size={18} className="animate-spin text-brand-green" />
              </div>
            ) : apis.length === 0 ? (
              <p className="px-5 py-4 text-sm font-semibold text-zinc-400 flex items-center gap-1.5">
                <AlertCircle size={14} /> No API connections configured for this workspace yet.
              </p>
            ) : (
              apis.map((a) => (
                <div key={a.id} className="px-5 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-brand-green-light border border-brand-green/20 text-brand-green flex items-center justify-center shrink-0">
                      <Plug size={14} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-zinc-900 leading-tight">{a.api_name}</p>
                      <p className="text-[10px] text-zinc-450 mt-0.5 uppercase font-bold tracking-wide">
                        {a.provider} ({a.provider_key})
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-md">
                      Active
                    </span>
                    <button
                      onClick={() => handleDeleteApi(a.id, a.api_name)}
                      className="p-1.5 text-zinc-400 hover:text-red-650 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                      title="Revoke API Connection"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* View Profile Modal */}
      {selectedMemberForProfile && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl w-full max-w-md p-6 relative space-y-6 text-left">
            <button
              onClick={() => {
                setSelectedMemberForProfile(null);
                setShowModalPassword(false);
              }}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-4 border-b border-zinc-100 pb-4">
              <div className="w-14 h-14 rounded-full bg-brand-green flex items-center justify-center font-extrabold text-lg text-white">
                {(selectedMemberForProfile.profile?.full_name ?? selectedMemberForProfile.profile?.email ?? "?")
                  .slice(0, 1)
                  .toUpperCase()}
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-zinc-900">
                  {selectedMemberForProfile.profile?.full_name ?? "—"}
                </h3>
                <span className="text-xs font-semibold text-zinc-455 block">
                  {selectedMemberForProfile.profile?.email ?? "—"}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wide">Role</span>
                  <span className="text-xs font-bold block capitalize bg-zinc-100 text-zinc-700 px-2.5 py-1 rounded-md w-fit">
                    {selectedMemberForProfile.role}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wide">Status</span>
                  <span className="text-xs font-bold block capitalize bg-zinc-100 text-zinc-700 px-2.5 py-1 rounded-md w-fit">
                    {selectedMemberForProfile.status}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wide">Joined Date</span>
                <span className="text-xs font-extrabold text-zinc-800 block">
                  {new Date(selectedMemberForProfile.created_at).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>

              {selectedMemberForProfile.profile?.password_plain ? (
                <div className="space-y-1.5 pt-2 border-t border-zinc-100">
                  <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wide">
                    Account Password
                  </label>
                  <div className="flex items-center justify-between gap-2 bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5">
                    <code className="text-xs font-mono text-zinc-800 select-all font-bold">
                      {showModalPassword ? selectedMemberForProfile.profile.password_plain : "••••••••"}
                    </code>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowModalPassword(!showModalPassword)}
                        className="text-zinc-400 hover:text-zinc-655 cursor-pointer"
                        title={showModalPassword ? "Hide password" : "Show password"}
                      >
                        {showModalPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(selectedMemberForProfile.profile!.password_plain!);
                          toast.success("Password copied to clipboard!");
                        }}
                        className="text-zinc-400 hover:text-brand-green cursor-pointer"
                        title="Copy password"
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5 pt-2 border-t border-zinc-100">
                  <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wide">
                    Account Password
                  </label>
                  <p className="text-xs font-semibold text-zinc-400 bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5">
                    No password stored
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={() => {
                setSelectedMemberForProfile(null);
                setShowModalPassword(false);
              }}
              className="w-full h-10 bg-brand-green hover:bg-brand-green-hover text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Close Profile
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
