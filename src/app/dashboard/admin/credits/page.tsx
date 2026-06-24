import CreditsPanel from "@/components/CreditsPanel";

export default function AdminCreditsPage() {
  return (
    <main className="flex-1 overflow-y-auto px-8 py-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="border-b border-zinc-200 pb-4">
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">Credits</h1>
          <p className="mt-0.5 text-sm font-semibold text-zinc-400">
            Track generation usage across this workspace and top up balances.
          </p>
        </div>
        <CreditsPanel canGrant />
      </div>
    </main>
  );
}
