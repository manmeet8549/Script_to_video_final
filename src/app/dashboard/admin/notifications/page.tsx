"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AtSign,
  Bell,
  CalendarDays,
  Check,
  CheckCircle,
  Loader2,
  PenTool,
  Share2,
  ShieldAlert,
  Trash2,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api/client";
import type { Notification } from "@/types/db";

function relTime(iso: string): string {
  const delta = Date.now() - new Date(iso).getTime();
  const s = Math.floor(delta / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

function notifIcon(type: Notification["type"]) {
  switch (type) {
    case "deadline":
    case "deadline_reminder":
      return { icon: CalendarDays, bg: "bg-amber-50 border-amber-100", color: "text-amber-600" };
    case "edit_request":
    case "edit_complete":
    case "edit_rejected":
      return { icon: PenTool, bg: "bg-blue-50 border-blue-100", color: "text-blue-600" };
    case "publish_complete":
    case "publish_failed":
      return { icon: Share2, bg: "bg-violet-50 border-violet-100", color: "text-violet-600" };
    case "stage_complete":
      return { icon: CheckCircle, bg: "bg-emerald-50 border-emerald-100", color: "text-emerald-600" };
    case "invite":
      return { icon: UserPlus, bg: "bg-emerald-50 border-emerald-100", color: "text-emerald-600" };
    case "mention":
      return { icon: AtSign, bg: "bg-zinc-50 border-zinc-200", color: "text-zinc-500" };
    default:
      return { icon: ShieldAlert, bg: "bg-red-50 border-red-100", color: "text-red-600" };
  }
}

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<Notification[]>("/api/notifications");
      setNotifications(data);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void (async () => { await load(); })();
  }, [load]);

  const markAllRead = async () => {
    try {
      await api.post("/api/notifications", { action: "read-all" });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      toast.success("All notifications marked as read.");
    } catch {
      toast.error("Failed to mark all as read.");
    }
  };

  const markOneRead = async (id: string) => {
    try {
      await api.patch(`/api/notifications/${id}`, {});
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch {
      // silent
    }
  };

  const deleteOne = async (id: string) => {
    try {
      await api.del(`/api/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      toast.success("Notification deleted.");
    } catch {
      toast.error("Failed to delete notification.");
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <main className="flex-1 overflow-y-auto px-8 py-8 bg-zinc-50/50">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
          <div className="text-left leading-normal">
            <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight flex items-center gap-3">
              Notifications
              {unreadCount > 0 && (
                <span className="text-xs font-bold bg-red-500 text-white px-2 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </h1>
            <p className="text-sm font-semibold text-zinc-400 mt-0.5">
              Workspace updates, deadline alerts, and activity logs.
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="h-9 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer border border-emerald-100"
            >
              <Check size={14} />
              Mark all read
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="animate-spin text-brand-green" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white border border-zinc-200 rounded-2xl p-16 text-center shadow-xs">
            <Bell size={32} className="text-zinc-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-zinc-800">You&apos;re all caught up!</h3>
            <p className="text-xs font-semibold text-zinc-400 mt-1">
              No workspace notifications at this time.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => {
              const { icon: Icon, bg, color } = notifIcon(n.type);
              return (
                <div
                  key={n.id}
                  onClick={() => { if (!n.is_read) markOneRead(n.id); }}
                  className={`bg-white border rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-all flex items-start justify-between gap-6 text-left cursor-pointer ${
                    n.is_read
                      ? "border-zinc-200 opacity-75"
                      : "border-emerald-200 ring-1 ring-emerald-500/5"
                  }`}
                >
                  <div className="flex gap-4">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${bg}`}>
                      <Icon size={16} className={color} />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <h4 className="text-sm font-extrabold text-zinc-900">{n.title}</h4>
                        {!n.is_read && (
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                        )}
                      </div>
                      {n.message && (
                        <p className="text-xs text-zinc-650 font-semibold leading-relaxed">{n.message}</p>
                      )}
                      <span className="text-[10px] text-zinc-400 font-bold block pt-0.5">
                        {relTime(n.created_at)}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => { e.stopPropagation(); deleteOne(n.id); }}
                    className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50 rounded-lg transition-colors cursor-pointer shrink-0"
                    title="Delete notification"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
