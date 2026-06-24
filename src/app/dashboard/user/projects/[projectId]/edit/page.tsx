"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";

// The editing stage now lives in the unified pipeline wizard (Export step
// drawers) on the project hub.
export default function EditRedirect({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  const router = useRouter();
  useEffect(() => {
    router.replace(`/dashboard/user/projects/${projectId}`);
  }, [projectId, router]);
  return null;
}
