# Quick read-only health check. Runs after remote/lib.sh (see ../check.sh).
# Prints one line per check:  OK | WARN | FAIL  <check>  <detail>
# Optional: PLAR_DOMAIN (set by ../check.sh) adds the PLAR site checks.

fails=0; warns=0
say() {
  case "$1" in FAIL) fails=$((fails+1));; WARN) warns=$((warns+1));; esac
  printf '%-5s %-28s %s\n' "$1" "$2" "$3" | redact
}

# Load
read -r l1 _ < /proc/loadavg; cpus=$(nproc)
if awk "BEGIN{exit !($l1 > $cpus*2)}"; then say FAIL load "1-min load $l1 on $cpus CPUs"
elif awk "BEGIN{exit !($l1 > $cpus)}"; then say WARN load "1-min load $l1 on $cpus CPUs"
else say OK load "1-min load $l1 on $cpus CPUs"; fi

# Memory
avail=$(awk '/MemAvailable/ {a=$2} /MemTotal/ {t=$2} END {printf "%d", a*100/t}' /proc/meminfo)
total=$(free -h | awk '/^Mem:/ {print $2}')
if [ "$avail" -lt 5 ]; then say FAIL memory "${avail}% of $total available"
elif [ "$avail" -lt 15 ]; then say WARN memory "${avail}% of $total available"
else say OK memory "${avail}% of $total available"; fi

# Disks
while read -r use mnt; do
  pct=${use%\%}
  if [ "$pct" -ge 95 ]; then say FAIL "disk $mnt" "$use used"
  elif [ "$pct" -ge 85 ]; then say WARN "disk $mnt" "$use used"
  else say OK "disk $mnt" "$use used"; fi
done < <(df -P -x tmpfs -x devtmpfs -x overlay -x squashfs | awk 'NR>1 {print $5, $6}')

# Reboot and failed units
[ -f /var/run/reboot-required ] && say WARN reboot "a reboot is pending (kernel or library updates)" || say OK reboot "no reboot pending"
nfailed=$(systemctl --failed --no-legend 2>/dev/null | grep -c .)
[ "$nfailed" -gt 0 ] && say WARN "systemd units" "$nfailed failed: $(systemctl --failed --no-legend | awk '{print $2}' | paste -sd' ')" || say OK "systemd units" "none failed"

# Docker
if have docker; then
  if ! docker info >/dev/null 2>&1; then say FAIL docker "daemon not responding"
  else
    say OK docker "$(docker ps -q | wc -l) running of $(docker ps -aq | wc -l)"
    while read -r name status health restart; do
      case "$status/$health" in
        running/unhealthy) say FAIL "container $name" "unhealthy" ;;
        restarting/*)      say FAIL "container $name" "restart loop" ;;
        running/*)         : ;;
        *) [ "$restart" = "no" ] && say OK "container $name" "$status (restart=no, likely a one-off)" \
                                 || say WARN "container $name" "$status but restart=$restart" ;;
      esac
    done < <(docker ps -aq | xargs -r docker inspect --format '{{.Name}} {{.State.Status}} {{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}} {{.HostConfig.RestartPolicy.Name}}' | sed 's#^/##')
  fi
fi

# Certificates
for d in $(collect_domains); do
  case "$d" in \*.*) continue ;; esac
  set -- $(cert_info "$d")
  days=$1
  if [ "$days" = "-" ]; then say WARN "cert $d" "no certificate served on 443"
  elif [ "$days" -lt 7 ]; then say FAIL "cert $d" "expires in $days days ($2)"
  elif [ "$days" -lt 21 ]; then say WARN "cert $d" "expires in $days days ($2)"
  else say OK "cert $d" "$days days left ($2, ${*:3})"; fi
done

# PLAR site (once it is deployed)
if [ -n "${PLAR_DOMAIN:-}" ]; then
  code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 --resolve "$PLAR_DOMAIN:443:127.0.0.1" "https://$PLAR_DOMAIN/")
  case "$code" in 2??|3??) say OK "PLAR https" "$PLAR_DOMAIN -> $code" ;; *) say FAIL "PLAR https" "$PLAR_DOMAIN -> $code" ;; esac
  c=$(docker ps -a --filter label=com.docker.compose.project=plar --format '{{.Names}} {{.Status}}' 2>/dev/null)
  [ -n "$c" ] && say OK "PLAR containers" "$(echo "$c" | paste -sd';')" || say WARN "PLAR containers" "no compose project named plar"

  # PLAR's own Supabase (hz project plar-api): every container healthy, and Auth answering through the gateway.
  sb=$(docker ps -a --filter label=com.docker.compose.project=plar-api --format '{{.Names}} {{.Status}}' 2>/dev/null)
  if [ -z "$sb" ]; then say WARN "PLAR Supabase" "no compose project named plar-api"
  elif echo "$sb" | grep -qv '(healthy)'; then say FAIL "PLAR Supabase" "$(echo "$sb" | paste -sd';')"
  else say OK "PLAR Supabase" "$(echo "$sb" | wc -l | tr -d ' ') containers healthy"; fi
  key=$(grep '^ANON_KEY=' /opt/projects/plar-api/.env 2>/dev/null | cut -d= -f2)
  code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 --resolve "plar-api.airl.ca:443:127.0.0.1" -H "apikey: $key" "https://plar-api.airl.ca/auth/v1/health")
  [ "$code" = 200 ] && say OK "PLAR Supabase https" "plar-api.airl.ca auth -> 200" || say FAIL "PLAR Supabase https" "plar-api.airl.ca auth -> $code"
  last=$(ls -t "$HOME"/backups/plar-api/db-*.sql.gz 2>/dev/null | head -1)
  if [ -z "$last" ]; then say WARN "PLAR backup" "none yet in ~/backups/plar-api"
  elif [ -n "$(find "$last" -mmin +1560 2>/dev/null)" ]; then say WARN "PLAR backup" "newest is older than 26 hours: $(basename "$last")"
  else say OK "PLAR backup" "$(basename "$last")"; fi
fi

echo
echo "SUMMARY $fails fail, $warns warn"
