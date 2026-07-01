create extension if not exists pgcrypto;

create type public.member_role as enum ('owner', 'admin', 'member');
create type public.article_status as enum (
  'to_read',
  'reading',
  'done',
  'used_in_draft'
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text not null,
  avatar_url text,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, avatar_url)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(coalesce(new.email, ''), '@', 1), 'New teammate'),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do update
  set
    email = excluded.email,
    name = excluded.name,
    avatar_url = excluded.avatar_url;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  owner_id uuid not null references public.profiles(id) on delete cascade,
  invite_slug text unique not null default encode(gen_random_bytes(12), 'hex'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.project_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.member_role not null default 'member',
  created_at timestamptz not null default now(),
  unique (project_id, user_id)
);

create table public.project_invites (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  email text,
  token text unique not null default encode(gen_random_bytes(24), 'hex'),
  role public.member_role not null default 'member',
  expires_at timestamptz not null default now() + interval '14 days',
  accepted_at timestamptz,
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  url text not null,
  normalized_url text not null,
  title text not null,
  description text not null default '',
  favicon_url text,
  image_url text,
  site_name text,
  status public.article_status not null default 'to_read',
  summary text not null default '',
  main_idea text not null default '',
  facts jsonb not null default '[]'::jsonb,
  added_by uuid not null references public.profiles(id) on delete restrict,
  search_vector tsvector generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(summary, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(main_idea, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(facts::text, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(url, '')), 'C')
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, normalized_url)
);

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  color text not null default '#6f826a',
  created_at timestamptz not null default now(),
  unique (project_id, lower(name))
);

create table public.bookmark_tags (
  bookmark_id uuid not null references public.bookmarks(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key (bookmark_id, tag_id)
);

create table public.bookmark_comments (
  id uuid primary key default gen_random_uuid(),
  bookmark_id uuid not null references public.bookmarks(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index bookmarks_project_status_idx on public.bookmarks(project_id, status);
create index bookmarks_search_idx on public.bookmarks using gin(search_vector);
create index tags_project_name_idx on public.tags(project_id, name);
create index comments_bookmark_created_idx on public.bookmark_comments(bookmark_id, created_at);

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.project_invites enable row level security;
alter table public.bookmarks enable row level security;
alter table public.tags enable row level security;
alter table public.bookmark_tags enable row level security;
alter table public.bookmark_comments enable row level security;

create or replace function public.is_project_member(target_project_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.project_members
    where project_members.project_id = target_project_id
      and project_members.user_id = auth.uid()
  );
$$;

create or replace function public.is_project_admin(target_project_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.project_members
    where project_members.project_id = target_project_id
      and project_members.user_id = auth.uid()
      and project_members.role in ('owner', 'admin')
  );
$$;

create policy "Profiles are readable by authenticated users"
on public.profiles for select
to authenticated
using (true);

create policy "Users can insert their own profile"
on public.profiles for insert
to authenticated
with check (id = auth.uid());

create policy "Users can update their own profile"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "Members can read projects"
on public.projects for select
to authenticated
using (public.is_project_member(id));

create policy "Authenticated users can create projects"
on public.projects for insert
to authenticated
with check (owner_id = auth.uid());

create policy "Admins can update projects"
on public.projects for update
to authenticated
using (public.is_project_admin(id))
with check (public.is_project_admin(id));

create policy "Members can read project membership"
on public.project_members for select
to authenticated
using (public.is_project_member(project_id));

create policy "Owners and admins can add members"
on public.project_members for insert
to authenticated
with check (public.is_project_admin(project_id));

create policy "Project owners can create their own owner membership"
on public.project_members for insert
to authenticated
with check (
  user_id = auth.uid()
  and role = 'owner'
  and exists (
    select 1
    from public.projects
    where projects.id = project_members.project_id
      and projects.owner_id = auth.uid()
  )
);

create policy "Owners and admins can remove members"
on public.project_members for delete
to authenticated
using (public.is_project_admin(project_id));

create policy "Admins can manage invites"
on public.project_invites for all
to authenticated
using (public.is_project_admin(project_id))
with check (public.is_project_admin(project_id));

create policy "Members can read bookmarks"
on public.bookmarks for select
to authenticated
using (public.is_project_member(project_id));

create policy "Members can add bookmarks"
on public.bookmarks for insert
to authenticated
with check (
  public.is_project_member(project_id)
  and added_by = auth.uid()
);

create policy "Members can update bookmarks"
on public.bookmarks for update
to authenticated
using (public.is_project_member(project_id))
with check (public.is_project_member(project_id));

create policy "Members can delete bookmarks they added or admins can delete"
on public.bookmarks for delete
to authenticated
using (added_by = auth.uid() or public.is_project_admin(project_id));

create policy "Members can read tags"
on public.tags for select
to authenticated
using (public.is_project_member(project_id));

create policy "Members can manage tags"
on public.tags for all
to authenticated
using (public.is_project_member(project_id))
with check (public.is_project_member(project_id));

create policy "Members can read bookmark tags"
on public.bookmark_tags for select
to authenticated
using (
  exists (
    select 1
    from public.bookmarks
    where bookmarks.id = bookmark_tags.bookmark_id
      and public.is_project_member(bookmarks.project_id)
  )
);

create policy "Members can manage bookmark tags"
on public.bookmark_tags for all
to authenticated
using (
  exists (
    select 1
    from public.bookmarks
    where bookmarks.id = bookmark_tags.bookmark_id
      and public.is_project_member(bookmarks.project_id)
  )
)
with check (
  exists (
    select 1
    from public.bookmarks
    where bookmarks.id = bookmark_tags.bookmark_id
      and public.is_project_member(bookmarks.project_id)
  )
);

create policy "Members can read comments"
on public.bookmark_comments for select
to authenticated
using (
  exists (
    select 1
    from public.bookmarks
    where bookmarks.id = bookmark_comments.bookmark_id
      and public.is_project_member(bookmarks.project_id)
  )
);

create policy "Members can add comments"
on public.bookmark_comments for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.bookmarks
    where bookmarks.id = bookmark_comments.bookmark_id
      and public.is_project_member(bookmarks.project_id)
  )
);

create policy "Comment authors can update comments"
on public.bookmark_comments for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

alter publication supabase_realtime add table public.bookmarks;
alter publication supabase_realtime add table public.bookmark_comments;
alter publication supabase_realtime add table public.bookmark_tags;

create or replace function public.get_project_by_invite(invite_slug_param text)
returns table (
  id uuid,
  name text,
  description text
)
language sql
security definer
set search_path = public
stable
as $$
  select projects.id, projects.name, projects.description
  from public.projects
  where projects.invite_slug = invite_slug_param
  limit 1;
$$;

create or replace function public.accept_project_invite(invite_slug_param text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target_project_id uuid;
begin
  if auth.uid() is null then
    raise exception 'You must be signed in to accept an invite.';
  end if;

  select projects.id
  into target_project_id
  from public.projects
  where projects.invite_slug = invite_slug_param
  limit 1;

  if target_project_id is null then
    raise exception 'Invite link is invalid or expired.';
  end if;

  insert into public.project_members (project_id, user_id, role)
  values (target_project_id, auth.uid(), 'member')
  on conflict (project_id, user_id) do nothing;

  return target_project_id;
end;
$$;

grant execute on function public.get_project_by_invite(text) to anon, authenticated;
grant execute on function public.accept_project_invite(text) to authenticated;

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
