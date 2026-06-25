"use client";

import { useState } from "react";
import { User, Shield, Bell, Settings } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

export default function EditorSettingsPage() {
  const [fullName, setFullName] = useState("Tom W.");
  const [phoneNumber, setPhoneNumber] = useState("+1 (555) 765-4321");
  const [bio, setBio] = useState(
    "Senior Video Editor at Acme Corp. Editing high-quality clips, captions, and transitions."
  );

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isChangingPw, setIsChangingPw] = useState(false);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) {
      toast.error("Password cannot be empty.");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    setIsChangingPw(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("profiles").update({ password_plain: newPassword }).eq("id", user.id);
      }

      setCurrentPassword("");
      setNewPassword("");
      toast.success("Password updated successfully!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update password.");
    } finally {
      setIsChangingPw(false);
    }
  };

  const handleSaveChanges = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Profile details saved successfully!");
  };

  return (
    <main className="flex-1 overflow-y-auto px-8 py-8 bg-zinc-50/50">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
          <div className="text-left leading-normal">
            <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight">Editor Profile Settings</h1>
            <p className="text-sm font-semibold text-zinc-400 mt-0.5">
              Manage your personal editor workspace options and profile credentials.
            </p>
          </div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-6 text-left">
          {/* Profile Picture Card */}
          <div className="flex items-center gap-6 border-b border-zinc-100 pb-6">
            <div className="w-20 h-20 rounded-full bg-brand-green flex items-center justify-center font-bold text-xl text-white shrink-0 shadow-xs">
              TW
            </div>
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-zinc-900">Avatar Image</h4>
              <p className="text-[10px] font-semibold text-zinc-400">
                PNG, JPG up to 5MB. Recommended size 256×256px.
              </p>
              <div className="flex items-center gap-2 select-none pt-1">
                <button
                  onClick={() => toast.info("Opening file uploader...")}
                  className="h-8 px-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  Change
                </button>
              </div>
            </div>
          </div>

          {/* Profile Details Form */}
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
                  className="w-full px-4 h-11 border border-zinc-200 focus:border-violet-600 focus:ring-2 focus:ring-violet-650/20 rounded-xl text-sm font-semibold text-zinc-900 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wide">
                  Editor Email
                </label>
                <input
                  type="email"
                  disabled
                  value="tom.editor@acmecorp.com"
                  className="w-full px-4 h-11 border border-zinc-200 bg-zinc-50 text-zinc-400 rounded-xl text-sm font-semibold outline-none cursor-not-allowed"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wide">
                Phone Number
              </label>
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full px-4 h-11 border border-zinc-200 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 rounded-xl text-sm font-semibold text-zinc-900 outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wide">
                Bio / Status Notes
              </label>
              <textarea
                rows={4}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full p-4 border border-zinc-200 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 rounded-xl text-sm font-semibold text-zinc-900 outline-none resize-none"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="h-10 px-6 bg-brand-green hover:bg-brand-green-hover text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-700/10 active:scale-[0.98] cursor-pointer"
              >
                Save Details
              </button>
            </div>
          </form>

          {/* Change Password Form */}
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div className="space-y-1 text-left">
              <h4 className="text-xs font-bold text-zinc-900">Change Password</h4>
              <p className="text-[10px] font-semibold text-zinc-400 mt-0.5">
                Keep your editor portal credentials secure.
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
                  className="w-full px-4 h-11 border border-zinc-200 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 rounded-xl text-sm font-semibold text-zinc-900 outline-none"
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
                  className="w-full px-4 h-11 border border-zinc-200 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 rounded-xl text-sm font-semibold text-zinc-900 outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isChangingPw}
                className="h-10 px-6 bg-zinc-800 hover:bg-zinc-900 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-[0.98] cursor-pointer disabled:opacity-60"
              >
                {isChangingPw ? "Updating..." : "Update Password"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
