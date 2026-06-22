"use client";

import { useState } from "react";
import { User, Shield, Bell, Key } from "lucide-react";
import { toast } from "sonner";

export default function OwnerSettingsPage() {
  const [fullName, setFullName] = useState("John Doe");
  const [phoneNumber, setPhoneNumber] = useState("+1 (555) 987-6543");
  const [sessionTimeout, setSessionTimeout] = useState("30");

  const [currentPassword, setCurrentPassword] = useState("••••••••");
  const [newPassword, setNewPassword] = useState("••••••••");

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Password updated successfully!");
  };

  const handleSaveChanges = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Platform settings saved successfully!");
  };

  return (
    <main className="flex-1 overflow-y-auto px-8 py-8 bg-zinc-50/50">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
          <div className="text-left leading-normal">
            <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight">Console Settings</h1>
            <p className="text-sm font-semibold text-zinc-400 mt-0.5">
              Manage platform owner profile details and global console preferences.
            </p>
          </div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-6 text-left">
          {/* Profile Section */}
          <div className="flex items-center gap-6 border-b border-zinc-100 pb-6">
            <div className="w-20 h-20 rounded-full bg-brand-green flex items-center justify-center font-bold text-xl text-white shrink-0">
              JD
            </div>
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-zinc-900">Profile Image</h4>
              <p className="text-[10px] font-semibold text-zinc-400">
                Primary admin avatar for global console activity.
              </p>
              <div className="flex items-center gap-2 select-none pt-1">
                <button
                  onClick={() => toast.info("Opening photo uploader...")}
                  className="h-8 px-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  Change
                </button>
              </div>
            </div>
          </div>

          {/* Settings Form */}
          <form onSubmit={handleSaveChanges} className="space-y-4 border-b border-zinc-100 pb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wide">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 h-11 border border-zinc-200 focus:border-indigo-650 focus:ring-2 focus:ring-indigo-655/20 rounded-xl text-sm font-semibold text-zinc-900 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wide">
                  Console Email
                </label>
                <input
                  type="email"
                  disabled
                  value="owner@uchat.com"
                  className="w-full px-4 h-11 border border-zinc-200 bg-zinc-50 text-zinc-400 rounded-xl text-sm font-semibold outline-none cursor-not-allowed"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wide">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full px-4 h-11 border border-zinc-200 focus:border-indigo-650 focus:ring-2 focus:ring-indigo-655/20 rounded-xl text-sm font-semibold text-zinc-900 outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wide">
                  Session Timeout (Minutes)
                </label>
                <input
                  type="number"
                  value={sessionTimeout}
                  onChange={(e) => setSessionTimeout(e.target.value)}
                  className="w-full px-4 h-11 border border-zinc-200 focus:border-indigo-650 focus:ring-2 focus:ring-indigo-655/20 rounded-xl text-sm font-semibold text-zinc-900 outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="h-10 px-6 bg-brand-green hover:bg-brand-green-hover text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-700/10 active:scale-[0.98] cursor-pointer"
              >
                Save Preferences
              </button>
            </div>
          </form>

          {/* Credentials Form */}
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-zinc-900">Change Console Password</h4>
              <p className="text-[10px] font-semibold text-zinc-400 mt-0.5">
                Ensure the platform root account is heavily secured.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wide">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 h-11 border border-zinc-200 focus:border-indigo-650 focus:ring-2 focus:ring-indigo-655/20 rounded-xl text-sm font-semibold text-zinc-900 outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wide">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 h-11 border border-zinc-200 focus:border-indigo-650 focus:ring-2 focus:ring-indigo-655/20 rounded-xl text-sm font-semibold text-zinc-900 outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="h-10 px-6 bg-zinc-800 hover:bg-zinc-900 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-[0.98] cursor-pointer"
              >
                Update Password
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
