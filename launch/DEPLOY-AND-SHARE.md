# Deploy & Share Guide (`$0` Options) — VSMEKit

VSMEKit can be deployed at **$0** as a purely static browser application or as a lightweight Node 22 + `node:sqlite WAL` server.

---

## Option A — `$0` Commercial-Safe Static Deployment (Cloudflare Workers Static Assets)
Ideal for instant public browser demos (`localStorage` persistence, zero backend servers).

```bash
npm run build
npx wrangler deploy
```

Uses [`wrangler.jsonc`](../wrangler.jsonc) with `"not_found_handling": "single-page-application"` so `/r/:slugOrCode` client routes work cleanly.

---

## Option B — Docker & Docker Compose (Full SQLite WAL Server)
Runs the Node 22 backend (`vsmekit.sqlite` in `WAL` mode) and SPA together on port `4225`:

```bash
docker compose up -d --build
```

Reverse proxy cleanly with [`deploy/Caddyfile`](../deploy/Caddyfile) (`X-Content-Type-Options: nosniff`, `Referrer-Policy: same-origin`, `X-Frame-Options: SAMEORIGIN`).

---

## Option C — Linux `systemd` Service & Online SQLite Backup
1. Copy [`deploy/.env.example`](../deploy/.env.example) to `/etc/vsmekit/.env` (set `HOST=127.0.0.1`, `PORT=4225`, `VSMEKIT_DATA_DIR=/var/lib/vsmekit`).
2. Install [`deploy/vsmekit.service`](../deploy/vsmekit.service) and run `systemctl enable --now vsmekit`.
3. Schedule [`deploy/backup-sqlite.sh`](../deploy/backup-sqlite.sh) for zero-downtime `VACUUM INTO` backups (14-day retention).
