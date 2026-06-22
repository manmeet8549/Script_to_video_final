"use client";

import { useState } from "react";
import { Settings, Shield, Server, HardDrive, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function AdminWorkspaceSettingsPage() {
  const [workspaceName, setWorkspaceName] = useState("Acme Corp");
  const [domainRestriction, setDomainRestriction] = useState("acmecorp.com");
  const [storageUsage, setStorageUsage] = useState(82); // 82%
  const [creditBalance, setCreditBalance] = useState(450); // credits

  const handleSaveWorkspaceSettings = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Workspace settings updated successfully!");
  };

  return (
    <main className="flex-1 overflow-y-auto px-8 py-8 bg-zinc-50/50">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
          <div className="text-left leading-normal">
            <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight">Workspace Settings</h1>
            <p className="text-sm font-semibold text-zinc-400 mt-0.5">
              Manage configuration, API key parameters, and usage quotas for the Acme Corp workspace.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 select-none">
          <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-2xs text-left">
            <span className="text-[10px] font-extrabold text-zinc-400 uppercase block">Workspace Credits</span>
            <div className="text-2xl font-extrabold text-zinc-900 mt-1">{creditBalance} Remaining</div>
          </div>
          <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-2xs text-left">
            <span className="text-[10px] font-extrabold text-zinc-400 uppercase block">Workspace Tier</span>
            <div className="text-2xl font-extrabold text-brand-green mt-1">Enterprise</div>
          </div>
          <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-2xs text-left space-y-1.5">
            <div className="flex justify-between items-center text-[10px] font-extrabold text-zinc-400">
              <span>Storage Used</span>
              <span>{storageUsage}%</span>
            </div>
            <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500" style={{ width: `${storageUsage}%` }} />
            </div>
          </div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
          <form onSubmit={handleSaveWorkspaceSettings} className="space-y-6 text-left">
            <h3 className="text-sm font-extrabold text-zinc-800 uppercase tracking-wide border-b border-zinc-150 pb-2.5">
              General Properties
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wide">
                  Workspace Name
                </label>
                <input
                  type="text"
                  required
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  className="w-full px-4 h-11 border border-zinc-200 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 rounded-xl text-sm font-semibold text-zinc-900 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wide">
                  Allowed Email Domains
                </label>
                <input
                  type="text"
                  placeholder="e.g. acmecorp.com"
                  value={domainRestriction}
                  onChange={(e) => setDomainRestriction(e.target.value)}
                  className="w-full px-4 h-11 border border-zinc-200 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 rounded-xl text-sm font-semibold text-zinc-900 outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="h-11 px-6 bg-brand-green hover:bg-brand-green-hover text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-brand-green/10 active:scale-[0.98] cursor-pointer"
              >
                Save Properties
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
