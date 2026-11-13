# Server harness

Small scripts for the server that hosts PLAR: the team's **OVH project server** (`144.217.80.160`, user `hh_horaizon`), where PLAR is live at **https://plar.airl.ca**. `doctor.sh`, `inspect.sh` and `check.sh` are **read-only**. `deploy.sh` and `publish.sh` change the server, touching only PLAR's own folder, container, nginx site and certificate. Findings are in [`../Resources/docs/18-hosting-server.md`](../Resources/docs/18-hosting-server.md).

## First run

Key login only; the scripts never use or ask for a password. This Mac's key is already authorised. On another machine, run this once in your own terminal (it asks for the server password):

```bash
ssh-copy-id -i ~/.ssh/id_ed25519.pub hh_horaizon@144.217.80.160
```

Then:

```bash
cd server
./doctor.sh    # key, port 22, key login, tools on the server
./deploy.sh    # ship the committed web/ and rebuild the container
./check.sh     # quick health check, exit code 1 on any FAIL
```

## Commands

| Command | What it does |
|---|---|
| `./doctor.sh` | Checks the local key, that port 22 answers, that key login works, and which tools the server has |
| `./inspect.sh` | Full read-only snapshot: system, network and firewall, SSH settings, updates, Docker (containers, images, volumes, limits, health), every project folder (Compose files, git, env variable names), Plesk, reverse proxy and certificates, databases, backups, cron and timers, host services. Then looks up DNS for every domain from this Mac |
| `./deploy.sh` | **Changes the server.** Deploys the committed `web/` (HEAD) to `/opt/projects/plar` the server's way: `hz init plar` the first time, then the code, `.env.local`/`.env` (the two public Supabase values only) and `hz rebuild plar`. No password needed. Container files in [`plar/`](plar) |
| `./publish.sh [domain]` | **Changes the server.** Runs `hz proxy plar <domain>` (default `plar.airl.ca`): nginx vhost, Let's Encrypt certificate, HTTP→HTTPS redirect, after backing up the nginx config. Uses sudo, so run it in your own terminal and type the `hh_horaizon` password. Only needed once per domain |
| `./check.sh` | Quick health: load, memory, disks, pending reboot, failed units, containers (stopped, unhealthy, restarting), certificate expiry, and the PLAR site once `PLAR_DOMAIN` is set |

Settings (host, user, key, `PLAR_DOMAIN`) default to the values in [`.env.example`](.env.example); override them in `server/.env.local` (git-ignored). To inspect the older IONOS server: `PLAR_SERVER_HOST=74.208.142.195 PLAR_SERVER_USER=root ./inspect.sh`. Its PLAR setup is recorded in [`plar/ionos/`](plar/ionos/README.md).

As `hh_horaizon` (no root), `inspect.sh` can't read the firewall, SSH settings or other users' crontabs; those sections come back empty.

## How it works

- `remote/lib.sh` + `remote/<script>.sh` are piped over SSH to `bash -s`; nothing is copied to or installed on the server.
- `remote/` scripts follow a read-only contract (top of `remote/lib.sh`): no installs, restarts, `apt update`, `docker pull/exec/run`, `pm2`, `certbot`, `plesk login` or file writes.

## Secrets

- Secret values are masked **on the server** before output leaves it: URL credentials, any `KEY=value` / `key: value` whose key looks secret, `mysql -p…`, JWTs and well-known token shapes, private-key blocks. A second pass on this Mac masks token shapes again.
- Env files are reported as **variable names only**.
- Snapshots are saved to `server/.snapshots/` (folder mode 700, git-ignored) and stay on this Mac. Read a snapshot before quoting it anywhere, and never paste one into a shared document.
