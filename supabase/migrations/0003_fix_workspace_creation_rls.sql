-- Fix workspace members select and write policies to allow workspace owners to manage memberships.
drop policy if exists members_select on public.workspace_members;
create policy members_select on public.workspace_members
  for select using (
    user_id = auth.uid()
    or workspace_id in (select public.auth_workspace_ids())
    or is_platform_owner()
    or exists (
      select 1 from public.workspaces w
      where w.id = workspace_members.workspace_id
        and w.owner_id = auth.uid()
    )
  );

drop policy if exists members_write on public.workspace_members;
create policy members_write on public.workspace_members
  for all using (
    has_workspace_role(workspace_id, array['owner','admin'])
    or is_platform_owner()
    or exists (
      select 1 from public.workspaces w
      where w.id = workspace_members.workspace_id
        and w.owner_id = auth.uid()
    )
  )
  with check (
    has_workspace_role(workspace_id, array['owner','admin'])
    or is_platform_owner()
    or exists (
      select 1 from public.workspaces w
      where w.id = workspace_members.workspace_id
        and w.owner_id = auth.uid()
    )
  );
