"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  PlusCircle,
  Plug,
  FolderKanban,
  Settings,
  Bell,
  Crown,
} from "lucide-react";
import { toast } from "sonner";
import { SidebarUserCard, TopbarUserMenu } from "@/components/sidebar-user-card";
import { api } from "@/lib/api/client";

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [workspacesCount, setWorkspacesCount] = useState<number | null>(null);
  const [projectsCount, setProjectsCount] = useState<number | null>(null);
  const [unreadCount, setUnreadCount] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);

    const fetchCounts = async () => {
      try {
        const [ws, prjs, notifs] = await Promise.all([
          api.get<any[]>("/api/workspaces").catch(() => []),
          api.get<any[]>("/api/projects?all=true").catch(() => []),
          api.get<any[]>("/api/notifications").catch(() => []),
        ]);
        setWorkspacesCount(ws.length);
        setProjectsCount(prjs.length);
        setUnreadCount(notifs.filter(n => !n.is_read).length);
      } catch (err) {
        // Fail silently
      }
    };

    fetchCounts();
  }, []);

  useEffect(() => {
    if (pathname?.endsWith("/notifications")) {
      const fetchNotifications = async () => {
        try {
          const notifs = await api.get<any[]>("/api/notifications");
          setUnreadCount(notifs.filter(n => !n.is_read).length);
        } catch {
          // Fail silently
        }
      };
      fetchNotifications();
    }
  }, [pathname]);

  const navItems = [
    { label: "Dashboard", href: "/dashboard/owner", icon: <LayoutDashboard size={16} /> },
    { category: "WORKSPACES" },
    { label: "All Workspaces", href: "/dashboard/owner/workspaces", icon: <Building2 size={16} />, badge: workspacesCount !== null ? String(workspacesCount) : undefined },
    { label: "Create Workspace", href: "/dashboard/owner/workspaces/new", icon: <PlusCircle size={16} /> },
    { category: "PROJECTS" },
    { label: "Cross-Workspace View", href: "/dashboard/owner/projects", icon: <FolderKanban size={16} />, badge: projectsCount !== null ? String(projectsCount) : undefined },
  ];

  return (
    <div className="flex min-h-screen bg-zinc-50/50">
      {/* Left Sidebar (bg-sidebar-bg) */}
      <aside className="w-64 h-screen sticky top-0 bg-sidebar-bg flex flex-col justify-between p-6 shrink-0 select-none text-zinc-650 border-r border-sidebar-border">
        <div className="space-y-8">
          {/* Logo / Workspace name */}
          <div className="flex items-center gap-2.5 px-1 select-none text-left">
            <img src="/ThinkNEXT-LOGO-NEW.svg" alt="ThinkNEXT Logo" className="h-10 w-auto" />
            <div className="flex flex-col">
              <span className="font-extrabold text-sm tracking-tight text-sidebar-active-text block leading-none">
                Platform Console
              </span>
              <span className="text-[8px] font-bold text-zinc-450 block mt-0.5 uppercase tracking-wider leading-none">
                Owner Active
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

              const isActive = pathname === item.href || (item.href !== "/dashboard/owner" && pathname?.startsWith(item.href!));
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
              href="/dashboard/owner/settings"
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                pathname === "/dashboard/owner/settings"
                  ? "bg-sidebar-active-bg text-sidebar-active-text font-bold"
                  : "text-zinc-655 hover:text-zinc-955 hover:bg-[#ebeeeb]/40"
              }`}
            >
              <Settings size={16} />
              Settings
            </Link>
          </nav>

          {/* User Profile Card */}
          <SidebarUserCard />
        </div>
      </aside>

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar Navigation */}
        <header className="h-16 border-b border-sidebar-border bg-white px-8 flex items-center justify-between shrink-0 select-none z-45">
          <div className="flex items-center gap-2 text-xs font-bold text-zinc-450 uppercase tracking-wider">
            <Crown size={14} className="text-brand-green" />
            <span>PLATFORM CONSOLE</span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/owner/notifications"
              className="p-2 text-zinc-450 hover:text-zinc-655 transition-colors relative"
            >
              <Bell size={18} />
              {unreadCount !== null && unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[8px] font-extrabold text-white ring-2 ring-white">
                  {unreadCount}
                </span>
              )}
            </Link>
            <TopbarUserMenu fallbackInitials="JD" />
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
