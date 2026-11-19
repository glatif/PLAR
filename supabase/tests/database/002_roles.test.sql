-- The six roles, and who oversees every case. Run with `npm run test:db` in harness/ (local stack only).
-- Everything rolls back.
begin;
create extension if not exists pgtap with schema extensions;
select plan(8);

select enum_has_labels('public', 'app_role', array['student', 'advisor', 'assessor', 'manager', 'director', 'admin'],
  'there are exactly six roles, and no separate coordinator');

-- One synthetic person per role, and one case advised by the advisor.
insert into auth.users (instance_id, id, aud, role, email, raw_user_meta_data)
select '00000000-0000-0000-0000-000000000000', v.id::uuid, 'authenticated', 'authenticated', v.role || '@example.test', jsonb_build_object('full_name', v.role)
from (values
  ('11111111-1111-4111-8111-000000000001', 'student'),
  ('11111111-1111-4111-8111-000000000002', 'advisor'),
  ('11111111-1111-4111-8111-000000000003', 'assessor'),
  ('11111111-1111-4111-8111-000000000004', 'manager'),
  ('11111111-1111-4111-8111-000000000005', 'director'),
  ('11111111-1111-4111-8111-000000000006', 'admin')
) as v (id, role);
insert into public.role_assignments (user_id, role)
select id, split_part(email, '@', 1)::public.app_role from auth.users where email like '%@example.test';

insert into public.programs (id, code, name) values ('22222222-2222-4222-8222-000000000001', 'TST', 'Test program');
insert into public.cases (reference, student_id, advisor_id, program_id, credit_level, stage)
values ('TEST-1', '11111111-1111-4111-8111-000000000001', '11111111-1111-4111-8111-000000000002', '22222222-2222-4222-8222-000000000001', 'lower', 'feedback');

create function pg_temp.cases_seen_by(person uuid) returns int language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', person, 'role', 'authenticated')::text, true);
  return (select count(*) from public.cases where reference = 'TEST-1');
end $$;

set local role authenticated;

select is(pg_temp.cases_seen_by('11111111-1111-4111-8111-000000000001'), 1, 'the student sees their own case');
select is(pg_temp.cases_seen_by('11111111-1111-4111-8111-000000000002'), 1, 'the advisor sees a case they advise');
select is(pg_temp.cases_seen_by('11111111-1111-4111-8111-000000000003'), 0, 'an assessor does not see a case they are not assigned to');
select is(pg_temp.cases_seen_by('11111111-1111-4111-8111-000000000004'), 1, 'the manager sees every case');
select is(pg_temp.cases_seen_by('11111111-1111-4111-8111-000000000005'), 1, 'the director sees every case');
select is(pg_temp.cases_seen_by('11111111-1111-4111-8111-000000000006'), 1, 'the admin sees every case');

select set_config('request.jwt.claims', '{"sub":"11111111-1111-4111-8111-000000000004","role":"authenticated"}', true);
select throws_ok(
  $$ insert into public.role_assignments (user_id, role) values ('11111111-1111-4111-8111-000000000004', 'admin') $$,
  '42501', null, 'a manager cannot grant roles (only admins can)'
);

select * from finish();
rollback;
