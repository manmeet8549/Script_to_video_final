"use client";

import { useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Grid,
  Plus,
  Search,
  Bell,
  Settings,
  MoreVertical,
  Activity,
  Users,
  Key,
  AlertTriangle,
  FileCheck,
  ChevronRight,
  TrendingUp,
  X,
  Loader2,
  FolderOpen,
  HelpCircle,
  LogOut,
  AppWindow,
} from "lucide-react";
import { toast } from "sonner";

type WorkspaceItem = {
  id: string;
  name: string;
  slug: string;
  status: "Active" | "Suspended" | "Archived" | "Active (New)";
  members: number;
  projects: number;
};

export default function OwnerDashboardPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [newWorkspaceSlug, setNewWorkspaceSlug] = useState("");
  const [newWorkspacePlan, setNewWorkspacePlan] = useState("Enterprise");
  const [isCreating, setIsCreating] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);

  // Dynamic counter states
  const [workspaceCount, setWorkspaceCount] = useState(12);
  const [totalProjectsCount, setTotalProjectsCount] = useState(156);
  const [activeMembersCount, setActiveMembersCount] = useState(48);

  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>([
    {
      id: "1",
      name: "Acme Corp",
      slug: "acme-corp",
      status: "Active",
      members: 24,
      projects: 156,
    },
    {
      id: "2",
      name: "Globex",
      slug: "globex",
      status: "Suspended",
      members: 8,
      projects: 42,
    },
    {
      id: "3",
      name: "Soylent Corp",
      slug: "soylent-corp",
      status: "Archived",
      members: 112,
      projects: 84,
    },
  ]);

  const [attentionWorkspaces, setAttentionWorkspaces] = useState([
    {
      id: "attn-1",
      name: "Legacy Media",
      slug: "legacy-media",
      status: "Payment Failed",
      statusColor: "bg-red-50 text-red-700 border-red-150",
      projects: 45,
      members: 12,
    },
    {
      id: "attn-2",
      name: "Freelance Hub",
      slug: "freelance-hub",
      status: "Nearing Quota",
      statusColor: "bg-amber-50 text-amber-700 border-amber-150",
      projects: 89,
      members: 3,
    },
    {
      id: "attn-3",
      name: "Marketing Q3",
      slug: "marketing-q3",
      status: "Active (New)",
      statusColor: "bg-emerald-50 text-brand-green border-emerald-150",
      projects: 2,
      members: 8,
    },
  ]);

  const handleCreateWorkspace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName || !newWorkspaceSlug) {
      toast.error("Please fill in all workspace details");
      return;
    }

    setIsCreating(true);
    toast.info("Configuring cloud databases & billing profiles...");

    setTimeout(() => {
      setIsCreating(false);
      setWorkspaceCount((prev) => prev + 1);
      const newWS: WorkspaceItem = {
        id: Date.now().toString(),
        name: newWorkspaceName,
        slug: newWorkspaceSlug.toLowerCase().replace(/\s+/g, "-"),
        status: "Active (New)" as any,
        members: 1,
        projects: 0,
      };
      setWorkspaces([newWS, ...workspaces]);
      setShowCreateModal(false);
      setNewWorkspaceName("");
      setNewWorkspaceSlug("");
      toast.success(`Workspace "${newWorkspaceName}" successfully provisioned!`);
    }, 1500);
  };

  const runFullAudit = () => {
    setIsAuditing(true);
    toast.info("Scanning platform usage, database integrity, and connected API channels...");

    setTimeout(() => {
      setIsAuditing(false);
      toast.success("Audit completed successfully! 0 critical vulnerability found.");
    }, 2000);
  };

  // SVGs bar chart data points
  const barChartData = [
    { month: "Jan", count: 50, height: 50 },
    { month: "Feb", count: 75, height: 75 },
    { month: "Mar", count: 100, height: 100 },
    { month: "Apr", count: 85, height: 85 },
    { month: "May", count: 130, height: 130 },
    { month: "Jun", count: 150, height: 150 },
  ];

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
                    setNewWorkspaceSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"));
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

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wide block">
                  Select Plan
                </label>
                <select
                  value={newWorkspacePlan}
                  onChange={(e) => setNewWorkspacePlan(e.target.value)}
                  className="w-full px-4 h-11 border border-zinc-200 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 rounded-xl text-sm font-semibold text-zinc-900 outline-none bg-white cursor-pointer"
                >
                  <option>Pro</option>
                  <option>Enterprise</option>
                  <option>Free Trial</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isCreating}
                className="w-full h-11 bg-brand-green hover:bg-brand-green-hover disabled:bg-brand-green/60 text-white rounded-xl text-sm font-bold shadow-md shadow-emerald-700/10 cursor-pointer flex items-center justify-center gap-1.5 pt-0.5"
              >
                {isCreating ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Provisioning...
                  </>
                ) : (
                  <>Create Workspace</>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Scrollable Dashboard Body */}
      <main className="flex-1 overflow-y-auto px-8 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: "Workspaces", val: workspaceCount, sub: "+2 this month", color: "bg-brand-green-light text-brand-green border-brand-green/10" },
              { label: "Total Projects", val: totalProjectsCount, sub: "+24 this month", color: "bg-brand-green-light text-brand-green border-brand-green/10" },
              { label: "Active Members", val: activeMembersCount, sub: "+5 this month", color: "bg-brand-green-light text-brand-green border-brand-green/10" },
              { label: "APIs Connected", val: 8, sub: "+1 this month", color: "bg-brand-green-light text-brand-green border-brand-green/10" },
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
                <span
                  className={`inline-block px-1.5 py-0.25 rounded text-[9px] font-bold border mt-2 ${kpi.color}`}
                >
                  {kpi.sub}
                </span>
              </div>
            ))}
          </div>

          {/* Split layout: svg bar chart vs activity feed */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* SVG Growth Bar Chart */}
            <div className="lg:col-span-7 bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3 select-none">
                <h3 className="text-sm font-extrabold text-zinc-800 uppercase tracking-wide">
                  Projects Over Time
                </h3>
                <button className="p-1.5 text-zinc-400 hover:text-zinc-650 rounded-lg">
                  <MoreVertical size={16} />
                </button>
              </div>

              <div className="h-64 flex items-end justify-between px-2 pt-6 relative select-none">
                {/* Y Axis Guides */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-[9px] font-bold text-zinc-300 text-left pl-1">
                  <span className="border-b border-zinc-100 w-full pb-1">150</span>
                  <span className="border-b border-zinc-100 w-full pb-1">100</span>
                  <span className="border-b border-zinc-100 w-full pb-1">50</span>
                  <span className="border-b border-zinc-100 w-full pb-1">0</span>
                </div>

                {/* Bars container */}
                <div className="flex-1 flex items-end justify-around relative z-10 pl-6 h-full pb-1">
                  {barChartData.map((d, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-2 group cursor-pointer">
                      {/* Tooltip */}
                      <span className="opacity-0 group-hover:opacity-100 bg-zinc-900 text-white text-[9px] font-bold px-1.5 py-0.5 rounded absolute transition-opacity duration-200 mt-[-25px] transform translate-y-[-10px] shadow-sm">
                        {d.count}
                      </span>
                      {/* Bar */}
                      <div
                        style={{ height: `${(d.height / 150) * 160}px` }}
                        className="w-10 bg-brand-green/80 hover:bg-brand-green transition-all rounded-t-lg shadow-3xs"
                      />
                      <span className="text-[10px] font-bold text-zinc-400">
                        {d.month}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="lg:col-span-5 bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-zinc-100 pb-2 select-none">
                <h3 className="text-sm font-extrabold text-zinc-800 uppercase tracking-wide">
                  Recent Activity
                </h3>
                <button
                  onClick={() => toast.info("Opening all activity logs...")}
                  className="text-xs font-bold text-brand-green hover:underline cursor-pointer"
                >
                  View All
                </button>
              </div>

              <div className="space-y-4 text-left select-none">
                {[
                  { title: "Sarah Jenkins created a new workspace", val: "Marketing Q3", time: "10 minutes ago", icon: "🏢" },
                  { title: "Dev Team Alpha added 3 new members.", val: "", time: "2 hours ago", icon: "👥" },
                  { title: "Mike Chen generated a new API key for", val: "Billing Service", time: "5 hours ago", icon: "🔑" },
                  { title: "System triggered an alert for high usage in", val: "Legacy Workspace", time: "Yesterday at 4:30 PM", icon: "⚠️", danger: true },
                  { title: "Design Studio published 12 new projects.", val: "", time: "Yesterday at 2:15 PM", icon: "🎬" },
                ].map((log, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-1 rounded-lg hover:bg-zinc-50 transition-colors">
                    <div className="w-7 h-7 bg-zinc-100 border border-zinc-200 flex items-center justify-center text-xs rounded-lg shrink-0 shadow-3xs">
                      {log.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-zinc-650 leading-tight">
                        {log.title} <span className={`font-bold ${log.danger ? "text-red-500" : "text-zinc-900"}`}>{log.val}</span>
                      </p>
                      <span className="text-[9px] font-bold text-zinc-400 block mt-1">{log.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Section 1: Workspaces Requiring Attention */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between border-b border-zinc-100 pb-3 gap-4">
              <div className="text-left space-y-0.5">
                <h3 className="text-sm font-extrabold text-zinc-800 uppercase tracking-wide">
                  Workspaces Requiring Attention
                </h3>
                <p className="text-[11px] font-semibold text-zinc-400">
                  Review usage limits, billing issues, or security alerts across your platform.
                </p>
              </div>
              <button
                onClick={runFullAudit}
                disabled={isAuditing}
                className="h-9 px-4 bg-brand-green hover:bg-brand-green-hover disabled:bg-brand-green/60 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm animate-pulse"
              >
                {isAuditing ? (
                  <>
                    <Loader2 size={12} className="animate-spin" />
                    Auditing...
                  </>
                ) : (
                  <>Run Full Audit</>
                )}
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-semibold text-zinc-800">
                <thead>
                  <tr className="border-b border-zinc-200 text-zinc-400 font-extrabold select-none pb-2">
                    <th className="py-2.5 uppercase tracking-wider">Workspace</th>
                    <th className="py-2.5 uppercase tracking-wider">Status</th>
                    <th className="py-2.5 uppercase tracking-wider text-center">Projects</th>
                    <th className="py-2.5 uppercase tracking-wider text-center">Members</th>
                    <th className="py-2.5 text-right"></th>
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
                        <span className={`px-2 py-0.5 border rounded-[4px] text-[10px] font-extrabold ${ws.statusColor}`}>
                          {ws.status}
                        </span>
                      </td>
                      <td className="py-3 text-center">{ws.projects}</td>
                      <td className="py-3 text-center">{ws.members}</td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => toast.info(`Managing alert context for ${ws.name}...`)}
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
          </div>

          {/* Bottom Section 2: Global Workspaces Grid */}
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3 select-none">
              <h3 className="text-sm font-extrabold text-zinc-800 uppercase tracking-wide">
                Workspaces
              </h3>
              <button
                onClick={() => setShowCreateModal(true)}
                className="h-9 px-4 bg-brand-green hover:bg-brand-green-hover text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
              >
                <Plus size={14} strokeWidth={3} />
                Create Workspace
              </button>
            </div>

            {/* Grid cards list */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {workspaces.map((ws) => (
                <div
                  key={ws.id}
                  onClick={() => {
                    toast.success(`Managing workspace details for ${ws.name}`);
                  }}
                  className="bg-white border border-zinc-200 hover:border-brand-green hover:shadow-xs rounded-2xl p-6 shadow-2xs transition-all cursor-pointer text-left space-y-4 flex flex-col justify-between"
                >
                  {/* Title & Status */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-extrabold text-zinc-955 block">{ws.name}</h4>
                      <span className="text-[10px] text-zinc-450 block mt-0.5">/{ws.slug}</span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-[4px] text-[9px] font-extrabold uppercase border ${
                        ws.status === "Active"
                          ? "bg-brand-green-light text-brand-green border-brand-green/10"
                          : ws.status === "Suspended"
                          ? "bg-red-50 text-red-750 border-red-100 animate-pulse"
                          : ws.status === "Active (New)"
                          ? "bg-brand-green-light text-brand-green border-brand-green/20"
                          : "bg-zinc-100 text-zinc-450 border-zinc-200"
                      }`}
                    >
                      {ws.status}
                    </span>
                  </div>

                  <hr className="border-zinc-100" />

                  {/* Stats metrics */}
                  <div className="grid grid-cols-2 text-xs font-semibold text-zinc-700">
                    <div className="border-r border-zinc-100 pr-2">
                      <span className="text-[9px] text-zinc-400 block uppercase font-extrabold">Members</span>
                      <span className="text-zinc-800 font-extrabold mt-0.5 block">{ws.members} active</span>
                    </div>
                    <div className="pl-4">
                      <span className="text-[9px] text-zinc-400 block uppercase font-extrabold">Projects</span>
                      <span className="text-zinc-800 font-extrabold mt-0.5 block">{ws.projects} total</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
