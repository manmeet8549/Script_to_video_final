"use client";

import { useState } from "react";
import { ArrowLeft, Check } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api/client";
import type { Workspace } from "@/types/db";

export default function OwnerNewWorkspacePage() {
  const router = useRouter();
  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaceOwner, setWorkspaceOwner] = useState("");
  const [tier, setTier] = useState("Pro");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceName) {
      toast.error("Please enter a workspace name.");
      return;
    }

    setIsSubmitting(true);
    toast.info("Scaffolding database records and storage partitions...");

    try {
      await api.post<Workspace>("/api/workspaces", {
        name: workspaceName,
        subscription_tier: tier.toLowerCase(),
        description: workspaceOwner ? `Owner: ${workspaceOwner}` : undefined,
      });
      toast.success(`Workspace "${workspaceName}" successfully created!`);
      router.push("/dashboard/owner/workspaces");
      router.refresh();
    } catch (err) {
      setIsSubmitting(false);
      toast.error(err instanceof ApiError ? err.message : "Failed to create workspace.");
    }
  };

  return (
    <main className="flex-1 overflow-y-auto px-8 py-8 bg-zinc-50/50">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Back link */}
        <Link
          href="/dashboard/owner/workspaces"
          className="inline-flex items-center text-sm font-semibold text-zinc-400 hover:text-zinc-800 transition-colors text-left"
        >
          <ArrowLeft size={16} className="mr-1.5" />
          Back to Workspaces
        </Link>

        {/* Heading */}
        <div className="text-left space-y-1 pb-2">
          <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight">Create Workspace</h1>
          <p className="text-sm font-semibold text-zinc-400">
            Initialize a new isolated environment for client team production pipelines.
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6 text-left">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wide">
                  Workspace Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Stark Industries"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  className="w-full px-4 h-11 border border-zinc-200 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 rounded-xl text-sm font-semibold text-zinc-900 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wide">
                  Workspace Owner Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tony Stark"
                  value={workspaceOwner}
                  onChange={(e) => setWorkspaceOwner(e.target.value)}
                  className="w-full px-4 h-11 border border-zinc-200 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 rounded-xl text-sm font-semibold text-zinc-900 outline-none"
                />
              </div>
            </div>

            {/* Select Tier */}
            <div className="space-y-2.5">
              <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wide block">
                Subscription Tier
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 select-none">
                {[
                  { key: "Free", limit: "5 members, 5GB storage, 50 credits/mo" },
                  { key: "Pro", limit: "25 members, 100GB storage, 500 credits/mo" },
                  { key: "Enterprise", limit: "Unlimited members, 1TB storage, 5000 credits/mo" },
                ].map((t) => (
                  <div
                    key={t.key}
                    onClick={() => setTier(t.key)}
                    className={`border rounded-2xl p-4 cursor-pointer transition-all flex flex-col justify-between h-28 ${
                      tier === t.key
                        ? "border-brand-green bg-brand-green-light shadow-sm"
                        : "border-zinc-200 hover:bg-zinc-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-900">{t.key}</span>
                      {tier === t.key && (
                        <div className="w-4 h-4 rounded-full bg-brand-green flex items-center justify-center text-white">
                          <Check size={10} strokeWidth={3} />
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] text-zinc-400 font-semibold leading-normal">{t.limit}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="h-11 px-8 bg-brand-green hover:bg-brand-green-hover disabled:bg-brand-green/60 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-700/10 active:scale-[0.98] cursor-pointer"
              >
                {isSubmitting ? "Creating Workspace..." : "Create Workspace"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
