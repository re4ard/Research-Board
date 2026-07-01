create or replace function public.create_project_with_owner(
  project_name text,
  project_description text default ''
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_project_id uuid;
begin
  if auth.uid() is null then
    raise exception 'You must be signed in to create a project.';
  end if;

  insert into public.projects (
    name,
    description,
    owner_id
  )
  values (
    project_name,
    coalesce(project_description, ''),
    auth.uid()
  )
  returning id into new_project_id;

  insert into public.project_members (
    project_id,
    user_id,
    role
  )
  values (
    new_project_id,
    auth.uid(),
    'owner'
  )
  on conflict (project_id, user_id) do nothing;

  return new_project_id;
end;
$$;

create or replace function public.delete_current_user()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'You must be signed in to delete your account.';
  end if;

  delete from auth.users
  where id = auth.uid();
end;
$$;

grant execute on function public.create_project_with_owner(text, text) to authenticated;
grant execute on function public.delete_current_user() to authenticated;
