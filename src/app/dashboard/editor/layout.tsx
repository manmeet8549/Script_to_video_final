"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  Inbox,
  Loader2,
  Eye,
  CheckCircle2,
  Bell,
  Settings,
  Pen,
} from "lucide-react";
import { toast } from "sonner";
import { SidebarUserCard, TopbarUserMenu } from "@/components/sidebar-user-card";
import BackButton from "@/components/back-button";
import { api } from "@/lib/api/client";

function EditorLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
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
  }, [isEditingWorkspace]);

  useEffect(() => {
    if (isEditingWorkspace) return;
    if (pathname?.endsWith("/notifications")) {
      const fetchNotifications = async () => {
        try {
          type Notification = { is_read: boolean };
          const notifs = await api.get<Notification[]>("/api/notifications");
          setUnreadCount(notifs.filter((n) => !n.is_read).length);
        } catch {
          // Fail silently
        }
      };
      fetchNotifications();
    }
  }, [pathname, isEditingWorkspace]);

  if (isEditingWorkspace) {
    return <div className="min-h-screen bg-zinc-955 flex flex-col">{children}</div>;
  }

  const navItems = [
    { label: "Dashboard", href: "/dashboard/editor", icon: <LayoutDashboard size={16} /> },
    { category: "TASKS" },
    { label: "My Assignments", href: "/dashboard/editor/assignments", icon: <Inbox size={16} /> },
    { label: "Pending Requests", href: "/dashboard/editor/assignments?status=pending", icon: <Inbox size={16} /> },
    { label: "In Progress", href: "/dashboard/editor/assignments?status=in_progress", icon: <Loader2 size={16} /> },
    { label: "Under Review", href: "/dashboard/editor/assignments?status=under_review", icon: <Eye size={16} /> },
    { label: "Completed", href: "/dashboard/editor/assignments?status=completed", icon: <CheckCircle2 size={16} /> },
  ];

  return (
    <div className="flex min-h-screen bg-zinc-50/50">
      {/* Left Sidebar (bg-sidebar-bg) */}
      <aside className="w-64 h-screen sticky top-0 bg-sidebar-bg flex flex-col justify-between p-6 shrink-0 select-none text-zinc-650 border-r border-sidebar-border">
        <div className="space-y-8">
          {/* Logo / Editor welcome */}
          <div className="flex items-center gap-2.5 px-1 select-none text-left">
            <img src="/ThinkNEXT-LOGO-NEW.svg" alt="ThinkNEXT Logo" className="h-10 w-auto" />
            <div className="flex flex-col">
              <span className="font-extrabold text-sm tracking-tight text-sidebar-active-text block leading-none">
                Editor Workflow
              </span>
              <span className="text-[8px] font-bold text-zinc-450 block mt-0.5 uppercase tracking-wider leading-none">
                {workspaceName ?? "Loading..."}
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

              const isActive = (() => {
                if (!item.href) return false;
                const [itemPath, itemQuery] = item.href.split("?");
                if (pathname !== itemPath) return false;

                if (itemQuery) {
                  const itemParams = new URLSearchParams(itemQuery);
                  for (const [key, value] of itemParams.entries()) {
                    if (searchParams.get(key) !== value) return false;
                  }
                  return true;
                } else {
                  return !searchParams.has("status");
                }
              })();

              return (
                <Link
                  key={idx}
                  href={item.href!}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? "bg-sidebar-active-bg text-sidebar-active-text font-bold"
                      : "text-zinc-600 hover:text-zinc-955 hover:bg-[#ebeeeb]/40"
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
                  : "text-zinc-650 hover:text-zinc-955 hover:bg-[#ebeeeb]/40"
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
          <div className="flex items-center gap-3">
            <BackButton />
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-450 uppercase tracking-wider">
              <Pen size={14} className="text-brand-green" />
              <span>{workspaceName ?? ""}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/editor/notifications"
              className="p-2 text-zinc-455 hover:text-zinc-650 transition-colors relative"
            >
              <Bell size={18} />
              {unreadCount !== null && unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[8px] font-extrabold text-white ring-2 ring-white">
                  {unreadCount}
                </span>
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

export default function EditorLayout({ children }: { children: React.ReactNode }) {
  // useSearchParams() (used in EditorLayoutInner) must be wrapped in a Suspense
  // boundary, otherwise Next.js fails to statically prerender pages under this
  // layout (e.g. /dashboard/editor/notifications) during `next build`.
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-50/50" />}>
      <EditorLayoutInner>{children}</EditorLayoutInner>
    </Suspense>
  );
}
