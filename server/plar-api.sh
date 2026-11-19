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
#   ./plar-api.sh backup-install   nightly database backup (hh_horaizon crontab), and run one now
#   ./plar-api.sh microsoft [status|off]   TRU Microsoft sign-in (asks for TRU's app values)
#   ./plar-api.sh lab-keys   the verification lab's storage key and encryption key (server-only, once)
#
# Never run `hz rm plar-api` or `hz deploy plar-api`: rm runs `docker compose down -v` (deletes the
# database), and deploy rewrites .env. Use `hz up/restart/logs plar-api` and this script.
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
    # hz proxy uses sudo, so the server asks for the hh_horaizon password: run this in your own terminal.
    a=$(dig +short A "$PLAR_API_DOMAIN" | tail -1)
    [ "$a" = "$PLAR_SERVER_HOST" ] || { echo "DNS: $PLAR_API_DOMAIN -> ${a:-nothing}, not $PLAR_SERVER_HOST. Add the A record first."; exit 1; }
    echo ":: DNS ok ($PLAR_API_DOMAIN -> $a). The server will ask for the $PLAR_SERVER_USER password (sudo)."
    ssh -t "${SSH_OPTS[@]}" "$TARGET" "sudo -v && sudo tar czf /opt/backups/nginx-\$(date +%Y%m%d-%H%M%S).tar.gz -C /etc/nginx sites-available sites-enabled && hz proxy plar-api '$PLAR_API_DOMAIN'"
    code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 15 "https://$PLAR_API_DOMAIN/auth/v1/health" -H "apikey: $("$0" anon-key)" || true)
    [ "$code" = "200" ] && echo "✓ https://$PLAR_API_DOMAIN answers (auth health $code)" || { echo "! https://$PLAR_API_DOMAIN/auth/v1/health returned $code"; exit 1; }
    ;;
  microsoft)
    # TRU Microsoft Entra ID for "Sign in with Microsoft". Run in your own terminal:
    #   ./plar-api.sh microsoft          asks for the tenant ID, client ID and secret (secret not shown)
    #   ./plar-api.sh microsoft status   is Microsoft switched on in PLAR's Supabase?
    #   ./plar-api.sh microsoft off      switch it off again
    # Values can also come from AZURE_TENANT_ID / AZURE_CLIENT_ID / AZURE_SECRET in the environment.
    # They're sent over SSH on stdin (never on a command line) into the server's .env (mode 600).
    settings() { run "curl -s http://127.0.0.1:9007/auth/v1/settings -H 'apikey: $("$0" anon-key)'" \
      | python3 -c 'import json,sys; s=json.load(sys.stdin); print("Microsoft sign-in in PLAR Supabase:", "ON" if s["external"].get("azure") else "off", "· email sign-in:", "on" if s["external"].get("email") else "off", "· sign-up:", "off" if s.get("disable_signup") else "ON")'; }
    case "${2:-on}" in
      status) settings ;;
      off)
        run "set -e; cd $DIR; ( umask 077; grep -v '^AZURE_' .env > .env.new; echo AZURE_ENABLED=false >> .env.new; mv .env.new .env ); chmod 600 .env; docker compose up -d --no-deps auth >/dev/null 2>&1"
        sleep 5; settings ;;
      on)
        tenant=${AZURE_TENANT_ID:-}; client=${AZURE_CLIENT_ID:-}; secret=${AZURE_SECRET:-}
        [ -n "$tenant" ] || read -rp "TRU tenant ID (Directory ID): " tenant
        [ -n "$client" ] || read -rp "PLAR app's Application (client) ID: " client
        [ -n "$secret" ] || { read -rsp "Client secret VALUE (not shown as you type): " secret; echo; }
        guid='^[0-9a-fA-F]{8}-([0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}$'
        [[ $tenant =~ $guid ]] || { echo "The tenant ID should look like 1a2b3c4d-…-…-…-123456789abc"; exit 1; }
        [[ $client =~ $guid ]] || { echo "The client ID should look like 1a2b3c4d-…-…-…-123456789abc"; exit 1; }
        [ ${#secret} -ge 10 ] && [[ $secret != *"'"* ]] || { echo "That doesn't look like a client secret value (use the Value, not the Secret ID)."; exit 1; }
        printf '%s\n%s\n%s\n' "$tenant" "$client" "$secret" | run "set -e; cd $DIR; read -r t; read -r c; read -r s
          ( umask 077; grep -v '^AZURE_' .env > .env.new
            printf \"AZURE_ENABLED=true\nAZURE_TENANT_ID=%s\nAZURE_CLIENT_ID=%s\nAZURE_SECRET='%s'\n\" \"\$t\" \"\$c\" \"\$s\" >> .env.new
            mv .env.new .env ); chmod 600 .env
          docker compose up -d --no-deps auth >/dev/null 2>&1"
        unset secret
        sleep 5; settings
        echo "Next: deploy the web app with Microsoft live:  PLAR_MICROSOFT=entra ./deploy.sh" ;;
      *) echo "Use: ./plar-api.sh microsoft [status|off]"; exit 1 ;;
    esac
    ;;
  lab-keys)
    # The identity-verification lab's server-only settings, in /opt/projects/plar/.env.server (mode 600),
    # which deploy.sh adds to the web container's runtime settings. Made once, on the server:
    #   VERIFICATION_STORAGE_KEY   token for the private "verification" bucket only (claim plar_lab)
    #   VERIFICATION_ENCRYPTION_KEY  AES-256 key the web app encrypts captures with. NEVER replace it:
    #                                captures saved with it can't be opened without it. It's backed up
    #                                with the database backup.
    run "set -e; f=/opt/projects/plar/.env.server; touch \$f; chmod 600 \$f
      jwt=\$(grep '^JWT_SECRET=' $DIR/.env | cut -d= -f2)
      if ! grep -q '^VERIFICATION_STORAGE_KEY=' \$f; then
        key=\$(docker run --rm -e JWT_SECRET=\$jwt node:22-bookworm-slim node -e '
          const c=require(\"crypto\"), b=(o)=>Buffer.from(JSON.stringify(o)).toString(\"base64url\");
          const now=Math.floor(Date.now()/1000); const h=b({alg:\"HS256\",typ:\"JWT\"});
          const p=b({role:\"authenticated\",aud:\"authenticated\",plar_lab:\"verification\",iss:\"supabase\",iat:now,exp:now+10*365*86400});
          console.log(h+\".\"+p+\".\"+c.createHmac(\"sha256\",process.env.JWT_SECRET).update(h+\".\"+p).digest(\"base64url\"))')
        echo VERIFICATION_STORAGE_KEY=\$key >> \$f; echo ':: made the storage key'
      fi
      grep -q '^VERIFICATION_STORAGE_URL=' \$f || echo VERIFICATION_STORAGE_URL=https://$PLAR_API_DOMAIN >> \$f
      if ! grep -q '^VERIFICATION_ENCRYPTION_KEY=' \$f; then
        echo VERIFICATION_ENCRYPTION_KEY=\$(openssl rand -base64 32) >> \$f; echo ':: made the encryption key'
      fi
      grep -o '^[A-Z_]*=' \$f"
    ;;
  backup-install)
    # Nightly pg_dump at 03:45 by hh_horaizon's crontab (no sudo), into ~/backups/plar-api (outside the
    # project folder, so `hz rm` can't take the backups with it). Keeps 14 days.
    run "mkdir -p ~/backups/plar-api ~/bin && cat > ~/bin/plar-api-backup.sh && chmod 700 ~/bin/plar-api-backup.sh" < "$HERE/plar-api/backup.sh"
    run "( crontab -l 2>/dev/null | grep -v plar-api-backup.sh; echo '45 3 * * * \$HOME/bin/plar-api-backup.sh >> \$HOME/backups/plar-api/backup.log 2>&1' ) | crontab - && crontab -l | grep plar-api && ~/bin/plar-api-backup.sh && ls -la ~/backups/plar-api | tail -3"
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
    sed -n '2,23p' "$0"; exit 1 ;;
esac
