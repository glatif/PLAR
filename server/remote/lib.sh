# Shared helpers for the remote scripts. Sent to the server ahead of each script
# (cat remote/lib.sh remote/<script>.sh | ssh ... bash -s); nothing is installed there.
#
# READ-ONLY CONTRACT: nothing in remote/ may change the server. No installs, no
# restarts, no `apt update`, no `docker pull/exec/run/start/stop`, no `pm2` (it
# starts a daemon), no `certbot` (it writes logs), no `nginx -t` (it opens logs),
# no plain `git status` (it can rewrite the index), no `plesk login` (it mints a
# login link), no file writes. Only listing commands of the Plesk CLI are used
# (`plesk version`, `plesk bin ... --list/--info`); Plesk may note them in its own log.

export LC_ALL=C
export PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
export GIT_OPTIONAL_LOCKS=0

# Mask secret values before anything leaves the server:
#  - credentials inside URLs             scheme://user:****@host
#  - KEY=value / key: value whose key looks secret
#  - mysql -pPASSWORD on command lines
#  - well-known token shapes (JWTs, GitHub/OpenAI/AWS/Slack keys)
#  - PEM private-key blocks
redact() {
  sed -E \
    -e 's#(://[^:/@[:space:]]+:)[^@[:space:]]+@#\1****@#g' \
    -e 's#(([A-Za-z0-9_.-]*(pass(word|wd)?|pwd|secret|token|api[_-]?key|access[_-]?key|private[_-]?key|auth|credential|dsn|database[_-]?url|db[_-]?url|salt|cookie|jwt|signing|encryption)[A-Za-z0-9_.-]*)["'"'"']?[[:space:]]*[:=][[:space:]]*)[^[:space:],}]+#\1****#Ig' \
    -e '/mysql|mariadb/ s# -p[^[:space:]]+# -p****#g' \
    -e 's#eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]*#[jwt removed]#g' \
    -e 's#(^|[^A-Za-z0-9])(sk-[A-Za-z0-9_-]{16,}|gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|glpat-[A-Za-z0-9_-]{16,}|AKIA[0-9A-Z]{16}|xox[abprs]-[A-Za-z0-9-]{10,})#\1[token removed]#g' \
    -e '/-----BEGIN [A-Z ]*PRIVATE KEY-----/,/-----END [A-Z ]*PRIVATE KEY-----/c\    [private key removed]'
}

section() { printf '\n\n==================== %s ====================\n' "$*"; }

# run "label" cmd args...   -> prints the label, runs the command with a time limit, redacts output
run() {
  local label="$1"; shift
  printf '\n--- %s\n' "$label"
  timeout 90 "$@" 2>&1 | redact
}

# pipe "label" 'shell pipeline'   -> same, for pipelines
pipe() {
  local label="$1"; shift
  printf '\n--- %s\n' "$label"
  timeout 90 bash -c "$1" 2>&1 | redact
}

have() { command -v "$1" >/dev/null 2>&1; }
export -f have

# Variable NAMES only from an env file (values never leave the server).
env_names() {
  grep -E '^[[:space:]]*(export[[:space:]]+)?[A-Za-z_][A-Za-z0-9_]*=' "$1" 2>/dev/null \
    | sed -E 's/^[[:space:]]*(export[[:space:]]+)?([A-Za-z_][A-Za-z0-9_]*)=.*/\2/' | sort -u | tr '\n' ' '
  echo
}

# Containers that look like a reverse proxy / web server.
proxy_containers() {
  have docker || return 0
  docker ps -a --format '{{.Names}} {{.Image}}' 2>/dev/null \
    | grep -iE 'nginx|caddy|traefik|haproxy|proxy|swag|httpd|apache|acme|certbot' | awk '{print $1}'
}

# Host folders mounted into those containers (where their config lives).
proxy_config_dirs() {
  for c in $(proxy_containers); do
    docker inspect --format '{{range .Mounts}}{{.Source}}{{"\n"}}{{end}}' "$c" 2>/dev/null
  done | grep -vE '^$|docker\.sock|^/var/run|^/run|^/var/log|^/etc/localtime|^/etc/timezone' | sort -u
}

# Config files a proxy might use (never keys, certs or acme.json).
proxy_config_files() {
  {
    ls /etc/nginx/nginx.conf /etc/nginx/sites-enabled/* /etc/nginx/conf.d/*.conf \
       /etc/nginx/plesk.conf.d/*.conf /etc/nginx/plesk.conf.d/vhosts/*.conf \
       /var/www/vhosts/system/*/conf/vhost_nginx.conf /var/www/vhosts/system/*/conf/vhost.conf \
       /etc/caddy/Caddyfile /etc/apache2/sites-enabled/* /etc/haproxy/haproxy.cfg /etc/traefik/* 2>/dev/null
    for d in $(proxy_config_dirs); do
      if [ -f "$d" ]; then echo "$d"; else
        find "$d" -maxdepth 5 -type f -size -256k \
          \( -name '*.conf' -o -name 'Caddyfile*' -o -name '*.toml' -o -name '*.yml' -o -name '*.yaml' -o -name '*.cfg' \) 2>/dev/null
      fi
    done
  } | grep -vE '\.(pem|key|crt)$|acme\.json$|/(logs?|html|www|node_modules)/' | sort -u | head -150
}

# Every domain name the server seems to serve, one per line.
collect_domains() {
  local files; files=$(proxy_config_files)
  {
    # nginx server_name
    [ -n "$files" ] && echo "$files" | xargs -r -d '\n' grep -hE '^[[:space:]]*server_name' 2>/dev/null \
      | sed -E 's/^[[:space:]]*server_name//; s/;.*//' | tr ' ' '\n'
    # Caddyfile site blocks:  example.com, www.example.com {
    [ -n "$files" ] && echo "$files" | grep -i caddyfile | xargs -r -d '\n' grep -hE '^[^#[:space:]][^{]*\{[[:space:]]*$' 2>/dev/null \
      | sed -E 's/\{.*//' | tr ', ' '\n\n'
    # Traefik Host(`x`) rules in files and labels, nginx-proxy VIRTUAL_HOST / LETSENCRYPT_HOST
    local text
    text=$(
      [ -n "$files" ] && echo "$files" | xargs -r -d '\n' cat 2>/dev/null
      have docker && docker ps -aq | xargs -r docker inspect \
        --format '{{range $k,$v := .Config.Labels}}{{$k}}={{$v}}{{"\n"}}{{end}}{{range .Config.Env}}{{.}}{{"\n"}}{{end}}' 2>/dev/null
    )
    printf '%s\n' "$text" | grep -oE 'Host(SNI)?\([^)]*\)' | grep -oE '`[^`]+`' | tr -d '`'
    printf '%s\n' "$text" | grep -E '^(VIRTUAL_HOST|LETSENCRYPT_HOST)=' | sed -E 's/^[A-Z_]+=//' | tr ',' '\n'
    # certbot certificates on the host
    ls /etc/letsencrypt/live 2>/dev/null
  } | sed -E 's#^https?://##; s#:[0-9]+$##; s#/.*##' | tr 'A-Z' 'a-z' \
    | grep -E '^(\*\.)?([a-z0-9-]+\.)+[a-z]{2,}$' \
    | grep -vE '\.(conf|ya?ml|toml|json|sh|js|php|html?|pem|key|crt|log|sock|txt|local|internal|lan)$|^localhost' \
    | sort -u
}

# Certificate the server presents for a domain on 127.0.0.1:443: "<days left> <expiry date> <issuer>"
cert_info() {
  local d="$1" pem end days issuer
  pem=$(echo | timeout 8 openssl s_client -connect 127.0.0.1:443 -servername "$d" 2>/dev/null) || true
  end=$(printf '%s' "$pem" | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)
  [ -z "$end" ] && { echo "- no-certificate-on-443"; return; }
  issuer=$(printf '%s' "$pem" | openssl x509 -noout -issuer 2>/dev/null | sed -E 's/.*O ?= ?([^,]+).*/\1/; s/^issuer=//')
  days=$(( ( $(date -d "$end" +%s) - $(date +%s) ) / 86400 ))
  echo "$days $(date -d "$end" +%F) $issuer"
}
