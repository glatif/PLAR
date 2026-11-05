-- Demo data for the hosted dev project (plar-dev). SYNTHETIC ONLY: every person, case and note is made up.
-- Load it with `npm run dev:seed` in harness/. It clears the previous demo data first, so it's safe to rerun.
-- Never load this into a project that holds real student information.
-- Demo sign-ins are listed in harness/DEMO-ACCOUNTS.md.

-- ---------------------------------------------------------------------------
-- 1. Clear previous demo data
-- ---------------------------------------------------------------------------
delete from public.cases;
delete from public.programs;
delete from auth.users where email like '%demo.test';

-- ---------------------------------------------------------------------------
-- 2. People
-- ---------------------------------------------------------------------------
create or replace function pg_temp.demo_user(p_id uuid, p_email text, p_name text, p_password text)
returns uuid
language plpgsql
as $$
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) values (
    '00000000-0000-0000-0000-000000000000', p_id, 'authenticated', 'authenticated', p_email,
    case when p_password is null then '' else extensions.crypt(p_password, extensions.gen_salt('bf')) end,
    now(), '{"provider":"email","providers":["email"]}', jsonb_build_object('full_name', p_name), now(), now(),
    '', '', '', ''
  );
  insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (gen_random_uuid(), p_id, p_id::text,
          jsonb_build_object('sub', p_id::text, 'email', p_email, 'email_verified', true),
          'email', now(), now(), now());
  return p_id;
end;
$$;

-- Accounts you can sign in with: one per role (password in harness/DEMO-ACCOUNTS.md)
create temp table demo_people (key text primary key, id uuid, email text, name text, role public.app_role, can_sign_in boolean);
insert into demo_people values
  ('student',     '00000000-0000-4000-8000-000000000001', 'student@demo.test',     'Alex Morgan',    'student',     true),
  ('advisor',     '00000000-0000-4000-8000-000000000002', 'advisor@demo.test',     'Sam Patel',      'advisor',     true),
  ('advisor2',    '00000000-0000-4000-8000-000000000008', 'advisor2@demo.test',    'Maria Laurent',  'advisor',     true),
  ('chair',       '00000000-0000-4000-8000-000000000003', 'assessor@demo.test',    'Jordan Rivera',  'assessor',    true),
  ('writer',      '00000000-0000-4000-8000-000000000004', 'writer@demo.test',      'Kai Thompson',   'assessor',    true),
  ('coordinator', '00000000-0000-4000-8000-000000000009', 'coordinator@demo.test', 'Dana Whitfield', 'coordinator', true),
  ('manager',     '00000000-0000-4000-8000-000000000005', 'manager@demo.test',     'Lee Chen',       'manager',     true),
  ('director',    '00000000-0000-4000-8000-000000000006', 'director@demo.test',    'Pat Okafor',     'director',    true),
  ('admin',       '00000000-0000-4000-8000-000000000007', 'admin@demo.test',       'Robin Admin',    'admin',       true);

-- Other synthetic students (no sign-in)
insert into demo_people (key, id, email, name, role, can_sign_in)
select s.key, gen_random_uuid(), s.key || '@students.demo.test', s.name, 'student', false
from (values
  ('taylor.brooks', 'Taylor Brooks'), ('priya.nair', 'Priya Nair'), ('liam.oconnor', 'Liam O''Connor'),
  ('mei.wong', 'Mei Wong'), ('daniel.okoro', 'Daniel Okoro'), ('sofia.martins', 'Sofia Martins'),
  ('ethan.clarke', 'Ethan Clarke'), ('aisha.rahman', 'Aisha Rahman'), ('noah.tremblay', 'Noah Tremblay'),
  ('grace.lee', 'Grace Lee'), ('omar.haddad', 'Omar Haddad'), ('chloe.dubois', 'Chloe Dubois'),
  ('ravi.menon', 'Ravi Menon'), ('hannah.fischer', 'Hannah Fischer'), ('marcus.bell', 'Marcus Bell')
) as s (key, name);

select pg_temp.demo_user(p.id, p.email, p.name, case when p.can_sign_in then 'demo1234' end) from demo_people p;

insert into public.role_assignments (user_id, role)
select id, role from demo_people;

-- ---------------------------------------------------------------------------
-- 3. Programs
-- ---------------------------------------------------------------------------
insert into public.programs (code, name) values
  ('BGS', 'Bachelor of General Studies'),
  ('BBA', 'Bachelor of Business Administration'),
  ('BHS', 'Bachelor of Health Science'),
  ('BTM', 'Bachelor of Tourism Management'),
  ('BA',  'Bachelor of Arts');

-- ---------------------------------------------------------------------------
-- 4. Cases (dates are relative to today, so the demo always looks current)
-- ---------------------------------------------------------------------------
create temp table demo_cases (
  reference text, student text, advisor text, program text, level public.credit_level, stage public.case_stage,
  started_days_ago int, sections_done int, evidence int, chair text, writer text
);
insert into demo_cases values
  ('PLAR-2026-014', 'student',        'advisor',  'BGS', 'upper', 'feedback',    70, 5, 19, null,     null),
  ('PLAR-2026-002', 'taylor.brooks',  'advisor',  'BBA', 'upper', 'assessment', 150, 7, 22, 'chair',  'writer'),
  ('PLAR-2026-005', 'priya.nair',     'advisor2', 'BHS', 'lower', 'interview',  130, 7, 18, 'writer', 'chair'),
  ('PLAR-2026-007', 'liam.oconnor',   'advisor',  'BGS', 'upper', 'interview',  125, 7, 21, 'chair',  'writer'),
  ('PLAR-2026-001', 'mei.wong',       'advisor2', 'BTM', 'lower', 'decision',   165, 7, 24, 'chair',  'writer'),
  ('PLAR-2026-003', 'daniel.okoro',   'advisor',  'BBA', 'lower', 'credit',     170, 7, 20, 'writer', 'chair'),
  ('PLAR-2026-009', 'sofia.martins',  'advisor',  'BGS', 'upper', 'approval',   112, 7, 17, null,     null),
  ('PLAR-2026-010', 'ethan.clarke',   'advisor2', 'BA',  'lower', 'approval',   108, 7, 16, null,     null),
  ('PLAR-2026-011', 'aisha.rahman',   'advisor',  'BHS', 'upper', 'feedback',    95, 6, 15, null,     null),
  ('PLAR-2026-012', 'noah.tremblay',  'advisor2', 'BBA', 'lower', 'feedback',    88, 5, 12, null,     null),
  ('PLAR-2026-015', 'grace.lee',      'advisor',  'BGS', 'upper', 'portfolio',   60, 3,  9, null,     null),
  ('PLAR-2026-016', 'omar.haddad',    'advisor2', 'BTM', 'lower', 'portfolio',   45, 2,  6, null,     null),
  ('PLAR-2026-017', 'chloe.dubois',   'advisor',  'BA',  'upper', 'portfolio',   30, 2,  4, null,     null),
  ('PLAR-2026-018', 'ravi.menon',     'advisor2', 'BGS', 'lower', 'readiness',   10, 0,  0, null,     null),
  ('PLAR-2026-019', 'hannah.fischer', 'advisor',  'BBA', 'upper', 'readiness',    5, 0,  0, null,     null),
  ('PLAR-2025-041', 'marcus.bell',    'advisor2', 'BGS', 'upper', 'closed',     260, 7, 23, 'chair',  'writer');

insert into public.cases (reference, student_id, advisor_id, program_id, credit_level, stage, started_on, due_on, sections_done, evidence_count)
select dc.reference, s.id, a.id, pr.id, dc.level, dc.stage,
       current_date - dc.started_days_ago, current_date - dc.started_days_ago + 168,
       dc.sections_done, dc.evidence
from demo_cases dc
join demo_people s on s.key = dc.student
join demo_people a on a.key = dc.advisor
join public.programs pr on pr.code = dc.program;

insert into public.case_assessors (case_id, assessor_id, role)
select c.id, p.id, 'chair'::public.assessor_role from demo_cases dc join public.cases c using (reference) join demo_people p on p.key = dc.chair
union all
select c.id, p.id, 'writer'::public.assessor_role from demo_cases dc join public.cases c using (reference) join demo_people p on p.key = dc.writer;

-- ---------------------------------------------------------------------------
-- 5. Journey events: one per stage reached, spread between the start date and today
-- ---------------------------------------------------------------------------
create temp table demo_stage_events (stage public.case_stage, n int, kind text, title text, actor text);
insert into demo_stage_events values
  ('readiness',  1, 'readiness',  'Readiness questionnaire completed',             'student'),
  ('portfolio',  2, 'portfolio',  'Portfolio workspace opened',                     'advisor'),
  ('feedback',   3, 'feedback',   'Advisor feedback returned',                      'advisor'),
  ('approval',   4, 'approval',   'Portfolio submitted for approval',               'student'),
  ('interview',  5, 'approval',   'Approved for assessment',                        'manager'),
  ('assessment', 6, 'interview',  'Discussion of Learning completed',               'chair'),
  ('decision',   7, 'assessment', 'Consensus ratings and report submitted',         'chair'),
  ('credit',     8, 'decision',   'Decision approved and released to the student',  'director'),
  ('closed',     9, 'credit',     'Credit recorded by Records',                     'manager');

insert into public.case_events (case_id, kind, title, actor_id, occurred_at)
select c.id, e.kind, e.title,
       case e.actor
         when 'student' then c.student_id
         when 'advisor' then c.advisor_id
         when 'chair' then (select ca.assessor_id from public.case_assessors ca where ca.case_id = c.id and ca.role = 'chair')
         else (select p.id from demo_people p where p.key = e.actor)
       end,
       c.started_on::timestamptz + interval '10 hours'
         + (now() - c.started_on::timestamptz) * (e.n::float8 / (array_position(enum_range(null::public.case_stage), c.stage) + 1))
from public.cases c
join demo_stage_events e on e.n <= array_position(enum_range(null::public.case_stage), c.stage);

-- A few detailed recent events
insert into public.case_events (case_id, kind, title, detail, actor_id, occurred_at)
select c.id, v.kind, v.title, v.detail, (select id from demo_people where key = v.actor), now() - v.ago
from (values
  ('PLAR-2026-014', 'feedback',  'Feedback round 2 returned',      'Communication and Problem-Solving sections', 'advisor',  interval '2 days'),
  ('PLAR-2026-014', 'upload',    'Uploaded 3 evidence files',      'Reference letter, workshop agenda, certificate', 'student', interval '5 days'),
  ('PLAR-2026-002', 'assessment','Preliminary ratings submitted',   'Writer submitted; waiting for the chair', 'writer', interval '1 day'),
  ('PLAR-2026-005', 'interview', 'Interview booked',               'Built-in room · identity check scheduled', 'coordinator', interval '3 days'),
  ('PLAR-2026-001', 'assessment','Report sent for director review', 'Full credit recommended', 'manager', interval '20 hours')
) as v (reference, kind, title, detail, actor, ago)
join public.cases c using (reference);

-- ---------------------------------------------------------------------------
-- 6. Interviews
-- ---------------------------------------------------------------------------
insert into public.interviews (case_id, scheduled_at, mode)
select c.id, ((current_date + v.day_offset)::timestamp + v.at_time) at time zone 'America/Vancouver', v.mode::public.interview_mode
from (values
  ('PLAR-2026-005',  1, time '10:00', 'built_in'),
  ('PLAR-2026-007',  3, time '09:30', 'built_in'),
  ('PLAR-2026-002', -6, time '13:00', 'built_in'),
  ('PLAR-2026-001', -21, time '11:00', 'zoom')
) as v (reference, day_offset, at_time, mode)
join public.cases c using (reference);

-- ---------------------------------------------------------------------------
-- 7. Tasks
-- ---------------------------------------------------------------------------
insert into public.tasks (case_id, assignee_id, title, detail, status, due_on, ai_assisted)
select c.id, p.id, v.title, v.detail, v.status::public.task_status,
       case when v.due_in is null then null else current_date + v.due_in end, v.ai
from (values
  -- Student
  ('PLAR-2026-014', 'student',     'Review advisor feedback on Communication', 'Feedback round 2 is ready to read',               'ready',    null, false),
  ('PLAR-2026-014', 'student',     'Add the “why” to 3 evidence captions',     'Evidence Description and Listing',                'todo',     10,   false),
  ('PLAR-2026-014', 'student',     'Send your next two competencies',           'Your advisor suggested sending them by week 12',  'due_soon', 4,    false),
  -- Advisors
  ('PLAR-2026-011', 'advisor',     'A. Rahman · Demonstration of Learning',     'Communication and Problem-Solving · round 2',      'review',   2,    true),
  ('PLAR-2026-009', 'advisor',     'S. Martins · Final submission checklist',   '2 checks need a look',                             'due_soon', 3,    false),
  ('PLAR-2026-014', 'advisor',     'A. Morgan · Reply about evidence captions', 'Asked 2 days ago',                                 'todo',     null, false),
  ('PLAR-2026-019', 'advisor',     'H. Fischer · Welcome call',                 'Readiness results are in',                         'todo',     5,    false),
  ('PLAR-2026-012', 'advisor2',    'N. Tremblay · Evidence listing review',     'First review · 12 evidence items',                 'review',   3,    true),
  ('PLAR-2026-010', 'advisor2',    'E. Clarke · Final submission checklist',    'Checklist complete',                               'ready',    null, false),
  ('PLAR-2026-018', 'advisor2',    'R. Menon · Readiness follow-up',            'Resume received',                                  'todo',     6,    false),
  -- Assessors
  ('PLAR-2026-002', 'chair',       'T. Brooks · Preliminary ratings',           'Chair · co-assessor has submitted',                'ready',    2,    false),
  ('PLAR-2026-007', 'chair',       'L. O''Connor · Interview preparation',      'Chair · 16 questions suggested',                   'todo',     3,    true),
  ('PLAR-2026-001', 'chair',       'M. Wong · Review the report draft',         'Chair · the writer''s draft is ready',             'review',   1,    true),
  ('PLAR-2026-005', 'writer',      'P. Nair · Interview preparation',           'Chair · interview tomorrow',                       'due_soon', 1,    true),
  ('PLAR-2026-002', 'writer',      'T. Brooks · Draft the assessment report',   'Writer · after consensus',                         'waiting',  null, true),
  -- Coordinator, manager, director
  ('PLAR-2026-005', 'coordinator', 'P. Nair · Send interview reminder',         'Interview tomorrow',                               'due_soon', 0,    false),
  ('PLAR-2026-007', 'coordinator', 'L. O''Connor · Confirm the room test',      'Student device check not done yet',                'todo',     2,    false),
  ('PLAR-2026-009', 'manager',     'S. Martins · Approve for assessment',       'Advisor checklist complete',                       'ready',    null, false),
  ('PLAR-2026-010', 'manager',     'E. Clarke · Assign assessors',              '3 suggested pairs by availability and expertise',  'todo',     4,    false),
  ('PLAR-2026-001', 'director',    'M. Wong · Final decision',                  'Full credit recommended · consistency checks passed', 'review', 2,    false)
) as v (reference, assignee, title, detail, status, due_in, ai)
join public.cases c using (reference)
join demo_people p on p.key = v.assignee;
