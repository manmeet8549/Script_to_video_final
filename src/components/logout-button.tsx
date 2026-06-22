"use client";

import { useTransition } from "react";
import { LogOut, Loader2 } from "lucide-react";
import { signOut } from "@/app/auth/actions";

// Drop-in logout control. Calls the signOut server action (clears the Supabase
// session) and redirects to /auth/login.
export function LogoutButton({ className, label = "Log out" }: { className?: string; label?: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => signOut())}
      className={
        className ??
        "flex items-center gap-2 text-sm font-semibold text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer disabled:opacity-60"
      }
    >
      {pending ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
      {label}
    </button>
  );
}
