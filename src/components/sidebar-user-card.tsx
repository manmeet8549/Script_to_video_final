"use client";

import { useEffect, useState, useTransition, useRef } from "react";
import { LogOut, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { signOut } from "@/app/auth/actions";

interface UserInfo {
  name: string;
  email: string;
  initials: string;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function SidebarUserCard() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      const email = data.user.email ?? "";
      const fullName =
        data.user.user_metadata?.full_name ??
        data.user.user_metadata?.name ??
        "";
      const name = fullName.trim() || email.split("@")[0];
      setUser({ name, email, initials: getInitials(name) });
    });
  }, []);

  return (
    <div className="pt-2 space-y-1 select-none">
      {/* Name + email row */}
      <div className="flex items-center gap-2.5 px-1 min-w-0">
        <div className="w-8 h-8 rounded-full bg-brand-green flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-2xs">
          {user?.initials ?? "··"}
        </div>
        <div className="text-left leading-tight min-w-0 flex-1 truncate">
          <span className="text-xs font-extrabold text-zinc-900 block truncate">
            {user?.name ?? "Loading…"}
          </span>
          <span className="text-[10px] font-medium text-zinc-400 block mt-0.5 truncate">
            {user?.email ?? ""}
          </span>
        </div>
      </div>

      {/* Log out button */}
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => signOut())}
        className="w-full flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold text-red-500 hover:text-red-700 hover:bg-red-50/70 transition-all cursor-pointer disabled:opacity-60"
      >
        {pending ? (
          <Loader2 size={15} className="animate-spin" />
        ) : (
          <LogOut size={15} />
        )}
        Log out
      </button>
    </div>
  );
}

// Compact topbar avatar that shows a small dropdown with user info + logout.
export function TopbarUserMenu({ fallbackInitials }: { fallbackInitials?: string }) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      const email = data.user.email ?? "";
      const fullName =
        data.user.user_metadata?.full_name ??
        data.user.user_metadata?.name ??
        "";
      const name = fullName.trim() || email.split("@")[0];
      setUser({ name, email, initials: getInitials(name) });
    });
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const initials = user?.initials ?? fallbackInitials ?? "··";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-8 h-8 rounded-full bg-brand-green border border-brand-green flex items-center justify-center text-xs font-bold text-white cursor-pointer hover:opacity-90 transition-opacity"
        title={user?.name ?? "Account"}
      >
        {initials}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-52 bg-white border border-zinc-200 rounded-2xl shadow-lg z-50 overflow-hidden">
          {/* User info header */}
          <div className="px-4 py-3 border-b border-zinc-100">
            <p className="text-xs font-extrabold text-zinc-900 truncate">
              {user?.name ?? "Loading…"}
            </p>
            <p className="text-[10px] text-zinc-400 mt-0.5 truncate">
              {user?.email ?? ""}
            </p>
          </div>

          {/* Log out */}
          <div className="p-1.5">
            <button
              type="button"
              disabled={pending}
              onClick={() => startTransition(() => signOut())}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-red-500 hover:text-red-700 hover:bg-red-50 transition-all cursor-pointer disabled:opacity-60"
            >
              {pending ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <LogOut size={15} />
              )}
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
