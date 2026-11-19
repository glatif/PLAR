-- People management for admins (project lead, 2026-11-19): from the admin portal, add people with
-- their roles, change roles, reset passwords, deactivate and reactivate people, sign them out
-- everywhere, edit their details and delete people who have no records. The web app only has the publishable key, so these are
-- security-definer functions that first check the caller is an admin. Every change is written to
-- public.admin_events. A reset or a new account makes the person choose a new password at sign-in.

-- ---------------------------------------------------------------------------
-- Audit log of admin changes
-- ---------------------------------------------------------------------------
create table public.admin_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles (id) on delete set null,
  target_id uuid references public.profiles (id) on delete set null,
  action text not null,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
comment on table public.admin_events is 'Who changed which person''s account or roles, and when. Written only by the admin functions.';
create index admin_events_actor_id_idx on public.admin_events (actor_id);
create index admin_events_target_id_idx on public.admin_events (target_id);
create index admin_events_created_at_idx on public.admin_events (created_at desc);

revoke all on public.admin_events from anon, authenticated;
grant select on public.admin_events to authenticated;
alter table public.admin_events enable row level security;
create policy "Admin events: admins read"
  on public.admin_events for select to authenticated
  using ((select private.has_role('admin')));

-- ---------------------------------------------------------------------------
-- Private helpers
-- ---------------------------------------------------------------------------
create function private.require_admin()
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.has_role('admin') then
    raise exception 'Only an admin can do this' using errcode = '42501';
  end if;
end;
$$;

-- Keeps the person's name and email with the entry, so the history still reads well after a deletion.
create function private.log_admin_event(p_target uuid, p_action text, p_detail jsonb default '{}'::jsonb)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.admin_events (actor_id, target_id, action, detail)
  values ((select auth.uid()), p_target, p_action,
          coalesce((select jsonb_build_object('name', full_name, 'email', email) from public.profiles where id = p_target), '{}'::jsonb)
            || coalesce(p_detail, '{}'::jsonb));
$$;

create function private.check_password(p_password text)
returns void
language plpgsql
immutable
set search_path = ''
as $$
begin
  if length(coalesce(p_password, '')) < 8 then
    raise exception 'The password needs at least 8 characters' using errcode = '22023';
  end if;
end;
$$;

-- Ends every session the person has, on every device.
create function private.end_sessions(p_user uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  delete from auth.refresh_tokens where user_id = p_user::text;
  delete from auth.sessions where user_id = p_user;
$$;

create function private.require_person(p_user uuid)
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not exists (select 1 from public.profiles where id = p_user) then
    raise exception 'That person doesn''t exist' using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function private.require_admin() from public;
revoke all on function private.log_admin_event(uuid, text, jsonb) from public;
revoke all on function private.check_password(text) from public;
revoke all on function private.end_sessions(uuid) from public;
revoke all on function private.require_person(uuid) from public;

-- ---------------------------------------------------------------------------
-- Admin functions (called from the portal through the REST API)
-- ---------------------------------------------------------------------------

-- Everyone who has a profile, with their roles and account state.
create function public.admin_list_people()
returns table (
  id uuid,
  email text,
  full_name text,
  roles public.app_role[],
  can_sign_in boolean,
  active boolean,
  must_change_password boolean,
  created_at timestamptz,
  last_sign_in_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform private.require_admin();
  return query
  select p.id, p.email, p.full_name,
         coalesce(array_agg(ra.role order by ra.role) filter (where ra.role is not null), '{}')::public.app_role[],
         coalesce(u.encrypted_password, '') <> '',
         u.banned_until is null or u.banned_until < now(),
         coalesce((u.raw_app_meta_data ->> 'must_change_password')::boolean, false),
         p.created_at,
         u.last_sign_in_at
  from public.profiles p
  join auth.users u on u.id = p.id
  left join public.role_assignments ra on ra.user_id = p.id
  group by p.id, u.id
  order by p.full_name;
end;
$$;

-- Adds a person who can sign in with email and a temporary password. They choose their own at first sign-in.
create function public.admin_create_person(p_email text, p_full_name text, p_roles public.app_role[], p_password text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid := gen_random_uuid();
  v_email text := lower(trim(coalesce(p_email, '')));
  v_name text := trim(coalesce(p_full_name, ''));
begin
  perform private.require_admin();
  if v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'Enter a valid email address' using errcode = '22023';
  end if;
  if v_name = '' then
    raise exception 'Enter the person''s name' using errcode = '22023';
  end if;
  if coalesce(array_length(p_roles, 1), 0) = 0 then
    raise exception 'Choose at least one role' using errcode = '22023';
  end if;
  perform private.check_password(p_password);
  if exists (select 1 from auth.users where lower(email) = v_email) then
    raise exception 'Someone already has that email address' using errcode = '23505';
  end if;

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) values (
    '00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated', v_email,
    extensions.crypt(p_password, extensions.gen_salt('bf')), now(),
    jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email'), 'must_change_password', true),
    jsonb_build_object('full_name', v_name), now(), now(), '', '', '', ''
  );
  insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (gen_random_uuid(), v_id, v_id::text,
          jsonb_build_object('sub', v_id::text, 'email', v_email, 'email_verified', true),
          'email', null, now(), now());

  insert into public.role_assignments (user_id, role, granted_by)
  select v_id, r, (select auth.uid()) from unnest(p_roles) as r
  on conflict (user_id, role) do nothing;

  perform private.log_admin_event(v_id, 'person_added', jsonb_build_object('email', v_email, 'roles', to_jsonb(p_roles)));
  return v_id;
end;
$$;

-- Replaces a person's roles (promote, change or remove roles). Admins can't remove their own admin role.
create function public.admin_set_roles(p_user uuid, p_roles public.app_role[])
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_before public.app_role[];
begin
  perform private.require_admin();
  perform private.require_person(p_user);
  if coalesce(array_length(p_roles, 1), 0) = 0 then
    raise exception 'Choose at least one role' using errcode = '22023';
  end if;
  if p_user = (select auth.uid()) and not ('admin' = any (p_roles)) then
    raise exception 'You can''t remove your own admin role' using errcode = '42501';
  end if;

  select coalesce(array_agg(role order by role), '{}') into v_before from public.role_assignments where user_id = p_user;
  delete from public.role_assignments where user_id = p_user and role <> all (p_roles);
  insert into public.role_assignments (user_id, role, granted_by)
  select p_user, r, (select auth.uid()) from unnest(p_roles) as r
  on conflict (user_id, role) do nothing;

  perform private.log_admin_event(p_user, 'roles_changed',
    jsonb_build_object('before', to_jsonb(v_before), 'after', to_jsonb((select array_agg(r order by r) from unnest(p_roles) as r))));
end;
$$;

-- Sets a temporary password, signs the person out everywhere and makes them choose a new one at sign-in.
create function public.admin_reset_password(p_user uuid, p_password text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.require_admin();
  perform private.require_person(p_user);
  perform private.check_password(p_password);

  update auth.users
  set encrypted_password = extensions.crypt(p_password, extensions.gen_salt('bf')),
      email_confirmed_at = coalesce(email_confirmed_at, now()),
      raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"must_change_password": true}'::jsonb,
      updated_at = now()
  where id = p_user;

  -- People added without a sign-in (some synthetic students) need an email identity to sign in.
  insert into auth.identities (id, user_id, provider_id, identity_data, provider, created_at, updated_at)
  select gen_random_uuid(), u.id, u.id::text,
         jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true), 'email', now(), now()
  from auth.users u
  where u.id = p_user and not exists (select 1 from auth.identities i where i.user_id = u.id and i.provider = 'email');

  perform private.end_sessions(p_user);
  perform private.log_admin_event(p_user, 'password_reset');
end;
$$;

-- Deactivates (can't sign in, signed out everywhere) or reactivates a person. Their records stay.
create function public.admin_set_active(p_user uuid, p_active boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.require_admin();
  perform private.require_person(p_user);
  if p_user = (select auth.uid()) and not p_active then
    raise exception 'You can''t deactivate yourself' using errcode = '42501';
  end if;

  -- A far-future date rather than 'infinity', which the auth service can't read.
  update auth.users
  set banned_until = case when p_active then null else timestamptz '2999-12-31 00:00:00+00' end,
      updated_at = now()
  where id = p_user;
  if not p_active then
    perform private.end_sessions(p_user);
  end if;

  perform private.log_admin_event(p_user, case when p_active then 'reactivated' else 'deactivated' end);
end;
$$;

-- Signs a person out on every device.
create function public.admin_sign_out_everywhere(p_user uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.require_admin();
  perform private.require_person(p_user);
  perform private.end_sessions(p_user);
  perform private.log_admin_event(p_user, 'signed_out_everywhere');
end;
$$;

-- Changes a person's name or email address.
create function public.admin_update_person(p_user uuid, p_full_name text, p_email text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text := lower(trim(coalesce(p_email, '')));
  v_name text := trim(coalesce(p_full_name, ''));
  v_old record;
begin
  perform private.require_admin();
  perform private.require_person(p_user);
  if v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'Enter a valid email address' using errcode = '22023';
  end if;
  if v_name = '' then
    raise exception 'Enter the person''s name' using errcode = '22023';
  end if;
  if exists (select 1 from auth.users where lower(email) = v_email and id <> p_user) then
    raise exception 'Someone else already has that email address' using errcode = '23505';
  end if;

  select email, full_name into v_old from public.profiles where id = p_user;
  update auth.users
  set email = v_email,
      raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('full_name', v_name),
      updated_at = now()
  where id = p_user;
  update auth.identities
  set identity_data = identity_data || jsonb_build_object('email', v_email), updated_at = now()
  where user_id = p_user and provider = 'email';
  update public.profiles set email = v_email, full_name = v_name where id = p_user;

  perform private.log_admin_event(p_user, 'details_changed', jsonb_build_object(
    'before', jsonb_build_object('email', v_old.email, 'name', v_old.full_name),
    'after', jsonb_build_object('email', v_email, 'name', v_name)));
end;
$$;

-- Permanently removes a person who has no case records (for example someone added by mistake).
-- People with cases are deactivated instead, so their history stays.
create function public.admin_delete_person(p_user uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.require_admin();
  perform private.require_person(p_user);
  if p_user = (select auth.uid()) then
    raise exception 'You can''t delete yourself' using errcode = '42501';
  end if;
  if exists (select 1 from public.cases where student_id = p_user or advisor_id = p_user)
     or exists (select 1 from public.case_assessors where assessor_id = p_user)
     or exists (select 1 from public.tasks where assignee_id = p_user) then
    raise exception 'This person has case records. Deactivate them instead, so their history stays.' using errcode = '23503';
  end if;

  perform private.log_admin_event(p_user, 'person_deleted');
  delete from auth.users where id = p_user;
end;
$$;

-- The signed-in person has chosen a new password: stop asking them to.
create function public.complete_password_change()
returns void
language sql
security definer
set search_path = ''
as $$
  update auth.users
  set raw_app_meta_data = raw_app_meta_data - 'must_change_password', updated_at = now()
  where id = (select auth.uid());
$$;

-- Only signed-in people can call these (each admin function checks the admin role itself).
revoke all on function public.admin_list_people() from public, anon;
revoke all on function public.admin_create_person(text, text, public.app_role[], text) from public, anon;
revoke all on function public.admin_set_roles(uuid, public.app_role[]) from public, anon;
revoke all on function public.admin_reset_password(uuid, text) from public, anon;
revoke all on function public.admin_set_active(uuid, boolean) from public, anon;
revoke all on function public.admin_sign_out_everywhere(uuid) from public, anon;
revoke all on function public.admin_update_person(uuid, text, text) from public, anon;
revoke all on function public.complete_password_change() from public, anon;
revoke all on function public.admin_delete_person(uuid) from public, anon;
grant execute on function public.admin_list_people() to authenticated;
grant execute on function public.admin_create_person(text, text, public.app_role[], text) to authenticated;
grant execute on function public.admin_set_roles(uuid, public.app_role[]) to authenticated;
grant execute on function public.admin_reset_password(uuid, text) to authenticated;
grant execute on function public.admin_set_active(uuid, boolean) to authenticated;
grant execute on function public.admin_sign_out_everywhere(uuid) to authenticated;
grant execute on function public.admin_update_person(uuid, text, text) to authenticated;
grant execute on function public.complete_password_change() to authenticated;
grant execute on function public.admin_delete_person(uuid) to authenticated;
