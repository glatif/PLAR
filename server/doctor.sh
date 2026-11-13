#!/usr/bin/env bash
# Checks that this Mac can reach the server with key login, and what the harness needs there.
set -u
. "$(dirname "$0")/common.sh"

ok()   { printf 'OK    %s\n' "$*"; }
bad()  { printf 'FAIL  %s\n' "$*"; }

[ -f "$PLAR_SERVER_KEY" ] && ok "private key $PLAR_SERVER_KEY" || { bad "no private key at $PLAR_SERVER_KEY"; exit 1; }
[ -f "$PLAR_SERVER_KEY.pub" ] && ok "public key $PLAR_SERVER_KEY.pub" || bad "no public key next to it"

if nc -z -G 5 "$PLAR_SERVER_HOST" 22 2>/dev/null || nc -z -w 5 "$PLAR_SERVER_HOST" 22 2>/dev/null; then
  ok "port 22 open on $PLAR_SERVER_HOST"
else
  bad "cannot reach $PLAR_SERVER_HOST:22"; exit 1
fi

if ssh "${SSH_OPTS[@]}" "$TARGET" true 2>/dev/null; then
  ok "key login as $TARGET"
else
  bad "key login as $TARGET"; key_help; exit 1
fi

ssh "${SSH_OPTS[@]}" "$TARGET" 'bash -s' <<'REMOTE'
for t in bash sed awk timeout ss openssl docker python3 curl; do
  if command -v $t >/dev/null 2>&1; then printf 'OK    server has %s\n' $t; else printf 'WARN  server lacks %s (some checks will be skipped)\n' $t; fi
done
REMOTE
echo
echo "Ready: ./inspect.sh for a full snapshot, ./check.sh for a quick health check."
