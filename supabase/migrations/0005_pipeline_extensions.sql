-- ============================================================================
-- 0005_pipeline_extensions.sql
-- SCRIPT-AI pipeline rework: credit accounting, R2 video metadata,
-- editor-version collaboration, and the admin approval queue.
-- Follows the conventions in 0001_core_schema.sql (set_updated_at trigger,
-- auth_workspace_ids()/has_workspace_role()/project_workspace_id() RLS helpers).
-- ============================================================================

-- ============================================================================
-- TABLES
-- ============================================================================

-- CREDIT WALLETS (one per workspace; track-only accounting) --------------------
create table if not exists public.credit_wallets (
  id                  uuid primary key default gen_random_uuid(),
  workspace_id        uuid not null unique references public.workspaces(id) on delete cascade,
  script_credits      integer not null default 100,
  voice_credits       integer not null default 100,
  video_credits       integer not null default 100,
  publish_credits     integer not null default 100,
  storage_limit_gb    numeric not null default 5,
  storage_used_bytes  bigint  not null default 0,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- CREDIT TRANSACTIONS (audit ledger; amount<0 = spend) ------------------------
create table if not exists public.credit_transactions (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces(id) on delete cascade,
  project_id    uuid references public.projects(id) on delete set null,
  kind          text not null check (kind in ('script','voice','video','publish')),
  amount        integer not null,            -- negative for spend, positive for grant
  balance_after integer,
  reason        text,
  created_by    uuid references public.profiles(id),
  created_at    timestamptz not null default now()
);

-- VIDEO GENERATION METADATA (R2 backfill) -------------------------------------
alter table public.video_generations
  add column if not exists thumbnail_url     text,
  add column if not exists r2_key            text,
  add column if not exists thumbnail_r2_key  text,
  add column if not exists file_size_bytes   bigint,
  add column if not exists duration_seconds  integer,
  add column if not exists width             integer,
  add column if not exists height            integer,
  add column if not exists version           integer not null default 1;

-- EDITOR COLLABORATION: edited video versions ---------------------------------
create table if not exists public.edited_videos (
  id               uuid primary key default gen_random_uuid(),
  editing_task_id  uuid not null references public.editing_tasks(id) on delete cascade,
  version          integer not null default 1,
  video_url        text,
  r2_key           text,
  notes            text,
  created_by       uuid references public.profiles(id),
  created_at       timestamptz not null default now()
);

-- Extend editing_tasks status set with the collaboration states.
alter table public.editing_tasks drop constraint if exists editing_tasks_status_check;
alter table public.editing_tasks
  add constraint editing_tasks_status_check
  check (status in ('pending','in_progress','review','under_review',
                    'revision_requested','approved','completed','rejected'));

-- ADMIN APPROVAL QUEUE --------------------------------------------------------
create table if not exists public.approval_items (
  id                  uuid primary key default gen_random_uuid(),
  workspace_id        uuid not null references public.workspaces(id) on delete cascade,
  project_id          uuid references public.projects(id) on delete cascade,
  publishing_task_id  uuid references public.publishing_tasks(id) on delete cascade,
  status              text not null default 'pending'
                        check (status in ('pending','approved','rejected','changes_requested')),
  requested_by        uuid references public.profiles(id),
  decided_by          uuid references public.profiles(id),
  feedback            text,
  decided_at          timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ============================================================================
-- INDEXES
-- ============================================================================
create index if not exists idx_credit_wallets_ws        on public.credit_wallets(workspace_id);
create index if not exists idx_credit_tx_ws             on public.credit_transactions(workspace_id);
create index if not exists idx_credit_tx_project        on public.credit_transactions(project_id);
create index if not exists idx_edited_videos_task       on public.edited_videos(editing_task_id);
create index if not exists idx_approval_items_ws        on public.approval_items(workspace_id);
create index if not exists idx_approval_items_project   on public.approval_items(project_id);
create index if not exists idx_approval_items_status    on public.approval_items(workspace_id, status);

-- ============================================================================
-- updated_at TRIGGERS
-- ============================================================================
do $$
declare
  t text;
begin
  foreach t in array array['credit_wallets','approval_items']
  loop
    execute format('drop trigger if exists trg_%1$s_updated_at on public.%1$s;', t);
    execute format(
      'create trigger trg_%1$s_updated_at before update on public.%1$s
         for each row execute function public.set_updated_at();', t);
  end loop;
end$$;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
alter table public.credit_wallets      enable row level security;
alter table public.credit_transactions enable row level security;
alter table public.edited_videos       enable row level security;
alter table public.approval_items      enable row level security;

-- CREDIT WALLETS: members read; owner/admin manage (server uses service role).
drop policy if exists credit_wallets_select on public.credit_wallets;
create policy credit_wallets_select on public.credit_wallets
  for select using (
    workspace_id in (select public.auth_workspace_ids())
    or is_platform_owner()
  );

drop policy if exists credit_wallets_write on public.credit_wallets;
create policy credit_wallets_write on public.credit_wallets
  for all using (
    has_workspace_role(workspace_id, array['owner','admin'])
    or is_platform_owner()
  )
  with check (
    has_workspace_role(workspace_id, array['owner','admin'])
    or is_platform_owner()
  );

-- CREDIT TRANSACTIONS: members read; inserts happen via service role server-side.
drop policy if exists credit_tx_select on public.credit_transactions;
create policy credit_tx_select on public.credit_transactions
  for select using (
    workspace_id in (select public.auth_workspace_ids())
    or is_platform_owner()
  );

-- EDITED VIDEOS: share the parent project's workspace membership.
drop policy if exists edited_videos_all on public.edited_videos;
create policy edited_videos_all on public.edited_videos
  for all using (
    public.project_workspace_id(
      (select project_id from public.editing_tasks et where et.id = editing_task_id)
    ) in (select public.auth_workspace_ids())
    or is_platform_owner()
  )
  with check (
    public.project_workspace_id(
      (select project_id from public.editing_tasks et where et.id = editing_task_id)
    ) in (select public.auth_workspace_ids())
  );

-- APPROVAL ITEMS: members read; owner/admin decide.
drop policy if exists approval_items_select on public.approval_items;
create policy approval_items_select on public.approval_items
  for select using (
    workspace_id in (select public.auth_workspace_ids())
    or is_platform_owner()
  );

drop policy if exists approval_items_write on public.approval_items;
create policy approval_items_write on public.approval_items
  for all using (
    has_workspace_role(workspace_id, array['owner','admin'])
    or is_platform_owner()
  )
  with check (
    workspace_id in (select public.auth_workspace_ids())
  );
