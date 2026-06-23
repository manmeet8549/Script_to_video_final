"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Inbox,
  Loader2,
  Eye,
  CheckCircle2,
  Bell,
  Settings,
  HelpCircle,
  Pen,
} from "lucide-react";
import { toast } from "sonner";
import { SidebarUserCard, TopbarUserMenu } from "@/components/sidebar-user-card";
import { api } from "@/lib/api/client";

export default function EditorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [workspaceName, setWorkspaceName] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState<number | null>(null);

  const isEditingWorkspace = pathname?.includes("/tasks/") && pathname?.includes("/edit");

  useEffect(() => {
    const fetchData = async () => {
      try {
        type Workspace = { name: string };
        type Notification = { is_read: boolean };
        const [workspaces, notifs] = await Promise.all([
          api.get<Workspace[]>("/api/workspaces").catch(() => [] as Workspace[]),
          api.get<Notification[]>("/api/notifications").catch(() => [] as Notification[]),
        ]);
        if (workspaces.length > 0) setWorkspaceName(workspaces[0].name);
        setUnreadCount(notifs.filter((n) => !n.is_read).length);
      } catch {
        // Fail silently
      }
    };

    if (!isEditingWorkspace) fetchData();
  }, [pathname, isEditingWorkspace]);

  if (isEditingWorkspace) {
    return <div className="min-h-screen bg-zinc-955 flex flex-col">{children}</div>;
  }

  const navItems = [
    { label: "Dashboard", href: "/dashboard/editor", icon: <LayoutDashboard size={16} /> },
    { category: "TASKS" },
    { label: "Pending Requests", href: "/dashboard/editor/tasks?status=pending", icon: <Inbox size={16} /> },
    { label: "In Progress", href: "/dashboard/editor/tasks?status=in_progress", icon: <Loader2 size={16} /> },
    { label: "Under Review", href: "/dashboard/editor/tasks?status=review", icon: <Eye size={16} /> },
    { label: "Completed", href: "/dashboard/editor/completed", icon: <CheckCircle2 size={16} /> },
  ];

  return (
    <div className="flex min-h-screen bg-zinc-50/50">
      {/* Left Sidebar (bg-sidebar-bg) */}
      <aside className="w-64 h-screen sticky top-0 bg-sidebar-bg flex flex-col justify-between p-6 shrink-0 select-none text-zinc-650 border-r border-sidebar-border">
        <div className="space-y-8">
          {/* Logo / Editor welcome */}
          <div className="flex flex-col px-1 select-none text-left">
            <span className="font-extrabold text-lg tracking-tight text-sidebar-active-text block leading-none">
              Editor Workflow
            </span>
            <span className="text-[10px] font-bold text-zinc-450 block mt-1 uppercase tracking-wider">
              {workspaceName ?? "Loading..."}
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

              const isActive = pathname === item.href || (item.href!.includes('?') && typeof window !== 'undefined' && pathname + window.location.search === item.href);

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
          <nav className="space-y-1">
            <Link
              href="/dashboard/editor/settings"
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                pathname === "/dashboard/editor/settings"
                  ? "bg-sidebar-active-bg text-sidebar-active-text font-bold"
                  : "text-zinc-650 hover:text-zinc-950 hover:bg-[#ebeeeb]/40"
              }`}
            >
              <Settings size={16} />
              Settings
            </Link>
            <Link
              href="/dashboard/editor/notifications"
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                pathname === "/dashboard/editor/notifications"
                  ? "bg-sidebar-active-bg text-sidebar-active-text font-bold"
                  : "text-zinc-650 hover:text-zinc-950 hover:bg-[#ebeeeb]/40"
              }`}
            >
              <span className="flex items-center gap-3">
                <Bell size={16} />
                Notifications
              </span>
              {unreadCount !== null && unreadCount > 0 && (
                <span className="text-[9px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </Link>
            <button
              onClick={() => toast.info("Opening Help & Support panel...")}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-zinc-655 hover:text-zinc-950 text-left cursor-pointer hover:bg-[#ebeeeb]/40"
            >
              <HelpCircle size={16} />
              Help & Support
            </button>
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
            <Pen size={14} className="text-brand-green" />
            <span>{workspaceName ?? ""}</span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/editor/notifications"
              className="p-2 text-zinc-455 hover:text-zinc-650 transition-colors relative"
            >
              <Bell size={18} />
              {unreadCount !== null && unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </Link>
            <TopbarUserMenu fallbackInitials="TW" />
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
