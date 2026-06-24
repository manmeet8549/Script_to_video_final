"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { api } from "@/lib/api/client";
import ProjectPipeline from "@/components/ProjectPipeline";
import type { Project } from "@/types/db";

export default function ProjectPipelinePage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  const [project, setProject] = useState<Project | null>(null);

  useEffect(() => {
    api.get<Project>(`/api/projects/${projectId}`).then(setProject).catch(() => {});
  }, [projectId]);

  return (
    <main className="flex-1 overflow-y-auto px-10 py-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <Link
          href="/dashboard/user/projects"
          className="inline-flex items-center text-sm font-semibold text-zinc-400 transition-colors hover:text-zinc-800"
        >
          <ArrowLeft size={16} className="mr-1.5" />
          Back to My Projects
        </Link>

        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">
            {project?.title || "Loading project…"}
          </h1>
          <p className="text-xs font-semibold text-zinc-400">
            Generate your video step by step — script, voice, avatar, and export.
          </p>
        </div>

        <ProjectPipeline projectId={projectId} />
      </div>
    </main>
  );
}
