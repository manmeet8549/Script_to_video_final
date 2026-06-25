-- Fix projects update policy so it matches the documented intent
-- ("owner/admin/user can create/update") and the pipeline UX.
--
-- The original policy only let a 'user' update projects they personally
-- created (created_by = auth.uid()). A user working a project that was
-- assigned to them by an admin — or any non-creator member progressing the
-- pipeline (e.g. saving a script, which PATCHes status -> 'scripting') — was
-- denied. The denied UPDATE affected 0 rows, so the DAL's `.single()` threw and
-- the route returned a 500.
--
-- New rule: any active owner/admin/user member of the workspace can update a
-- project, plus the project's assignee (covers assigned editors). Tenant
-- isolation is still enforced by the with-check on workspace_id.
drop policy if exists projects_update on public.projects;
create policy projects_update on public.projects
  for update using (
    has_workspace_role(workspace_id, array['owner','admin','user'])
    or assigned_to = auth.uid()
  )
  with check (
    workspace_id in (select public.auth_workspace_ids())
  );
