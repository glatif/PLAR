-- Six roles: student, advisor, assessor, manager, director and admin (project lead, 2026-11-19).
-- Advisors also book interviews, so the separate coordinator role is retired. Anyone who held it
-- becomes an advisor. Postgres can't drop an enum value, so the type is rebuilt.

-- 1. Coordinators become advisors.
insert into public.role_assignments (user_id, role, granted_by)
select user_id, 'advisor', granted_by from public.role_assignments where role = 'coordinator'
on conflict (user_id, role) do nothing;
delete from public.role_assignments where role = 'coordinator';

-- 2. Drop what depends on the old type: the role helper and the three policies that call it.
drop policy "Roles: read own, admins read all" on public.role_assignments;
drop policy "Roles: admins grant" on public.role_assignments;
drop policy "Roles: admins remove" on public.role_assignments;
drop function private.has_role(public.app_role);

-- 3. Rebuild the type without coordinator.
alter type public.app_role rename to app_role_old;
create type public.app_role as enum ('student', 'advisor', 'assessor', 'manager', 'director', 'admin');
comment on type public.app_role is 'What a person does in PLAR. Advisors also book interviews.';
alter table public.role_assignments alter column role type public.app_role using role::text::public.app_role;
drop type public.app_role_old;

-- 4. Recreate the helper and the policies exactly as before.
create function private.has_role(check_role public.app_role)
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

create policy "Roles: read own, admins read all"
  on public.role_assignments for select to authenticated
  using (user_id = (select auth.uid()) or (select private.has_role('admin')));

create policy "Roles: admins grant"
  on public.role_assignments for insert to authenticated
  with check ((select private.has_role('admin')));

create policy "Roles: admins remove"
  on public.role_assignments for delete to authenticated
  using ((select private.has_role('admin')));

-- 5. Managers, directors and admins oversee every case.
create or replace function private.sees_all_cases()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.role_assignments ra
    where ra.user_id = (select auth.uid())
      and ra.role in ('manager', 'director', 'admin')
  );
$$;
