"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PublishSection } from "@/components/PublishSection";

export default function UserPublishPage({ params }: { params: Promise<{ projectId: string }> }) {
  const resolvedParams = use(params);
  const projectId = resolvedParams.projectId;

  return (
    <main className="flex-1 overflow-y-auto px-8 py-8 bg-zinc-50/50">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Back link */}
        <Link
          href={`/dashboard/user/projects/${projectId}`}
          className="inline-flex items-center text-sm font-semibold text-zinc-450 hover:text-zinc-800 transition-colors text-left"
        >
          <ArrowLeft size={16} className="mr-1.5" />
          Back to Projects
        </Link>

        {/* Heading */}
        <div className="text-left space-y-1 pb-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 animate-in fade-in duration-300">
            Publish Video
          </h1>
          <p className="text-sm font-semibold text-zinc-400">
            Distribute this project's final video render to your active social networks.
          </p>
        </div>

        {/* operator console pre-selected with this project */}
        <PublishSection initialProjectId={projectId} />
      </div>
    </main>
  );
}
