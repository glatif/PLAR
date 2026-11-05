-- Foundation: a private helper schema, the role list, profiles and role assignments.
-- Every table has row-level security on, and access is denied unless a policy allows it.
-- The full case schema (cases, sections, documents, audit) follows in the week 2 migrations.

-- ---------------------------------------------------------------------------
-- Private schema: helpers used by policies and triggers. Not exposed by the API.
-- ---------------------------------------------------------------------------
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated, service_role;

-- Keeps updated_at current on any table that has it.
create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Roles in the PLAR process. One person can hold several.
-- ---------------------------------------------------------------------------
create type public.app_role as enum (
  'student',
  'advisor',
  'coordinator',
  'assessor',
  'manager',
  'director',
  'admin'
);

-- ---------------------------------------------------------------------------
-- Profiles: one row per person who can sign in, created from auth.users.
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text not null default '',
  preferred_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.profiles is 'One row per person who can sign in. Created automatically when an auth user is created.';

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- Role assignments: what each person may do.
-- ---------------------------------------------------------------------------
create table public.role_assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.app_role not null,
  granted_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
comment on table public.role_assignments is 'The roles each person holds. Only admins can grant or remove them.';

create index role_assignments_granted_by_idx on public.role_assignments (granted_by);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

-- True when the signed-in person holds the role. Security definer so policies
-- can call it without recursing through role_assignments' own policies.
create or replace function private.has_role(check_role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.role_assignments ra
    where ra.user_id = (select auth.uid())
      and ra.role = check_role
  );
$$;
revoke all on function private.has_role(public.app_role) from public;
grant execute on function private.has_role(public.app_role) to authenticated, service_role;

-- Creates the profile when an auth user is created (sign-up, invite or seed).
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  );
  return new;
end;
$$;
revoke all on function private.handle_new_user() from public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- ---------------------------------------------------------------------------
-- Privileges and row-level security
-- ---------------------------------------------------------------------------
revoke all on public.profiles, public.role_assignments from anon;

-- People may change their own name fields, never their email or id.
revoke update on public.profiles from authenticated;
grant update (full_name, preferred_name) on public.profiles to authenticated;

alter table public.profiles enable row level security;
alter table public.role_assignments enable row level security;

-- Profiles: people read their own; admins read everyone's.
create policy "Profiles: read own, admins read all"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select private.has_role('admin')));

create policy "Profiles: update own"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Roles: people read their own; only admins grant or remove.
create policy "Roles: read own, admins read all"
  on public.role_assignments for select to authenticated
  using (user_id = (select auth.uid()) or (select private.has_role('admin')));

create policy "Roles: admins grant"
  on public.role_assignments for insert to authenticated
  with check ((select private.has_role('admin')));

create policy "Roles: admins remove"
  on public.role_assignments for delete to authenticated
  using ((select private.has_role('admin')));
