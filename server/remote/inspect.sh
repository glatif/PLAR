# Full read-only snapshot of the server. Runs after remote/lib.sh (see ../inspect.sh).
# Every command here only reads. Output is redacted by lib.sh before it leaves the server.

echo "PLAR server snapshot  $(date -u +%FT%TZ)  host=$(hostname)"

# ---------------------------------------------------------------- 1. System
section "1. SYSTEM"
run  "os release"            cat /etc/os-release
run  "kernel"                uname -srmo
run  "hostnamectl"           hostnamectl
run  "uptime"                uptime
run  "timedatectl"           timedatectl
pipe "cpu"                   "lscpu | grep -E '^(Architecture|CPU\(s\)|Model name|Thread|Core|Socket|Virtualization|Hypervisor)'"
run  "memory"                free -h
run  "swap"                  swapon --show
run  "disks"                 df -hT -x tmpfs -x devtmpfs -x overlay -x squashfs
run  "inodes on /"           df -i /
run  "block devices"         lsblk -o NAME,SIZE,TYPE,FSTYPE,MOUNTPOINT
pipe "load and pressure"     "cat /proc/loadavg; cat /proc/pressure/memory 2>/dev/null"

# ---------------------------------------------------------------- 2. Network and security
section "2. NETWORK AND SECURITY"
run  "public addresses"      ip -brief addr
run  "listening TCP"         ss -tlnpH
run  "listening UDP"         ss -ulnpH
pipe "ufw"                   "have ufw && ufw status verbose || echo 'ufw not installed'"
pipe "iptables INPUT policy and rules" "iptables -S INPUT 2>&1 | head -60"
pipe "iptables DOCKER-USER (Docker-published ports bypass ufw unless filtered here)" "iptables -S DOCKER-USER 2>&1 | head -40"
pipe "nftables (first 120 lines)" "have nft && nft list ruleset 2>&1 | head -120 || echo 'nft not installed'"
pipe "sshd effective settings" "sshd -T 2>/dev/null | grep -Ei '^(port|permitrootlogin|passwordauthentication|pubkeyauthentication|kbdinteractiveauthentication|challengeresponseauthentication|permitemptypasswords|maxauthtries|allowusers|allowgroups|x11forwarding|usepam) '"
pipe "sshd config files"     "ls -la /etc/ssh/sshd_config.d/ 2>/dev/null"
pipe "root authorized_keys (type and comment only)" "awk 'NF {print \$1, \$NF}' /root/.ssh/authorized_keys 2>/dev/null; echo \"count: \$(grep -c . /root/.ssh/authorized_keys 2>/dev/null)\""
pipe "login users (uid >= 1000) and shells" "awk -F: '\$3>=1000 && \$3<65534 {print \$1, \$3, \$6, \$7}' /etc/passwd"
pipe "sudoers group"         "getent group sudo; getent group docker"
pipe "recent logins"         "last -n 15 -w 2>/dev/null | head -20"
pipe "failed ssh logins (last 24h, count)" "journalctl -u ssh -u sshd --since '-24h' --no-pager 2>/dev/null | grep -ciE 'failed password|invalid user'"
pipe "fail2ban"              "have fail2ban-client && { fail2ban-client status; fail2ban-client status sshd 2>/dev/null; } || echo 'fail2ban not installed'"
pipe "unattended upgrades"   "systemctl is-enabled unattended-upgrades 2>&1; cat /etc/apt/apt.conf.d/20auto-upgrades 2>/dev/null; tail -5 /var/log/unattended-upgrades/unattended-upgrades.log 2>/dev/null"
pipe "pending updates (from the last apt cache, not refreshed)" "ls -l --time-style=+%F /var/lib/apt/periodic/update-success-stamp 2>/dev/null; /usr/lib/update-notifier/apt-check --human-readable 2>/dev/null; apt list --upgradable 2>/dev/null | grep -c upgradable"
pipe "reboot required"       "cat /var/run/reboot-required 2>/dev/null || echo no; cat /var/run/reboot-required.pkgs 2>/dev/null"
pipe "apparmor"              "aa-status --enabled 2>/dev/null && echo enabled || echo 'not enabled or not installed'"

# ---------------------------------------------------------------- 3. Docker
section "3. DOCKER"
if have docker; then
  run  "docker version"        docker version --format 'client {{.Client.Version}}  server {{.Server.Version}}'
  run  "compose version"       docker compose version
  pipe "docker info"           "docker info --format 'root={{.DockerRootDir}} driver={{.Driver}} logging={{.LoggingDriver}} cgroup={{.CgroupDriver}} containers={{.Containers}} running={{.ContainersRunning}} images={{.Images}} swarm={{.Swarm.LocalNodeState}}'"
  pipe "daemon.json"           "cat /etc/docker/daemon.json 2>/dev/null || echo 'none (defaults: json-file logs, no rotation)'"
  run  "containers"            docker ps -a --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}'
  run  "compose projects"      docker compose ls -a
  run  "images"                docker images --format 'table {{.Repository}}:{{.Tag}}\t{{.ID}}\t{{.CreatedSince}}\t{{.Size}}'
  pipe "image origin (digests=0 means built on this server)" "docker images -q | sort -u | xargs -r docker image inspect --format '{{.RepoTags}} digests={{len .RepoDigests}} created={{.Created}}'"
  run  "networks"              docker network ls
  pipe "network members"       "docker network ls -q | xargs -r docker network inspect --format '{{.Name}} ({{.Driver}}): {{range .Containers}}{{.Name}} {{end}}'"
  run  "volumes"               docker volume ls
  run  "disk usage"            docker system df
  pipe "volume sizes"          "docker system df -v 2>/dev/null | sed -n '/^Local Volumes/,/^Build cache/p' | head -60"
  pipe "container log files (largest)" "du -sh /var/lib/docker/containers/*/*-json.log 2>/dev/null | sort -h | tail -10"

  printf '\n--- container details\n'
  for c in $(docker ps -aq); do
    docker inspect --format '
[{{.Name}}]
  image:    {{.Config.Image}}
  state:    {{.State.Status}} since {{.State.StartedAt}}  restarts={{.RestartCount}}
  restart:  {{.HostConfig.RestartPolicy.Name}}
  limits:   memory={{.HostConfig.Memory}} nanocpus={{.HostConfig.NanoCpus}} pids={{.HostConfig.PidsLimit}}
  health:   {{with index .State "Health"}}{{.Status}}{{else}}no healthcheck{{end}}
  user:     {{if .Config.User}}{{.Config.User}}{{else}}(image default){{end}}  privileged={{.HostConfig.Privileged}}  network_mode={{.HostConfig.NetworkMode}}
  compose:  project={{index .Config.Labels "com.docker.compose.project"}} service={{index .Config.Labels "com.docker.compose.service"}}
  dir:      {{index .Config.Labels "com.docker.compose.project.working_dir"}}
  files:    {{index .Config.Labels "com.docker.compose.project.config_files"}}
  ports:    {{range $p, $b := .NetworkSettings.Ports}}{{$p}}{{if $b}}->{{range $b}}{{.HostIp}}:{{.HostPort}} {{end}}{{end}}; {{end}}
  networks: {{range $n, $_ := .NetworkSettings.Networks}}{{$n}} {{end}}
  mounts:   {{range .Mounts}}
            {{.Type}} {{with index . "Name"}}{{.}}{{else}}{{.Source}}{{end}} -> {{.Destination}}{{if not .RW}} (ro){{end}}{{end}}
  env names: {{range .Config.Env}}{{index (split . "=") 0}} {{end}}' "$c" 2>&1 | redact
  done

  printf '\n--- routing labels and env (traefik / caddy / nginx-proxy)\n'
  for c in $(docker ps -aq); do
    docker inspect --format '{{.Name}}{{range $k,$v := .Config.Labels}}{{"\n"}}  {{$k}}={{$v}}{{end}}{{range .Config.Env}}{{"\n"}}  {{.}}{{end}}' "$c" 2>/dev/null \
      | grep -E '^/|^  (traefik|caddy|VIRTUAL_HOST=|VIRTUAL_PORT=|LETSENCRYPT_HOST=)' \
      | awk 'NR==1 {h=$0; next} {if (h) {print h; h=""} print}' | redact
  done
else
  echo "docker not installed"
fi

# ---------------------------------------------------------------- 4. Projects
section "4. PROJECTS"
dirs=$(
  { have docker && docker ps -aq | xargs -r docker inspect --format '{{index .Config.Labels "com.docker.compose.project.working_dir"}}' 2>/dev/null
    find /opt /srv /var/www /home /root /var/lib/projects -maxdepth 4 \
      \( -name 'docker-compose*.y*ml' -o -name 'compose*.y*ml' -o -name 'Dockerfile' -o -name 'package.json' -o -name '.git' \) \
      -not -path '*/node_modules/*' -not -path '*/.cache/*' -not -path '*/.npm/*' -not -path '/root/snap/*' 2>/dev/null \
      | xargs -r -n1 dirname
  } | grep -v '^$' | sort -u
)
# keep top-level project folders only (drop sub-folders of a folder already listed)
projects=$(echo "$dirs" | awk 'NF { for (i in seen) if (index($0, i"/") == 1) next; seen[$0]=1; print }')
printf '\n--- project folders found\n%s\n' "$projects"

for p in $projects; do
  [ -d "$p" ] || continue
  printf '\n\n########## PROJECT %s\n' "$p"
  run  "listing"  ls -la "$p"
  pipe "size"     "du -sh '$p' 2>/dev/null"
  pipe "git"      "cd '$p' && git -c safe.directory='*' rev-parse --is-inside-work-tree >/dev/null 2>&1 && {
                     echo \"branch: \$(git -c safe.directory='*' branch --show-current)\";
                     git -c safe.directory='*' remote -v | head -2;
                     git -c safe.directory='*' log -3 --format='%h %ad %an: %s' --date=short;
                     echo \"uncommitted files: \$(git -c safe.directory='*' status --porcelain --untracked-files=no 2>/dev/null | wc -l)\";
                   } || echo 'not a git checkout'"
  pipe "deploy hints (CI, scripts, Makefile)" "cd '$p' && ls -d .github/workflows/* .gitlab-ci.yml Jenkinsfile Makefile deploy* *.sh ecosystem.config.* 2>/dev/null"
  for f in $(find "$p" -maxdepth 2 \( -name 'docker-compose*.y*ml' -o -name 'compose*.y*ml' \) -not -path '*/node_modules/*' 2>/dev/null); do
    printf '\n--- compose file %s (secret values masked)\n' "$f"
    head -300 "$f" | redact
  done
  for f in $(find "$p" -maxdepth 2 -name 'Dockerfile*' -not -path '*/node_modules/*' 2>/dev/null); do
    pipe "Dockerfile $f (FROM / EXPOSE / CMD)" "grep -E '^(FROM|EXPOSE|CMD|ENTRYPOINT)' '$f'"
  done
  for f in $(find "$p" -maxdepth 2 -type f \( -name '.env' -o -name '.env.*' -o -name '*.env' \) -not -path '*/node_modules/*' 2>/dev/null); do
    printf '\n--- env file %s  (%s)  variable names only:\n' "$f" "$(stat -c '%A %U' "$f")"
    env_names "$f"
  done
done

# ---------------------------------------------------------------- 5. Reverse proxy and TLS
section "5. REVERSE PROXY AND TLS"
pipe "host web servers"   "for s in nginx caddy apache2 httpd traefik haproxy; do printf '%-8s %s\n' \$s \"\$(systemctl is-active \$s 2>/dev/null)\"; done"
pipe "who owns 80 and 443" "ss -tlnpH '( sport = :80 or sport = :443 )'"
printf '\n--- proxy containers\n%s\n' "$(proxy_containers)"
printf '\n--- proxy config folders\n%s\n' "$(proxy_config_dirs)"
for f in $(proxy_config_files); do
  case "$f" in
    /etc/nginx/plesk.conf.d/*)   # generated by Plesk and long: key directives only
      printf '\n--- config %s (key lines only)\n' "$f"
      grep -E '^[[:space:]]*(server_name|listen|proxy_pass|root|ssl_certificate |include|location)' "$f" 2>/dev/null | head -60 | redact ;;
    *)
      printf '\n--- config %s (secret values masked)\n' "$f"
      grep -vE '^[[:space:]]*(#|$)' "$f" 2>/dev/null | head -200 | redact ;;
  esac
done

if have plesk; then
  printf '\n--- PLESK (this server is managed by Plesk: it owns nginx, Apache, domains and certificates)\n'
  run  "plesk version"         plesk version
  run  "plesk domains"         plesk bin domain --list
  run  "plesk subscriptions"   plesk bin subscription --list
  run  "plesk sites"           plesk bin site --list
  run  "plesk extensions"      plesk bin extension --list
  pipe "plesk panel ports"     "ss -tlnpH '( sport = :8443 or sport = :8880 or sport = :8447 )'"
  pipe "plesk services"        "for s in psa sw-engine sw-cp-server nginx apache2 plesk-php83-fpm plesk-php82-fpm psa-firewall fail2ban postfix dovecot mariadb named; do printf '%-18s %s\n' \$s \"\$(systemctl is-active \$s 2>/dev/null)\"; done"
  pipe "plesk custom nginx directives per domain (how apps are proxied)" "for f in /var/www/vhosts/system/*/conf/vhost_nginx.conf; do [ -s \"\$f\" ] && { echo \"[\$f]\"; grep -vE '^[[:space:]]*(#|$)' \"\$f\"; }; done"
  pipe "plesk docker proxy rules"  "grep -rlE 'proxy_pass http://(0\.0\.0\.0|127\.0\.0\.1|localhost):' /etc/nginx/plesk.conf.d/vhosts /var/www/vhosts/system/*/conf 2>/dev/null"
  pipe "plesk certificates folder (names only)" "ls /usr/local/psa/var/certificates 2>/dev/null | wc -l"
fi
pipe "certbot certificates on the host" "for c in /etc/letsencrypt/live/*/cert.pem; do [ -f \"\$c\" ] || continue; echo \"\$c\"; openssl x509 -noout -subject -enddate -ext subjectAltName -in \"\$c\" 2>/dev/null | sed 's/^/   /'; done; ls /etc/letsencrypt/renewal 2>/dev/null"
pipe "certificate renewal timers and cron" "systemctl list-timers --all --no-pager 2>/dev/null | grep -iE 'certbot|acme|letsencrypt' ; grep -rlsiE 'certbot|acme' /etc/cron* /var/spool/cron 2>/dev/null"
pipe "traefik acme.json (domains only)" "for f in \$(find / -xdev \( -path /proc -o -path /usr -o -path /snap -o -path /var/lib/docker/overlay2 \) -prune -o -name acme.json -size -5M -print 2>/dev/null | head -5); do echo \"\$f\"; python3 -c 'import json,sys
d=json.load(open(sys.argv[1]))
for r in d.values():
  for c in (r or {}).get(\"Certificates\") or []:
    print(\"   \", c[\"domain\"][\"main\"], *(c[\"domain\"].get(\"sans\") or []))' \"\$f\" 2>&1; done"

printf '\n--- domains served, with the certificate seen on 127.0.0.1:443 (days-left expiry issuer)\n'
for d in $(collect_domains); do
  case "$d" in \*.*) echo "DOMAIN $d wildcard"; continue ;; esac
  echo "DOMAIN $d $(cert_info "$d")"
done

# ---------------------------------------------------------------- 6. Databases, data, backups, logs
section "6. DATABASES, DATA, BACKUPS, LOGS"
pipe "database containers" "docker ps -a --format '{{.Names}} {{.Image}} {{.Status}}' 2>/dev/null | grep -iE 'postgres|mysql|mariadb|mongo|redis|valkey|elastic|opensearch|influx|clickhouse|couch|neo4j|minio|rabbit|kafka'"
pipe "database services on the host" "for s in postgresql mysql mariadb redis-server redis mongod; do printf '%-12s %s\n' \$s \"\$(systemctl is-active \$s 2>/dev/null)\"; done"
pipe "volume mount points" "docker volume ls -q 2>/dev/null | xargs -r docker volume inspect --format '{{.Name}} {{.Mountpoint}} {{index .Labels \"com.docker.compose.project\"}}'"
pipe "crontabs (all users)" "for u in \$(cut -d: -f1 /etc/passwd); do t=\$(crontab -l -u \$u 2>/dev/null | grep -vE '^[[:space:]]*(#|$)'); [ -n \"\$t\" ] && printf '[%s]\n%s\n' \"\$u\" \"\$t\"; done; echo '[/etc/crontab]'; grep -vE '^[[:space:]]*(#|$)' /etc/crontab"
pipe "/etc/cron.d"          "for f in /etc/cron.d/*; do echo \"[\$f]\"; grep -vE '^[[:space:]]*(#|$)' \"\$f\"; done"
pipe "cron.daily / weekly / monthly" "ls /etc/cron.hourly /etc/cron.daily /etc/cron.weekly /etc/cron.monthly 2>/dev/null"
run  "systemd timers"       systemctl list-timers --all --no-pager
pipe "backup-looking files and scripts" "find / -xdev -maxdepth 4 \( -iname '*backup*' -o -iname '*.sql.gz' -o -iname '*.dump' -o -iname 'restic*' -o -iname 'borg*' \) -not -path '/proc/*' -not -path '/usr/*' -not -path '/var/lib/docker/*' -not -path '/snap/*' -not -path '/sys/*' 2>/dev/null | head -40"
pipe "backup tools installed" "for t in restic borg rclone duplicity rsnapshot pg_dump mysqldump aws s3cmd; do have \$t && echo \"\$t: \$(command -v \$t)\"; done; true"
pipe "logrotate configs"    "ls /etc/logrotate.d"
pipe "journal disk usage"   "journalctl --disk-usage 2>/dev/null"
pipe "largest folders under /var" "du -xh --max-depth=2 /var 2>/dev/null | sort -h | tail -12"

# ---------------------------------------------------------------- 7. Other host software
section "7. OTHER HOST SOFTWARE"
run  "running services"     systemctl list-units --type=service --state=running --no-pager --no-legend
pipe "failed units"         "systemctl --failed --no-pager --no-legend"
pipe "custom unit files"    "for f in /etc/systemd/system/*.service; do [ -f \"\$f\" ] && [ ! -L \"\$f\" ] && { echo \"[\$f]\"; grep -E '^(Description|ExecStart|WorkingDirectory|User|EnvironmentFile)=' \"\$f\"; }; done"
pipe "top processes by memory" "ps -eo user,pid,%cpu,%mem,rss,etime,args --sort=-rss | head -25 | cut -c1-220"
pipe "node / python / php / java / pm2 outside Docker" "ps -eo pid,user,args | grep -E '[n]ode |[p]ython|[p]hp-fpm|[j]ava |PM2' | grep -v containerd-shim | cut -c1-200; ls -d /root/.pm2 /home/*/.pm2 2>/dev/null"
pipe "runtimes installed on the host" "for t in node npm python3 php java go git snap; do have \$t && printf '%-8s %s\n' \$t \"\$(\$t --version 2>&1 | head -1)\"; done; true"
pipe "snaps"                "have snap && snap list 2>/dev/null"

echo
echo "END OF SNAPSHOT"
