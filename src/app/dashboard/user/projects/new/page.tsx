"use client";

import { useState } from "react";
import { Plus, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api/client";
import type { Project, ProjectPriority } from "@/types/db";

export default function UserNewProjectPage() {
  const router = useRouter();
  const [projectName, setProjectName] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [stage, setStage] = useState("AI Script Gen");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName) {
      toast.error("Please enter a project name.");
      return;
    }

    setIsSubmitting(true);
    toast.info("Scaffolding pipeline tracks and voice configurations...");

    try {
      await api.post<Project>("/api/projects", {
        title: projectName,
        priority: priority.toLowerCase() as ProjectPriority,
      });
      toast.success(`Project "${projectName}" successfully created!`);
      router.push("/dashboard/user/projects");
      router.refresh();
    } catch (err) {
      setIsSubmitting(false);
      toast.error(err instanceof ApiError ? err.message : "Failed to create project.");
    }
  };

  return (
    <main className="flex-1 overflow-y-auto px-8 py-8 bg-zinc-50/50">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Back link */}
        <Link
          href="/dashboard/user/projects"
          className="inline-flex items-center text-sm font-semibold text-zinc-400 hover:text-zinc-800 transition-colors text-left"
        >
          <ArrowLeft size={16} className="mr-1.5" />
          Back to Projects
        </Link>

        {/* Heading */}
        <div className="text-left space-y-1 pb-2">
          <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight">Create New Project</h1>
          <p className="text-sm font-semibold text-zinc-400">
            Set up a new workflow pipeline to generate, script, record, and publish your video campaign.
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6 text-left">
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wide">
                Project Title
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Q3 Sales Overview"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="w-full px-4 h-11 border border-zinc-200 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 rounded-xl text-sm font-semibold text-zinc-900 outline-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wide block">
                  Priority Level
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-4 h-11 border border-zinc-200 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 rounded-xl text-sm font-semibold text-zinc-900 outline-none bg-white cursor-pointer"
                >
                  <option>High</option>
                  <option>Medium</option>
                  <option>Low</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wide block">
                  Initial Workflow Step
                </label>
                <select
                  value={stage}
                  onChange={(e) => setStage(e.target.value)}
                  className="w-full px-4 h-11 border border-zinc-200 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 rounded-xl text-sm font-semibold text-zinc-900 outline-none bg-white cursor-pointer"
                >
                  <option>AI Script Gen</option>
                  <option>Voiceover Sync</option>
                  <option>Video Studio</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="h-11 px-8 bg-brand-green hover:bg-brand-green-hover disabled:bg-brand-green/60 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-brand-green/10 active:scale-[0.98] cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Initializing...
                  </>
                ) : (
                  <>Create Project</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
