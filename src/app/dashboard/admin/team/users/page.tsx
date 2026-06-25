"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus, MoreVertical, Eye, EyeOff, X, Copy } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api/client";
import type { Profile, WorkspaceMember } from "@/types/db";

type MemberRow = WorkspaceMember & { profile: Profile | null };

const AVATAR_COLORS = [
  "bg-emerald-500", "bg-blue-500", "bg-violet-500", "bg-amber-500", "bg-pink-500", "bg-cyan-500",
];

function avatarLetter(m: MemberRow) {
  return (m.profile?.full_name ?? m.profile?.email ?? "?").slice(0, 1).toUpperCase();
}

function fmtJoined(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export default function AdminTeamUsersPage() {
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showPasswordId, setShowPasswordId] = useState<string | null>(null);
  const [selectedMemberForProfile, setSelectedMemberForProfile] = useState<MemberRow | null>(null);
  const [showModalPassword, setShowModalPassword] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
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

  const filtered = members.filter((m) => {
    const isUserRole = m.role === "user" || m.role === "viewer" || m.role === "admin";
    const name = m.profile?.full_name ?? m.profile?.email ?? "";
    const matchesSearch =
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.profile?.email ?? "").toLowerCase().includes(searchQuery.toLowerCase());
    return isUserRole && matchesSearch;
  });

  return (
    <main className="flex-1 overflow-y-auto px-8 py-8 bg-zinc-50/50">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
          <div className="text-left space-y-1">
            <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight">Team Members: Users</h1>
            <p className="text-sm font-semibold text-zinc-400">
              Workspace owners, admins, and client viewers.
            </p>
          </div>
          <button
            onClick={() => toast.info("Use Team Management to add members.")}
            className="h-10 px-4 bg-brand-green hover:bg-brand-green-hover text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-brand-green/10"
          >
            <Plus size={14} strokeWidth={3} />
            Invite Member
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4 bg-white border border-zinc-200 p-4 rounded-2xl shadow-2xs">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 px-3 border border-zinc-200 focus:border-brand-green rounded-xl text-xs font-semibold text-zinc-900 outline-none w-60"
          />
          <span className="text-xs font-bold text-zinc-400">
            {loading ? "Loading…" : `${filtered.length} member${filtered.length !== 1 ? "s" : ""}`}
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="animate-spin text-brand-green" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-zinc-200 rounded-2xl p-16 text-center shadow-xs">
            <p className="text-sm font-semibold text-zinc-400">No users found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((member, idx) => (
              <div
                key={member.id}
                className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-4 hover:border-zinc-300 transition-all flex flex-col justify-between"
              >
                <div className="flex items-start justify-between">
                  <div className="relative">
                    <div
                      className={`w-12 h-12 rounded-full ${AVATAR_COLORS[idx % AVATAR_COLORS.length]} text-white flex items-center justify-center font-extrabold text-base select-none`}
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
                  {member.profile?.password_plain && (
                    <div className="mt-2 p-2 bg-zinc-50 border border-zinc-200 rounded-lg flex items-center justify-between text-xs">
                      <span className="font-semibold text-zinc-500">Pw:</span>
                      <code className="font-mono text-zinc-800">
                        {showPasswordId === member.id ? member.profile.password_plain : "••••••••"}
                      </code>
                      <button
                        type="button"
                        onClick={() => setShowPasswordId(showPasswordId === member.id ? null : member.id)}
                        className="text-zinc-400 hover:text-zinc-600 ml-2 cursor-pointer"
                      >
                        {showPasswordId === member.id ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide mt-1 ${
                        member.role === "admin" || member.role === "owner"
                          ? "bg-brand-green-light text-brand-green border border-brand-green-light"
                          : "bg-zinc-100 text-zinc-700 border border-zinc-200"
                      }`}
                    >
                      {member.role}
                    </span>
                    {member.status === "pending" && (
                      <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide mt-1 bg-amber-50 text-amber-700 border border-amber-100">
                        pending
                      </span>
                    )}
                  </div>
                </div>

                <hr className="border-zinc-100" />

                 <div className="grid grid-cols-2 text-xs font-semibold pb-2">
                  <div className="space-y-0.5 text-left border-r border-zinc-100 pr-2">
                    <span className="text-[9px] font-bold text-zinc-400 block uppercase">Status</span>
                    <span className="text-xs font-extrabold text-zinc-800 capitalize">{member.status}</span>
                  </div>
                  <div className="space-y-0.5 text-left pl-4">
                    <span className="text-[9px] font-bold text-zinc-400 block uppercase">Joined</span>
                    <span className="text-xs font-extrabold text-zinc-800">{fmtJoined(member.created_at)}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-zinc-100">
                  <button
                    onClick={() => setSelectedMemberForProfile(member)}
                    className="w-full h-9 border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-xs font-bold rounded-xl transition-all cursor-pointer select-none active:scale-[0.99] flex items-center justify-center"
                  >
                    View Profile
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
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
              {avatarLetter(selectedMemberForProfile)}
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
                      className="text-zinc-400 hover:text-zinc-650 cursor-pointer"
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
