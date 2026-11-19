#!/usr/bin/env bash
# PLAR's own Supabase on the OVH server (/opt/projects/plar-api, published at https://$PLAR_API_DOMAIN).
# Run from this Mac. Key login only, no sudo.
#
#   ./plar-api.sh deploy     upload server/plar-api, register it with hz (first time), make the secrets
#                            (first time, on the server), start it and wait until it's healthy
#   ./plar-api.sh publish    hz proxy: nginx vhost + Let's Encrypt for $PLAR_API_DOMAIN (DNS must resolve)
#   ./plar-api.sh anon-key   print the public anon key (what the web app calls the publishable key)
#   ./plar-api.sh migrate    apply supabase/migrations that aren't applied yet, each in a transaction
#   ./plar-api.sh seed       load supabase/seed.sql (synthetic demo data; clears the previous demo data)
#   ./plar-api.sh test       run the pgTAP tests in supabase/tests/database (everything rolls back)
#   ./plar-api.sh status     containers and applied migrations
#
# Secrets (Postgres password, JWT secret, service-role key, gateway dashboard password) are made on the
# server and stay in /opt/projects/plar-api/.env (mode 600). Only the anon key is ever printed.
set -euo pipefail
. "$(dirname "$0")/common.sh"
: "${PLAR_API_DOMAIN:=plar-api.airl.ca}"
REPO="$(cd "$HERE/.." && pwd)"
DIR=/opt/projects/plar-api
ssh "${SSH_OPTS[@]}" "$TARGET" true 2>/dev/null || { key_help; exit 1; }
run() { ssh "${SSH_OPTS[@]}" "$TARGET" "$@"; }
psql_remote() { run "docker exec -i plar-api-db psql -U postgres -d postgres -v ON_ERROR_STOP=1 -q $*"; }

case "${1:-}" in
  deploy)
    run "hz info plar-api >/dev/null 2>&1 || hz init plar-api --container-port 8000"
    tar -czf - -C "$HERE/plar-api" . | run "tar -xzf - -C $DIR"
    run "set -e; cd $DIR
      if [ ! -f .env ]; then
        echo ':: making secrets (first deploy)'
        pg=\$(openssl rand -hex 24); jwt=\$(openssl rand -hex 32); dash=\$(openssl rand -hex 16)
        keys=\$(docker run --rm -e JWT_SECRET=\$jwt node:22-bookworm-slim node -e '
          const c=require(\"crypto\"), b=(o)=>Buffer.from(JSON.stringify(o)).toString(\"base64url\");
          const now=Math.floor(Date.now()/1000), exp=now+10*365*86400;
          const sign=(role)=>{const h=b({alg:\"HS256\",typ:\"JWT\"}), p=b({role,iss:\"supabase\",iat:now,exp});
            return h+\".\"+p+\".\"+c.createHmac(\"sha256\",process.env.JWT_SECRET).update(h+\".\"+p).digest(\"base64url\")};
          console.log(\"ANON_KEY=\"+sign(\"anon\")); console.log(\"SERVICE_ROLE_KEY=\"+sign(\"service_role\"));')
        ( umask 077; {
          echo '# PLAR Supabase secrets. Made on the server by plar-api.sh. Never copy into git.'
          echo POSTGRES_PASSWORD=\$pg
          echo JWT_SECRET=\$jwt
          echo JWT_EXPIRY=3600
          echo \"\$keys\"
          echo DASHBOARD_USERNAME=plar
          echo DASHBOARD_PASSWORD=\$dash
          echo SUPABASE_PUBLIC_URL=https://$PLAR_API_DOMAIN
          echo API_EXTERNAL_URL=https://$PLAR_API_DOMAIN
          echo SITE_URL=https://plar.airl.ca
          echo ADDITIONAL_REDIRECT_URLS=https://plar.airl.ca/auth/callback,http://localhost:3100/auth/callback
        } > .env )
      fi
      chmod 600 .env
      hz up plar-api
      for i in \$(seq 1 60); do
        s=\$(docker inspect -f '{{.State.Health.Status}}' plar-api 2>/dev/null || echo missing)
        [ \"\$s\" = healthy ] && break; sleep 3
      done
      docker ps --filter name=plar-api --format '  {{.Names}}  {{.Status}}'
      port=\$(hz info plar-api 2>/dev/null | grep -oE '127\.0\.0\.1:[0-9]+' | head -1)
      echo \":: gateway: \$port\"
      code=\$(curl -s -o /dev/null -w '%{http_code}' \"http://\$port/auth/v1/health\" -H \"apikey: \$(grep ^ANON_KEY= .env | cut -d= -f2)\")
      echo \":: auth health through the gateway: HTTP \$code\""
    ;;
  publish)
    run "hz proxy plar-api $PLAR_API_DOMAIN"
    ;;
  anon-key)
    run "grep '^ANON_KEY=' $DIR/.env | cut -d= -f2"
    ;;
  migrate)
    psql_remote "-c \"create schema if not exists supabase_migrations; create table if not exists supabase_migrations.schema_migrations (version text primary key, name text, applied_at timestamptz not null default now());\""
    applied=$(run "docker exec plar-api-db psql -U postgres -d postgres -tAc 'select version from supabase_migrations.schema_migrations'")
    for f in "$REPO"/supabase/migrations/*.sql; do
      base=$(basename "$f" .sql); version=${base%%_*}; name=${base#*_}
      if grep -qx "$version" <<<"$applied"; then echo "   = $base"; continue; fi
      { echo "begin;"; cat "$f"; echo; echo "insert into supabase_migrations.schema_migrations (version, name) values ('$version', '$name');"; echo "commit;"; } \
        | run "docker exec -i plar-api-db psql -U postgres -d postgres -v ON_ERROR_STOP=1 -q"
      echo "   + $base"
    done
    ;;
  seed)
    run "docker exec -i plar-api-db psql -U postgres -d postgres -v ON_ERROR_STOP=1 -q -1" < "$REPO/supabase/seed.sql"
    echo "✓ demo data loaded"
    ;;
  test)
    psql_remote "-c 'create extension if not exists pgtap with schema extensions'"
    for f in "$REPO"/supabase/tests/database/*.sql; do
      echo "── $(basename "$f")"
      run "docker exec -i plar-api-db psql -U postgres -d postgres -X -q -t -A" < "$f" | grep -E '^(ok|not ok|# )' || true
    done
    ;;
  status)
    run "docker ps --filter name=plar-api --format '  {{.Names}}  {{.Status}}'; docker exec plar-api-db psql -U postgres -d postgres -tAc 'select version, name from supabase_migrations.schema_migrations order by 1' 2>/dev/null || true"
    ;;
  *)
    sed -n '2,16p' "$0"; exit 1 ;;
esac
