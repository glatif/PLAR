-- Identity-verification lab captures in Supabase Storage (project lead, 2026-11-19).
-- A private bucket that only the lab's own key can use. That key is a token signed with PLAR's JWT
-- secret on the server, carrying the claim plar_lab = 'verification'; sign-in tokens from Auth never
-- carry it, and nobody can make one without the secret. It is not the service key: it can't read any
-- table or any other bucket. Files are encrypted by the web app before upload, so the bucket only
-- ever holds ciphertext.

insert into storage.buckets (id, name, public, file_size_limit)
values ('verification', 'verification', false, 104857600)
on conflict (id) do update set public = false;

create function private.is_verification_lab()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce((select auth.jwt()) ->> 'plar_lab', '') = 'verification';
$$;
revoke all on function private.is_verification_lab() from public;
grant usage on schema private to authenticated;
grant execute on function private.is_verification_lab() to authenticated;

create policy "Verification lab: read its bucket"
  on storage.objects for select to authenticated
  using (bucket_id = 'verification' and (select private.is_verification_lab()));

create policy "Verification lab: add to its bucket"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'verification' and (select private.is_verification_lab()));

create policy "Verification lab: replace in its bucket"
  on storage.objects for update to authenticated
  using (bucket_id = 'verification' and (select private.is_verification_lab()))
  with check (bucket_id = 'verification' and (select private.is_verification_lab()));

create policy "Verification lab: delete from its bucket"
  on storage.objects for delete to authenticated
  using (bucket_id = 'verification' and (select private.is_verification_lab()));

create policy "Verification lab: sees its bucket"
  on storage.buckets for select to authenticated
  using (id = 'verification' and (select private.is_verification_lab()));
