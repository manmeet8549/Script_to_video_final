"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, User, Play, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { signIn } from "@/app/auth/actions";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.set("email", email);
    formData.set("password", password);

    const result = await signIn(formData);
    if (!result.ok) {
      setIsLoading(false);
      toast.error(result.error);
      return;
    }

    toast.success("Successfully signed in!");
    const redirectedFrom = new URLSearchParams(window.location.search).get("redirectedFrom");
    router.replace(
      redirectedFrom && redirectedFrom.startsWith("/dashboard") ? redirectedFrom : "/dashboard",
    );
    router.refresh();
  };

  const handleGoogleLogin = () => {
    toast.info("Google sign-in isn't configured yet. Use email and password.");
  };

  return (
    <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 min-h-screen">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex flex-col justify-between bg-brand-green p-12 text-white relative overflow-hidden select-none">
        {/* Background Decorative Circles */}
        <div className="absolute -left-16 -top-16 w-[400px] h-[400px] rounded-full border border-white/10 pointer-events-none" />
        <div className="absolute -right-24 -bottom-24 w-[600px] h-[600px] rounded-full border border-white/5 pointer-events-none" />
        <div className="absolute left-[15%] top-[30%] w-[300px] h-[300px] rounded-full border border-white/5 pointer-events-none" />

        {/* Top: Logo */}
        <div className="flex items-center gap-2 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-white text-brand-green flex items-center justify-center shadow-md shadow-black/10">
            <Play size={20} fill="currentColor" className="translate-x-[0.5px]" />
          </div>
          <span className="font-extrabold text-xl tracking-tight">UChat Video</span>
        </div>

        {/* Center: Headline */}
        <div className="my-auto max-w-md space-y-4 relative z-10">
          <h2 className="text-4xl font-extrabold leading-tight tracking-tight">
            Create videos at scale with AI-powered tools.
          </h2>
        </div>

        {/* Bottom: Testimonial & Copyright */}
        <div className="space-y-8 relative z-10">
          <div className="bg-white/10 backdrop-blur-md border border-white/15 p-6 rounded-2xl max-w-md shadow-lg">
            <p className="text-sm font-semibold opacity-95 leading-relaxed">
              &ldquo;UChat Video transformed our content pipeline. We went from producing two videos a week to ten, without compromising on quality or brand voice.&rdquo;
            </p>
            <div className="flex items-center gap-3 mt-4">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <User size={16} className="text-white" />
              </div>
              <div>
                <div className="text-xs font-extrabold">Sarah Jenkins</div>
                <div className="text-[10px] font-bold opacity-60">Content Lead</div>
              </div>
            </div>
          </div>
          <div className="text-xs font-semibold opacity-50">
            &copy; 2024 UChat Video AI.
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex items-center justify-center bg-white py-12 px-6 sm:px-12 lg:px-20 relative">
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <div className="text-left space-y-2">
            <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900">
              Welcome back
            </h2>
            <p className="text-zinc-500 text-sm font-medium">
              Sign in to your account to continue
            </p>
          </div>

          {/* Form */}
          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Email Address */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-xs font-bold text-zinc-400 uppercase tracking-wide">
                Email address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-zinc-400 pointer-events-none">
                  <Mail size={18} />
                </span>
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 h-11 border border-zinc-200 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 rounded-xl text-sm font-semibold text-zinc-900 placeholder-zinc-400 outline-none transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-xs font-bold text-zinc-400 uppercase tracking-wide">
                  Password
                </label>
                <Link
                  href="/auth/forgot-password"
                  className="text-xs font-bold text-brand-green hover:text-brand-green-hover transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-zinc-400 pointer-events-none">
                  <Lock size={18} />
                </span>
                <input
                  id="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 h-11 border border-zinc-200 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 rounded-xl text-sm font-semibold text-zinc-900 placeholder-zinc-400 outline-none transition-all"
                />
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center">
              <label className="flex items-center gap-2.5 text-zinc-500 text-sm font-semibold cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4.5 h-4.5 accent-brand-green border-zinc-200 rounded-md cursor-pointer"
                />
                Remember me
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-[#3f6445] hover:bg-[#345339] disabled:bg-[#3f6445]/60 text-white rounded-xl text-sm font-bold shadow-md shadow-emerald-950/10 hover:shadow-lg active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-150" />
            </div>
            <span className="relative px-4 bg-white text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              Or continue with
            </span>
          </div>

          {/* Google Login */}
          <button
            onClick={handleGoogleLogin}
            type="button"
            className="w-full h-11 border border-zinc-200 hover:bg-zinc-50 rounded-xl text-sm font-bold text-zinc-700 flex items-center justify-center gap-3 transition-colors cursor-pointer active:scale-[0.99]"
          >
            {/* Google Logo SVG */}
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.2-5.142 4.2-3.308 0-6-2.692-6-6s2.692-6 6-6c1.5 0 2.858.552 3.9 1.47l3.054-3.055C18.666 2.822 15.65 1.5 12.24 1.5 6.31 1.5 1.5 6.31 1.5 12.24s4.81 10.74 10.74 10.74c6.14 0 10.74-4.32 10.74-10.74 0-.693-.075-1.365-.21-1.95H12.24z"
              />
            </svg>
            Google
          </button>

          {/* Register Link */}
          <div className="text-center text-sm font-semibold text-zinc-500 pt-4">
            Don't have an account?{" "}
            <Link
              href="/auth/register"
              className="text-brand-green hover:text-brand-green-hover hover:underline font-bold"
            >
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
