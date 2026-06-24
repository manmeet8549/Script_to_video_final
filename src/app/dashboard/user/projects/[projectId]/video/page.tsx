"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";

// The avatar/video stage now lives in the unified pipeline wizard on the hub.
export default function VideoRedirect({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  const router = useRouter();
  useEffect(() => {
    router.replace(`/dashboard/user/projects/${projectId}`);
  }, [projectId, router]);
  return null;
}
