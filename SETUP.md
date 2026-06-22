# Backend Setup

This app uses **Supabase** (Postgres + Auth + Row Level Security) as its backend
and calls real third-party providers for the voice → video → edit → publish
pipeline. Follow these steps to take it from "compiles" to "running".

## 1. Create a Supabase project

1. Create a project at <https://supabase.com>.
2. In **Project Settings → API**, copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (server-only secret)

## 2. Environment variables

```bash
cp .env.example .env.local
```

Fill in the Supabase values above, then generate the two secrets:

```bash
# 32-byte key for encrypting provider API keys at rest
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"   # → ENCRYPTION_KEY
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"   # → WEBHOOK_SECRET
```

## 3. Run the database migrations

> **Already applied** to the configured project. The repo includes a runner that
> backs up, resets `public`, applies migrations, backfills profiles from
> `auth.users`, and bootstraps an owner:
>
> ```bash
> node --env-file=.env.local scripts/reset-and-migrate.mjs you@example.com
> ```
>
> ⚠️ This DROPS the `public` schema first (a JSON backup is written to
> `db-backup-*.json`). To apply migrations **without** resetting, use
> `node --env-file=.env.local scripts/apply-migrations.mjs` (only works on an
> empty/compatible `public`). You can also paste the files in
> `supabase/migrations/` into the Supabase SQL Editor in order.

## 4. Object storage (Cloudflare R2)

Generated audio/video is uploaded to **Cloudflare R2** (S3-compatible) via
`src/lib/storage/media.ts`. Set `R2_*` in `.env.local` and make sure the bucket's
public access (`R2_PUBLIC_URL`, the `*.r2.dev` domain) is enabled so the stored
URLs are reachable.

## 5. Auth settings

- For the smoothest local flow, disable email confirmation:
  **Authentication → Providers → Email → "Confirm email" = off**.
  (With it on, sign-up returns no session; the user must confirm before the
  first workspace is created.)

## 6. The first owner

`manmeet8549singh@gmail.com` has already been bootstrapped as platform owner with
a "My Workspace" workspace (and the other existing `auth.users` account has a
backfilled profile). Sign in at `/auth/login` with that account's existing
password to land on the owner dashboard.

New self-serve signups via `/auth/register` create their own workspace. To flag
another account as platform owner, run in the SQL Editor:

```sql
select public.bootstrap_owner('someone@example.com', 'My Company', 'my-company');
```

## 7. Configure providers (real API keys)

Provider keys are stored **per workspace**, encrypted with `ENCRYPTION_KEY`, in
the `workspace_apis` table — never in env. Add them via `POST /api/integrations`
(owner/admin) or insert from the dashboard's API settings. Defaults wired:

| Kind        | `provider_key`     | Service   | Needed config                                  |
| ----------- | ------------------ | --------- | ---------------------------------------------- |
| `voice`     | `elevenlabs`       | ElevenLabs| `api_key`; optional `config.default_voice_id`  |
| `video`     | `heygen`           | HeyGen    | `api_key`; `config.avatar_id` (required)       |
| `editing`   | `generic-edit`     | any HTTP  | `api_key` + `endpoint_url` (POSTs to `/edit`)  |
| `publishing`| `generic-publish`  | any HTTP  | `api_key` + `endpoint_url` (POSTs to `/publish`)|

Example (curl, while signed in with an owner/admin session cookie):

```bash
curl -X POST http://localhost:3000/api/integrations \
  -H "Content-Type: application/json" \
  -d '{"provider":"voice","provider_key":"elevenlabs","api_name":"ElevenLabs","api_key":"sk-...","config":{"default_voice_id":"21m00Tcm4TlvDq8ikWAM"}}'
```

To use a **different** voice/video vendor (Azure TTS, D-ID, Synthesia, …), add an
adapter implementing the interface in `src/lib/integrations/types.ts` and register
it in `src/lib/integrations/registry.ts`. The editing/publishing "providers"
(Subagic/Zernio in the architecture doc) are generic HTTP adapters — point
`endpoint_url` at the real service, or swap in a vendor adapter.

## 8. Webhooks (async providers)

HeyGen (video) completes asynchronously. Point the provider's webhook at:

```
POST https://<your-host>/api/webhooks/video
POST https://<your-host>/api/webhooks/voice
POST https://<your-host>/api/webhooks/publish
```

Send the shared secret as `x-webhook-secret: <WEBHOOK_SECRET>`. If a provider
can't send custom headers, you can also poll: `GET /api/projects/<id>/video?poll=1`.

## 9. Run it

```bash
npm run dev
```

Register at `/auth/register`, then create projects and run the pipeline.

---

## Architecture notes

- **Auth & routing**: `src/proxy.ts` (Next 16 renamed Middleware → Proxy) keeps
  the session fresh and gates `/dashboard`. Per-request authorization is enforced
  in the data-access layer and route handlers (defense in depth) — never relying
  on the proxy alone.
- **Clients**: `src/lib/supabase/{client,server,admin}.ts` (browser anon /
  server anon / service-role). The admin client bypasses RLS and is only used by
  webhooks and trusted server jobs.
- **RLS**: every tenant table is workspace-scoped via `SECURITY DEFINER` helper
  functions (`auth_workspace_ids`, `has_workspace_role`) to avoid policy
  recursion.
- **REST API**: `src/app/api/**` route handlers; client calls them through
  `src/lib/api/client.ts`.
- **Pipeline**: `src/lib/dal/pipeline.ts` orchestrates script → voice → video →
  edit → publish; provider calls go through `src/lib/integrations/*`.

## What's wired end-to-end in this slice

- Email/password auth (sign up + first workspace, sign in, sign out) + role-based
  dashboard routing.
- Workspaces (list/create) and the projects vertical (list/create/detail/stages).
- Full pipeline route handlers + provider integration + webhooks.

Remaining dashboard pages (admin team, editor tasks, calendar, notifications,
pipeline sub-pages) still read the legacy `src/app/utils/storage.ts` mock and can
be migrated to the same `src/lib/api/client.ts` pattern.
