-- Local development seed. SYNTHETIC DATA ONLY: never put real student information here.
-- Runs on `supabase db reset` against the local stack, never against hosted projects.
-- Every demo account uses the local-only password: plar-demo-2026

-- One synthetic person per role. Profiles are created by the on_auth_user_created trigger.
with demo (id, email, full_name) as (
  values
    ('00000000-0000-4000-8000-000000000001'::uuid, 'student@example.test',  'Alex Morgan'),
    ('00000000-0000-4000-8000-000000000002'::uuid, 'advisor@example.test',  'Sam Patel'),
    ('00000000-0000-4000-8000-000000000003'::uuid, 'chair@example.test',    'Jordan Rivera'),
    ('00000000-0000-4000-8000-000000000004'::uuid, 'writer@example.test',   'Kai Thompson'),
    ('00000000-0000-4000-8000-000000000005'::uuid, 'manager@example.test',  'Lee Chen'),
    ('00000000-0000-4000-8000-000000000006'::uuid, 'director@example.test', 'Pat Okafor'),
    ('00000000-0000-4000-8000-000000000007'::uuid, 'admin@example.test',    'Robin Admin')
),
users as (
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change
  )
  select
    '00000000-0000-0000-0000-000000000000', d.id, 'authenticated', 'authenticated', d.email,
    extensions.crypt('plar-demo-2026', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}', jsonb_build_object('full_name', d.full_name), now(), now(),
    '', '', '', ''
  from demo d
  returning id, email
)
insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), u.id, u.id::text, jsonb_build_object('sub', u.id::text, 'email', u.email), 'email', now(), now(), now()
from users u;

insert into public.role_assignments (user_id, role) values
  ('00000000-0000-4000-8000-000000000001', 'student'),
  ('00000000-0000-4000-8000-000000000002', 'advisor'),
  ('00000000-0000-4000-8000-000000000003', 'assessor'),
  ('00000000-0000-4000-8000-000000000004', 'assessor'),
  ('00000000-0000-4000-8000-000000000005', 'manager'),
  ('00000000-0000-4000-8000-000000000006', 'director'),
  ('00000000-0000-4000-8000-000000000007', 'admin');
