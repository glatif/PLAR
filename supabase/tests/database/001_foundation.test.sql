-- Foundation tests: structure, the sign-up trigger and row-level security per role.
-- Run with `npm run test:db` in harness/ (local stack only). Everything rolls back.
begin;
create extension if not exists pgtap with schema extensions;
select plan(11);

-- Structure
select has_table('public', 'profiles', 'profiles table exists');
select has_table('public', 'role_assignments', 'role_assignments table exists');
select ok((select relrowsecurity from pg_class where oid = 'public.profiles'::regclass), 'RLS is on for profiles');
select ok((select relrowsecurity from pg_class where oid = 'public.role_assignments'::regclass), 'RLS is on for role_assignments');

-- Two synthetic test users
insert into auth.users (instance_id, id, aud, role, email, raw_user_meta_data)
values
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-4111-8111-111111111111', 'authenticated', 'authenticated', 'test-student@example.test', '{"full_name":"Test Student"}'),
  ('00000000-0000-0000-0000-000000000000', '22222222-2222-4222-8222-222222222222', 'authenticated', 'authenticated', 'test-admin@example.test', '{"full_name":"Test Admin"}');

select is(
  (select full_name from public.profiles where id = '11111111-1111-4111-8111-111111111111'),
  'Test Student',
  'a profile is created when an auth user is created'
);

insert into public.role_assignments (user_id, role) values
  ('11111111-1111-4111-8111-111111111111', 'student'),
  ('22222222-2222-4222-8222-222222222222', 'admin');

-- As the student
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}', true);

select is((select count(*)::int from public.profiles), 1, 'a student sees only their own profile');
select is((select count(*)::int from public.role_assignments), 1, 'a student sees only their own roles');
select throws_ok(
  $$ insert into public.role_assignments (user_id, role) values ('11111111-1111-4111-8111-111111111111', 'admin') $$,
  '42501', null, 'a student cannot grant themselves a role'
);
select throws_ok(
  $$ update public.profiles set email = 'changed@example.test' where id = '11111111-1111-4111-8111-111111111111' $$,
  '42501', null, 'email cannot be changed by the user'
);

-- As the admin
select set_config('request.jwt.claims', '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}', true);
select ok((select count(*) from public.profiles) >= 2, 'an admin sees every profile');

-- Signed out
reset role;
set local role anon;
select throws_ok($$ select * from public.profiles $$, '42501', null, 'signed-out visitors have no access to profiles');

select * from finish();
rollback;
