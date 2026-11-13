#!/usr/bin/env bash
# Full read-only snapshot of the server, saved to server/.snapshots/<time>.txt (git-ignored).
# Secret values are masked on the server before they are sent; a second pass here masks
# anything that still looks like a token. DNS for the domains found is checked from this Mac.
set -u
. "$(dirname "$0")/common.sh"

ssh "${SSH_OPTS[@]}" "$TARGET" true 2>/dev/null || { key_help; exit 1; }

mkdir -p "$HERE/.snapshots"; chmod 700 "$HERE/.snapshots"
out="$HERE/.snapshots/$(date +%Y%m%d-%H%M%S).txt"
umask 077

echo "Inspecting $TARGET (read-only, takes a minute or two)..."
remote inspect > "$out" 2>&1

# Local DNS check for every domain the server serves.
domains=$(grep -E '^DOMAIN ' "$out" | awk '{print $2}' | sort -u)
{
  printf '\n\n==================== DNS (looked up from this Mac) ====================\n'
  printf '%-40s %-18s %s\n' DOMAIN A-RECORD POINTS-HERE
  for d in $domains; do
    a=$(dig +short A "$d" | grep -E '^[0-9.]+$' | paste -sd, -)
    [ -z "$a" ] && a="(none)"
    case ",$a," in *",$PLAR_SERVER_HOST,"*) here=yes ;; *) here=no ;; esac
    printf '%-40s %-18s %s\n' "$d" "$a" "$here"
  done
  printf '%-40s %s\n' "reverse DNS of $PLAR_SERVER_HOST" "$(dig +short -x "$PLAR_SERVER_HOST" | paste -sd, -)"
} >> "$out"

# Second-pass masking for token shapes (defence in depth).
sed -E -i '' \
  -e 's#eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]*#[jwt removed]#g' \
  -e 's#(^|[^A-Za-z0-9])(sk-[A-Za-z0-9_-]{16,}|gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|glpat-[A-Za-z0-9_-]{16,}|AKIA[0-9A-Z]{16}|xox[abprs]-[A-Za-z0-9-]{10,})#\1[token removed]#g' \
  "$out" 2>/dev/null || sed -E -i \
  -e 's#eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]*#[jwt removed]#g' "$out"

echo "Saved $out ($(wc -l < "$out" | tr -d ' ') lines). It stays on this Mac and is git-ignored."
grep -q 'END OF SNAPSHOT' "$out" || echo "WARNING: the snapshot did not finish; check the end of the file."
