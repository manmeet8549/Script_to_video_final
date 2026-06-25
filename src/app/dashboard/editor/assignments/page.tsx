"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import EditorAssignments from "@/components/EditorAssignments";

function AssignmentsContent() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status") || undefined;

  return <EditorAssignments statusFilter={status} />;
}

export default function EditorAssignmentsPage() {
  return (
    <main className="flex-1 overflow-y-auto px-8 py-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="border-b border-zinc-200 pb-4">
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">My Assignments</h1>
          <p className="mt-0.5 text-sm font-semibold text-zinc-400">
            Accept editing work and upload your edited versions for review.
          </p>
        </div>
        <Suspense fallback={<div className="text-sm font-semibold text-zinc-400 py-10 text-center">Loading assignments...</div>}>
          <AssignmentsContent />
        </Suspense>
      </div>
    </main>
  );
}
