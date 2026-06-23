# Self-Hosted Deployment on Digaf's Ubuntu Cloud VM

This document plans the migration of the Digaf Shareholder Governance Platform off Vercel + Neon onto an Ubuntu virtual machine provided by Digaf's own cloud subscription. It covers hardware sizing, required software, server setup, application deployment, database migration, TLS/subdomain cutover, ongoing deploys, backups, and rollback.

This is a planning document. Nothing here has been executed yet — treat each section as a checklist to work through with the Digaf IT team.

## 1. What changes vs. what stays the same

| Component | Today | After migration |
| --- | --- | --- |
| Frontend (`apps/web`, Next.js) | Vercel project `digaf-web` | Node.js process on the Ubuntu VM, behind Nginx |
| Backend API (`apps/api`, Express) | Vercel project `digaf-api` | Node.js process on the Ubuntu VM, behind Nginx |
| App database (Postgres) | Neon (managed) | PostgreSQL installed directly on the Ubuntu VM |
| Auth (Supabase) | Supabase Cloud | **Unchanged** — stays on Supabase Cloud |
| DNS | `*.vercel.app` | Digaf-provided subdomain (e.g. `governance.digaf.et`) pointed at the VM |
| TLS | Automatic (Vercel) | Let's Encrypt via Certbot, auto-renewing |
| CI/CD | Git push → Vercel auto-deploy | Git push → deploy script (manual or GitHub Actions over SSH) |

**Recommendation: keep Supabase Auth as-is.** It is already isolated to `requireAuth.ts` (API) and `src/lib/supabase/*` (web) per our existing architecture decision, it costs nothing at this scale, and self-hosting Supabase (GoTrue + Postgres + Kong + Realtime, etc., via Docker Compose) adds real operational risk for no benefit here. Only the app tier (web, API, app database) needs to move. If Digaf later requires auth data to live on-premises too, that's a separate follow-up project — flag it if it comes up, don't bundle it into this migration.

## 2. Hardware requirements

This is an internal back-office tool for one microcredit provider — low concurrent traffic (tens of staff users, not thousands of public users). Recommended VM sizing:

| Tier | vCPU | RAM | Disk | Notes |
| --- | --- | --- | --- | --- |
| Minimum | 2 | 4 GB | 40 GB SSD | Works, tight headroom for Postgres + Node + OS |
| **Recommended** | 2–4 | 8 GB | 80 GB SSD | Comfortable for Postgres, both Node processes, Nginx, OS, logs, and backups |
| Growth headroom | 4 | 16 GB | 160 GB SSD | If Digaf expects significant shareholder volume growth or wants the DB and app on the same box for years |

Disk should be SSD-backed (Postgres I/O matters). Ask Digaf IT what their cloud subscription's VM SKUs look like and pick the closest match to the "Recommended" row — exact vCPU/RAM naming varies by provider (Azure, AWS, on-prem VMware, etc.).

**Networking requirement:** the VM needs a static (or DHCP-reserved) internal IP and a public IP or NAT path so the subdomain can resolve to it, plus outbound HTTPS access (port 443 outbound) so the API can reach Supabase Cloud for auth calls.

## 3. Software requirements

| Software | Version | Purpose |
| --- | --- | --- |
| Ubuntu Server | 24.04 LTS (22.04 LTS acceptable) | Base OS |
| Node.js | 22.x LTS or newer | Runs both `apps/web` (Next.js 16) and `apps/api` (Express) — confirm exact minimum against `apps/web/package.json` / `apps/api/package.json` at deploy time, since neither currently pins an `engines` field |
| PostgreSQL | 16 or 17 | Replaces Neon as the app database |
| Nginx | latest from Ubuntu repos | Reverse proxy + TLS termination, routes the subdomain to the two Node processes |
| Certbot (`python3-certbot-nginx`) | latest | Let's Encrypt TLS certificate, auto-renewal |
| PM2 | latest (`npm install -g pm2`) | Keeps both Node processes running, restarts on crash, restarts on reboot |
| Git | latest from Ubuntu repos | Pulling deploys from GitHub |
| UFW | bundled with Ubuntu | Firewall |
| fail2ban | latest from Ubuntu repos | SSH brute-force protection |

## 4. Server preparation

Run as a sudo-capable user (not root) once Digaf IT hands over SSH access:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git build-essential ufw fail2ban

# Firewall: allow SSH, HTTP, HTTPS only
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

sudo systemctl enable fail2ban --now
```

Harden SSH (`/etc/ssh/sshd_config`): disable root login, disable password auth if Digaf IT can provide key-based access, then `sudo systemctl restart sshd`.

Create a dedicated non-login system user to own the app files (avoid running the app as your personal SSH user):

```bash
sudo adduser --system --group digaf-app
sudo mkdir -p /opt/digaf-governance
sudo chown digaf-app:digaf-app /opt/digaf-governance
```

## 5. Install Node.js

Use NodeSource to get a current LTS (Ubuntu's default apt repo Node is usually too old):

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
node -v   # confirm v22.x or newer
npm -v
sudo npm install -g pm2
```

## 6. Install and configure PostgreSQL

```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable postgresql --now
```

Create the application database and a dedicated app user (do **not** use the `postgres` superuser for the app connection):

```bash
sudo -u postgres psql <<'SQL'
CREATE USER digaf_app WITH PASSWORD 'CHANGE_ME_STRONG_PASSWORD';
CREATE DATABASE digaf_governance OWNER digaf_app;
SQL
```

By default PostgreSQL listens on `localhost` only — keep it that way. The Node API runs on the same VM and connects over `localhost`, so Postgres never needs to be exposed to the network. Confirm in `postgresql.conf` that `listen_addresses = 'localhost'` and that `pg_hba.conf` only allows local connections.

### Apply schema migrations

From the repo, in order, against the new database:

```bash
cd /opt/digaf-governance/app/database/migrations
for f in $(ls *.sql | sort); do
  echo "Applying $f"
  psql "postgresql://digaf_app:CHANGE_ME_STRONG_PASSWORD@localhost:5432/digaf_governance" -f "$f"
done
```

There are currently 11 migrations (`001_initial_governance_schema.sql` through `011_fix_po_box_back_to_31698.sql`). Run them strictly in numeric order — several later migrations assume earlier ones already ran (e.g. migration 010 depends on column added in 008).

### Migrate existing data out of Neon

If Digaf wants to bring over the current production data (real shareholders, certificates, audit history) rather than starting fresh, dump from Neon and restore into the new server:

```bash
# From a machine with network access to both Neon and the new server
pg_dump "postgresql://<user>:<password>@<neon-host>/<database>?sslmode=require" \
  --no-owner --no-privileges -F c -f digaf_governance.dump

# Copy digaf_governance.dump to the new server, then:
pg_restore --no-owner --no-privileges \
  -d "postgresql://digaf_app:CHANGE_ME_STRONG_PASSWORD@localhost:5432/digaf_governance" \
  digaf_governance.dump
```

Do this once, close to the actual cutover window, so the data is as fresh as possible — not weeks in advance.

## 7. Deploy the application code

```bash
sudo -u digaf-app git clone https://github.com/Henoktd/Digaf.git /opt/digaf-governance/app
cd /opt/digaf-governance/app
```

### API (`apps/api`)

```bash
cd /opt/digaf-governance/app/apps/api
npm install
```

Create `/opt/digaf-governance/app/apps/api/.env`:

```env
DATABASE_URL=postgresql://digaf_app:CHANGE_ME_STRONG_PASSWORD@localhost:5432/digaf_governance
SUPABASE_URL=<unchanged — same Supabase project as today>
SUPABASE_SERVICE_ROLE_KEY=<unchanged — same Supabase project as today>
CERTIFICATE_HMAC_SECRET=<carry over the existing production secret — changing it invalidates all issued certificate hashes>
FRONTEND_PUBLIC_BASE_URL=https://<digaf-subdomain>
ALLOWED_ORIGINS=https://<digaf-subdomain>
NODE_ENV=production
PORT=4000
```

### Web (`apps/web`)

```bash
cd /opt/digaf-governance/app/apps/web
npm install
npm run build
```

Create `/opt/digaf-governance/app/apps/web/.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=https://<digaf-subdomain>/api
NEXT_PUBLIC_SUPABASE_URL=<unchanged — same Supabase project as today>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<unchanged — same Supabase project as today>
```

Pull the actual current values for `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `CERTIFICATE_HMAC_SECRET` from the current Vercel project settings — they must stay identical to today's production values, since Supabase auth sessions and certificate hash verification both depend on them.

### Run both processes under PM2

```bash
cd /opt/digaf-governance/app

pm2 start apps/api/src/server.ts --name digaf-api --interpreter node --interpreter-args="--import tsx"
pm2 start "npm run start" --name digaf-web --cwd apps/web

pm2 save
pm2 startup   # follow the printed instructions to enable PM2 on boot
```

(`apps/api` runs via `tsx` directly today, matching its existing `npm run start` script — no separate build step needed for the API. `apps/web` needs `npm run build` once per deploy before `pm2 restart digaf-web`.)

## 8. Nginx reverse proxy + subdomain + TLS

Once Digaf IT creates the subdomain (e.g. `governance.digaf.et`) and points its DNS A record at the VM's public IP, configure Nginx:

```nginx
# /etc/nginx/sites-available/digaf-governance
server {
    listen 80;
    server_name governance.digaf.et;

    location /api/ {
        proxy_pass http://localhost:4000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/digaf-governance /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d governance.digaf.et
```

Certbot edits the Nginx config to add the TLS `listen 443` block and sets up auto-renewal via a systemd timer — confirm with `sudo systemctl list-timers | grep certbot`.

**Important — the API path prefix.** The Nginx config above proxies `/api/` to the API's root, but the API's own routes are already mounted at `/api/...` internally (e.g. `/api/certificates`). Decide one of two approaches before going live:
- Run the API unprefixed behind Nginx (`location /api/ { proxy_pass http://localhost:4000/api/; }`, matching paths exactly) — simplest, no app code changes.
- Or keep the API's existing root-relative health checks (`/health`, `/health/db`) reachable too, by adding a second `location` block for those paths.

Test both `/api/version` and `/health` through the public subdomain before declaring this step done.

## 9. DNS cutover plan

1. Digaf IT creates the subdomain DNS record pointing to the VM's public IP, but **do not** decommission the Vercel projects yet.
2. Deploy and fully test the self-hosted stack at the new subdomain in parallel with the live Vercel deployment.
3. Run the full smoke checklist (see [operations-runbook.md](operations-runbook.md)) against the new subdomain.
4. Pick a low-traffic window. Re-run the Neon → self-hosted data dump/restore (Section 6) one final time to capture any data created since the first migration, so the cutover loses zero records.
5. Confirm with Digaf which URL staff will actually use going forward, and whether the old Vercel URL needs to keep working temporarily (e.g. a redirect) or can be retired immediately.
6. After a stable burn-in period (recommend at least 1–2 weeks), decommission the Vercel projects.

## 10. Ongoing deploys (replacing Vercel auto-deploy)

Vercel's "push to `main` → auto-deploy" goes away. Two options, pick one with Digaf IT:

**Option A — Manual deploy script (simplest, recommended to start):**

```bash
#!/usr/bin/env bash
# /opt/digaf-governance/deploy.sh
set -euo pipefail
cd /opt/digaf-governance/app
git pull origin main
(cd apps/api && npm install)
(cd apps/web && npm install && npm run build)
pm2 restart digaf-api digaf-web
```

Whoever deploys SSHs in and runs `./deploy.sh` after a push. Low automation, but transparent and easy to reason about for a small team.

**Option B — GitHub Actions self-hosted runner or SSH deploy action:**

Add a `.github/workflows/deploy.yml` that SSHs into the VM on push to `main` and runs the same script as Option A, using a deploy-only SSH key stored as a GitHub secret. More automated, but requires Digaf IT to be comfortable with a CI system having SSH access to their VM — confirm this is acceptable before building it.

Start with Option A. Move to Option B later if manual deploys become a bottleneck.

## 11. Backups

Neon handled backups automatically; a self-hosted Postgres does not, by default. Set up a daily dump:

```bash
#!/usr/bin/env bash
# /opt/digaf-governance/backup.sh
set -euo pipefail
TS=$(date +%Y%m%d_%H%M%S)
pg_dump "postgresql://digaf_app:CHANGE_ME_STRONG_PASSWORD@localhost:5432/digaf_governance" \
  -F c -f "/opt/digaf-governance/backups/digaf_governance_${TS}.dump"
find /opt/digaf-governance/backups -name "*.dump" -mtime +14 -delete
```

```bash
sudo mkdir -p /opt/digaf-governance/backups
sudo chown digaf-app:digaf-app /opt/digaf-governance/backups
crontab -u digaf-app -e
# add: 0 2 * * * /opt/digaf-governance/backup.sh
```

This keeps 14 days of local backups. Also copy backups off the VM periodically (Digaf's cloud subscription may offer object storage, or even a simple `rsync`/`scp` to another machine) — a backup that lives only on the same disk as the database doesn't protect against VM-level failure. See [data-backup-restore-plan.md](data-backup-restore-plan.md) for the existing backup/restore conventions to align with.

## 12. Monitoring and logs

```bash
pm2 logs digaf-api
pm2 logs digaf-web
pm2 monit
sudo journalctl -u nginx -f
sudo tail -f /var/log/postgresql/postgresql-*.log
```

At minimum, set up `pm2-logrotate` so logs don't fill the disk:

```bash
pm2 install pm2-logrotate
```

## 13. Security checklist before going live

- [ ] SSH key-based auth only, root login disabled
- [ ] UFW enabled, only 22/80/443 open
- [ ] fail2ban active
- [ ] Postgres listening on `localhost` only, strong app DB password
- [ ] `.env` files not committed to Git, readable only by the app user (`chmod 600`)
- [ ] `CERTIFICATE_HMAC_SECRET` carried over exactly from current production — do not regenerate
- [ ] TLS certificate valid and auto-renewal confirmed working
- [ ] Daily backup cron confirmed running, and a test restore has actually been performed once
- [ ] OS unattended security updates enabled (`sudo apt install unattended-upgrades`)

## 14. Rollback plan

Because the Vercel deployment stays live and untouched throughout the migration (Section 9, step 1), rollback is simple during the burn-in period: point staff back at the old Vercel URL, or revert the DNS record if the subdomain was already cut over. The only state that can drift is data created after cutover — minimize that risk by keeping the burn-in window short and communicating clearly to staff which URL is authoritative on which day.

## 15. Open items to confirm with Digaf IT

- [ ] Exact VM specs being provisioned (vCPU / RAM / disk) — compare against Section 2
- [ ] Ubuntu version available (22.04 vs 24.04)
- [ ] Subdomain name and who owns the DNS record
- [ ] Whether the VM has a public IP directly, or sits behind Digaf's own firewall/load balancer/NAT
- [ ] SSH access method and who holds the keys
- [ ] Whether Option A or Option B (Section 10) is acceptable for ongoing deploys
- [ ] Where off-VM backup copies should be stored (Section 11)
- [ ] Confirmation that Supabase Cloud (auth) remains acceptable, or whether Digaf wants auth data on-premises too (separate future project, not in scope here)
