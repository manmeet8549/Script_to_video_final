"use client";

import { PublishSection } from "@/components/PublishSection";
import { useEffect } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function UserPublishHubPage() {
  const router = useRouter();

  useEffect(() => {
    // Intercept OAuth callback status parameters in the URL
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const connected = params.get("connected");
      const error = params.get("error");

      if (connected) {
        toast.success(`Successfully connected ${connected} account!`);
        router.replace("/dashboard/user/publish");
      }
      if (error) {
        toast.error(`Connection error: ${error}`);
        router.replace("/dashboard/user/publish");
      }
    }
  }, [router]);

  return (
    <main className="flex-1 overflow-y-auto px-8 py-8 bg-zinc-50/50">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-left space-y-1 pb-2">
          <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight">Publishing Hub</h1>
          <p className="text-sm font-semibold text-zinc-400">
            Publish, schedule, and distribute your video creations across social platforms.
          </p>
        </div>

        {/* Core Operator Console */}
        <PublishSection />
      </div>
    </main>
  );
}
