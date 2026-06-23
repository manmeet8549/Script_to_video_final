"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Check,
  ChevronDown,
  Copy,
  Grid,
  List,
  Loader2,
  Mail,
  MoreVertical,
  Plus,
  User,
  UserCheck,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api/client";
import type { Profile, WorkspaceMember } from "@/types/db";

type MemberRow = WorkspaceMember & { profile: Profile | null };

type InviteResult = {
  tempPassword?: string;
  setupLink?: string;
  isNewUser: boolean;
};

const AVATAR_COLORS = [
  "bg-emerald-500",
  "bg-blue-500",
  "bg-violet-500",
  "bg-amber-500",
  "bg-pink-500",
  "bg-cyan-500",
  "bg-teal-500",
];

function avatarColor(idx: number) {
  return AVATAR_COLORS[idx % AVATAR_COLORS.length];
}

function avatarLetter(m: MemberRow) {
  return (m.profile?.full_name ?? m.profile?.email ?? "?").slice(0, 1).toUpperCase();
}

function fmtJoined(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export default function AdminTeamPage() {
  const [activeTab, setActiveTab] = useState<"all" | "users" | "editors">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState("All");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Invite modal
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState<"user" | "editor">("user");
  const [isInviting, setIsInviting] = useState(false);

  // Success dialog
  const [successData, setSuccessData] = useState<{
    email: string;
    role: string;
    result: InviteResult;
  } | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await api.get<MemberRow[]>("/api/members");
      setMembers(data);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to load members.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void (async () => { await load(); })();
  }, [load]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) {
      toast.error("Please enter an email address.");
      return;
    }
    setIsInviting(true);
    try {
      const result = await api.post<InviteResult>("/api/members", {
        email: inviteEmail.trim(),
        full_name: inviteName.trim() || undefined,
        role: inviteRole,
        use_temp_password: true,
      });
      setShowInviteModal(false);
      setSuccessData({ email: inviteEmail.trim(), role: inviteRole, result });
      setInviteEmail("");
      setInviteName("");
      setInviteRole("user");
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to invite member.");
    } finally {
      setIsInviting(false);
    }
  };

  const copy = (text: string, label: string) => {
    navigator.clipboard?.writeText(text).then(
      () => toast.success(`${label} copied`),
      () => toast.error("Copy failed"),
    );
  };

  const totalAll = members.length;
  const totalUsers = members.filter((m) => m.role === "user" || m.role === "viewer").length;
  const totalEditors = members.filter((m) => m.role === "editor").length;

  const filteredMembers = members.filter((m) => {
    const displayName = m.profile?.full_name ?? m.profile?.email ?? "";
    const matchesSearch =
      displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.profile?.email ?? "").toLowerCase().includes(searchQuery.toLowerCase());

    let matchesTab = true;
    if (activeTab === "users") matchesTab = m.role === "user" || m.role === "viewer";
    else if (activeTab === "editors") matchesTab = m.role === "editor";

    let matchesRole = true;
    if (selectedRoleFilter !== "All") {
      matchesRole = m.role === selectedRoleFilter.toLowerCase();
    }

    return matchesSearch && matchesTab && matchesRole;
  });

  const acceptUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/auth/accept-invite`
      : "/auth/accept-invite";

  return (
    <>
      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl w-full max-w-md p-6 relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowInviteModal(false)}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-650 rounded-lg cursor-pointer"
            >
              <X size={18} />
            </button>
            <div className="flex items-center gap-3 border-b border-zinc-100 pb-4 mb-5">
              <div className="w-10 h-10 rounded-full bg-brand-green-light text-brand-green flex items-center justify-center shrink-0">
                <UserCheck size={20} />
              </div>
              <div className="text-left">
                <h3 className="text-sm font-extrabold text-zinc-900 block">Add Member</h3>
                <p className="text-[10px] font-semibold text-zinc-400 block mt-[-1px]">
                  Create a user or editor with a temporary password.
                </p>
              </div>
            </div>

            <form onSubmit={handleInvite} className="space-y-4">
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wide">
                  Full Name (optional)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-zinc-450 pointer-events-none">
                    <User size={14} />
                  </span>
                  <input
                    type="text"
                    placeholder="e.g. Jane Doe"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    className="w-full pl-9 pr-4 h-11 border border-zinc-200 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 rounded-xl text-xs font-semibold text-zinc-900 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wide">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-zinc-455 pointer-events-none">
                    <Mail size={14} />
                  </span>
                  <input
                    type="email"
                    required
                    placeholder="jane@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full pl-9 pr-4 h-11 border border-zinc-200 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 rounded-xl text-xs font-semibold text-zinc-900 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wide block">
                  Role
                </label>
                <div className="space-y-2">
                  {[
                    { role: "user", title: "User / Client", desc: "Can view projects and download assets." },
                    { role: "editor", title: "Video Editor", desc: "Can edit sequences and render footage." },
                  ].map((r) => (
                    <label
                      key={r.role}
                      className={`flex items-start gap-3 p-3 border rounded-xl cursor-pointer transition-all ${
                        inviteRole === r.role
                          ? "border-brand-green bg-brand-green-light/20"
                          : "border-zinc-200 hover:bg-zinc-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="invite_role"
                        className="mt-1 accent-brand-green"
                        checked={inviteRole === r.role}
                        onChange={() => setInviteRole(r.role as "user" | "editor")}
                      />
                      <div>
                        <span className="text-xs font-bold text-zinc-800 block">{r.title}</span>
                        <span className="text-[10px] text-zinc-400 block mt-0.5">{r.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="h-9 px-4 text-xs font-bold text-zinc-550 hover:text-zinc-850 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isInviting}
                  className="h-9 px-5 bg-brand-green hover:bg-brand-green-hover disabled:bg-brand-green/60 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition-colors active:scale-[0.98]"
                >
                  {isInviting ? (
                    <>
                      <Loader2 size={12} className="animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Member"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Dialog */}
      {successData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl w-full max-w-md p-8 text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-brand-green flex items-center justify-center mx-auto">
              <Check size={32} strokeWidth={3} className="text-white" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-extrabold text-zinc-900">Member Invited!</h2>
              <p className="text-sm font-semibold text-zinc-400">
                {successData.email} — {successData.role}
              </p>
            </div>

            <div className="bg-zinc-50 rounded-xl border border-zinc-150 p-4 space-y-3 text-left">
              {/* Invite link */}
              <div className="space-y-1">
                <p className="text-[11px] font-extrabold uppercase tracking-wide text-zinc-400">
                  Invitation Link
                </p>
                <div className="flex items-center justify-between gap-2 bg-white border border-zinc-200 rounded-lg px-3 py-2">
                  <code className="text-xs font-mono text-zinc-700 truncate">
                    {`${acceptUrl}?email=${encodeURIComponent(successData.email)}&role=${successData.role}`}
                  </code>
                  <button
                    type="button"
                    onClick={() =>
                      copy(
                        `${acceptUrl}?email=${encodeURIComponent(successData.email)}&role=${successData.role}`,
                        "Invitation link",
                      )
                    }
                    className="text-zinc-400 hover:text-brand-green transition-colors shrink-0"
                  >
                    <Copy size={14} />
                  </button>
                </div>
              </div>

              {/* Temp password */}
              {successData.result.tempPassword && (
                <div className="space-y-1">
                  <p className="text-[11px] font-extrabold uppercase tracking-wide text-zinc-400">
                    Temporary Password
                  </p>
                  <div className="flex items-center justify-between gap-2 bg-white border border-zinc-200 rounded-lg px-3 py-2">
                    <code className="text-xs font-mono text-zinc-700 truncate">
                      {successData.result.tempPassword}
                    </code>
                    <button
                      type="button"
                      onClick={() => copy(successData.result.tempPassword!, "Temporary password")}
                      className="text-zinc-400 hover:text-brand-green transition-colors shrink-0"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                  <p className="text-[11px] font-semibold text-amber-600">
                    Share securely — they&apos;ll change it on first login.
                  </p>
                </div>
              )}

              {/* Setup link */}
              {successData.result.setupLink && (
                <div className="space-y-1">
                  <p className="text-[11px] font-extrabold uppercase tracking-wide text-zinc-400">
                    Setup Link
                  </p>
                  <div className="flex items-center justify-between gap-2 bg-white border border-zinc-200 rounded-lg px-3 py-2">
                    <code className="text-xs font-mono text-zinc-700 truncate">
                      {successData.result.setupLink}
                    </code>
                    <button
                      type="button"
                      onClick={() => copy(successData.result.setupLink!, "Setup link")}
                      className="text-zinc-400 hover:text-brand-green transition-colors shrink-0"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setSuccessData(null)}
              className="w-full h-11 bg-brand-green hover:bg-brand-green-hover text-white rounded-xl text-sm font-bold transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Page Body */}
      <main className="flex-1 overflow-y-auto px-8 py-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
            <div className="space-y-1">
              <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">Team Management</h1>
              <p className="text-sm font-semibold text-zinc-400 leading-normal">
                Manage members and set permission levels
              </p>
            </div>
            <button
              onClick={() => setShowInviteModal(true)}
              className="h-10 px-4 bg-brand-green hover:bg-brand-green-hover text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-brand-green/10"
            >
              <Plus size={14} strokeWidth={3} />
              Add Member
            </button>
          </div>

          {/* Tabs */}
          <div className="flex items-center border-b border-zinc-200 pb-px gap-4 select-none">
            {[
              { key: "all", label: "All", count: totalAll },
              { key: "users", label: "Users", count: totalUsers },
              { key: "editors", label: "Editors", count: totalEditors },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as "all" | "users" | "editors")}
                className={`h-11 px-4 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === tab.key
                    ? "text-zinc-950 border-b-2 border-brand-green"
                    : "text-zinc-400 hover:text-zinc-700"
                }`}
              >
                {tab.label}
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                  activeTab === tab.key
                    ? "bg-brand-green-light text-brand-green border border-brand-green-light"
                    : "bg-zinc-100 text-zinc-550"
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-4 select-none">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <select
                  value={selectedRoleFilter}
                  onChange={(e) => setSelectedRoleFilter(e.target.value)}
                  className="pl-3 pr-8 h-9 border border-zinc-200 focus:border-brand-green rounded-xl text-xs font-bold outline-none appearance-none bg-white cursor-pointer"
                >
                  <option value="All">All Roles</option>
                  <option value="Admin">Admin</option>
                  <option value="Editor">Editor</option>
                  <option value="User">User</option>
                  <option value="Viewer">Viewer</option>
                </select>
                <span className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none text-zinc-400">
                  <ChevronDown size={14} />
                </span>
              </div>

              <input
                type="text"
                placeholder="Search members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 px-3 border border-zinc-200 focus:border-brand-green rounded-xl text-xs font-semibold text-zinc-900 outline-none w-44"
              />
            </div>

            <div className="flex bg-zinc-150/80 p-0.5 rounded-lg border border-zinc-200">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-md cursor-pointer ${
                  viewMode === "grid" ? "bg-white text-zinc-800 shadow-2xs" : "text-zinc-400 hover:text-zinc-700"
                }`}
              >
                <Grid size={14} />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-md cursor-pointer ${
                  viewMode === "list" ? "bg-white text-zinc-800 shadow-2xs" : "text-zinc-400 hover:text-zinc-700"
                }`}
              >
                <List size={14} />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={28} className="animate-spin text-brand-green" />
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMembers.map((member, idx) => (
                <div
                  key={member.id}
                  className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-4 hover:border-zinc-300 transition-all flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between relative">
                    <div className="relative">
                      <div
                        className={`w-12 h-12 rounded-full ${avatarColor(idx)} text-white flex items-center justify-center font-extrabold text-base select-none`}
                      >
                        {avatarLetter(member)}
                      </div>
                      <span
                        className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                          member.status === "active" ? "bg-brand-green animate-pulse" : "bg-zinc-350"
                        }`}
                      />
                    </div>
                    <button className="p-1.5 text-zinc-400 hover:text-zinc-600 rounded-lg transition-colors cursor-pointer">
                      <MoreVertical size={16} />
                    </button>
                  </div>

                  <div className="text-left space-y-1.5">
                    <h4 className="text-sm font-extrabold text-zinc-900">
                      {member.profile?.full_name ?? "—"}
                    </h4>
                    <span className="text-[11px] font-semibold text-zinc-400 block">
                      {member.profile?.email ?? "—"}
                    </span>
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide mt-1.5 ${
                        member.role === "admin" || member.role === "owner"
                          ? "bg-brand-green-light text-brand-green border border-brand-green-light"
                          : member.role === "editor"
                          ? "bg-amber-50 text-amber-700 border border-amber-100"
                          : "bg-zinc-100 text-zinc-700 border border-zinc-200"
                      }`}
                    >
                      {member.role}
                    </span>
                    {member.status === "pending" && (
                      <span className="ml-1.5 inline-block px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide bg-amber-50 text-amber-700 border border-amber-100">
                        pending
                      </span>
                    )}
                  </div>

                  <hr className="border-zinc-100" />

                  <div className="grid grid-cols-2 text-center text-xs font-semibold">
                    <div className="space-y-0.5 text-left border-r border-zinc-100 pr-2">
                      <span className="text-[9px] font-bold text-zinc-400 block uppercase">Status</span>
                      <span className="text-xs font-extrabold text-zinc-800 capitalize">{member.status}</span>
                    </div>
                    <div className="space-y-0.5 text-left pl-4">
                      <span className="text-[9px] font-bold text-zinc-400 block uppercase">Joined</span>
                      <span className="text-xs font-extrabold text-zinc-800">{fmtJoined(member.created_at)}</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => toast.info(`Viewing profile for ${member.profile?.full_name ?? member.profile?.email}`)}
                      className="w-full h-9 border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-xs font-bold rounded-xl transition-all cursor-pointer select-none active:scale-[0.99] flex items-center justify-center"
                    >
                      View Profile
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-400 font-extrabold select-none">
                    <th className="p-4 uppercase tracking-wide">Member</th>
                    <th className="p-4 uppercase tracking-wide">Role</th>
                    <th className="p-4 uppercase tracking-wide">Status</th>
                    <th className="p-4 uppercase tracking-wide">Joined</th>
                    <th className="p-4 text-right" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 font-semibold text-zinc-800">
                  {filteredMembers.map((member, idx) => (
                    <tr key={member.id} className="hover:bg-zinc-50/50">
                      <td className="p-4 flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full ${avatarColor(idx)} text-white flex items-center justify-center font-bold text-xs`}
                        >
                          {avatarLetter(member)}
                        </div>
                        <div>
                          <span className="font-extrabold block text-zinc-900">
                            {member.profile?.full_name ?? "—"}
                          </span>
                          <span className="text-[10px] text-zinc-450 block mt-0.5">
                            {member.profile?.email ?? "—"}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 capitalize">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                            member.role === "admin" || member.role === "owner"
                              ? "bg-brand-green-light text-brand-green"
                              : member.role === "editor"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-zinc-100 text-zinc-700"
                          }`}
                        >
                          {member.role}
                        </span>
                      </td>
                      <td className="p-4 capitalize">
                        <span className="flex items-center gap-1.5">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              member.status === "active" ? "bg-brand-green" : "bg-zinc-400"
                            }`}
                          />
                          {member.status}
                        </span>
                      </td>
                      <td className="p-4">{fmtJoined(member.created_at)}</td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() =>
                            toast.info(`Viewing profile for ${member.profile?.full_name ?? member.profile?.email}`)
                          }
                          className="px-3 py-1 border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-xs font-bold rounded-lg"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {filteredMembers.length === 0 && !loading && (
            <div className="text-center py-12">
              <p className="text-sm font-semibold text-zinc-400">No members match your filters.</p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
