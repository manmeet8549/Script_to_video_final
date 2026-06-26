"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Play, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { registerWithWorkspace } from "@/app/auth/actions";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Password strength calculation
  const [strengthScore, setStrengthScore] = useState(0); // 0 to 3
  const [strengthLabel, setStrengthLabel] = useState("Weak password");

  useEffect(() => {
    if (!password) {
      setStrengthScore(0);
      setStrengthLabel("Weak password");
      return;
    }

    let score = 1; // Basic length > 0 is weak
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password) && /[0-9]/.test(password)) score += 1;

    setStrengthScore(score);

    if (score === 1) setStrengthLabel("Weak password");
    else if (score === 2) setStrengthLabel("Medium password");
    else if (score === 3) setStrengthLabel("Strong password");
  }, [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password || !confirmPassword || !workspaceName) {
      toast.error("Please fill in all fields");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (!agreeTerms) {
      toast.error("You must agree to the Terms of Service and Privacy Policy");
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.set("full_name", fullName);
    formData.set("email", email);
    formData.set("password", password);
    formData.set("workspace_name", workspaceName);

    const result = await registerWithWorkspace(formData);
    if (!result.ok) {
      setIsLoading(false);
      toast.error(result.error);
      return;
    }

    if (result.needsConfirmation) {
      setIsLoading(false);
      toast.success("Account created! Check your email to confirm, then sign in.");
      router.push("/auth/login");
      return;
    }

    toast.success("Account created successfully!");
    router.replace("/dashboard");
    router.refresh();
  };

  const handleGoogleSignup = async () => {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) toast.error(error.message);
  };

  return (
    <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 min-h-screen">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex flex-col justify-between bg-brand-green p-12 text-white relative overflow-hidden select-none">
        {/* Background Decorative Circles */}
        <div className="absolute -left-16 -top-16 w-[400px] h-[400px] rounded-full border border-white/10 pointer-events-none" />
        <div className="absolute -right-24 -bottom-24 w-[600px] h-[600px] rounded-full border border-white/5 pointer-events-none" />

        {/* Top: Logo */}
        <div className="flex items-center gap-2 relative z-10 select-none">
          <img src="/ThinkNEXT-LOGO-NEW.svg" alt="ThinkNEXT Logo" className="h-16 w-auto" />
        </div>

        {/* Center: Content Checklist */}
        <div className="my-auto max-w-md space-y-8 relative z-10">
          <h2 className="text-4xl font-extrabold leading-tight tracking-tight">
            Start your video journey today.
          </h2>
          <ul className="space-y-4">
            {[
              "Free 14-day trial",
              "No credit card required",
              "Cancel anytime",
            ].map((item, idx) => (
              <li key={idx} className="flex items-center gap-3 text-sm font-bold">
                <div className="w-6 h-6 rounded-full border-2 border-white/30 flex items-center justify-center text-white shrink-0">
                  <Check size={12} strokeWidth={3} />
                </div>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom: Copyright */}
        <div className="text-xs font-semibold opacity-50 relative z-10">
          &copy; 2024 ThinkNEXT Video AI.
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex items-center justify-center bg-white py-12 px-6 sm:px-12 lg:px-20 relative">
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <div className="text-left space-y-2">
            <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900">
              Create your account
            </h2>
            <p className="text-zinc-500 text-sm font-medium">
              Start creating videos in minutes
            </p>
          </div>

          {/* Form */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Full Name */}
            <div className="space-y-1.5">
              <label htmlFor="fullName" className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wide">
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                required
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 h-11 border border-zinc-200 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 rounded-xl text-sm font-semibold text-zinc-900 placeholder-zinc-400 outline-none transition-all"
              />
            </div>

            {/* Email Address */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wide">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                placeholder="john@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 h-11 border border-zinc-200 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 rounded-xl text-sm font-semibold text-zinc-900 placeholder-zinc-400 outline-none transition-all"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wide">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 h-11 border border-zinc-200 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 rounded-xl text-sm font-semibold text-zinc-900 placeholder-zinc-400 outline-none transition-all"
              />

              {/* Password Strength Indicator */}
              {password && (
                <div className="pt-1.5 space-y-1.5">
                  <div className="flex gap-1.5 h-1.5 w-full">
                    <div
                      className={`h-full rounded-full flex-1 transition-colors duration-300 ${
                        strengthScore >= 1
                          ? strengthScore === 1
                            ? "bg-red-500"
                            : strengthScore === 2
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                          : "bg-zinc-150"
                      }`}
                    />
                    <div
                      className={`h-full rounded-full flex-1 transition-colors duration-300 ${
                        strengthScore >= 2
                          ? strengthScore === 2
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                          : "bg-zinc-150"
                      }`}
                    />
                    <div
                      className={`h-full rounded-full flex-1 transition-colors duration-300 ${
                        strengthScore >= 3 ? "bg-emerald-500" : "bg-zinc-150"
                      }`}
                    />
                  </div>
                  <div
                    className={`text-[10px] font-bold ${
                      strengthScore === 1
                        ? "text-red-500"
                        : strengthScore === 2
                        ? "text-amber-500"
                        : "text-emerald-500"
                    }`}
                  >
                    {strengthLabel}
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label htmlFor="confirmPassword" className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wide">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 h-11 border border-zinc-200 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 rounded-xl text-sm font-semibold text-zinc-900 placeholder-zinc-400 outline-none transition-all"
              />
            </div>

            {/* Workspace Name */}
            <div className="space-y-1.5">
              <label htmlFor="workspaceName" className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wide">
                Workspace Name
              </label>
              <input
                id="workspaceName"
                type="text"
                required
                placeholder="Acme Corporation"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                className="w-full px-4 h-11 border border-zinc-200 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 rounded-xl text-sm font-semibold text-zinc-900 placeholder-zinc-400 outline-none transition-all"
              />
            </div>

            {/* Terms and conditions Checkbox */}
            <div className="flex items-start pt-1">
              <label className="flex items-start gap-2.5 text-zinc-500 text-xs font-semibold cursor-pointer select-none leading-tight">
                <input
                  type="checkbox"
                  required
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="w-4.5 h-4.5 accent-brand-green border-zinc-200 rounded-md cursor-pointer shrink-0 mt-0.5"
                />
                <span>
                  I agree to the{" "}
                  <Link href="/terms" className="text-brand-green hover:underline font-bold">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-brand-green hover:underline font-bold">
                    Privacy Policy
                  </Link>
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-brand-green hover:bg-brand-green-hover disabled:bg-brand-green/60 text-white rounded-xl text-sm font-bold shadow-md shadow-emerald-950/10 hover:shadow-lg active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer pt-0.5"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create Account"
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

          {/* Google Signup */}
          <button
            onClick={handleGoogleSignup}
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

          {/* Login Link */}
          <div className="text-center text-sm font-semibold text-zinc-500 pt-4">
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="text-brand-green hover:text-brand-green-hover hover:underline font-bold"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
