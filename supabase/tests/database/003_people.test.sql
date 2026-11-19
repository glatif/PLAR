-- People management: only admins can add people, change roles, reset passwords and deactivate people;
-- everyone else is refused; the audit log is admin-only. Run with `server/plar-api.sh test`. Rolls back.
begin;
create extension if not exists pgtap with schema extensions;
select plan(20);

select has_table('public', 'admin_events', 'admin_events table exists');
select ok((select relrowsecurity from pg_class where oid = 'public.admin_events'::regclass), 'RLS is on for admin_events');

-- One synthetic admin and one synthetic advisor.
insert into auth.users (instance_id, id, aud, role, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-000000000000', '33333333-3333-4333-8333-000000000001', 'authenticated', 'authenticated', 'people-admin@example.test', '{"full_name":"People Admin"}'),
  ('00000000-0000-0000-0000-000000000000', '33333333-3333-4333-8333-000000000002', 'authenticated', 'authenticated', 'people-advisor@example.test', '{"full_name":"People Advisor"}');
insert into public.role_assignments (user_id, role) values
  ('33333333-3333-4333-8333-000000000001', 'admin'),
  ('33333333-3333-4333-8333-000000000002', 'advisor');

create function pg_temp.new_id() returns uuid language sql as $$
  select id from public.profiles where email = 'new-person@example.test'
$$;

set local role authenticated;

-- As the advisor: refused everywhere.
select set_config('request.jwt.claims', '{"sub":"33333333-3333-4333-8333-000000000002","role":"authenticated"}', true);
select throws_ok($$ select * from public.admin_list_people() $$, '42501', null, 'an advisor cannot list people');
select throws_ok($$ select public.admin_create_person('x@example.test', 'X', array['student']::public.app_role[], 'temporary-pass') $$,
  '42501', null, 'an advisor cannot add people');
select throws_ok($$ select public.admin_set_roles('33333333-3333-4333-8333-000000000002', array['admin']::public.app_role[]) $$,
  '42501', null, 'an advisor cannot promote themselves');
select is((select count(*)::int from public.admin_events), 0, 'an advisor cannot read the audit log');

-- As the admin.
select set_config('request.jwt.claims', '{"sub":"33333333-3333-4333-8333-000000000001","role":"authenticated"}', true);
select lives_ok($$ select public.admin_create_person('New-Person@example.test', 'New Person', array['assessor']::public.app_role[], 'temporary-pass') $$,
  'an admin can add a person');
select is((select roles from public.admin_list_people() where email = 'new-person@example.test'), array['assessor']::public.app_role[],
  'the new person has the chosen role, and the email is stored in lower case');
select is((select must_change_password from public.admin_list_people() where email = 'new-person@example.test'), true,
  'a new person must choose their own password at first sign-in');
select throws_ok($$ select public.admin_create_person('new-person@example.test', 'Again', array['student']::public.app_role[], 'temporary-pass') $$,
  '23505', null, 'the same email cannot be added twice');
select throws_ok($$ select public.admin_create_person('short@example.test', 'Short', array['student']::public.app_role[], 'short') $$,
  '22023', null, 'a password under 8 characters is refused');

select lives_ok($$ select public.admin_set_roles(pg_temp.new_id(), array['assessor', 'manager']::public.app_role[]) $$, 'an admin can promote a person');
select throws_ok($$ select public.admin_set_roles('33333333-3333-4333-8333-000000000001', array['manager']::public.app_role[]) $$,
  '42501', null, 'an admin cannot remove their own admin role');

select public.admin_set_active(pg_temp.new_id(), false);
select is((select active from public.admin_list_people() where email = 'new-person@example.test'), false, 'an admin can deactivate a person');
select throws_ok($$ select public.admin_set_active('33333333-3333-4333-8333-000000000001', false) $$,
  '42501', null, 'an admin cannot deactivate themselves');

select is((select count(*)::int from public.admin_events where target_id = pg_temp.new_id()), 3, 'each change is in the audit log');

select throws_ok($$ select public.admin_delete_person('33333333-3333-4333-8333-000000000001') $$,
  '42501', null, 'an admin cannot delete themselves');
select lives_ok($$ select public.admin_delete_person(pg_temp.new_id()) $$, 'an admin can delete a person with no case records');
select is((select count(*)::int from public.profiles where email = 'new-person@example.test'), 0, 'the deleted person is gone');

-- Signed out: the functions can't be called at all.
reset role;
set local role anon;
select throws_ok($$ select * from public.admin_list_people() $$, '42501', null, 'signed-out visitors cannot call the admin functions');

select * from finish();
rollback;
