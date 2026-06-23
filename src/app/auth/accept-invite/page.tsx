"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Play,
  Lock,
  Eye,
  EyeOff,
  Check,
  X,
  Loader2,
  Users,
  Plug,
  LayoutDashboard,
  ArrowRight,
  User as UserIcon,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { api, ApiError } from "@/lib/api/client";

type Stage = "loading" | "landing" | "password" | "profile" | "welcome" | "expired";

const RULES = [
  { key: "len", label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { key: "upper", label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { key: "num", label: "One number", test: (p: string) => /[0-9]/.test(p) },
  { key: "special", label: "One special character", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
] as const;

function strength(p: string): number {
  return RULES.filter((r) => r.test(p)).length;
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={<CenteredSpinner />}>
      <AcceptInviteFlow />
    </Suspense>
  );
}

function CenteredSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FAFBFC] to-brand-green-light">
      <Loader2 className="animate-spin text-brand-green" size={28} />
    </div>
  );
}

function AcceptInviteFlow() {
  const router = useRouter();
  const params = useSearchParams();

  const workspaceName = params.get("workspace") ?? "this workspace";
  const inviterName = params.get("inviter") ?? "The workspace owner";
  const roleLabel = params.get("role") ?? "Administrator";
  const emailParam = params.get("email") ?? "";

  const [stage, setStage] = useState<Stage>("loading");
  // Whether the invitee already has a session (arrived via a Supabase setup
  // link) — in that case there's no temporary password step.
  const [hasSession, setHasSession] = useState(false);
  const [sessionEmail, setSessionEmail] = useState("");
  const [fullName, setFullName] = useState(params.get("name") ?? "");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setHasSession(true);
        setSessionEmail(data.user.email ?? "");
        if (!fullName && data.user.user_metadata?.full_name) {
          setFullName(String(data.user.user_metadata.full_name));
        }
      }
      setStage("landing");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const email = sessionEmail || emailParam;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#FAFBFC] to-brand-green-light px-4 py-12">
      {stage !== "welcome" && (
        <div className="flex flex-col items-center gap-1 mb-8 select-none">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-brand-green text-white flex items-center justify-center">
              <Play size={14} fill="currentColor" className="translate-x-[0.5px]" />
            </span>
            <span className="font-extrabold text-2xl tracking-tight text-zinc-900">UChat</span>
          </div>
          <span className="text-[11px] font-bold text-zinc-400 tracking-[0.2em] uppercase">Video Platform</span>
        </div>
      )}

      {stage === "loading" && <Loader2 className="animate-spin text-brand-green" size={28} />}

      {stage === "landing" && (
        <Landing
          workspaceName={workspaceName}
          inviterName={inviterName}
          roleLabel={roleLabel}
          onAccept={() => setStage("password")}
        />
      )}

      {stage === "password" && (
        <PasswordStep
          email={email}
          hasSession={hasSession}
          onDone={() => setStage("profile")}
        />
      )}

      {stage === "profile" && (
        <ProfileStep
          fullName={fullName}
          setFullName={setFullName}
          onComplete={() => setStage("welcome")}
          onSkip={() => setStage("welcome")}
        />
      )}

      {stage === "welcome" && (
        <Welcome name={fullName || "there"} workspaceName={workspaceName} roleLabel={roleLabel} onSkip={() => router.push("/dashboard")} />
      )}
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-zinc-200 shadow-[0_10px_40px_rgba(0,0,0,0.08)] p-10 max-w-md w-full text-left">
      {children}
    </div>
  );
}

function Landing({
  workspaceName,
  inviterName,
  roleLabel,
  onAccept,
}: {
  workspaceName: string;
  inviterName: string;
  roleLabel: string;
  onAccept: () => void;
}) {
  return (
    <Card>
      <span className="inline-block text-sm font-bold bg-brand-green-light text-brand-green rounded-lg px-3 py-1.5">
        {workspaceName}
      </span>
      <h1 className="text-3xl font-extrabold text-zinc-900 mt-4">You&apos;re Invited!</h1>
      <p className="text-sm font-medium text-zinc-500 mt-2 leading-relaxed">
        {inviterName} has invited you to be the {roleLabel} of this workspace on UChat Video.
      </p>

      <div className="bg-zinc-50 rounded-xl p-4 my-6 space-y-3">
        <Row label="Role">
          <span className="text-xs font-bold bg-brand-green text-white rounded-full px-2.5 py-0.5">{roleLabel}</span>
        </Row>
        <Row label="Workspace">
          <span className="text-sm font-bold text-zinc-700">{workspaceName}</span>
        </Row>
        <Row label="Invited by">
          <span className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-brand-green/10 text-brand-green flex items-center justify-center">
              <UserIcon size={14} />
            </span>
            <span className="text-sm font-bold text-zinc-700">{inviterName}</span>
          </span>
        </Row>
        <Row label="Expires">
          <span className="text-sm font-bold text-brand-green">7 days remaining</span>
        </Row>
      </div>

      <p className="text-[11px] font-semibold text-brand-green flex items-center gap-1 mb-5">
        <Lock size={11} />
        Your connection is secure.
      </p>

      <button
        onClick={onAccept}
        className="w-full h-12 bg-brand-green hover:bg-brand-green-hover text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors active:scale-[0.99]"
      >
        Accept Invitation
        <ArrowRight size={16} />
      </button>
      <button
        onClick={() => toast.info("Invitation declined. You can close this page.")}
        className="w-full h-10 text-red-500 hover:text-red-700 text-sm font-bold mt-2 transition-colors"
      >
        Decline
      </button>
    </Card>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs font-bold text-zinc-400 uppercase tracking-wide">{label}</span>
      {children}
    </div>
  );
}

function PasswordStep({
  email: emailProp,
  hasSession,
  onDone,
}: {
  email: string;
  hasSession: boolean;
  onDone: () => void;
}) {
  const [emailInput, setEmailInput] = useState(emailProp);
  const [tempPassword, setTempPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showTemp, setShowTemp] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const email = emailInput.trim();
  const score = strength(password);
  const allRulesMet = score === RULES.length;
  const matches = confirm.length > 0 && confirm === password;
  const emailOk = hasSession || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const tempOk = hasSession || tempPassword.length > 0;
  const canSubmit = emailOk && tempOk && allRulesMet && matches && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    const supabase = createClient();
    try {
      // Temp-password flow: establish a session by signing in with the
      // temporary password first. Link flow already has a session.
      if (!hasSession) {
        const { error } = await supabase.auth.signInWithPassword({ email, password: tempPassword });
        if (error) {
          toast.error("The temporary password is incorrect. Check your invitation email.");
          setSubmitting(false);
          return;
        }
      }

      const { error: upErr } = await supabase.auth.updateUser({ password });
      if (upErr) {
        toast.error(upErr.message);
        setSubmitting(false);
        return;
      }

      // Finalize: activate the pending membership(s) server-side.
      await api.post("/api/invitations/accept");
      toast.success("Your account is ready.");
      onDone();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  const barColor = (i: number) => {
    if (score <= i) return "bg-zinc-200";
    if (score <= 1) return "bg-red-500";
    if (score <= 3) return "bg-amber-500";
    return "bg-emerald-500";
  };

  return (
    <Card>
      <h1 className="text-2xl font-extrabold text-zinc-900">
        {hasSession ? "Create Your Password" : "Set Your Password"}
      </h1>
      <p className="text-sm font-medium text-zinc-500 mt-1.5 mb-6">
        {hasSession
          ? "Set a secure password for your UChat account."
          : "Enter the temporary password from your email, then create a secure one."}
      </p>

      {hasSession && email && (
        <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-150 rounded-xl px-4 h-11 mb-4">
          <Check size={15} className="text-brand-green" />
          <span className="text-sm font-semibold text-zinc-500">{email}</span>
        </div>
      )}

      <div className="space-y-4">
        {!hasSession && !emailProp && (
          <div className="space-y-1.5">
            <label className="text-[11px] font-extrabold text-zinc-400 uppercase tracking-wide block">
              Your Email Address
            </label>
            <input
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="admin@company.com"
              className="w-full px-4 h-11 border border-zinc-200 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 rounded-xl text-sm font-semibold text-zinc-900 outline-none transition-all"
            />
          </div>
        )}

        {!hasSession && (
          <PasswordInput
            label="Temporary Password"
            value={tempPassword}
            onChange={setTempPassword}
            show={showTemp}
            onToggle={() => setShowTemp((v) => !v)}
            placeholder="From your invitation email"
          />
        )}

        <PasswordInput
          label="New Password"
          value={password}
          onChange={setPassword}
          show={showNew}
          onToggle={() => setShowNew((v) => !v)}
          placeholder="Create a strong password"
        />

        {/* Strength bars */}
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <span key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${barColor(i + 1)}`} />
          ))}
        </div>

        <PasswordInput
          label="Confirm New Password"
          value={confirm}
          onChange={setConfirm}
          show={showNew}
          onToggle={() => setShowNew((v) => !v)}
          placeholder="Re-enter your password"
          status={confirm.length === 0 ? undefined : matches ? "ok" : "bad"}
        />
        {confirm.length > 0 && !matches && (
          <p className="text-xs font-semibold text-red-500">Passwords don&apos;t match.</p>
        )}

        {/* Requirements */}
        <ul className="space-y-1.5 pt-1">
          {RULES.map((r) => {
            const met = r.test(password);
            return (
              <li key={r.key} className="flex items-center gap-2 text-xs font-semibold">
                <span
                  className={`w-4 h-4 rounded-full flex items-center justify-center ${
                    met ? "bg-emerald-100 text-emerald-600" : "bg-zinc-100 text-zinc-300"
                  }`}
                >
                  <Check size={10} strokeWidth={3} />
                </span>
                <span className={met ? "text-zinc-600" : "text-zinc-400"}>{r.label}</span>
              </li>
            );
          })}
        </ul>

        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="w-full h-12 bg-brand-green hover:bg-brand-green-hover disabled:bg-brand-green/40 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
        >
          {submitting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Securing your account...
            </>
          ) : (
            <>
              Create Account &amp; Continue
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </div>
    </Card>
  );
}

function PasswordInput({
  label,
  value,
  onChange,
  show,
  onToggle,
  placeholder,
  status,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
  placeholder?: string;
  status?: "ok" | "bad";
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-extrabold text-zinc-400 uppercase tracking-wide block">{label}</label>
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-300">
          <Lock size={16} />
        </span>
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full pl-10 pr-16 h-11 border rounded-xl text-sm font-semibold text-zinc-900 outline-none transition-all focus:ring-2 ${
            status === "bad"
              ? "border-red-300 focus:border-red-400 focus:ring-red-100"
              : "border-zinc-200 focus:border-brand-green focus:ring-brand-green/20"
          }`}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          {status === "ok" && <Check size={15} className="text-brand-green" strokeWidth={3} />}
          {status === "bad" && <X size={15} className="text-red-500" strokeWidth={3} />}
          <button type="button" onClick={onToggle} className="text-zinc-400 hover:text-zinc-600 transition-colors">
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}

function ProfileStep({
  fullName,
  setFullName,
  onComplete,
  onSkip,
}: {
  fullName: string;
  setFullName: (v: string) => void;
  onComplete: () => void;
  onSkip: () => void;
}) {
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  const handleComplete = async () => {
    setSaving(true);
    const supabase = createClient();
    try {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        await supabase
          .from("profiles")
          .update({ full_name: fullName.trim() || null, phone: phone.trim() || null })
          .eq("id", data.user.id);
      }
      onComplete();
    } catch {
      // Profile is optional — don't block the flow on a transient failure.
      onComplete();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <h1 className="text-2xl font-extrabold text-zinc-900">Complete Your Profile</h1>
      <p className="text-sm font-medium text-zinc-500 mt-1.5 mb-6">Help your team recognize you.</p>

      <div className="flex justify-center mb-6">
        <div className="w-28 h-28 rounded-full bg-zinc-100 flex items-center justify-center text-3xl font-extrabold text-zinc-400">
          {(fullName.trim()[0] ?? "?").toUpperCase()}
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-[11px] font-extrabold text-zinc-400 uppercase tracking-wide block">Full Name</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="John Doe"
            className="w-full px-4 h-11 border border-zinc-200 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 rounded-xl text-sm font-semibold text-zinc-900 outline-none transition-all"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-extrabold text-zinc-400 uppercase tracking-wide block">
            Phone Number <span className="text-zinc-300 normal-case font-bold">(optional)</span>
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1 (555) 000-0000"
            className="w-full px-4 h-11 border border-zinc-200 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 rounded-xl text-sm font-semibold text-zinc-900 outline-none transition-all"
          />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={onSkip}
            className="h-12 px-5 text-sm font-bold text-zinc-500 hover:text-zinc-800 transition-colors"
          >
            Skip for Now
          </button>
          <button
            onClick={handleComplete}
            disabled={saving}
            className="flex-1 h-12 bg-brand-green hover:bg-brand-green-hover disabled:bg-brand-green/50 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : (
              <>
                Complete Setup
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>
      </div>
    </Card>
  );
}

function Welcome({
  name,
  workspaceName,
  roleLabel,
  onSkip,
}: {
  name: string;
  workspaceName: string;
  roleLabel: string;
  onSkip: () => void;
}) {
  const cards = [
    {
      icon: <Users size={22} />,
      title: "Meet Your Team",
      desc: "See who you'll be collaborating with",
      cta: "View Members",
      href: "/dashboard",
    },
    {
      icon: <Plug size={22} />,
      title: "Set Up Your Profile",
      desc: "Add your details so your team recognizes you",
      cta: "Open Settings",
      href: "/dashboard/settings",
    },
    {
      icon: <LayoutDashboard size={22} />,
      title: "Explore Dashboard",
      desc: "Get familiar with your workspace tools",
      cta: "Go to Dashboard",
      href: "/dashboard",
    },
  ];

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-brand-green to-brand-green-hover flex flex-col items-center justify-center px-6 py-12 text-white text-center overflow-y-auto">
      <div className="max-w-3xl w-full">
        <h1 className="text-4xl font-extrabold tracking-tight">Welcome to UChat, {name}!</h1>
        <p className="text-lg font-medium text-white/90 mt-3">
          You&apos;re now part of {workspaceName} as {roleLabel}.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-10">
          {cards.map((c) => (
            <div
              key={c.title}
              className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-5 flex flex-col items-center gap-3 text-center"
            >
              <span className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center">{c.icon}</span>
              <h3 className="text-base font-bold">{c.title}</h3>
              <p className="text-xs font-medium text-white/80 leading-snug flex-1">{c.desc}</p>
              <Link
                href={c.href}
                className="w-full h-10 bg-white text-brand-green rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-white/90 transition-colors"
              >
                {c.cta}
                <ArrowRight size={13} />
              </Link>
            </div>
          ))}
        </div>

        <button
          onClick={onSkip}
          className="text-sm font-medium text-white/70 underline mt-8 hover:text-white transition-colors"
        >
          I&apos;ll explore on my own
        </button>
      </div>
    </div>
  );
}
