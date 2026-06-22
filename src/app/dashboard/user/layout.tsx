"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Clapperboard,
  PlusCircle,
  Share2,
  Upload,
  Bell,
  Settings,
  HelpCircle,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { SidebarUserCard } from "@/components/sidebar-user-card";

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const navItems = [
    { label: "Dashboard", href: "/dashboard/user", icon: <LayoutDashboard size={16} /> },
    { category: "CREATIVE PIPELINE" },
    { label: "Script Gen", href: "/dashboard/user/projects", icon: <Sparkles size={16} /> },
    { label: "Voiceover", href: "/dashboard/user/projects", icon: <Clapperboard size={16} /> }, // Using Clapperboard / generic icons
    { label: "Video Studio", href: "/dashboard/user/projects", icon: <Clapperboard size={16} /> },
    { category: "DISTRIBUTION" },
    { label: "Publishing Hub", href: "/dashboard/user/publish", icon: <Share2 size={16} />, badge: "4" },
    { label: "Upload & Publish", href: "/dashboard/user/publish/upload", icon: <Upload size={16} /> },
  ];

  return (
    <div className="flex min-h-screen bg-zinc-50/50">
      {/* Left Sidebar (bg-sidebar-bg) */}
      <aside className="w-64 h-screen sticky top-0 bg-sidebar-bg flex flex-col justify-between p-6 shrink-0 select-none text-zinc-650 border-r border-sidebar-border">
        <div className="space-y-8">
          {/* Logo / Creator welcome */}
          <div className="flex flex-col px-1 select-none text-left">
            <span className="font-extrabold text-lg tracking-tight text-sidebar-active-text block leading-none">
              Project Workflow
            </span>
            <span className="text-[10px] font-bold text-zinc-450 block mt-1 uppercase tracking-wider">
              V2.4 Active
            </span>
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
                  {item.badge && (
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                      isActive ? "bg-[#d2e2cd] text-sidebar-active-text" : "bg-zinc-200/60 text-zinc-550"
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* System Settings & Profile */}
        <div className="space-y-4 pt-4 border-t border-sidebar-border">
          <nav className="space-y-1">
            <Link
              href="/dashboard/user/settings"
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                pathname === "/dashboard/user/settings"
                  ? "bg-sidebar-active-bg text-sidebar-active-text font-bold"
                  : "text-zinc-650 hover:text-zinc-950 hover:bg-[#ebeeeb]/40"
              }`}
            >
              <Settings size={16} />
              Settings
            </Link>
            <Link
              href="/dashboard/user/notifications"
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                pathname === "/dashboard/user/notifications"
                  ? "bg-sidebar-active-bg text-sidebar-active-text font-bold"
                  : "text-zinc-650 hover:text-zinc-950 hover:bg-[#ebeeeb]/40"
              }`}
            >
              <span className="flex items-center gap-3">
                <Bell size={16} />
                Notifications
              </span>
              <span className="text-[9px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full">
                3
              </span>
            </Link>
            <button
              onClick={() => toast.info("Opening Help & Support panel...")}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-zinc-655 hover:text-zinc-950 text-left cursor-pointer hover:bg-[#ebeeeb]/40"
            >
              <HelpCircle size={16} />
              Help & Support
            </button>
          </nav>

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
        <header className="h-16 border-b border-sidebar-border bg-white px-8 flex items-center justify-between shrink-0 select-none z-45">
          {/* Left links */}
          <div className="flex items-center gap-6">
            <Link
              href="/dashboard/user"
              className={`text-sm font-semibold transition-colors ${
                pathname === "/dashboard/user" ? "text-sidebar-active-text font-bold" : "text-zinc-500 hover:text-zinc-900"
              }`}
            >
              Workspace
            </Link>
            <Link
              href="/dashboard/user/projects"
              className={`text-sm font-semibold transition-colors ${
                pathname.startsWith("/dashboard/user/projects") ? "text-sidebar-active-text font-bold" : "text-zinc-500 hover:text-zinc-900"
              }`}
            >
              Library
            </Link>
            <button
              onClick={() => toast.info("Opening Templates Gallery...")}
              className="text-zinc-500 hover:text-zinc-900 text-sm font-semibold transition-colors cursor-pointer"
            >
              Templates
            </button>
          </div>

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
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </Link>
            <Link
              href="/dashboard/user/settings"
              className="p-2 text-zinc-500 hover:text-zinc-900 transition-colors"
              title="Settings"
            >
              <Settings size={18} />
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
