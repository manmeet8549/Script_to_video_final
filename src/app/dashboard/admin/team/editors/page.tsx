"use client";

import { useState, useEffect } from "react";
import { Search, Plus, Calendar } from "lucide-react";
import { toast } from "sonner";
import { getStoredMembers, Member } from "../../../../utils/storage";

export default function AdminTeamEditorsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [members, setMembers] = useState<Member[]>([]);

  useEffect(() => {
    setMembers(getStoredMembers());
  }, []);

  const filteredMembers = members.filter((m) => {
    const matchesRole = m.role === "editor";
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRole && matchesSearch;
  });

  return (
    <main className="flex-1 overflow-y-auto px-8 py-8 bg-zinc-50/50">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
          <div className="text-left space-y-1">
            <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight">Team Members: Editors</h1>
            <p className="text-sm font-semibold text-zinc-400">
              Professional video and audio production editors.
            </p>
          </div>
          <button
            onClick={() => toast.info("Invite modal triggered from Team Hub")}
            className="h-10 px-4 bg-brand-green hover:bg-brand-green-hover text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-brand-green/10"
          >
            <Plus size={14} strokeWidth={3} />
            Invite Member
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="flex items-center justify-end gap-4 bg-white border border-zinc-200 p-4 rounded-2xl shadow-2xs select-none">
          <span className="text-xs font-bold text-zinc-400">Showing 2 editors</span>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMembers.map((member) => (
            <div
              key={member.id}
              className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-4 hover:border-zinc-300 transition-all flex flex-col justify-between"
            >
              <div className="flex items-start justify-between relative">
                <div className="relative">
                  <div className={`w-12 h-12 rounded-full ${member.avatarColor} text-white flex items-center justify-center font-extrabold text-base select-none`}>
                    {member.avatarLetter}
                  </div>
                  <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                    member.status === "active" ? "bg-brand-green animate-pulse" : "bg-zinc-350"
                  }`} />
                </div>
              </div>

              <div className="text-left space-y-1.5">
                <h4 className="text-sm font-extrabold text-zinc-900">{member.name}</h4>
                <span className="text-[11px] font-semibold text-zinc-400 block">{member.email}</span>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-50 text-amber-705 border border-amber-100 uppercase tracking-wide mt-1.5">
                  {member.role}
                </span>
              </div>

              <hr className="border-zinc-100" />

              <div className="grid grid-cols-2 text-center text-xs font-semibold">
                <div className="space-y-0.5 text-left border-r border-zinc-100 pr-2">
                  <span className="text-[9px] font-bold text-zinc-400 block uppercase">Projects</span>
                  <span className="text-xs font-extrabold text-zinc-800">{member.projects} active</span>
                </div>
                <div className="space-y-0.5 text-left pl-4">
                  <span className="text-[9px] font-bold text-zinc-400 block uppercase">Joined</span>
                  <span className="text-xs font-extrabold text-zinc-800">{member.joined}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
