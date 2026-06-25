"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Clapperboard,
  Share2,
  Upload,
  Bell,
  Settings,
  Sparkles,
  Users,
  UserCheck,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";
import { SidebarUserCard } from "@/components/sidebar-user-card";
import { api } from "@/lib/api/client";

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState<number | null>(null);

  useEffect(() => {
    type Notification = { is_read: boolean };
    api.get<Notification[]>("/api/notifications")
      .then((notifs) => setUnreadCount(notifs.filter((n) => !n.is_read).length))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (pathname?.endsWith("/notifications")) {
      type Notification = { is_read: boolean };
      api.get<Notification[]>("/api/notifications")
        .then((notifs) => setUnreadCount(notifs.filter((n) => !n.is_read).length))
        .catch(() => {});
    }
  }, [pathname]);

  const navItems = [
    { label: "Dashboard", href: "/dashboard/user", icon: <LayoutDashboard size={16} /> },
    { category: "CREATIVE PIPELINE" },
    { label: "Script Gen", href: "/dashboard/user/projects", icon: <Sparkles size={16} /> },
    { label: "Voiceover", href: "/dashboard/user/projects", icon: <Clapperboard size={16} /> },
    { label: "Video Studio", href: "/dashboard/user/projects", icon: <Clapperboard size={16} /> },
    { category: "EDIT MANAGER" },
    { label: "Edit with AI", href: "/dashboard/user/edit/ai", icon: <Wand2 size={16} /> },
    { label: "Send to Editor", href: "/dashboard/user/edit/manual", icon: <UserCheck size={16} /> },
    { label: "Editor Manager", href: "/dashboard/user/editors", icon: <Users size={16} /> },
    { category: "DISTRIBUTION" },
    { label: "Publishing Hub", href: "/dashboard/user/publish", icon: <Share2 size={16} /> },
    { label: "Upload & Publish", href: "/dashboard/user/publish/upload", icon: <Upload size={16} /> },
  ];

  return (
    <div className="flex min-h-screen bg-zinc-50/50">
      {/* Left Sidebar (bg-sidebar-bg) */}
      <aside className="w-64 h-screen sticky top-0 bg-sidebar-bg flex flex-col justify-between p-6 shrink-0 select-none text-zinc-650 border-r border-sidebar-border">
        <div className="space-y-8">
          {/* Logo / Creator welcome */}
          <div className="flex items-center gap-2.5 px-1 select-none text-left">
            <img src="/ThinkNEXT-LOGO-NEW.svg" alt="ThinkNEXT Logo" className="h-10 w-auto" />
            <div className="flex flex-col">
              <span className="font-extrabold text-sm tracking-tight text-sidebar-active-text block leading-none">
                Project Workflow
              </span>
              <span className="text-[8px] font-bold text-zinc-450 block mt-0.5 uppercase tracking-wider leading-none">
                V2.4 Active
              </span>
            </div>
          </div>

          {/* Navigation links */}
          <nav className="space-y-1.5 overflow-y-auto max-h-[calc(100vh-280px)] pr-1">
            {navItems.map((item, idx) => {
              if (item.category) {
                return (
                  <span
                    key={idx}
                    className="text-[10px] font-extrabold text-zinc-450 uppercase tracking-widest px-3.5 pt-4 block first:pt-0"
                  >
                    {item.category}
                  </span>
                );
              }

              const isActive = pathname === item.href || (item.href !== "/dashboard/user" && pathname?.startsWith(item.href!));
              return (
                <Link
                  key={idx}
                  href={item.href!}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? "bg-sidebar-active-bg text-sidebar-active-text font-bold"
                      : "text-zinc-600 hover:text-zinc-950 hover:bg-[#ebeeeb]/40"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    {item.icon}
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* System Settings & Profile */}
        <div className="space-y-4 pt-4 border-t border-sidebar-border">
          {/* User Profile Card & Pro Upgrade Button */}
          <div className="space-y-3 pt-2">
            <SidebarUserCard />

            {/* Pro Upgrade Button */}
            <button
              onClick={() => toast.success("Redirecting to subscription plan page...")}
              className="w-full py-2.5 bg-[#ebe8e2] hover:bg-[#dfdbd5] text-zinc-700 font-bold text-xs rounded-xl shadow-3xs transition-all active:scale-[0.98] cursor-pointer"
            >
              Pro Upgrade
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar Navigation */}
        <header className="h-16 border-b border-sidebar-border bg-white px-8 flex items-center justify-end shrink-0 select-none z-45">
          {/* Right items */}
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/user/projects/new"
              className="h-10 px-4 bg-brand-green hover:bg-brand-green-hover text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs active:scale-[0.98]"
            >
              New Project
            </Link>
            <Link
              href="/dashboard/user/notifications"
              className="p-2 text-zinc-500 hover:text-zinc-900 transition-colors relative"
              title="Notifications"
            >
              <Bell size={18} />
              {unreadCount !== null && unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[8px] font-extrabold text-white ring-2 ring-white">
                  {unreadCount}
                </span>
              )}
            </Link>
          </div>
        </header>

        {/* Subpage Children */}
        <div className="flex-1 flex flex-col overflow-hidden bg-zinc-50/50">
          {children}
        </div>
      </div>
    </div>
  );
}
