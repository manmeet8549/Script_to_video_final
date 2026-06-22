"use client";

import { useState } from "react";
import { Bell, Check, Trash2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

type NotificationItem = {
  id: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
  type: "system" | "task" | "project";
};

export default function EditorNotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: "1",
      title: "New Editing Request",
      body: 'Corporate Promo Video Q3 is pending for your acceptance.',
      time: "10 minutes ago",
      read: false,
      type: "task",
    },
    {
      id: "2",
      title: "Task Feedback Received",
      body: 'Client left feedback on "Mobile App Tour Walkthrough" draft.',
      time: "1 hour ago",
      read: false,
      type: "project",
    },
  ]);

  const markAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
    toast.success("All notifications marked as read!");
  };

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter((n) => n.id !== id));
    toast.success("Notification deleted.");
  };

  return (
    <main className="flex-1 overflow-y-auto px-8 py-8 bg-zinc-50/50">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
          <div className="text-left leading-normal">
            <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight">Notifications</h1>
            <p className="text-sm font-semibold text-zinc-400 mt-0.5">
              Review new task assignments, project feedback, and editing pipeline alerts.
            </p>
          </div>
          {notifications.some((n) => !n.read) && (
            <button
              onClick={markAllAsRead}
              className="h-9 px-4 bg-brand-green-light hover:bg-brand-green-light/80 text-brand-green text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer border border-brand-green/20"
            >
              <Check size={14} />
              Mark all read
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="bg-white border border-zinc-200 rounded-2xl p-16 text-center shadow-xs">
            <span className="text-3xl block mb-2">🔔</span>
            <h3 className="text-sm font-bold text-zinc-800">No active notifications</h3>
            <p className="text-xs font-semibold text-zinc-400 mt-1">
              You are all caught up with your editing notifications.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`bg-white border rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-all flex items-start justify-between gap-6 text-left ${
                  n.read ? "border-zinc-200 opacity-75" : "border-brand-green/30 ring-1 ring-brand-green/5"
                }`}
              >
                <div className="flex gap-4">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                    n.type === "system"
                      ? "bg-red-50 text-red-655 border-red-100"
                      : "bg-brand-green-light text-brand-green border-brand-green/10"
                  }`}>
                    {n.type === "system" ? <ShieldAlert size={16} /> : <Bell size={16} />}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <h4 className="text-sm font-extrabold text-zinc-900">{n.title}</h4>
                      {!n.read && (
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                      )}
                    </div>
                    <p className="text-xs text-zinc-655 font-semibold leading-relaxed">{n.body}</p>
                    <span className="text-[10px] text-zinc-400 font-bold block pt-0.5">{n.time}</span>
                  </div>
                </div>

                <button
                  onClick={() => deleteNotification(n.id)}
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
