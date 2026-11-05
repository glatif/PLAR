-- Cases: programs, PLAR cases, assessor pairs, journey events, tasks and interviews.
-- Read access follows the case: students see their own, advisors their caseload, assessors the cases
-- they're assigned to, and coordinators, managers, directors and admins see every case.
-- Writes come with each feature; for now people may only change the status of their own tasks.

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------
create type public.case_stage as enum (
  'readiness', 'portfolio', 'feedback', 'approval', 'interview', 'assessment', 'decision', 'credit', 'closed'
);
create type public.credit_level as enum ('lower', 'upper');
create type public.assessor_role as enum ('chair', 'writer');
create type public.task_status as enum ('todo', 'ready', 'due_soon', 'review', 'waiting', 'done');
create type public.interview_mode as enum ('built_in', 'zoom', 'phone');

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table public.programs (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  created_at timestamptz not null default now()
);
comment on table public.programs is 'Credentials a student can apply PLAR credit to.';

create table public.cases (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  student_id uuid not null references public.profiles (id) on delete restrict,
  advisor_id uuid references public.profiles (id) on delete set null,
  program_id uuid not null references public.programs (id) on delete restrict,
  credit_level public.credit_level not null,
  stage public.case_stage not null default 'readiness',
  started_on date not null default current_date,
  due_on date,
  sections_total smallint not null default 7 check (sections_total > 0),
  sections_done smallint not null default 0,
  evidence_count smallint not null default 0 check (evidence_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (sections_done between 0 and sections_total)
);
comment on table public.cases is 'One student''s PLAR journey, from readiness to credit.';
create index cases_student_id_idx on public.cases (student_id);
create index cases_advisor_id_idx on public.cases (advisor_id);
create index cases_program_id_idx on public.cases (program_id);
create index cases_stage_idx on public.cases (stage);

create table public.case_assessors (
  case_id uuid not null references public.cases (id) on delete cascade,
  assessor_id uuid not null references public.profiles (id) on delete cascade,
  role public.assessor_role not null,
  assigned_at timestamptz not null default now(),
  primary key (case_id, assessor_id),
  unique (case_id, role)
);
comment on table public.case_assessors is 'The assessor pair on a case: one chair and one writer.';
create index case_assessors_assessor_id_idx on public.case_assessors (assessor_id);

create table public.case_events (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases (id) on delete cascade,
  kind text not null,
  title text not null,
  detail text,
  actor_id uuid references public.profiles (id) on delete set null,
  occurred_at timestamptz not null default now()
);
comment on table public.case_events is 'The journey timeline and activity feed for a case.';
create index case_events_case_id_occurred_at_idx on public.case_events (case_id, occurred_at desc);
create index case_events_actor_id_idx on public.case_events (actor_id);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases (id) on delete cascade,
  assignee_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  detail text,
  status public.task_status not null default 'todo',
  due_on date,
  ai_assisted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.tasks is 'Work waiting on a person, linked to a case.';
create index tasks_assignee_id_idx on public.tasks (assignee_id);
create index tasks_case_id_idx on public.tasks (case_id);

create table public.interviews (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases (id) on delete cascade,
  scheduled_at timestamptz not null,
  duration_minutes smallint not null default 60 check (duration_minutes > 0),
  mode public.interview_mode not null default 'built_in',
  created_at timestamptz not null default now()
);
comment on table public.interviews is 'Discussion of Learning sessions.';
create index interviews_case_id_idx on public.interviews (case_id);
create index interviews_scheduled_at_idx on public.interviews (scheduled_at);

create trigger cases_set_updated_at before update on public.cases
  for each row execute function private.set_updated_at();
create trigger tasks_set_updated_at before update on public.tasks
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- Access helpers (security definer, so policies don't recurse through each other)
-- ---------------------------------------------------------------------------

-- Coordinators, managers, directors and admins oversee every case.
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
      and ra.role in ('coordinator', 'manager', 'director', 'admin')
  );
$$;

-- True when the signed-in person may see the case.
create or replace function private.can_access_case(target_case uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.sees_all_cases()
    or exists (
      select 1 from public.cases c
      where c.id = target_case
        and ((select auth.uid()) in (c.student_id, c.advisor_id))
    )
    or exists (
      select 1 from public.case_assessors ca
      where ca.case_id = target_case
        and ca.assessor_id = (select auth.uid())
    );
$$;

-- True when the signed-in person advises the case.
create or replace function private.advises_case(target_case uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.cases c
    where c.id = target_case and c.advisor_id = (select auth.uid())
  );
$$;

-- True when the signed-in person may see another person's profile: themselves, anyone if they
-- oversee every case, and otherwise the people on cases they can see.
create or replace function private.can_see_profile(target_profile uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select target_profile = (select auth.uid())
    or private.has_role('admin')
    or private.sees_all_cases()
    or exists (
      select 1 from public.cases c
      where (c.student_id = target_profile or c.advisor_id = target_profile)
        and private.can_access_case(c.id)
    )
    or exists (
      select 1 from public.case_assessors ca
      where ca.assessor_id = target_profile
        and private.can_access_case(ca.case_id)
    );
$$;

revoke all on function private.sees_all_cases() from public;
revoke all on function private.can_access_case(uuid) from public;
revoke all on function private.advises_case(uuid) from public;
revoke all on function private.can_see_profile(uuid) from public;
grant execute on function private.sees_all_cases() to authenticated, service_role;
grant execute on function private.can_access_case(uuid) to authenticated, service_role;
grant execute on function private.advises_case(uuid) to authenticated, service_role;
grant execute on function private.can_see_profile(uuid) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Privileges and row-level security
-- ---------------------------------------------------------------------------
revoke all on public.programs, public.cases, public.case_assessors, public.case_events, public.tasks, public.interviews from anon;

-- Only a task's status can change, and only through the policy below.
revoke insert, update, delete on public.programs, public.cases, public.case_assessors, public.case_events, public.tasks, public.interviews from authenticated;
grant update (status) on public.tasks to authenticated;

alter table public.programs enable row level security;
alter table public.cases enable row level security;
alter table public.case_assessors enable row level security;
alter table public.case_events enable row level security;
alter table public.tasks enable row level security;
alter table public.interviews enable row level security;

create policy "Programs: everyone signed in can read"
  on public.programs for select to authenticated using (true);

create policy "Cases: people on the case and overseers"
  on public.cases for select to authenticated
  using (private.can_access_case(id));

create policy "Assessor pairs: follow the case"
  on public.case_assessors for select to authenticated
  using (private.can_access_case(case_id));

create policy "Events: follow the case"
  on public.case_events for select to authenticated
  using (private.can_access_case(case_id));

create policy "Interviews: follow the case"
  on public.interviews for select to authenticated
  using (private.can_access_case(case_id));

create policy "Tasks: own tasks, the case advisor and overseers"
  on public.tasks for select to authenticated
  using (
    assignee_id = (select auth.uid())
    or (select private.sees_all_cases())
    or private.advises_case(case_id)
  );

create policy "Tasks: people update their own"
  on public.tasks for update to authenticated
  using (assignee_id = (select auth.uid()))
  with check (assignee_id = (select auth.uid()));

-- Profiles: widen reading to the people someone works with.
drop policy "Profiles: read own, admins read all" on public.profiles;
create policy "Profiles: self, shared cases and overseers"
  on public.profiles for select to authenticated
  using (private.can_see_profile(id));
