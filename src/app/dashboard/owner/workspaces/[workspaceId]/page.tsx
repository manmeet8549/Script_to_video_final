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
  provider: "voice" | "video" | "editing" | "publishing";
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

export default function OwnerWorkspaceDetailPage() {
  const params = useParams<{ workspaceId: string }>();
  const router = useRouter();
  const workspaceId = params.workspaceId;

  const [detail, setDetail] = useState<WorkspaceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);

  // API integrations states
  const [apis, setApis] = useState<SafeWorkspaceApi[]>([]);
  const [loadingApis, setLoadingApis] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newApiName, setNewApiName] = useState("");
  const [newApiKey, setNewApiKey] = useState("");
  const [newApiSecret, setNewApiSecret] = useState("");
  const [newProvider, setNewProvider] = useState<"voice" | "video" | "editing" | "publishing">("voice");
  const [newProviderKey, setNewProviderKey] = useState("elevenlabs");
  const [isSubmittingApi, setIsSubmittingApi] = useState(false);

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

  const handleProviderChange = (prov: "voice" | "video" | "editing" | "publishing") => {
    setNewProvider(prov);
    switch (prov) {
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

          <button
            onClick={handleSwitch}
            disabled={switching}
            className="h-10 px-4 bg-brand-green hover:bg-brand-green-hover disabled:bg-brand-green/60 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-emerald-700/10 shrink-0"
          >
            {switching ? <Loader2 size={14} className="animate-spin" /> : <LogIn size={14} />}
            Switch to this workspace
          </button>
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
        <section className="space-y-3">
          <h2 className="text-lg font-extrabold text-zinc-900 flex items-center gap-2">
            <Users size={18} /> Members
          </h2>
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
                  </div>
                </div>
                <span className="text-[10px] font-extrabold uppercase tracking-wide px-2 py-0.5 bg-zinc-100 text-zinc-600 rounded capitalize">
                  {m.role}
                </span>
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
                      onChange={(e) => handleProviderChange(e.target.value as any)}
                      className="w-full px-3 h-10 border border-zinc-200 rounded-lg text-xs font-semibold outline-none bg-white"
                    >
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
                      {newProvider === "voice" && (
                        <>
                          <option value="elevenlabs">ElevenLabs</option>
                          <option value="azure_tts">Azure TTS</option>
                          <option value="google_tts">Google TTS</option>
                          <option value="polly">Amazon Polly</option>
                        </>
                      )}
                      {newProvider === "video" && (
                        <>
                          <option value="heygen">HeyGen</option>
                          <option value="synthesia">Synthesia</option>
                          <option value="d-id">D-ID</option>
                          <option value="runway">Runway</option>
                        </>
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
    </main>
  );
}
