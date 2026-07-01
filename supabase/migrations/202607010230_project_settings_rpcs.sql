create or replace function public.update_project_details(
  project_id_param uuid,
  project_name text,
  project_description text default ''
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'You must be signed in to update a project.';
  end if;

  if not exists (
    select 1
    from public.project_members
    where project_id = project_id_param
      and user_id = auth.uid()
      and role in ('owner', 'admin')
  ) then
    raise exception 'Only project owners and admins can update project settings.';
  end if;

  update public.projects
  set
    name = project_name,
    description = coalesce(project_description, ''),
    updated_at = now()
  where id = project_id_param;
end;
$$;

create or replace function public.delete_project(project_id_param uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'You must be signed in to delete a project.';
  end if;

  if not exists (
    select 1
    from public.project_members
    where project_id = project_id_param
      and user_id = auth.uid()
      and role in ('owner', 'admin')
  ) then
    raise exception 'Only project owners and admins can delete projects.';
  end if;

  delete from public.projects
  where id = project_id_param;
end;
$$;

grant execute on function public.update_project_details(uuid, text, text) to authenticated;
grant execute on function public.delete_project(uuid) to authenticated;
