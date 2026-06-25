"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  User,
  PenTool,
  CalendarDays,
  Settings,
  Bell,
  Shield,
  CheckSquare,
  Coins,
} from "lucide-react";
import { toast } from "sonner";
import { SidebarUserCard, TopbarUserMenu } from "@/components/sidebar-user-card";
import { api } from "@/lib/api/client";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [workspaceName, setWorkspaceName] = useState<string | null>(null);
  const [projectsCount, setProjectsCount] = useState<number | null>(null);
  const [membersCount, setMembersCount] = useState<number | null>(null);
  const [usersCount, setUsersCount] = useState<number | null>(null);
  const [editorsCount, setEditorsCount] = useState<number | null>(null);
  const [unreadCount, setUnreadCount] = useState<number | null>(null);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        type Member = { role: string };
        type Project = { id: string };
        type Workspace = { name: string };
        type Notification = { is_read: boolean };
        const [members, projects, workspaces, notifs] = await Promise.all([
          api.get<Member[]>("/api/members").catch(() => [] as Member[]),
          api.get<Project[]>("/api/projects").catch(() => [] as Project[]),
          api.get<Workspace[]>("/api/workspaces").catch(() => [] as Workspace[]),
          api.get<Notification[]>("/api/notifications").catch(() => [] as Notification[]),
        ]);
        setMembersCount(members.length);
        setUsersCount(members.filter((m) => m.role === "user").length);
        setEditorsCount(members.filter((m) => m.role === "editor").length);
        setProjectsCount(projects.length);
        setUnreadCount(notifs.filter((n) => !n.is_read).length);
        if (workspaces.length > 0) setWorkspaceName(workspaces[0].name);
      } catch {
        // Fail silently — counts just won't render
      }
    };

    fetchCounts();
  }, []);

  useEffect(() => {
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
  }, [pathname]);

  const navItems = [
    { label: "Dashboard", href: "/dashboard/admin", icon: <LayoutDashboard size={16} /> },
    { category: "PROJECTS" },
    { label: "All Projects", href: "/dashboard/admin/projects", icon: <FolderKanban size={16} />, badge: projectsCount !== null ? String(projectsCount) : undefined },
    { category: "TEAM" },
    { label: "All Members", href: "/dashboard/admin/team", icon: <Users size={16} />, badge: membersCount !== null ? String(membersCount) : undefined },
    { label: "Users", href: "/dashboard/admin/team/users", icon: <User size={16} />, badge: usersCount !== null ? String(usersCount) : undefined },
    { label: "Editors", href: "/dashboard/admin/team/editors", icon: <PenTool size={16} />, badge: editorsCount !== null ? String(editorsCount) : undefined },
    { category: "PUBLISHING" },
    { label: "Approval Queue", href: "/dashboard/admin/approvals", icon: <CheckSquare size={16} /> },
    { category: "BILLING" },
    { label: "Credits", href: "/dashboard/admin/credits", icon: <Coins size={16} /> },
    { category: "CALENDAR" },
    { label: "Schedule & Deadlines", href: "/dashboard/admin/calendar", icon: <CalendarDays size={16} /> },
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
                Admin Console
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

              const isActive = pathname === item.href || (item.href !== "/dashboard/admin" && pathname?.startsWith(item.href!));
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

        {/* Workspace settings, notifications & profile */}
        <div className="space-y-4 pt-4 border-t border-sidebar-border">
          <nav className="space-y-1">
            <Link
              href="/dashboard/admin/workspace-settings"
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                pathname === "/dashboard/admin/workspace-settings"
                  ? "bg-sidebar-active-bg text-sidebar-active-text font-bold"
                  : "text-zinc-655 hover:text-zinc-950 hover:bg-[#ebeeeb]/40"
              }`}
            >
              <Settings size={16} />
              Workspace Settings
            </Link>
          </nav>

          {/* User Profile Card */}
          <SidebarUserCard />
        </div>
      </aside>

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar Navigation */}
        <header className="h-16 border-b border-sidebar-border bg-white px-8 flex items-center justify-between shrink-0 select-none z-40">
          <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 uppercase tracking-wider">
            <Shield size={14} className="text-brand-green" />
            <span>ADMIN{workspaceName ? `: ${workspaceName}` : ""}</span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/admin/notifications"
              className="p-2 text-zinc-400 hover:text-zinc-600 transition-colors relative"
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
