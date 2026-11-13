#!/usr/bin/env bash
# Put PLAR on its domain with HTTPS using the server's own tool: `hz proxy plar <domain>`
# (nginx vhost + Let's Encrypt certificate + HTTP->HTTPS redirect). That command uses sudo, so the
# server asks for the hh_horaizon password: run this in your own terminal and type it there.
#   ./publish.sh               uses PLAR_DOMAIN (default plar.airl.ca)
#   ./publish.sh other.airl.ca
set -euo pipefail
. "$(dirname "$0")/common.sh"
host="${1:-$PLAR_DOMAIN}"
ssh "${SSH_OPTS[@]}" "$TARGET" true 2>/dev/null || { key_help; exit 1; }

a=$(dig +short A "$host" | tail -1)
[ "$a" = "$PLAR_SERVER_HOST" ] || { echo "DNS: $host -> ${a:-nothing}, not $PLAR_SERVER_HOST. Fix the A record first."; exit 1; }
echo ":: DNS ok ($host -> $a). The server will ask for the $PLAR_SERVER_USER password (sudo)."

# -t gives sudo a terminal for the password prompt. BatchMode only affects SSH login (key), not sudo.
ssh -t "${SSH_OPTS[@]}" "$TARGET" "sudo -v && sudo tar czf /opt/backups/nginx-\$(date +%Y%m%d-%H%M%S).tar.gz -C /etc/nginx sites-available sites-enabled && hz proxy plar '$host'"

code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 15 "https://$host/sign-in" || true)
title=$(curl -s --max-time 15 "https://$host/sign-in" | grep -oE '<title>[^<]*</title>' || true)
[ "$code" = "200" ] && echo "✓ https://$host  ($code, $title)" || { echo "! https://$host/sign-in returned $code"; exit 1; }
