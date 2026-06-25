"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Copy,
  Image as ImageIcon,
  Loader2,
  Shield,
  CheckCircle2,
  Plus,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api/client";
import { slugify } from "@/lib/utils/slug";
import type { Workspace } from "@/types/db";

type SlugStatus = "idle" | "checking" | "available" | "taken" | "invalid";

type InviteResult = {
  tempPassword?: string;
  setupLink?: string;
  isNewUser: boolean;
};

type SuccessInfo = {
  workspace: Workspace;
  email: string;
  invite: InviteResult;
};

const COMMON_DOMAINS = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "icloud.com"];

function suggestDomain(email: string): string | null {
  const at = email.indexOf("@");
  if (at < 0) return null;
  const domain = email.slice(at + 1).toLowerCase();
  if (!domain || COMMON_DOMAINS.includes(domain)) return null;
  for (const candidate of COMMON_DOMAINS) {
    // Cheap edit-distance: same length, off by one character.
    if (Math.abs(candidate.length - domain.length) <= 1) {
      let diff = 0;
      const max = Math.max(candidate.length, domain.length);
      for (let i = 0; i < max; i++) if (candidate[i] !== domain[i]) diff++;
      if (diff > 0 && diff <= 2) return `${email.slice(0, at + 1)}${candidate}`;
    }
  }
  return null;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function OwnerNewWorkspacePage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1 — workspace info
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [slugStatus, setSlugStatus] = useState<SlugStatus>("idle");
  const [description, setDescription] = useState("");
  const [tier, setTier] = useState("pro");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoName, setLogoName] = useState<string | null>(null);

  // Step 2 — invite admin
  const [adminEmail, setAdminEmail] = useState("");
  const [adminName, setAdminName] = useState("");
  const [message, setMessage] = useState("");
  const [showMessage, setShowMessage] = useState(false);
  const [useTempPassword, setUseTempPassword] = useState(true);
  const [sendWelcome, setSendWelcome] = useState(true);
  const [showEmailPreview, setShowEmailPreview] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState<SuccessInfo | null>(null);

  // Debounced slug availability check. All state updates happen inside the
  // timeout callback (asynchronously), never synchronously in the effect body.
  useEffect(() => {
    const candidate = slugify(slug);
    const handle = setTimeout(async () => {
      if (!candidate) {
        setSlugStatus(slug.length > 0 ? "invalid" : "idle");
        return;
      }
      setSlugStatus("checking");
      try {
        const res = await api.get<{ available: boolean; normalized: string }>(
          `/api/workspaces/slug-available?slug=${encodeURIComponent(candidate)}`,
        );
        setSlugStatus(res.available ? "available" : "taken");
      } catch {
        setSlugStatus("idle");
      }
    }, 400);
    return () => clearTimeout(handle);
  }, [slug]);

  const emailValid = EMAIL_RE.test(adminEmail.trim());
  const domainSuggestion = useMemo(() => suggestDomain(adminEmail.trim()), [adminEmail]);

  const step1Valid = name.trim().length > 0 && slugStatus === "available";

  const handleLogo = (file: File | null) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Logo must be under 2MB.");
      return;
    }
    setLogoName(file.name);
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(String(reader.result));
    reader.readAsDataURL(file);
  };

  const copy = (text: string, label: string) => {
    navigator.clipboard?.writeText(text).then(
      () => toast.success(`${label} copied`),
      () => toast.error("Copy failed"),
    );
  };

  const handleCreate = async () => {
    if (!step1Valid) {
      toast.error("Complete workspace info before inviting an admin.");
      setStep(1);
      return;
    }
    if (!emailValid) {
      toast.error("Enter a valid admin email address.");
      return;
    }

    setIsSubmitting(true);
    try {
      const workspace = await api.post<Workspace>("/api/workspaces", {
        name: name.trim(),
        slug: slugify(slug),
        description: description.trim() || undefined,
        subscription_tier: tier,
      });

      let invite: InviteResult = { isNewUser: true };
      try {
        invite = await api.post<InviteResult>(`/api/workspaces/${workspace.id}/members`, {
          email: adminEmail.trim(),
          role: "admin",
          full_name: adminName.trim() || undefined,
          message: message.trim() || undefined,
          use_temp_password: useTempPassword,
        });
      } catch (err) {
        // The workspace was created; surface the invite problem but don't lose it.
        toast.error(
          err instanceof ApiError
            ? `Workspace created, but the invite failed: ${err.message}`
            : "Workspace created, but the admin invite failed.",
        );
        router.push(`/dashboard/owner/workspaces/${workspace.id}`);
        router.refresh();
        return;
      }

      setSuccess({ workspace, email: adminEmail.trim(), invite });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to create workspace.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSuccess(null);
    setStep(1);
    setName("");
    setSlug("");
    setSlugEdited(false);
    setSlugStatus("idle");
    setDescription("");
    setTier("pro");
    setLogoPreview(null);
    setLogoName(null);
    setAdminEmail("");
    setAdminName("");
    setMessage("");
    setShowMessage(false);
    setUseTempPassword(true);
    setSendWelcome(true);
    setShowEmailPreview(false);
  };

  const slugUrl = `${slugify(slug) || "your-workspace"}.workspace.thinknext.com`;

  return (
    <main className="flex-1 overflow-y-auto px-6 py-12 bg-zinc-50/50">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Breadcrumb + header */}
        <div className="space-y-3 text-left">
          <nav className="text-sm font-semibold text-zinc-400 flex items-center gap-1.5">
            <Link href="/dashboard/owner" className="hover:text-zinc-600 transition-colors">
              Owner
            </Link>
            <span>/</span>
            <Link href="/dashboard/owner/workspaces" className="hover:text-zinc-600 transition-colors">
              Workspaces
            </Link>
            <span>/</span>
            <span className="text-zinc-600">New</span>
          </nav>
          <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight">Create New Workspace</h1>
          <p className="text-base font-semibold text-zinc-400 max-w-md">
            Set up a new workspace and invite your first administrator.
          </p>
        </div>

        {/* Progress steps */}
        <ProgressSteps step={step} />

        {/* Step 1 */}
        {step === 1 && (
          <section className="bg-white border border-zinc-200 rounded-2xl p-8 shadow-sm space-y-6 text-left">
            <h2 className="text-xl font-bold text-zinc-900">Workspace Information</h2>

            {/* Name */}
            <Field label="Workspace Name" required>
              <div className="relative">
                <input
                  type="text"
                  value={name}
                  maxLength={100}
                  onChange={(e) => {
                    const v = e.target.value;
                    setName(v);
                    // Auto-derive the slug until the user edits it directly.
                    if (!slugEdited) setSlug(slugify(v));
                  }}
                  placeholder="e.g., Acme Corporation"
                  className="w-full px-4 h-11 border border-zinc-200 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 rounded-xl text-sm font-semibold text-zinc-900 outline-none transition-all"
                />
                <span className="absolute right-3 bottom-[-18px] text-[10px] font-semibold text-zinc-400">
                  {name.length}/100
                </span>
              </div>
              <div className="flex items-center gap-1.5 pt-1.5 text-[13px] font-mono text-zinc-400">
                <span className="truncate">{slugUrl}</span>
                <button
                  type="button"
                  onClick={() => copy(slugUrl, "Workspace URL")}
                  className="text-zinc-400 hover:text-brand-green transition-colors shrink-0"
                  aria-label="Copy workspace URL"
                >
                  <Copy size={12} />
                </button>
              </div>
            </Field>

            {/* Slug */}
            <Field label="Slug" required helper="Used in the workspace URL">
              <div className="relative">
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => {
                    setSlugEdited(true);
                    setSlug(e.target.value);
                  }}
                  placeholder="acme-corporation"
                  className={`w-full px-4 pr-10 h-11 border rounded-xl text-sm font-semibold text-zinc-900 outline-none transition-all focus:ring-2 ${
                    slugStatus === "taken" || slugStatus === "invalid"
                      ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                      : "border-zinc-200 focus:border-brand-green focus:ring-brand-green/20"
                  }`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2">
                  {slugStatus === "checking" && <Loader2 size={16} className="animate-spin text-zinc-300" />}
                  {slugStatus === "available" && <Check size={16} className="text-brand-green" strokeWidth={3} />}
                  {(slugStatus === "taken" || slugStatus === "invalid") && (
                    <X size={16} className="text-red-500" strokeWidth={3} />
                  )}
                </span>
              </div>
              {slugStatus === "taken" && (
                <p className="text-xs font-semibold text-red-500 pt-1">That slug is already taken.</p>
              )}
              {slugStatus === "invalid" && (
                <p className="text-xs font-semibold text-red-500 pt-1">
                  Use lowercase letters, numbers, and hyphens.
                </p>
              )}
            </Field>

            {/* Description */}
            <Field label="Description">
              <div className="relative">
                <textarea
                  value={description}
                  maxLength={500}
                  rows={4}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe this workspace for your team..."
                  className="w-full px-4 py-3 border border-zinc-200 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 rounded-xl text-sm font-semibold text-zinc-900 outline-none transition-all resize-none"
                />
                <span className="absolute right-3 bottom-2.5 text-[10px] font-semibold text-zinc-400">
                  {description.length}/500
                </span>
              </div>
            </Field>

            {/* Logo */}
            <Field label="Workspace Logo">
              {logoPreview ? (
                <div className="flex items-center gap-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={logoPreview} alt="Logo preview" className="w-20 h-20 rounded-lg object-cover border border-zinc-200" />
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-zinc-700">{logoName}</p>
                    <button
                      type="button"
                      onClick={() => {
                        setLogoPreview(null);
                        setLogoName(null);
                      }}
                      className="text-xs font-bold text-red-500 hover:text-red-700 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-zinc-200 rounded-xl py-10 px-6 cursor-pointer hover:border-brand-green/50 hover:bg-brand-green-light/30 transition-colors text-center">
                  <ImageIcon size={40} className="text-zinc-300" />
                  <span className="text-sm font-bold text-zinc-700">Drop logo here or click to browse</span>
                  <span className="text-xs font-semibold text-zinc-400">PNG, JPG, or SVG up to 2MB</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml"
                    className="hidden"
                    onChange={(e) => handleLogo(e.target.files?.[0] ?? null)}
                  />
                </label>
              )}
            </Field>

            {/* Tier */}
            <Field label="Subscription Tier">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 select-none">
                {[
                  { key: "free", label: "Free", limit: "5 members · 5GB · 50 credits/mo" },
                  { key: "pro", label: "Pro", limit: "25 members · 100GB · 500 credits/mo" },
                  { key: "enterprise", label: "Enterprise", limit: "Unlimited · 1TB · 5000 credits/mo" },
                ].map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setTier(t.key)}
                    className={`border rounded-xl p-3.5 text-left transition-all flex flex-col gap-2 h-24 ${
                      tier === t.key ? "border-brand-green bg-brand-green-light shadow-sm" : "border-zinc-200 hover:bg-zinc-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-900">{t.label}</span>
                      {tier === t.key && (
                        <span className="w-4 h-4 rounded-full bg-brand-green flex items-center justify-center text-white">
                          <Check size={10} strokeWidth={3} />
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-semibold text-zinc-400 leading-snug">{t.limit}</span>
                  </button>
                ))}
              </div>
            </Field>

            <button
              type="button"
              disabled={!step1Valid}
              onClick={() => setStep(2)}
              className="w-full h-12 bg-brand-green hover:bg-brand-green-hover disabled:bg-brand-green/40 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
            >
              Continue
              <ArrowRight size={16} strokeWidth={2.5} />
            </button>
          </section>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <section className="bg-white border border-zinc-200 rounded-2xl p-8 shadow-sm space-y-6 text-left">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-zinc-900">Invite Initial Administrator</h2>
              <p className="text-sm font-semibold text-zinc-400">
                This person will have full admin access to manage the workspace.
              </p>
            </div>

            {/* Permissions preview */}
            <div className="bg-brand-green-light rounded-xl p-5 border-l-4 border-brand-green space-y-2">
              <div className="flex items-center gap-2">
                <Shield size={20} className="text-brand-green" />
                <span className="text-sm font-bold text-zinc-900">Admin Role Permissions</span>
              </div>
              <ul className="text-[13px] font-semibold text-zinc-500 space-y-1 list-disc pl-9">
                <li>Manage team members and roles</li>
                <li>Oversee all projects and deadlines</li>
                <li>Configure workspace settings</li>
                <li>Manage calendar and scheduling</li>
              </ul>
              <p className="text-xs font-semibold text-zinc-400 italic pl-9">
                You can add more admins later from Member Management.
              </p>
            </div>

            {/* Email */}
            <Field label="Admin Email" required>
              <div className="relative">
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@company.com"
                  className="w-full px-4 pr-10 h-11 border border-zinc-200 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 rounded-xl text-sm font-semibold text-zinc-900 outline-none transition-all"
                />
                {emailValid && (
                  <Check size={16} strokeWidth={3} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-green" />
                )}
              </div>
              {domainSuggestion && (
                <button
                  type="button"
                  onClick={() => setAdminEmail(domainSuggestion)}
                  className="text-xs font-semibold text-brand-green hover:underline pt-1"
                >
                  Did you mean {domainSuggestion}?
                </button>
              )}
            </Field>

            {/* Full name */}
            <Field label="Admin Full Name" helper="Optional — used in the invitation email">
              <input
                type="text"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                placeholder="John Doe"
                className="w-full px-4 h-11 border border-zinc-200 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 rounded-xl text-sm font-semibold text-zinc-900 outline-none transition-all"
              />
            </Field>

            {/* Custom message */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setShowMessage((v) => !v)}
                className="text-sm font-bold text-zinc-600 flex items-center gap-1.5 hover:text-zinc-900 transition-colors"
              >
                Add personal message
                <ChevronDown size={14} className={`transition-transform ${showMessage ? "rotate-180" : ""}`} />
              </button>
              {showMessage && (
                <div className="relative">
                  <textarea
                    value={message}
                    maxLength={200}
                    rows={3}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Add a personal note to the invitation email..."
                    className="w-full px-4 py-3 border border-zinc-200 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 rounded-xl text-sm font-semibold text-zinc-900 outline-none transition-all resize-none"
                  />
                  <span className="absolute right-3 bottom-2.5 text-[10px] font-semibold text-zinc-400">
                    {message.length}/200
                  </span>
                </div>
              )}
            </div>

            {/* Toggles */}
            <Toggle
              checked={useTempPassword}
              onChange={setUseTempPassword}
              label="Generate Temporary Password"
              helper={
                useTempPassword
                  ? "Admin receives a temporary password and must change it on first login."
                  : "Admin receives a password setup link instead."
              }
              secure
            />
            <Toggle
              checked={sendWelcome}
              onChange={setSendWelcome}
              label="Send Welcome Email"
              helper="Include the workspace getting-started guide."
            />

            {/* Email preview */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setShowEmailPreview((v) => !v)}
                className="text-sm font-bold text-brand-green flex items-center gap-1.5 hover:text-brand-green-hover transition-colors"
              >
                Preview Invitation Email
                <ChevronDown size={14} className={`transition-transform ${showEmailPreview ? "rotate-180" : ""}`} />
              </button>
              {showEmailPreview && (
                <div className="border border-zinc-200 rounded-xl p-6 space-y-3 overflow-hidden">
                  <div className="text-xs font-semibold text-zinc-400 border-b border-zinc-100 pb-3 space-y-0.5">
                    <p>
                      <span className="text-zinc-500 font-bold">From:</span> ThinkNEXT Platform
                    </p>
                    <p>
                      <span className="text-zinc-500 font-bold">Subject:</span> You&apos;re invited to manage{" "}
                      {name || "your workspace"}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-zinc-700">Hi {adminName || "there"},</p>
                  <p className="text-sm text-zinc-500 leading-relaxed">
                    You&apos;ve been invited to be the Administrator of{" "}
                    <span className="font-bold text-zinc-700">{name || "this workspace"}</span> on ThinkNEXT Video.
                  </p>
                  {message && <p className="text-sm text-zinc-500 italic border-l-2 border-zinc-200 pl-3">{message}</p>}
                  <div className="bg-zinc-50 rounded-lg p-3 text-xs font-mono text-zinc-500">{slugUrl}</div>
                  <span className="inline-flex items-center gap-1.5 bg-brand-green text-white text-xs font-bold px-4 py-2 rounded-lg">
                    Get Started <ArrowRight size={12} />
                  </span>
                  <p className="text-xs text-zinc-400">
                    {useTempPassword
                      ? "Your temporary password: ••••••••"
                      : "Set your password using the secure link in this email."}
                  </p>
                  <p className="text-[11px] text-zinc-300 border-t border-zinc-100 pt-2">
                    This invitation expires in 7 days.
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="h-12 px-5 text-sm font-bold text-zinc-500 hover:text-zinc-800 flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft size={16} />
                Back
              </button>
              <button
                type="button"
                disabled={!emailValid || isSubmitting}
                onClick={handleCreate}
                className="flex-1 h-12 bg-brand-green hover:bg-brand-green-hover disabled:bg-brand-green/40 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Creating Workspace...
                  </>
                ) : (
                  "Create Workspace & Send Invite"
                )}
              </button>
            </div>
          </section>
        )}
      </div>

      {/* Success overlay */}
      {success && (
        <SuccessOverlay
          info={success}
          onCopy={copy}
          onGoToWorkspace={() => {
            router.push(`/dashboard/owner/workspaces/${success.workspace.id}`);
            router.refresh();
          }}
          onCreateAnother={resetForm}
        />
      )}
    </main>
  );
}

function ProgressSteps({ step }: { step: 1 | 2 }) {
  const steps = [
    { n: 1, label: "Workspace Info" },
    { n: 2, label: "Invite Admin" },
    { n: 3, label: "Configure APIs" },
  ];
  return (
    <div className="flex items-center select-none">
      {steps.map((s, i) => {
        const done = s.n < step;
        const active = s.n === step;
        return (
          <div key={s.n} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  done
                    ? "bg-brand-green text-white"
                    : active
                      ? "bg-brand-green text-white"
                      : "bg-zinc-200 text-zinc-400"
                }`}
              >
                {done ? <Check size={16} strokeWidth={3} /> : s.n}
              </div>
              <span className={`text-[11px] font-semibold ${active || done ? "text-zinc-700" : "text-zinc-400"}`}>
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`h-0.5 flex-1 mx-2 mb-5 rounded ${s.n < step ? "bg-brand-green" : "bg-zinc-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function Field({
  label,
  required,
  helper,
  children,
}: {
  label: string;
  required?: boolean;
  helper?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-extrabold text-zinc-400 uppercase tracking-wide block">
        {label}
        {required && <span className="text-brand-green ml-1">*</span>}
      </label>
      {children}
      {helper && <p className="text-[11px] font-semibold text-zinc-400">{helper}</p>}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
  helper,
  secure,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  helper: string;
  secure?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border border-zinc-150 rounded-xl p-4">
      <div className="space-y-1">
        <p className="text-sm font-bold text-zinc-800">{label}</p>
        <p className="text-xs font-semibold text-zinc-400 leading-snug">{helper}</p>
        {secure && (
          <p className="text-[11px] font-semibold text-brand-green flex items-center gap-1">
            <Shield size={11} />
            All credentials are encrypted and securely transmitted.
          </p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`shrink-0 w-11 h-6 rounded-full transition-colors relative ${checked ? "bg-brand-green" : "bg-zinc-300"}`}
      >
        <span
          className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
            checked ? "translate-x-[22px]" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}

function SuccessOverlay({
  info,
  onCopy,
  onGoToWorkspace,
  onCreateAnother,
}: {
  info: SuccessInfo;
  onCopy: (text: string, label: string) => void;
  onGoToWorkspace: () => void;
  onCreateAnother: () => void;
}) {
  const url = `${info.workspace.slug}.workspace.thinknext.com`;
  const acceptUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/auth/accept-invite?email=${encodeURIComponent(info.email)}&workspace=${encodeURIComponent(info.workspace.name)}&role=Administrator`;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl max-w-md w-full p-8 text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
        <div className="w-20 h-20 rounded-full bg-brand-green flex items-center justify-center mx-auto animate-pulse">
          <Check size={40} strokeWidth={3} className="text-white" />
        </div>
        <div className="space-y-1">
          <h2 className="text-2xl font-extrabold text-zinc-900">Workspace Created!</h2>
          <p className="text-sm font-semibold text-zinc-400">{info.workspace.name} is ready to go.</p>
        </div>

        <div className="bg-zinc-50 rounded-xl border border-zinc-150 p-4 space-y-3 text-left">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-mono text-zinc-500 truncate">{url}</span>
            <button
              type="button"
              onClick={() => onCopy(url, "Workspace URL")}
              className="text-zinc-400 hover:text-brand-green transition-colors shrink-0"
            >
              <Copy size={14} />
            </button>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 size={16} className="text-brand-green shrink-0" />
            <span className="font-semibold text-zinc-600 truncate">{info.email}</span>
          </div>

          {/* Accept-invite link — share this with the admin so they know where to go */}
          <div className="space-y-1">
            <p className="text-[11px] font-extrabold uppercase tracking-wide text-zinc-400">
              Invitation link (share with admin)
            </p>
            <div className="flex items-center justify-between gap-2 bg-white border border-zinc-200 rounded-lg px-3 py-2">
              <code className="text-xs font-mono text-zinc-700 truncate">{acceptUrl}</code>
              <button
                type="button"
                onClick={() => onCopy(acceptUrl, "Invitation link")}
                className="text-zinc-400 hover:text-brand-green transition-colors shrink-0"
              >
                <Copy size={14} />
              </button>
            </div>
          </div>

          <p className="text-xs font-semibold text-zinc-400">Expires in 7 days.</p>

          {info.invite.tempPassword && (
            <div className="border-t border-zinc-150 pt-3 space-y-1.5">
              <p className="text-[11px] font-extrabold uppercase tracking-wide text-zinc-400">
                Temporary password
              </p>
              <div className="flex items-center justify-between gap-2 bg-white border border-zinc-200 rounded-lg px-3 py-2">
                <code className="text-xs font-mono text-zinc-700 truncate">{info.invite.tempPassword}</code>
                <button
                  type="button"
                  onClick={() => onCopy(info.invite.tempPassword!, "Temporary password")}
                  className="text-zinc-400 hover:text-brand-green transition-colors shrink-0"
                >
                  <Copy size={14} />
                </button>
              </div>
              <p className="text-[11px] font-semibold text-amber-600">
                Share this securely with the admin — they&apos;ll change it on first login.
              </p>
            </div>
          )}

          {info.invite.setupLink && (
            <div className="border-t border-zinc-150 pt-3 space-y-1.5">
              <p className="text-[11px] font-extrabold uppercase tracking-wide text-zinc-400">Setup link</p>
              <div className="flex items-center justify-between gap-2 bg-white border border-zinc-200 rounded-lg px-3 py-2">
                <code className="text-xs font-mono text-zinc-700 truncate">{info.invite.setupLink}</code>
                <button
                  type="button"
                  onClick={() => onCopy(info.invite.setupLink!, "Setup link")}
                  className="text-zinc-400 hover:text-brand-green transition-colors shrink-0"
                >
                  <Copy size={14} />
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="text-left text-[13px] font-semibold text-zinc-400 space-y-1">
          <p>· Admin will receive login instructions.</p>
          <p>· You can configure APIs from the workspace anytime.</p>
          <p>· The admin can invite team members once logged in.</p>
        </div>

        <div className="space-y-2">
          <button
            type="button"
            onClick={onGoToWorkspace}
            className="w-full h-11 bg-brand-green hover:bg-brand-green-hover text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors"
          >
            Go to Workspace
            <ArrowRight size={16} />
          </button>
          <button
            type="button"
            onClick={onCreateAnother}
            className="w-full h-11 text-zinc-500 hover:text-zinc-800 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Plus size={15} />
            Create Another Workspace
          </button>
        </div>
      </div>
    </div>
  );
}
