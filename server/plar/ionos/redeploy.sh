#!/usr/bin/env bash
# Rebuild and restart PLAR after new code has been unpacked into /opt/projects/plar.
# Run by ../deploy.sh from the Mac; safe to run again by hand on the server.
set -euo pipefail
cd /opt/projects/plar

# Untarring adds and overwrites but never removes: drop files no longer in the commit.
if [ -f .deploy-manifest ]; then
  echo ":: pruning files no longer in the commit"
  find src public scripts -type f -not -path 'public/vendor/*' 2>/dev/null | sort > /tmp/_plar_files
  sort .deploy-manifest > /tmp/_plar_manifest
  comm -23 /tmp/_plar_files /tmp/_plar_manifest | while read -r f; do [ -n "$f" ] && { echo "   removed $f"; rm -f -- "$f"; }; done
  rm -f /tmp/_plar_files /tmp/_plar_manifest
fi

[ -f .env ] || { echo "missing .env (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)"; exit 1; }
chmod 600 .env

echo ":: build"
docker compose build
echo ":: restart"
docker compose up -d

echo ":: waiting for health"
state=starting
for i in $(seq 1 40); do
  state=$(docker inspect plar --format '{{.State.Health.Status}}' 2>/dev/null || echo starting)
  [ "$state" = "healthy" ] && break
  sleep 3
done
echo "   health: $state"

code=$(curl -s -o /dev/null -w '%{http_code}' -m 20 http://127.0.0.1:9000/sign-in || true)
if [ "$code" = "200" ]; then echo "✓ live on 127.0.0.1:9000 (sign-in returned $code)"; else echo "! sign-in returned $code — check: docker logs plar"; exit 1; fi

echo ":: pruning dangling images"
docker image prune -f >/dev/null 2>&1 || true
