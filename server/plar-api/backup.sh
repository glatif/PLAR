#!/usr/bin/env bash
# Nightly backup of PLAR's own Supabase database (container plar-api-db). Installed by
# server/plar-api.sh backup-install into ~/bin and run from hh_horaizon's crontab at 03:45.
# Also copies Storage's files (encrypted captures). Keeps 14 days in ~/backups/plar-api. Same disk as
# the database: an off-server copy is still needed. The captures' encryption key is NOT in these
# backups (it's in /opt/projects/plar/.env.server): keep a copy of it somewhere safe as well.
set -euo pipefail
out="$HOME/backups/plar-api"; mkdir -p "$out"; umask 077
f="$out/db-$(date +%F).sql.gz"
docker exec plar-api-db pg_dumpall -U postgres --clean --if-exists | gzip > "$f.tmp"
mv "$f.tmp" "$f"
# Sanity checks: the dump isn't tiny, and it has the users and the access rules.
size=$(stat -c %s "$f"); users=$(docker exec plar-api-db psql -U postgres -tAc 'select count(*) from auth.users')
policies=$(docker exec plar-api-db psql -U postgres -tAc "select count(*) from pg_policies where schemaname='public'")
[ "$size" -gt 20000 ] || { echo "$(date -Is) FAIL: $f is only $size bytes"; exit 1; }
in_dump=$(zcat "$f" | grep -c 'CREATE POLICY' || true)
[ "$in_dump" -gt 0 ] || { echo "$(date -Is) FAIL: no policies in $f"; exit 1; }
# Storage files (identity-check captures, already encrypted by the web app).
st="$out/storage-$(date +%F).tgz"
docker exec plar-api-storage tar czf - -C /var/lib/storage . > "$st.tmp" && mv "$st.tmp" "$st"
find "$out" \( -name 'db-*.sql.gz' -o -name 'storage-*.tgz' \) -mtime +14 -delete
echo "$(date -Is) ok: $f ($size bytes, $users users, $policies policies), $(basename "$st") ($(stat -c %s "$st") bytes)"
