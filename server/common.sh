# Local settings and the SSH call shared by doctor.sh, inspect.sh and check.sh.
# Override any of these in server/.env.local (git-ignored) or the environment.

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
[ -f "$HERE/.env.local" ] && . "$HERE/.env.local"

: "${PLAR_SERVER_HOST:=144.217.80.160}"
: "${PLAR_SERVER_USER:=hh_horaizon}"
: "${PLAR_SERVER_KEY:=$HOME/.ssh/id_ed25519}"
: "${PLAR_DOMAIN:=plar.airl.ca}"
# The identity-verification lab on the live site (/verify, /testing). Open to anyone for now (2026-11-13,
# project lead's decision) until sign-in is added. PLAR_LAB_AI=true also sends the OpenRouter key.
: "${PLAR_LAB:=true}"
: "${PLAR_LAB_AI:=true}"
# Demo sign-in on the live site (2026-11-19, project lead's decision): one-click demo accounts and the
# "Sign in with Microsoft" demo picker, for the synthetic accounts only. Sends DEMO_LOGIN_PASSWORD.
# PLAR_MICROSOFT=entra once TRU's Microsoft Entra ID is connected in Supabase.
: "${PLAR_DEMO:=true}"
: "${PLAR_MICROSOFT:=demo}"

# Key-only, non-interactive: never prompts for or sends a password.
SSH_OPTS=(
  -o BatchMode=yes
  -o PasswordAuthentication=no
  -o KbdInteractiveAuthentication=no
  -o PreferredAuthentications=publickey
  -o IdentitiesOnly=yes
  -o StrictHostKeyChecking=accept-new
  -o ConnectTimeout=15
  -i "$PLAR_SERVER_KEY"
)
TARGET="$PLAR_SERVER_USER@$PLAR_SERVER_HOST"

# remote <script-name> [extra lines to prepend]  -> runs remote/lib.sh + remote/<script>.sh on the server
remote() {
  local script="$1"; shift
  { printf '%s\n' "$@"; cat "$HERE/remote/lib.sh" "$HERE/remote/$script.sh"; } \
    | ssh "${SSH_OPTS[@]}" "$TARGET" 'bash -s'
}

key_help() {
  cat >&2 <<MSG
SSH key login to $TARGET failed. This harness only uses key login.
Authorise this Mac's key once, in your own terminal (it asks for the server password):

  ssh-copy-id -i $PLAR_SERVER_KEY.pub $TARGET

Then run ./doctor.sh again.
MSG
}
