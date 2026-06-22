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
  type: "system" | "project" | "team";
};

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: "1",
      title: "Project Published",
      body: 'Project "CEO End of Year Address" successfully published to YouTube channel.',
      time: "15 minutes ago",
      read: false,
      type: "project",
    },
    {
      id: "2",
      title: "Script Approved",
      body: 'Mike K. approved the script for "Product Teaser".',
      time: "2 hours ago",
      read: false,
      type: "project",
    },
    {
      id: "3",
      title: "New Team Member Joined",
      body: "Emma Davis (Editor) accepted the invite and joined the workspace.",
      time: "1 day ago",
      read: false,
      type: "team",
    },
    {
      id: "4",
      title: "Overdue Alert",
      body: 'Project "Social Media Ad" has passed its due date without being published.',
      time: "2 days ago",
      read: false,
      type: "system",
    },
    {
      id: "5",
      title: "Workspace Storage High",
      body: "Acme Corp workspace has consumed 82% of its storage capacity quota.",
      time: "3 days ago",
      read: false,
      type: "system",
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
              Review workspace updates, publication logs, and resource usage thresholds.
            </p>
          </div>
          {notifications.some((n) => !n.read) && (
            <button
              onClick={markAllAsRead}
              className="h-9 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer border border-emerald-100"
            >
              <Check size={14} />
              Mark all read
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="bg-white border border-zinc-200 rounded-2xl p-16 text-center shadow-xs">
            <span className="text-3xl block mb-2">🔔</span>
            <h3 className="text-sm font-bold text-zinc-800">You're all caught up!</h3>
            <p className="text-xs font-semibold text-zinc-400 mt-1">
              No workspace notifications at this time.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`bg-white border rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-all flex items-start justify-between gap-6 text-left ${
                  n.read ? "border-zinc-200 opacity-75" : "border-emerald-200 ring-1 ring-emerald-500/5"
                }`}
              >
                <div className="flex gap-4">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                    n.type === "system"
                      ? "bg-red-50 text-red-655 border-red-100"
                      : "bg-emerald-50 text-emerald-650 border-emerald-100"
                  }`}>
                    {n.type === "system" ? <ShieldAlert size={16} /> : <Bell size={16} />}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <h4 className="text-sm font-extrabold text-zinc-900">{n.title}</h4>
                      {!n.read && (
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                      )}
                    </div>
                    <p className="text-xs text-zinc-650 font-semibold leading-relaxed">{n.body}</p>
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
