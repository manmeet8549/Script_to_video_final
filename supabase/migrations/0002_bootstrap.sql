-- ============================================================================
-- 0002_bootstrap.sql
-- Onboarding helper: promote an existing account to platform owner and give it
-- a workspace with an 'owner' membership. Run AFTER the user has signed up.
--
-- Usage (SQL editor / psql, as the service role):
--   select public.bootstrap_owner('you@example.com', 'My Company', 'my-company');
-- ============================================================================

create or replace function public.bootstrap_owner(
  p_email           text,
  p_workspace_name  text default 'My Workspace',
  p_workspace_slug  text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id      uuid;
  v_slug         text;
  v_workspace_id uuid;
begin
  select id into v_user_id from public.profiles where email = lower(p_email);
  if v_user_id is null then
    raise exception 'No profile found for %. Sign up first, then re-run.', p_email;
  end if;

  update public.profiles set is_platform_owner = true where id = v_user_id;

  v_slug := coalesce(
    p_workspace_slug,
    regexp_replace(lower(p_workspace_name), '[^a-z0-9]+', '-', 'g')
  );

  insert into public.workspaces (name, slug, owner_id)
  values (p_workspace_name, v_slug, v_user_id)
  returning id into v_workspace_id;

  insert into public.workspace_members (workspace_id, user_id, role, status)
  values (v_workspace_id, v_user_id, 'owner', 'active')
  on conflict (workspace_id, user_id) do update set role = 'owner', status = 'active';

  return v_workspace_id;
end;
$$;

revoke all on function public.bootstrap_owner(text, text, text) from public, anon, authenticated;
