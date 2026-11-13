# PLAR on the IONOS server (superseded)

PLAR was first deployed to the IONOS server `74.208.142.195` on 2026-11-12 (`/opt/projects/plar`, `127.0.0.1:9000`,
nginx sites `hz-plar` on 8090 and `hz-plar-web` for `plar.74-208-142-195.sslip.io`). The team's projects live on the
OVH server instead, so `../../deploy.sh` and `../../publish.sh` now target OVH. These files record the IONOS setup. **Removed from the IONOS server on 2026-11-13** (container, image, nginx sites, ufw rule, certificate, folder).
