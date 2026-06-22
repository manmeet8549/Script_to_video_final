-- Create notifications table and setup RLS policies.
create table if not exists public.notifications (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references public.profiles(id) on delete cascade,
  workspace_id        uuid references public.workspaces(id) on delete cascade,
  type                text not null check (type in ('deadline', 'deadline_reminder', 'edit_request', 'edit_complete', 'edit_rejected', 'publish_complete', 'publish_failed', 'stage_complete', 'mention', 'invite', 'system')),
  title               text not null,
  message             text,
  related_project_id  uuid references public.projects(id) on delete set null,
  related_task_id     uuid references public.editing_tasks(id) on delete set null,
  is_read             boolean not null default false,
  action_url          text,
  created_at          timestamptz not null default now()
);

-- Indexes for performance
create index if not exists idx_notifications_user on public.notifications(user_id);
create index if not exists idx_notifications_ws on public.notifications(workspace_id);

-- Enable RLS
alter table public.notifications enable row level security;

-- Select Policy: Users see own notifications + platform owners see all
drop policy if exists notifications_select on public.notifications;
create policy notifications_select on public.notifications
  for select using (
    user_id = auth.uid()
    or is_platform_owner()
  );

-- Insert Policy: Allow anyone authenticated to insert notifications (e.g. system events)
drop policy if exists notifications_insert on public.notifications;
create policy notifications_insert on public.notifications
  for insert with check (
    auth.uid() is not null
  );

-- Update Policy: Users can mark their own notifications as read
drop policy if exists notifications_update_self on public.notifications;
create policy notifications_update_self on public.notifications
  for update using (
    user_id = auth.uid()
  ) with check (
    user_id = auth.uid()
  );

-- Delete Policy: Users can dismiss their own notifications
drop policy if exists notifications_delete_self on public.notifications;
create policy notifications_delete_self on public.notifications
  for delete using (
    user_id = auth.uid()
  );
