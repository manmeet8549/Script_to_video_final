// Centralised environment access. Public vars are inlined by Next at build time;
// server-only vars are read lazily and validated at first use so that a missing
// secret produces a clear error instead of an opaque failure deep in a request.

function required(name: string, value: string | undefined): string {
  if (!value || value.length === 0) {
    throw new Error(
      `Missing required environment variable "${name}". ` +
        `Copy .env.example to .env.local and fill it in (see SETUP.md).`,
    );
  }
  return value;
}

// Public (safe to expose to the browser).
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
// Base URL the app is served from — used to build OAuth callback URLs (server
// side only). Precedence: explicit override → Vercel's stable production domain
// → localhost for dev. VERCEL_PROJECT_PRODUCTION_URL is the fixed production
// hostname (e.g. "script-to-video-final.vercel.app"), so OAuth allowlists stay
// valid across deploys; VERCEL_URL is intentionally not used (it changes per
// deployment).
export const APP_URL = (
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000")
).replace(/\/$/, "");

export function publicSupabaseConfig() {
  return {
    url: required("NEXT_PUBLIC_SUPABASE_URL", SUPABASE_URL),
    anonKey: required("NEXT_PUBLIC_SUPABASE_ANON_KEY", SUPABASE_ANON_KEY),
  };
}

// Server-only secrets (never import these from a Client Component).
export function serviceRoleKey(): string {
  return required("SUPABASE_SERVICE_ROLE_KEY", process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function encryptionKey(): string {
  return required("ENCRYPTION_KEY", process.env.ENCRYPTION_KEY);
}

// Optional platform-level webhook secret used to verify provider callbacks.
export function webhookSecret(): string | undefined {
  return process.env.WEBHOOK_SECRET || undefined;
}

// Cloudflare R2 (S3-compatible) object storage for generated media.
export function r2Config() {
  return {
    accountId: required("R2_ACCOUNT_ID", process.env.R2_ACCOUNT_ID),
    accessKeyId: required("R2_ACCESS_KEY_ID", process.env.R2_ACCESS_KEY_ID),
    secretAccessKey: required("R2_SECRET_ACCESS_KEY", process.env.R2_SECRET_ACCESS_KEY),
    bucket: required("R2_BUCKET_NAME", process.env.R2_BUCKET_NAME),
    publicUrl: required("R2_PUBLIC_URL", process.env.R2_PUBLIC_URL).replace(/\/$/, ""),
  };
}
