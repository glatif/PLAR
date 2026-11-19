#!/usr/bin/env bash
# Deploy the committed web app (HEAD:web) to the HorAIzon project server, the way its other projects
# are deployed (see /opt/projects/faculty-desk/DEPLOYING-TO-HORAIZON.md on the server):
#   hz init plar (first time) -> push code to /opt/projects/plar -> .env.local -> hz rebuild plar
# From web/.env.local it sends the two public NEXT_PUBLIC_* values and, at runtime only (never a build
# arg): OPENROUTER_API_KEY and VERIFICATION_AI_MODEL when the lab's AI check is on (PLAR_LAB_AI),
# DEMO_LOGIN_PASSWORD when demo sign-in is on (PLAR_DEMO), and MICROSOFT_SIGN_IN (PLAR_MICROSOFT).
# No sudo needed.
set -euo pipefail
. "$(dirname "$0")/common.sh"
ssh "${SSH_OPTS[@]}" "$TARGET" true 2>/dev/null || { key_help; exit 1; }

REPO="$(cd "$HERE/.." && pwd)"
[ -z "$(git -C "$REPO" status --porcelain -- web)" ] || echo "! web/ has uncommitted changes: they are NOT deployed (HEAD only)."
rev=$(git -C "$REPO" rev-parse --short HEAD)

tmp=$(mktemp -d); trap 'rm -rf "$tmp"' EXIT
git -C "$REPO" archive --format=tar HEAD:web > "$tmp/plar.tar"
tar -rf "$tmp/plar.tar" -C "$HERE/plar" Dockerfile docker-compose.yml
gzip "$tmp/plar.tar"
git -C "$REPO" ls-tree -r HEAD:web --name-only > "$tmp/manifest"
# .env = build args (public values and the lab switch); .env.local = runtime (adds the AI settings).
( umask 077
  grep -E '^NEXT_PUBLIC_SUPABASE_(URL|PUBLISHABLE_KEY)=' "$REPO/web/.env.local" > "$tmp/buildenv"
  echo "VERIFICATION_LAB=$PLAR_LAB" >> "$tmp/buildenv"
  cp "$tmp/buildenv" "$tmp/env"
  if [ "$PLAR_LAB" = true ] && [ "$PLAR_LAB_AI" = true ]; then
    grep -E '^(OPENROUTER_API_KEY|VERIFICATION_AI_MODEL)=' "$REPO/web/.env.local" >> "$tmp/env" || true
  fi
  # Demo sign-in (synthetic accounts only): runtime only, read by the pages at request time.
  if [ "$PLAR_DEMO" = true ]; then
    grep -E '^DEMO_LOGIN_PASSWORD=' "$REPO/web/.env.local" >> "$tmp/env" || true
  fi
  echo "MICROSOFT_SIGN_IN=$PLAR_MICROSOFT" >> "$tmp/env" )
[ "$(grep -c '^NEXT_PUBLIC_' "$tmp/buildenv")" = 2 ] || { echo "web/.env.local must define NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"; exit 1; }
echo ":: lab: $PLAR_LAB · AI check: $([ "$PLAR_LAB" = true ] && grep -q '^OPENROUTER_API_KEY=' "$tmp/env" && echo on || echo off) · demo sign-in: $(grep -q '^DEMO_LOGIN_PASSWORD=.' "$tmp/env" && echo on || echo off) · Microsoft: $PLAR_MICROSOFT"
cp "$HERE/plar/.dockerignore" "$tmp/dockerignore"

echo ":: uploading $rev to $TARGET"
scp -q "${SSH_OPTS[@]}" "$tmp/plar.tar.gz" "$tmp/manifest" "$tmp/env" "$tmp/buildenv" "$tmp/dockerignore" "$TARGET:/tmp/"
ssh "${SSH_OPTS[@]}" "$TARGET" "set -e
  hz info plar >/dev/null 2>&1 || hz init plar --container-port 3000
  d=/opt/projects/plar; cd \$d
  tar -xzf /tmp/plar.tar.gz -C . && mv /tmp/dockerignore .dockerignore && mv /tmp/manifest .deploy-manifest
  # untarring adds but never removes: drop files a commit deleted
  find src public scripts -type f -not -path 'public/vendor/*' 2>/dev/null | sort > /tmp/_plar_files
  sort .deploy-manifest | comm -23 /tmp/_plar_files - | while read -r f; do [ -n \"\$f\" ] && { echo \"   removed \$f\"; rm -f -- \"\$f\"; }; done
  rm -f /tmp/_plar_files
  # .env.local: runtime env (env_file, read on the host by hh_horaizon). .env: compose build args.
  install -m 600 /tmp/env .env.local && install -m 600 /tmp/buildenv .env && rm -f /tmp/env /tmp/buildenv /tmp/plar.tar.gz
  # Server-only lab secrets (storage key, encryption key) never leave the server: see plar-api.sh lab-keys.
  [ -f .env.server ] && cat .env.server >> .env.local
  echo $rev > .deployed-commit
  hz rebuild plar
  docker image prune -f >/dev/null 2>&1 || true
  port=\$(hz info plar 2>/dev/null | grep -oE '127\.0\.0\.1:[0-9]+' | head -1)
  echo \":: container: \$port\""
echo "✓ deployed $rev. Publish with ./publish.sh (once)."
