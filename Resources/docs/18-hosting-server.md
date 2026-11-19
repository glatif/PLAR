# Hosting servers

Where PLAR runs, how the team's servers are set up, and what to watch out for. Facts come from read-only snapshots taken on 2026-11-12 and 2026-11-13 `[SRV-SNAP]` `[SRV-OVH]` and from the servers' own guides `[SRV-GUIDE]` `[SRV-OVH-GUIDE]`. Proposals are marked as such.

[← Back to index](index.md)

**Tools:** the harness in [`server/`](../../server/README.md): `doctor.sh`, `inspect.sh` and `check.sh` (read-only), and `deploy.sh` and `publish.sh` (change the server). Snapshots stay on the Mac in `server/.snapshots/` (git-ignored).

**There are two servers.** The team's projects live on the **OVH server** (`144.217.80.160`). That is where PLAR runs: **https://plar.airl.ca** (Part A). The older **IONOS server** (`74.208.142.195`) still runs the exam app, n8n and older copies of some projects; Part B describes it. PLAR was first deployed there on 2026-11-12, before we knew the projects had moved, and was **removed on 2026-11-13**.

# Part A: the OVH project server (PLAR's home)

## A1. At a glance

| | |
|---|---|
| **Machine** | OVH VPS, 8 vCPU (Intel Haswell), 22 GB RAM, no swap, 193 GB disk (66% used, 67 GB free). Ubuntu 26.04 LTS, kernel 7.0, up 106 days. A reboot is pending (libc6 and a new kernel) `[SRV-OVH]` |
| **Access** | `ssh hh_horaizon@144.217.80.160` with this Mac's key. The account is in the `docker` group (no sudo needed for containers); `sudo` needs its password, so publishing steps are typed by a person `[SRV-OVH]` |
| **Front door** | Host nginx on 80/443. Port 80 `default_server` is the HorAIzon index page. Each project has its own `hz-<name>` vhost with a Let's Encrypt certificate (`certbot --nginx`), renewed by certbot's timer `[SRV-OVH]` `[SRV-OVH-GUIDE]` |
| **House tool** | `hz` (`/opt/horizon`): `hz init` gives a project a folder and a private port (9000–9099) and writes a `docker-compose.override.yml` with it; `hz up` / `hz rebuild` build and start; `hz proxy <name> <domain>` adds the vhost and certificate. Deploy guide: `/opt/projects/faculty-desk/DEPLOYING-TO-HORAIZON.md` on the server `[SRV-OVH-GUIDE]` |
| **DNS** | `airl.ca` is at Porkbun. The project subdomains (`heritage`, `faculty-desk`, `wildfireiq`, `lms`, `supabase`, `plar`) point to this server `[SRV-OVH]` |

## A2. Projects

| Project | Private port | Public | Notes |
|---|---|---|---|
| living-heritage | 9000 | https://heritage.airl.ca (and :8080) | Next.js + Supabase |
| faculty-desk | 9001 | https://faculty-desk.airl.ca (and :8081) | Next.js |
| self-hosted Supabase | 9002 | https://supabase.airl.ca | Living Heritage's own (by design, per its docs); not in hz. Not used by PLAR |
| **plar-api** (PLAR's own Supabase) | **9007** | https://plar-api.airl.ca (waiting on DNS) | Added 2026-11-19. See A6 |
| wildfireiq | 9003 | https://wildfireiq.airl.ca (and :8082) | Python API + web build |
| **plar** | **9004** | **https://plar.airl.ca** | Added 2026-11-13 |
| prebinary (exam app) | — | :8501, `144-217-80-160.sslip.io`, `lms.airl.ca` | Streamlit + MySQL + Caddy, not `hz`-managed |

Source: `[SRV-OVH]`.

## A3. How PLAR is set up there (2026-11-13)

| | |
|---|---|
| **Folder** | `/opt/projects/plar`, registered in `hz` (`hz list`, `hz info plar`) |
| **Code** | The committed `web/` tree (`git archive HEAD:web`) plus `server/plar/Dockerfile`, `docker-compose.yml` and `.dockerignore` from our repo. First deploy: commit `fa1ddb5` |
| **Container** | `plar` (service `app`, as `hz` expects), image `plar-web:latest` built on the server from `node:22-bookworm-slim` with npm 11.6.2. Runs as the `node` user, `init: true`, `restart: unless-stopped`, 768 MB memory limit, logs 10 MB × 3, healthcheck on `/sign-in` |
| **Port** | `127.0.0.1:9004`, written by `hz` into `docker-compose.override.yml`. Not reachable from outside (checked) |
| **Public** | nginx vhost `hz-plar` for `plar.airl.ca`, written by `hz proxy`; Let's Encrypt certificate valid to 2027-02-11; HTTP redirects to HTTPS. nginx config backed up to `/opt/backups/` first |
| **Settings** | `.env` (build args) and `.env.local` (runtime), mode 600, owned by `hh_horaizon`. Both hold `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (public by design) and `VERIFICATION_LAB=true`; `.env.local` also holds `OPENROUTER_API_KEY` and `VERIFICATION_AI_MODEL` for the lab's AI check. Since 2026-11-19 `.env.local` also holds `DEMO_LOGIN_PASSWORD` (one-click demo sign-in and the Microsoft demo picker, synthetic accounts only) and `MICROSOFT_SIGN_IN=demo`. `server/common.sh` switches: `PLAR_LAB`, `PLAR_LAB_AI`, `PLAR_DEMO`, `PLAR_MICROSOFT` |
| **Verification lab** | **On, and open to anyone, since 2026-11-13** (project lead's decision, until sign-in is added): `/verify` and `/testing`, linked from the home page. Anyone with the link can open `/testing` and see every capture, name and ID detail. Captures are kept in the Docker volume `plar_verification-data` (mounted at `/app/.verification-data`), so redeploys keep them. Memory limit raised to 1 GB for ID straightening |
| **Data** | Lab captures in the volume above. Everything else is in the hosted Supabase project `plar-dev` (Canada Central) |

**Checked 2026-11-13:** `/` and `/sign-in` return 200, `/verify` 404 (lab off), OpenCV and MediaPipe files served, valid certificate, HTTP→HTTPS redirect, sign-in page renders in a browser with no console errors. heritage, faculty-desk, wildfireiq and the index page still serve their own pages.

## A4. Deploying an update

From the Mac, after committing:

```bash
cd server
./deploy.sh     # HEAD:web -> /opt/projects/plar -> hz rebuild plar (no password needed)
./check.sh      # server health, containers, certificates and https://plar.airl.ca
```

`publish.sh` (`hz proxy`) is only needed again for a new domain; it asks for the `hh_horaizon` password because it uses sudo.

## A5. Still to do (proposals)

- **Add PLAR to the server index page** (`/var/www/horaizon-index/index.html`), as the deploy guide asks. It needs sudo, so the person with the password does it.
- **Change the `hh_horaizon` and IONOS root passwords**: both were shared in chat.
- **Reboot** the OVH server in a quiet moment (libc6 and kernel updates are waiting).

## A6. PLAR's own Supabase (2026-11-19)

Each project has its own Supabase (project lead's decision). Living Heritage's is `/opt/supabase` (its own docs describe it as Heritage's backend). PLAR's follows the dermixa pattern: one hz project with the database inside it and no host port for the database.

| | |
|---|---|
| **Folder** | `/opt/projects/plar-api`, registered in hz. Files from `server/plar-api/` in our repo |
| **Containers** | `plar-api` (Envoy gateway, the hz `app` service), `plar-api-auth` (GoTrue v2.189.0), `plar-api-rest` (PostgREST v14.12), `plar-api-db` (supabase/postgres 17.6.1.136). Same image tags as Heritage's stack. Memory limits 256 MB / 256 MB / 512 MB / 1 GB. No Storage, Realtime, Studio or pooler yet |
| **Port** | `127.0.0.1:9007` → gateway 8000 (hz override). The database has no host port; reach it with `docker exec plar-api-db psql -U postgres` |
| **Public** | `https://plar-api.airl.ca` once the A record exists at Porkbun and `server/plar-api.sh publish` has run (`hz proxy`, needs the sudo password). Until then the web app uses the cloud project `plar-dev` |
| **Auth** | Sign-up off, autoconfirm off, no anonymous or phone sign-in, no mail server yet. `SITE_URL=https://plar.airl.ca`. Own JWT secret and keys. Microsoft (Azure) provider wired but off: `./plar-api.sh microsoft` sets `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, `AZURE_SECRET` and `AZURE_ENABLED` in `.env` and restarts Auth |
| **Secrets** | `/opt/projects/plar-api/.env` (mode 600), made on the server by `plar-api.sh deploy`. Only the anon key (public) leaves the server |
| **Migrations** | `server/plar-api.sh migrate` applies `supabase/migrations` in order, each in a transaction, recorded in `supabase_migrations.schema_migrations`. `seed` loads the demo data; `test` runs the pgTAP tests (39 of 39 pass) |
| **Backups** | Nightly `pg_dumpall` at 03:45 from hh_horaizon's crontab, `~/bin/plar-api-backup.sh` → `~/backups/plar-api` (14 days, size and policy checks, log in `backup.log`). Same disk: an off-server copy is still needed |
| **Don't** | `hz rm plar-api` runs `docker compose down -v` and deletes the database; `hz deploy plar-api` rewrites `.env`. Use `hz up / restart / logs plar-api` and `server/plar-api.sh` |

# Part B: the IONOS server (`74.208.142.195`)

## Summary

| | |
|---|---|
| **Machine** | KVM virtual machine, 2 vCPU (AMD EPYC-Milan), 3.8 GB RAM + 4 GB swap, 154 GB disk (41% used, 92 GB free). The guide names the provider as IONOS `[SRV-SNAP]` `[SRV-GUIDE]` |
| **OS** | Ubuntu 24.04.4 LTS, kernel 6.8.0-137, up 99 days, timezone UTC `[SRV-SNAP]` |
| **Web front door** | Plain Ubuntu nginx 1.24 on the host (ports 80, 443 and per-app ports), certificates by certbot `[SRV-SNAP]` |
| **Apps** | Three Docker apps (Streamlit exam platform + MySQL, n8n, living-heritage) and one static site (WellnessHub). Plesk and a mail stack are installed but host nothing `[SRV-SNAP]` |
| **House rules** | The server has its own guide and a small tool, `hz`. New projects go in `/opt/projects/<name>`, bind to `127.0.0.1` on a port from 9000–9099, and are published only through nginx. Existing services are not touched `[SRV-GUIDE §1, §4]` |
| **Biggest risks** | Root password login open to the internet with ~9,000 failed logins a day and no fail2ban; two Docker ports public despite the firewall; n8n certificate expired; 51 pending updates and a pending reboot `[SRV-SNAP]` |
| **PLAR** | Deployed here 2026-11-12, **removed 2026-11-13** after moving to the OVH server (Part A). See §9 |

## 1. System

| Item | Value |
|---|---|
| Hostname | `agitated-benz.209-46-125-188.plesk.page` (a Plesk default name, which resolves to a different IP, 209.46.125.188) |
| OS / kernel | Ubuntu 24.04.4 LTS / 6.8.0-137-generic (newer kernels installed, waiting for a reboot) |
| CPU | 2 vCPU, AMD EPYC-Milan, KVM |
| RAM | 3.8 GB; 2.0 GB available; 0.9 GB of 4 GB swap in use (swappiness 60). Biggest swap users: the exam app's MySQL, living-heritage, MariaDB |
| Disk | `/` 154 GB, 63 GB used (41%), 92 GB free; inodes 6% |
| Biggest disk users | Docker 45 GB (of which **build cache 42.5 GB**, images 31.5 GB incl. a 9.2 GB exam-app image), systemd journal 4.1 GB (no size limit set) |
| Uptime / time | 99 days; UTC; NTP synchronised |

Source: `[SRV-SNAP §1]`.

## 2. Network and security

**Listening ports and what is actually reachable from the internet** (probed from the Mac) `[SRV-SNAP]`. There is a **second firewall at the hosting provider**, in front of the VM: port 8090 is open in ufw and works from the server itself, yet packets from outside never reach the server. Ports 8080 and 8501 must have been opened there by hand. Any new public port needs a rule in the provider's control panel as well as ufw.

| Port | Service | Public? |
|---|---|---|
| 22 | SSH | Yes |
| 80, 443 | host nginx | Yes |
| 8080 | nginx → living-heritage | Yes (ufw rule) |
| 8090 | was nginx → PLAR (rule and site removed 2026-11-13) | No |
| 8501 | exam app (Streamlit, Docker) | Yes (ufw rule) |
| 5678 | n8n (Docker) | **Yes, although ufw has no rule for it**: Docker-published ports bypass ufw |
| 3000 | living-heritage container | No (127.0.0.1) |
| 9000 | PLAR container | No (127.0.0.1) |
| 3306 | MariaDB (Plesk) | No (127.0.0.1) |
| 8443, 8880 | Plesk panel | No (blocked by ufw) |
| 21, 25, 110, 143, 465, 993, 995, 4190, 106 | FTP, mail | No (blocked by ufw) |

| Control | State |
|---|---|
| Firewall (ufw) | Active. Default deny incoming. Allows 22, 80, 443, 8080, 8501, and now 8090. The `DOCKER-USER` chain is empty, so Docker ports bypass it |
| SSH | `PermitRootLogin yes`, `PasswordAuthentication yes`, X11 forwarding on. One authorised key (this Mac's, added 2026-11-12) |
| Brute-force | **8,981 failed SSH logins in the last 24 hours**; fail2ban not installed (the Plesk fail2ban service is inactive) |
| Updates | Unattended security upgrades on and running daily; 51 updates pending (4 more need Ubuntu Pro ESM); **reboot required** (libc6 and six newer kernels installed since August) |
| AppArmor | Enabled |
| Accounts | Only root logs in; no regular user accounts |

## 3. Docker

Docker 29.7.1, Compose v5.4.0, overlay2, json-file logging with **no default log rotation** (no `daemon.json`) `[SRV-SNAP §3]`.

| Container | Image (origin) | Ports | Restart | Health | Limits | Data |
|---|---|---|---|---|---|---|
| `app-app-1` | `app-app` (built on server, 9.2 GB) | `0.0.0.0:8501` | unless-stopped | reported **unhealthy** for 2 months, but the app answers 200: its healthcheck calls `curl`, which the image doesn't have | none | binds `/opt/app/data`, `uploads`, `temp_uploads` |
| `app-db-1` | `mysql:8.0` (pulled) | none on host | unless-stopped | healthy | none | volume `app_db_data` (215 MB) |
| `n8n` | `n8nio/n8n:latest` (pulled March 2026) | `0.0.0.0:5678` | always | no healthcheck | none | volume `n8n_data` (2 MB) |
| `living-heritage` | `living-heritage` (built on server, 1.9 GB) | `127.0.0.1:3000` | unless-stopped | healthy | none; log rotation 10 MB × 3 | `.env.local` bind-mounted read-only |
| `plar` (removed 2026-11-13) | `plar-web` (built on server) | `127.0.0.1:9000` | unless-stopped | healthy | 768 MB memory; log rotation 10 MB × 3 | none |

Memory in use (one-off `docker stats`): n8n 223 MB, living-heritage 185 MB, MySQL 40 MB, Streamlit 15 MB. Each Compose project has its own bridge network.

## 4. Projects on the server

| Project | Folder | What it is | How it's deployed | Env file (variable names only) |
|---|---|---|---|---|
| **AI exam platform** | `/opt/app` (Compose project `app`) | Streamlit app + MySQL 8, proctoring features. Git checkout of a GitHub repo, last commit 2026-08-26 | Manual: `git pull` on the server, then `docker compose up --build`. No CI | `.env`: `DB_HOST DB_NAME DB_PASSWORD DB_USER MYSQL_ROOT_PASSWORD` (file is world-readable, mode 644) |
| (old copy) | `/opt/app_sftp_old` | Earlier copy of the exam app, not running. A manual backup tarball sits at `/opt/app_backup_2026-08-06.tar.gz` | — | same names |
| **n8n** | `/root/n8n` (Compose project `n8n`) | Workflow automation, configured for `n8n.aaifs.ca` | Pulled image, `docker compose up -d` | inline in compose: host, port, protocol, webhook URL, basic-auth variables |
| **Living Heritage** | `/opt/projects/living-heritage` | Next.js 16 + Supabase (same stack as PLAR) | From the Mac: `git archive` → `scp` → unpack → `redeploy.sh` (prune deleted files, `docker compose build`, `up -d`, wait for health, smoke test, prune images). Served at `http://74.208.142.195:8080`. Moved from PM2 to Docker in August; PM2 and Node 22 remain installed but idle | `.env`: the two `NEXT_PUBLIC_SUPABASE_*` values (build args). `.env.local`: `GEMINI_API_KEY NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY NEXT_PUBLIC_SUPABASE_URL OPENROUTER_API_KEY SUPABASE_ACCESS_TOKEN SUPABASE_PROJECT_REF SUPABASE_SECRET_KEY` (mode 600, mounted into the container) |
| **WellnessHub** | `/var/www/WellnessHub` | Vite/React static build served by nginx on port 80 for the bare IP. Git checkout, last commit 2026-05-01 | Manual build in place | `.env.local` (world-readable): `VITE_FIREBASE_*` (6) and `VITE_GEMINI_API_KEY`. `VITE_` values end up in the browser bundle |
| **Plesk** | `/opt/psa` | Plesk Obsidian 18.0.81 installed but **never configured** (no domains). Its Apache fails to start because nginx holds port 80 | — | — |
| **`hz` harness** | `/opt/horizon` | Shell CLI that scaffolds `/opt/projects/<name>` Compose projects, allocates ports 9000–9099 and writes nginx + certbot proxies. Its registry is empty: neither living-heritage nor PLAR is `hz`-managed | — | — |

Sources: `[SRV-SNAP §4]`, `[SRV-GUIDE §3, §5, §11]`.

## 5. Reverse proxy and TLS

Host nginx owns 80 and 443; there is no proxy in Docker `[SRV-SNAP §5]`. Sites in `/etc/nginx/sites-enabled/`:

| Site file | Listens | Server name | Goes to |
|---|---|---|---|
| `n8n` | 443 (TLS), 80 (redirect) | `n8n.aaifs.ca` | `127.0.0.1:5678`. As the only TLS site it is also the default for **every** HTTPS request to this IP |
| `wellnesshub` | 80 | `74.208.142.195` | static files in `/var/www/WellnessHub/dist` |
| `hz-living-heritage` | 8080 (default) | `_` | `127.0.0.1:3000` |
| `hz-plar-web` (removed 2026-11-13) | 443 (TLS), 80 (redirect) | `plar.74-208-142-195.sslip.io` | `127.0.0.1:9000` |
| `hz-plar` (removed 2026-11-13) | 8090 | `_` | `127.0.0.1:9000` (unreachable until the provider opens 8090) |

**Certificates:** one certbot certificate, `n8n.aaifs.ca`, **expired 2026-10-30** (PLAR's sslip.io certificate was deleted with PLAR on 2026-11-13). Renewal runs twice a day (systemd timer) and fails every time: `n8n.aaifs.ca` now resolves to a different server (51.222.27.32), so the HTTP challenge can't reach this one. `certbot.service` therefore shows as failed, although the other certificates still renew. No Plesk or Traefik certificates.

The guide says the port-80 block for the bare IP belongs to Plesk `[SRV-GUIDE §11]`; the snapshot shows it is the WellnessHub site `[SRV-SNAP]`.

## 6. Databases, data and backups

| Store | Where | Backed up? |
|---|---|---|
| Exam app MySQL 8 | Docker volume `app_db_data` (215 MB) | **No** scheduled backup; one manual tarball of the app folder from 2026-08-06 |
| n8n data | Docker volume `n8n_data` | **No** |
| Plesk MariaDB 10.11 | `/var/lib/mysql` (216 MB), localhost only | Plesk's backup cron runs, but Plesk has no domains configured |
| App files | `/opt/app/data`, `uploads` | **No** |

No backup tools other than `mysqldump`; no off-server copies. Log rotation is on for nginx, MariaDB, Plesk and ufw; Docker container logs rotate only where a compose file sets it (living-heritage, PLAR). The systemd journal has grown to 4.1 GB `[SRV-SNAP §6]`. **PLAR keeps no data on this server**: its database, sign-in and files are in Supabase (Canada Central).

## 7. Other host software

Running outside Docker: Plesk services (sw-engine, sw-cp-server, task manager, web socket), Postfix + Dovecot + SpamAssassin (idle; mail queue empty), MariaDB, PHP 8.3-FPM, xinetd (FTP), Dr.Web antivirus updates, sysstat. PM2 7 is installed with a daemon still running but no apps (its systemd unit is enabled but inactive). Host runtimes: Node 20.20 (system) and Node 22 (`/opt/node22`), Python 3.12, PHP 8.3. Failed units: `apache2` (port 80 taken by nginx) and `certbot` (see §5) `[SRV-SNAP §7]`.

## 8. Risks and issues noticed

Ordered by severity. These belong to the server owner; **none were changed** during this work, and the guide says the existing services are off-limits `[SRV-GUIDE §1, §9]`.

| # | Issue | Why it matters | Suggested fix (proposal) |
|---|---|---|---|
| 1 | Root login with a password over the internet, ~9,000 failed attempts a day, no fail2ban. The root password was also pasted into a chat on 2026-11-12 | A guessed or leaked password gives full control of every app | Change the root password now; switch to keys only (`PasswordAuthentication no`, `PermitRootLogin prohibit-password`); install fail2ban |
| 2 | n8n (5678) is reachable from the internet although ufw doesn't allow it; the exam app (8501) is plain HTTP | Docker writes its own firewall rules ahead of ufw | Bind both to `127.0.0.1` and publish through nginx, or add `DOCKER-USER` rules |
| 3 | Expired n8n certificate; its domain points elsewhere; certbot fails twice a day | Every HTTPS request to the IP gets an expired certificate; real renewal problems would be hidden among these failures | Decide whether this n8n is still used; if not, remove its certificate and site; if so, fix DNS |
| 4 | 51 pending updates and a reboot pending since August (libc6, six kernels) | Security fixes aren't active until a reboot | Plan a short maintenance window and reboot |
| 5 | No backups of the exam-app database, n8n or uploads | Disk or VM loss would lose them | Nightly `mysqldump` + volume archive, copied off the server |
| 6 | Secrets in world-readable files (`/opt/app/.env`, `/var/www/WellnessHub/.env.local`); a Gemini key in a `VITE_` variable is shipped to browsers | Any local user or leaked bundle exposes them | `chmod 600`; move AI keys server-side |
| 7 | 42.5 GB Docker build cache, 4.1 GB journal, no default Docker log rotation | Disk creeps up (17% used in August, 41% now) | `docker builder prune`; set `SystemMaxUse` for journald; add `log-opts` to `daemon.json` |
| 8 | RAM is the tight resource (3.8 GB, swap in use); building Next.js images on the server competes with live apps | Builds can push live apps into swap | Build images elsewhere (CI or the Mac) once deploys become frequent |
| 9 | Plesk and the mail stack are installed but unused; Apache fails on every boot | Extra software to patch; noisy failed units | Remove, or configure Plesk properly (it would then want to own nginx) |
| 10 | The exam app's healthcheck always fails (`curl` missing from the image) | Real failures can't be told apart from this one | Use a Python-based healthcheck |

## 9. PLAR on this server (removed 2026-11-13)

**Removed on 2026-11-13** at the project lead's request, after PLAR moved to the OVH server (Part A). Removed: the `plar` container and network, the `plar-web` image, nginx sites `hz-plar` and `hz-plar-web` (nginx config backed up first to `/root/backups/`), the ufw rule for 8090, the `plar.74-208-142-195.sslip.io` certificate and `/opt/projects/plar`. The exam app, n8n, living-heritage and WellnessHub were checked afterwards and still respond. The rest of this section records how it was set up.

### How it is set up (done 2026-11-12, at the project lead's request)

PLAR follows the living-heritage pattern and the server's house rules `[SRV-GUIDE §1, §4, §11]`:

| | |
|---|---|
| **Folder** | `/opt/projects/plar` (the committed `web/` tree from `git archive`, plus the deploy files) |
| **Definition** | `server/plar/` in our repo: `Dockerfile`, `docker-compose.yml`, `.dockerignore`, `redeploy.sh`, `nginx-hz-plar.conf` |
| **Image** | `plar-web:latest`, built on the server from `node:22-bookworm-slim` (the base living-heritage already uses). npm 11.6.2 in the build to match our lockfile. `public/vendor` (OpenCV.js, MediaPipe runtime and face model) is created during the build, since it isn't in git |
| **Container** | `plar`, Compose project `plar`, `init: true`, runs as the unprivileged `node` user, `restart: unless-stopped`, memory limit 768 MB, logs 10 MB × 3, healthcheck on `/sign-in` |
| **Port** | `127.0.0.1:9000` (in the 9000–9099 range, never public) |
| **Public entry** | nginx `/etc/nginx/sites-available/hz-plar-web` for `plar.74-208-142-195.sslip.io` on 443, with a Let's Encrypt certificate and an HTTP→HTTPS redirect (`server/publish.sh`). [sslip.io](https://sslip.io) is a free public DNS service that maps that name to `74.208.142.195`, so no domain purchase was needed. Also `hz-plar` on port 8090 by IP (ufw rule added; blocked by the provider's firewall). Both forward `$http_host`, which Next.js Server Actions need |
| **Settings** | `/opt/projects/plar/.env` (mode 600): only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, which are public by design. Not set on the server: `DEMO_LOGIN_PASSWORD` (one-click demo sign-in off), `VERIFICATION_LAB` and `OPENROUTER_API_KEY` (the identity-verification lab stays off; it is approved for local use only) |
| **Data** | None on the server. It talks to the hosted Supabase project `plar-dev` |
| **URL** | **https://plar.74-208-142-195.sslip.io** (and `http://74.208.142.195:8090` if TCP 8090 is ever opened in the provider's firewall). Verified on 2026-11-12 from the Mac: `/` and `/sign-in` 200, HTTP redirects to HTTPS, valid certificate, sign-in page renders with no console errors, `./check.sh` all OK for PLAR. Earlier, from the server: `/sign-in` 200, `/workspace` redirects to sign-in, OpenCV and MediaPipe files served, `/verify` 404 (lab off), container 121 MB of memory |

### Deploying an update

From the Mac, after committing:

```bash
cd server
./deploy.sh        # git archive HEAD:web -> /opt/projects/plar -> redeploy.sh
./check.sh         # health of the server, its containers, certificates and the PLAR site
```

`./publish.sh [hostname]` puts PLAR on a hostname with HTTPS (default `plar.74-208-142-195.sslip.io`). For a real domain later: point its A record at `74.208.142.195`, then `./publish.sh plar.<domain>`.

`deploy.sh` deploys the **committed** `web/` only (it warns about uncommitted changes), sends just the two public Supabase values from `web/.env.local`, and runs `redeploy.sh` on the server. That script prunes deleted files, rebuilds, restarts, waits for the healthcheck and smoke-tests `/sign-in`. `./deploy.sh --setup` also installs the nginx site and the ufw rule (only needed once).

### Limits of the current setup

- **Temporary hostname.** `plar.74-208-142-195.sslip.io` depends on the free sslip.io DNS service. Fine for demos; use a real domain before any pilot. HTTPS means the camera features will work once they're switched on in production (the verification lab is off on the server).
- **Demo sign-in** is off. Sign in with a demo account's email and password from `harness/DEMO-ACCOUNTS.md`.
- Builds run on the live server (about 2 GB of RAM at peak). The build cache keeps growing (risk 7).

### Recommended next steps (proposal)

1. **Get a real domain.** Add an A record (for example `plar.<domain>`) pointing to `74.208.142.195`, then run `./publish.sh plar.<domain>`. Remove the 8090 site and its ufw rule, since the provider blocks the port anyway.
2. **Supabase Auth settings:** set the Site URL and redirect URLs to the HTTPS domain once there is one (only needed when email links or magic links are added).
3. **CI later:** when deploys become frequent, build the image in GitHub Actions, push it to a registry, and have the server only pull. This removes build load from the live server.
4. **Register PLAR in the server guide** (`/opt/horizon/SERVER_GUIDE.md` §3, "Ours") so the next person sees it.

### Open questions

| Question | For |
|---|---|
| Which domain will PLAR use, and who controls its DNS (TRU, HorAIzon, us)? | Project lead |
| Who owns this server and the risks in §8 (password login, exposed ports, expired n8n certificate, reboot)? | Project lead / server owner |
| Is this server meant for the stakeholder pilot, or only for demos? Real student data would need a hosting and privacy review first (Canadian hosting, backups, access) | Project lead / TRU |
| Manual deploys from the Mac, or CI? | Team |
