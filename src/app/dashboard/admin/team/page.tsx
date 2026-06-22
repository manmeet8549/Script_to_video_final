"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  Film,
  History,
  CreditCard,
  Bell,
  Settings,
  Plus,
  Search,
  ChevronDown,
  Grid,
  List,
  MoreVertical,
  X,
  Check,
  UserCheck,
  HelpCircle,
  LogOut,
  Mail,
  Send,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { getStoredMembers, saveStoredMembers, Member } from "../../../utils/storage";

export default function AdminTeamPage() {
  const [activeTab, setActiveTab] = useState<"all" | "users" | "editors" | "support">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState("All");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("All");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Invite states
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "editor" | "viewer" | "support">("viewer");

  // Members list
  const [members, setMembers] = useState<Member[]>([]);

  useEffect(() => {
    setMembers(getStoredMembers());
  }, []);

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !inviteName) {
      toast.error("Please fill in all fields");
      return;
    }

    const colors = ["bg-purple-500", "bg-pink-500", "bg-cyan-500", "bg-teal-500"];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const letter = inviteName.substring(0, 1).toUpperCase();

    const newMember: Member = {
      id: Date.now().toString(),
      name: inviteName,
      email: inviteEmail,
      role: inviteRole,
      status: "active",
      projects: 0,
      joined: "Jun 2026",
      avatarLetter: letter,
      avatarColor: randomColor,
    };

    const updated = [...members, newMember];
    setMembers(updated);
    saveStoredMembers(updated);
    setShowInviteModal(false);
    setInviteName("");
    setInviteEmail("");
    toast.success(`Invite sent successfully to ${inviteEmail}!`);
  };

  // Filter calculations
  const totalAll = members.length;
  const totalUsers = members.filter((m) => m.role === "viewer" || m.role === "admin").length;
  const totalEditors = members.filter((m) => m.role === "editor").length;
  const totalSupport = members.filter((m) => m.role === "support").length;

  const filteredMembers = members.filter((m) => {
    // Search Query filter
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase());

    // Role Tab filter
    let matchesTab = true;
    if (activeTab === "users") matchesTab = m.role === "viewer" || m.role === "admin";
    else if (activeTab === "editors") matchesTab = m.role === "editor";
    else if (activeTab === "support") matchesTab = m.role === "support";

    // Dropdown Role filter
    let matchesRoleDropdown = true;
    if (selectedRoleFilter !== "All") {
      matchesRoleDropdown = m.role === selectedRoleFilter.toLowerCase();
    }

    // Dropdown Status filter
    let matchesStatusDropdown = true;
    if (selectedStatusFilter !== "All") {
      matchesStatusDropdown = m.status === (selectedStatusFilter === "Active" ? "active" : "offline");
    }

    return matchesSearch && matchesTab && matchesRoleDropdown && matchesStatusDropdown;
  });

  return (
    <>
      {/* Invite Modal Drawer */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl w-full max-w-md p-6 relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowInviteModal(false)}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-650 rounded-lg cursor-pointer"
            >
              <X size={18} />
            </button>
            
            {/* Modal Header */}
            <div className="flex items-center gap-3 border-b border-zinc-100 pb-4 mb-5">
              <div className="w-10 h-10 rounded-full bg-brand-green-light text-brand-green flex items-center justify-center shrink-0">
                <UserCheck size={20} />
              </div>
              <div className="text-left">
                <h3 className="text-sm font-extrabold text-zinc-900 block">Invite Member</h3>
                <p className="text-[10px] font-semibold text-zinc-400 block mt-[-1px]">
                  Add a new member to your workspace.
                </p>
              </div>
            </div>

            <form onSubmit={handleInvite} className="space-y-4">
              {/* Full Name */}
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wide">
                  Full Name
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-zinc-450 pointer-events-none">
                    <User size={14} />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Jane Doe"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    className="w-full pl-9 pr-4 h-11 border border-zinc-200 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 rounded-xl text-xs font-semibold text-zinc-900 outline-none"
                  />
                </div>
              </div>

              {/* Email Address */}
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

              {/* Select Role */}
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wide block">
                  Select Role
                </label>
                <div className="space-y-2">
                  {[
                    { role: "viewer", title: "Viewer / Client", desc: "Can view and download project assets." },
                    { role: "editor", title: "Video Editor", desc: "Can edit sequences and render footage." },
                    { role: "admin", title: "Team Admin", desc: "Full controls across the workspace." },
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
                        onChange={() => setInviteRole(r.role as any)}
                      />
                      <div>
                        <span className="text-xs font-bold text-zinc-800 block">{r.title}</span>
                        <span className="text-[10px] text-zinc-400 block mt-0.5">{r.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 select-none">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="h-9 px-4 text-xs font-bold text-zinc-550 hover:text-zinc-850 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-9 px-5 bg-brand-green hover:bg-brand-green-hover text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm shadow-brand-green/10 transition-colors active:scale-[0.98]"
                >
                  Send Invite
                  <Send size={12} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Content Body */}
      <main className="flex-1 overflow-y-auto px-8 py-8">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Header section with heading and CTA button */}
          <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
            <div className="space-y-1">
              <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">
                Team Management
              </h1>
              <p className="text-sm font-semibold text-zinc-400 leading-normal">
                Manage members and set permission levels
              </p>
            </div>
            <button
              onClick={() => setShowInviteModal(true)}
              className="h-10 px-4 bg-brand-green hover:bg-brand-green-hover text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-brand-green/10"
            >
              <Plus size={14} strokeWidth={3} />
              Invite Member
            </button>
          </div>
            {/* Role Filter Tabs */}
            <div className="flex items-center border-b border-zinc-200 pb-px gap-4 select-none">
              <button
                onClick={() => setActiveTab("all")}
                className={`h-11 px-4 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === "all"
                    ? "text-zinc-950 border-b-2 border-brand-green"
                    : "text-zinc-400 hover:text-zinc-700"
                }`}
              >
                All
                <span className="w-5 h-5 bg-brand-green-light text-brand-green rounded-full flex items-center justify-center text-[9px] font-bold border border-brand-green-light">
                  {totalAll}
                </span>
              </button>
              <button
                onClick={() => setActiveTab("users")}
                className={`h-11 px-4 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === "users"
                    ? "text-zinc-950 border-b-2 border-brand-green"
                    : "text-zinc-400 hover:text-zinc-700"
                }`}
              >
                Users
                <span className="w-5 h-5 bg-zinc-100 text-zinc-550 rounded-full flex items-center justify-center text-[9px] font-bold">
                  {totalUsers}
                </span>
              </button>
              <button
                onClick={() => setActiveTab("editors")}
                className={`h-11 px-4 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === "editors"
                    ? "text-zinc-950 border-b-2 border-brand-green"
                    : "text-zinc-400 hover:text-zinc-700"
                }`}
              >
                Editors
                <span className="w-5 h-5 bg-zinc-100 text-zinc-550 rounded-full flex items-center justify-center text-[9px] font-bold">
                  {totalEditors}
                </span>
              </button>
              <button
                onClick={() => setActiveTab("support")}
                className={`h-11 px-4 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === "support"
                    ? "text-zinc-950 border-b-2 border-brand-green"
                    : "text-zinc-400 hover:text-zinc-700"
                }`}
              >
                Support
                <span className="w-5 h-5 bg-zinc-100 text-zinc-550 rounded-full flex items-center justify-center text-[9px] font-bold">
                  {totalSupport}
                </span>
              </button>
            </div>

            {/* Filter Controls Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-4 select-none">
              <div className="flex flex-wrap items-center gap-3">

                {/* Role select */}
                <div className="relative">
                  <select
                    value={selectedRoleFilter}
                    onChange={(e) => setSelectedRoleFilter(e.target.value)}
                    className="pl-3 pr-8 h-9 border border-zinc-200 focus:border-brand-green focus:ring-1 focus:ring-brand-green/20 rounded-xl text-xs font-bold outline-none appearance-none bg-white cursor-pointer"
                  >
                    <option>All Roles</option>
                    <option>Admin</option>
                    <option>Editor</option>
                    <option>Viewer</option>
                  </select>
                  <span className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none text-zinc-400">
                    <ChevronDown size={14} />
                  </span>
                </div>

                {/* Status select */}
                <div className="relative">
                  <select
                    value={selectedStatusFilter}
                    onChange={(e) => setSelectedStatusFilter(e.target.value)}
                    className="pl-3 pr-8 h-9 border border-zinc-200 focus:border-brand-green focus:ring-1 focus:ring-brand-green/20 rounded-xl text-xs font-bold outline-none appearance-none bg-white cursor-pointer"
                  >
                    <option>Status</option>
                    <option>Active</option>
                    <option>Offline</option>
                  </select>
                  <span className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none text-zinc-400">
                    <ChevronDown size={14} />
                  </span>
                </div>
              </div>

              {/* Grid / List View Toggle */}
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

            {/* Member Cards Grid */}
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMembers.map((member) => (
                  <div
                    key={member.id}
                    className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-4 hover:border-zinc-300 transition-all flex flex-col justify-between"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between relative">
                      <div className="relative">
                        {/* Custom Avatar Letter representation */}
                        <div className={`w-12 h-12 rounded-full ${member.avatarColor} text-white flex items-center justify-center font-extrabold text-base select-none`}>
                          {member.avatarLetter}
                        </div>
                        {/* Status badge dot */}
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

                    {/* Member Details */}
                    <div className="text-left space-y-1.5">
                      <h4 className="text-sm font-extrabold text-zinc-900">{member.name}</h4>
                      <span className="text-[11px] font-semibold text-zinc-400 block">{member.email}</span>
                      
                      {/* Role Badge */}
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide mt-1.5 ${
                          member.role === "admin"
                            ? "bg-brand-green-light text-brand-green border border-brand-green-light"
                            : member.role === "editor"
                            ? "bg-amber-50 text-amber-700 border border-amber-100"
                            : "bg-zinc-100 text-zinc-700 border border-zinc-200"
                        }`}
                      >
                        {member.role}
                      </span>
                    </div>

                    <hr className="border-zinc-100" />

                    {/* Stats */}
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

                    {/* Footer Actions */}
                    <div className="pt-2">
                      <button
                        onClick={() => toast.info(`Viewing profile for ${member.name}...`)}
                        className="w-full h-9 border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-xs font-bold rounded-xl transition-all cursor-pointer select-none active:scale-[0.99] flex items-center justify-center"
                      >
                        View Profile
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // List View
              <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-400 font-extrabold select-none">
                      <th className="p-4 uppercase tracking-wide">Member</th>
                      <th className="p-4 uppercase tracking-wide">Role</th>
                      <th className="p-4 uppercase tracking-wide">Status</th>
                      <th className="p-4 uppercase tracking-wide">Projects</th>
                      <th className="p-4 uppercase tracking-wide">Joined</th>
                      <th className="p-4 text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 font-semibold text-zinc-800">
                    {filteredMembers.map((member) => (
                      <tr key={member.id} className="hover:bg-zinc-50/50">
                        <td className="p-4 flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full ${member.avatarColor} text-white flex items-center justify-center font-bold text-xs`}>
                            {member.avatarLetter}
                          </div>
                          <div>
                            <span className="font-extrabold block text-zinc-900">{member.name}</span>
                            <span className="text-[10px] text-zinc-450 block mt-0.5">{member.email}</span>
                          </div>
                        </td>
                        <td className="p-4 capitalize">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                              member.role === "admin"
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
                            <span className={`w-1.5 h-1.5 rounded-full ${member.status === "active" ? "bg-brand-green" : "bg-zinc-400"}`} />
                            {member.status}
                          </span>
                        </td>
                        <td className="p-4">{member.projects} active</td>
                        <td className="p-4">{member.joined}</td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => toast.info(`Viewing profile for ${member.name}...`)}
                            className="px-3 py-1 border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-xs font-bold rounded-lg mr-2"
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

            {/* Load More button */}
            <div className="flex justify-center pt-4 select-none">
              <button
                onClick={() => toast.info("All members loaded.")}
                className="h-10 px-5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                Load More Members
                <ChevronDown size={14} />
              </button>
            </div>
          </div>
        </main>
      </>
    );
  }
