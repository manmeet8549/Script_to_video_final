"use client";

import { useState, useEffect } from "react";
import { Bell, Check, Trash2, ShieldAlert, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api/client";

type NotificationItem = {
  id: string;
  title: string;
  message: string | null;
  created_at: string;
  is_read: boolean;
  type: string;
};

export default function OwnerNotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const data = await api.get<NotificationItem[]>("/api/notifications");
      setNotifications(data);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const markAllAsRead = async () => {
    try {
      await api.post("/api/notifications", { action: "read-all" });
      setNotifications(notifications.map((n) => ({ ...n, is_read: true })));
      toast.success("All notifications marked as read!");
    } catch (err) {
      toast.error("Failed to mark all as read.");
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await api.del(`/api/notifications/${id}`);
      setNotifications(notifications.filter((n) => n.id !== id));
      toast.success("Notification deleted.");
    } catch (err) {
      toast.error("Failed to delete notification.");
    }
  };

  const markAsRead = async (id: string, currentlyRead: boolean) => {
    if (currentlyRead) return;
    try {
      await api.patch(`/api/notifications/${id}`);
      setNotifications(notifications.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    } catch (err) {
      // Fail silently
    }
  };

  return (
    <main className="flex-1 overflow-y-auto px-8 py-8 bg-zinc-50/50">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
          <div className="text-left leading-normal">
            <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight">Notifications Hub</h1>
            <p className="text-sm font-semibold text-zinc-400 mt-0.5">
              Review critical system alerts, license billing updates, and API key warnings.
            </p>
          </div>
          {notifications.some((n) => !n.is_read) && (
            <button
              onClick={markAllAsRead}
              className="h-9 px-4 bg-brand-green-light hover:bg-brand-green-light/80 text-brand-green text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer border border-brand-green/20"
            >
              <Check size={14} />
              Mark all read
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-brand-green" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white border border-zinc-200 rounded-2xl p-16 text-center shadow-xs">
            <span className="text-3xl block mb-2">🔔</span>
            <h3 className="text-sm font-bold text-zinc-800">No warnings or alerts</h3>
            <p className="text-xs font-semibold text-zinc-400 mt-1">
              All platform subsystems are operating within normal limits.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => markAsRead(n.id, n.is_read)}
                className={`bg-white border rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-all flex items-start justify-between gap-6 text-left cursor-pointer ${
                  n.is_read ? "border-zinc-200 opacity-75" : "border-brand-green/30 ring-1 ring-brand-green/5"
                }`}
              >
                <div className="flex gap-4">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                    n.type === "critical" || n.type === "system"
                      ? "bg-red-50 text-red-600 border-red-100"
                      : "bg-brand-green-light text-brand-green border-brand-green/10"
                  }`}>
                    {n.type === "critical" || n.type === "system" ? <ShieldAlert size={16} /> : <Bell size={16} />}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <h4 className="text-sm font-extrabold text-zinc-900">{n.title}</h4>
                      {!n.is_read && (
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                      )}
                    </div>
                    <p className="text-xs text-zinc-655 font-semibold leading-relaxed">{n.message}</p>
                    <span className="text-[10px] text-zinc-400 font-bold block pt-0.5">
                      {new Date(n.created_at).toLocaleDateString()} {new Date(n.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNotification(n.id);
                  }}
                  className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50 rounded-lg transition-colors cursor-pointer"
                  title="Delete notification"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
