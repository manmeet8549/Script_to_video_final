"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";

// The voice stage now lives in the unified pipeline wizard on the project hub.
export default function VoiceRedirect({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  const router = useRouter();
  useEffect(() => {
    router.replace(`/dashboard/user/projects/${projectId}`);
  }, [projectId, router]);
  return null;
}
