-- ============================================================================
-- 0001_core_schema.sql
-- UChat-style video generation platform — core vertical slice
-- Tables: workspaces, profiles, workspace_members, workspace_apis, projects,
--         project_stages, scripts, voice_generations, video_generations,
--         editing_tasks, publishing_tasks
-- Includes: updated_at triggers, profile auto-provisioning, RLS policies.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- Shared helpers
-- ----------------------------------------------------------------------------

-- Generic updated_at maintainer
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================================
-- TABLES
-- ============================================================================

-- USERS (global identity, 1:1 with auth.users) --------------------------------
create table if not exists public.profiles (
  id                 uuid primary key references auth.users(id) on delete cascade,
  email              text not null unique,
  full_name          text,
  avatar_url         text,
  phone              text,
  is_platform_owner  boolean not null default false,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- WORKSPACES (tenants) --------------------------------------------------------
create table if not exists public.workspaces (
  id                 uuid primary key default gen_random_uuid(),
  name               text not null,
  slug               text not null unique,
  owner_id           uuid not null references public.profiles(id) on delete restrict,
  description        text,
  logo_url           text,
  status             text not null default 'active'
                       check (status in ('active','suspended','archived')),
  subscription_tier  text not null default 'basic',
  metadata           jsonb not null default '{}'::jsonb,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- WORKSPACE MEMBERSHIPS (RBAC) ------------------------------------------------
create table if not exists public.workspace_members (
  id                   uuid primary key default gen_random_uuid(),
  workspace_id         uuid not null references public.workspaces(id) on delete cascade,
  user_id              uuid not null references public.profiles(id) on delete cascade,
  role                 text not null
                         check (role in ('owner','admin','user','editor','support','viewer')),
  status               text not null default 'active'
                         check (status in ('active','pending','suspended')),
  invited_by           uuid references public.profiles(id),
  password_changed_at  timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  unique (workspace_id, user_id)
);

-- API INTEGRATIONS (per workspace) --------------------------------------------
create table if not exists public.workspace_apis (
  id                    uuid primary key default gen_random_uuid(),
  workspace_id          uuid not null references public.workspaces(id) on delete cascade,
  provider              text not null,   -- 'voice','video','editing','publishing'
  api_name              text not null,   -- display name, e.g. 'ElevenLabs'
  provider_key          text not null,   -- adapter id, e.g. 'elevenlabs','heygen'
  api_key_encrypted     text not null,   -- AES-256-GCM encrypted
  api_secret_encrypted  text,
  endpoint_url          text,
  is_active             boolean not null default true,
  config                jsonb not null default '{}'::jsonb,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- PROJECTS --------------------------------------------------------------------
create table if not exists public.projects (
  id                uuid primary key default gen_random_uuid(),
  workspace_id      uuid not null references public.workspaces(id) on delete cascade,
  title             text not null,
  description       text,
  status            text not null default 'idea'
                      check (status in ('idea','scripting','voice_gen','video_gen',
                                        'editing','review','published','archived')),
  priority          text not null default 'medium'
                      check (priority in ('low','medium','high','urgent')),
  created_by        uuid references public.profiles(id),
  assigned_to       uuid references public.profiles(id),
  deadline          timestamptz,
  progress_percent  integer not null default 0 check (progress_percent between 0 and 100),
  thumbnail_url     text,
  video_url         text,
  published_urls    jsonb not null default '[]'::jsonb,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- PROJECT STAGES (timeline) ---------------------------------------------------
create table if not exists public.project_stages (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references public.projects(id) on delete cascade,
  stage_name    text not null
                  check (stage_name in ('idea','script','voice','video','editing','review','publish')),
  status        text not null default 'pending'
                  check (status in ('pending','in_progress','completed','failed','skipped')),
  started_at    timestamptz,
  completed_at  timestamptz,
  assigned_to   uuid references public.profiles(id),
  notes         text,
  output_data   jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now(),
  unique (project_id, stage_name)
);

-- SCRIPTS ---------------------------------------------------------------------
create table if not exists public.scripts (
  id                  uuid primary key default gen_random_uuid(),
  project_id          uuid not null references public.projects(id) on delete cascade,
  content             text not null,
  tone                text not null default 'professional',
  language            text not null default 'en',
  word_count          integer,
  estimated_duration  integer,                 -- seconds
  ai_generated        boolean not null default false,
  created_by          uuid references public.profiles(id),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- VOICE GENERATIONS -----------------------------------------------------------
create table if not exists public.voice_generations (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid not null references public.projects(id) on delete cascade,
  script_id       uuid references public.scripts(id) on delete set null,
  voice_provider  text not null,               -- adapter id, e.g. 'elevenlabs'
  voice_id        text not null,
  audio_url       text,
  duration        integer,
  status          text not null default 'pending'
                    check (status in ('pending','generating','completed','failed')),
  provider_job_id text,                         -- external job/request id
  settings        jsonb not null default '{}'::jsonb,
  error           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- VIDEO GENERATIONS -----------------------------------------------------------
create table if not exists public.video_generations (
  id                   uuid primary key default gen_random_uuid(),
  project_id           uuid not null references public.projects(id) on delete cascade,
  voice_generation_id  uuid references public.voice_generations(id) on delete set null,
  video_provider       text not null,          -- adapter id, e.g. 'heygen'
  video_url            text,
  status               text not null default 'pending'
                         check (status in ('pending','generating','completed','failed')),
  provider_job_id      text,
  settings             jsonb not null default '{}'::jsonb,
  error                text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- EDITING TASKS ---------------------------------------------------------------
create table if not exists public.editing_tasks (
  id                uuid primary key default gen_random_uuid(),
  project_id        uuid not null references public.projects(id) on delete cascade,
  editor_id         uuid references public.profiles(id),
  requested_by      uuid references public.profiles(id),
  edit_type         text not null check (edit_type in ('ai','manual')),
  edit_provider     text,                       -- adapter id when edit_type='ai'
  status            text not null default 'pending'
                      check (status in ('pending','in_progress','review','completed','rejected')),
  instructions      text,
  source_video_url  text,
  edited_video_url  text,
  provider_job_id   text,
  feedback          text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  completed_at      timestamptz
);

-- PUBLISHING TASKS ------------------------------------------------------------
create table if not exists public.publishing_tasks (
  id                    uuid primary key default gen_random_uuid(),
  project_id            uuid not null references public.projects(id) on delete cascade,
  platform              text not null,          -- 'youtube','tiktok','instagram', etc.
  publish_provider      text,                   -- adapter id, e.g. 'zernio'
  status                text not null default 'draft'
                          check (status in ('draft','scheduled','publishing','published','failed')),
  scheduled_at          timestamptz,
  published_at          timestamptz,
  platform_video_id     text,
  provider_job_id       text,
  title                 text,
  description           text,
  tags                  text[],
  thumbnail_url         text,
  custom_thumbnail_url  text,
  visibility            text not null default 'public'
                          check (visibility in ('public','unlisted','private')),
  settings              jsonb not null default '{}'::jsonb,
  error                 text,
  created_by            uuid references public.profiles(id),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- ============================================================================
-- INDEXES (tenant-scoped access paths)
-- ============================================================================
create index if not exists idx_workspace_members_user on public.workspace_members(user_id);
create index if not exists idx_workspace_members_ws   on public.workspace_members(workspace_id);
create index if not exists idx_workspace_apis_ws       on public.workspace_apis(workspace_id);
create index if not exists idx_projects_ws             on public.projects(workspace_id);
create index if not exists idx_projects_ws_status      on public.projects(workspace_id, status);
create index if not exists idx_project_stages_project  on public.project_stages(project_id);
create index if not exists idx_scripts_project         on public.scripts(project_id);
create index if not exists idx_voice_gen_project       on public.voice_generations(project_id);
create index if not exists idx_video_gen_project       on public.video_generations(project_id);
create index if not exists idx_editing_tasks_project   on public.editing_tasks(project_id);
create index if not exists idx_editing_tasks_editor    on public.editing_tasks(editor_id);
create index if not exists idx_publishing_tasks_project on public.publishing_tasks(project_id);

-- ============================================================================
-- updated_at TRIGGERS
-- ============================================================================
do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles','workspaces','workspace_members','workspace_apis','projects',
    'scripts','voice_generations','video_generations','editing_tasks','publishing_tasks'
  ]
  loop
    execute format('drop trigger if exists trg_%1$s_updated_at on public.%1$s;', t);
    execute format(
      'create trigger trg_%1$s_updated_at before update on public.%1$s
         for each row execute function public.set_updated_at();', t);
  end loop;
end$$;

-- ============================================================================
-- AUTH: auto-provision a profile row when an auth.users row is created
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- RBAC HELPER FUNCTIONS (SECURITY DEFINER → bypass RLS, prevent recursion)
-- ============================================================================

-- Set of workspace ids the current user actively belongs to.
create or replace function public.auth_workspace_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select workspace_id
  from public.workspace_members
  where user_id = auth.uid()
    and status = 'active'
$$;

-- True when current user has one of the given roles in the workspace.
create or replace function public.has_workspace_role(p_workspace_id uuid, p_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members
    where workspace_id = p_workspace_id
      and user_id = auth.uid()
      and status = 'active'
      and role = any(p_roles)
  )
$$;

-- True when current user is the platform owner flag-holder.
create or replace function public.is_platform_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select is_platform_owner from public.profiles where id = auth.uid()),
    false
  )
$$;

-- Resolve the workspace id for a given project (RLS-safe).
create or replace function public.project_workspace_id(p_project_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select workspace_id from public.projects where id = p_project_id
$$;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
alter table public.profiles            enable row level security;
alter table public.workspaces          enable row level security;
alter table public.workspace_members   enable row level security;
alter table public.workspace_apis      enable row level security;
alter table public.projects            enable row level security;
alter table public.project_stages      enable row level security;
alter table public.scripts             enable row level security;
alter table public.voice_generations   enable row level security;
alter table public.video_generations   enable row level security;
alter table public.editing_tasks       enable row level security;
alter table public.publishing_tasks    enable row level security;

-- PROFILES: a user sees own profile + profiles of co-members in shared workspaces.
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select using (
    id = auth.uid()
    or is_platform_owner()
    or exists (
      select 1 from public.workspace_members m
      where m.user_id = profiles.id
        and m.workspace_id in (select public.auth_workspace_ids())
    )
  );

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- WORKSPACES: members + owner + platform owner can read; owner/platform-owner manage.
drop policy if exists workspaces_select on public.workspaces;
create policy workspaces_select on public.workspaces
  for select using (
    id in (select public.auth_workspace_ids())
    or owner_id = auth.uid()
    or is_platform_owner()
  );

drop policy if exists workspaces_insert on public.workspaces;
create policy workspaces_insert on public.workspaces
  for insert with check (owner_id = auth.uid() or is_platform_owner());

drop policy if exists workspaces_update on public.workspaces;
create policy workspaces_update on public.workspaces
  for update using (owner_id = auth.uid() or is_platform_owner())
  with check (owner_id = auth.uid() or is_platform_owner());

drop policy if exists workspaces_delete on public.workspaces;
create policy workspaces_delete on public.workspaces
  for delete using (owner_id = auth.uid() or is_platform_owner());

-- WORKSPACE MEMBERS
drop policy if exists members_select on public.workspace_members;
create policy members_select on public.workspace_members
  for select using (
    user_id = auth.uid()
    or workspace_id in (select public.auth_workspace_ids())
    or is_platform_owner()
  );

drop policy if exists members_write on public.workspace_members;
create policy members_write on public.workspace_members
  for all using (
    has_workspace_role(workspace_id, array['owner','admin'])
    or is_platform_owner()
  )
  with check (
    has_workspace_role(workspace_id, array['owner','admin'])
    or is_platform_owner()
  );

-- WORKSPACE APIS (secrets): owner/admin only; never exposed via anon reads of key.
drop policy if exists apis_select on public.workspace_apis;
create policy apis_select on public.workspace_apis
  for select using (
    has_workspace_role(workspace_id, array['owner','admin'])
    or is_platform_owner()
  );

drop policy if exists apis_write on public.workspace_apis;
create policy apis_write on public.workspace_apis
  for all using (
    has_workspace_role(workspace_id, array['owner','admin'])
    or is_platform_owner()
  )
  with check (
    has_workspace_role(workspace_id, array['owner','admin'])
    or is_platform_owner()
  );

-- PROJECTS: any active member can read; owner/admin/user can create/update; delete owner/admin.
drop policy if exists projects_select on public.projects;
create policy projects_select on public.projects
  for select using (
    workspace_id in (select public.auth_workspace_ids())
    or is_platform_owner()
  );

drop policy if exists projects_insert on public.projects;
create policy projects_insert on public.projects
  for insert with check (
    has_workspace_role(workspace_id, array['owner','admin','user'])
  );

drop policy if exists projects_update on public.projects;
create policy projects_update on public.projects
  for update using (
    has_workspace_role(workspace_id, array['owner','admin'])
    or (has_workspace_role(workspace_id, array['user']) and created_by = auth.uid())
  )
  with check (
    workspace_id in (select public.auth_workspace_ids())
  );

drop policy if exists projects_delete on public.projects;
create policy projects_delete on public.projects
  for delete using (
    has_workspace_role(workspace_id, array['owner','admin'])
    or (has_workspace_role(workspace_id, array['user']) and created_by = auth.uid())
  );

-- Child tables of a project share the project's workspace membership for access.
-- A reusable policy body via project_workspace_id().
drop policy if exists project_stages_all on public.project_stages;
create policy project_stages_all on public.project_stages
  for all using (
    public.project_workspace_id(project_id) in (select public.auth_workspace_ids())
    or is_platform_owner()
  )
  with check (
    public.project_workspace_id(project_id) in (select public.auth_workspace_ids())
  );

drop policy if exists scripts_all on public.scripts;
create policy scripts_all on public.scripts
  for all using (
    public.project_workspace_id(project_id) in (select public.auth_workspace_ids())
    or is_platform_owner()
  )
  with check (
    public.project_workspace_id(project_id) in (select public.auth_workspace_ids())
  );

drop policy if exists voice_generations_all on public.voice_generations;
create policy voice_generations_all on public.voice_generations
  for all using (
    public.project_workspace_id(project_id) in (select public.auth_workspace_ids())
    or is_platform_owner()
  )
  with check (
    public.project_workspace_id(project_id) in (select public.auth_workspace_ids())
  );

drop policy if exists video_generations_all on public.video_generations;
create policy video_generations_all on public.video_generations
  for all using (
    public.project_workspace_id(project_id) in (select public.auth_workspace_ids())
    or is_platform_owner()
  )
  with check (
    public.project_workspace_id(project_id) in (select public.auth_workspace_ids())
  );

drop policy if exists editing_tasks_all on public.editing_tasks;
create policy editing_tasks_all on public.editing_tasks
  for all using (
    public.project_workspace_id(project_id) in (select public.auth_workspace_ids())
    or is_platform_owner()
  )
  with check (
    public.project_workspace_id(project_id) in (select public.auth_workspace_ids())
  );

drop policy if exists publishing_tasks_all on public.publishing_tasks;
create policy publishing_tasks_all on public.publishing_tasks
  for all using (
    public.project_workspace_id(project_id) in (select public.auth_workspace_ids())
    or is_platform_owner()
  )
  with check (
    public.project_workspace_id(project_id) in (select public.auth_workspace_ids())
  );
