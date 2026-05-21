# Deploy Brand2School: Railway + Cloudflare + Domain

This is the recommended production path: **low moving parts**, **HTTPS everywhere**, **no nginx to operate**, and a domain you own.

## Architecture

```
                    ┌─────────────────────────────────────┐
                    │           Cloudflare DNS            │
                    │  (proxy ON, SSL Full strict)        │
                    └─────────────────────────────────────┘
                      │              │              │
           app.* CNAME │   api.* CNAME│ admin.* CNAME │
                      ▼              ▼              ▼
              ┌───────────┐  ┌───────────┐  ┌──────────────┐
              │  Railway  │  │  Railway  │  │   Railway    │
              │    web    │  │    api    │  │  admin-web   │
              └───────────┘  └─────┬─────┘  └──────────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    ▼              ▼              ▼
              worker-whatsapp  worker-audit   worker-esg
                    │              │              │
                    └──────────────┴──────────────┘
                                   │
                            ┌──────▼──────┐
                            │  Postgres   │
                            │  (Railway)  │
                            └─────────────┘
```

**Suggested hostnames** (replace `brand2school.co.za` with your domain):

| Host | Service | Purpose |
|------|---------|---------|
| `app.brand2school.co.za` | `web` | Public site, school & brand portals |
| `api.brand2school.co.za` | `api` | REST API + WhatsApp webhook |
| `admin.brand2school.co.za` | `admin-web` | Internal admin dashboard |
| `brand2school.co.za` | redirect | Optional: redirect apex → `app` |

Workers have **no public URL** — they only talk to Postgres and external APIs (Meta, SMTP).

| Worker | Role |
|--------|------|
| `worker-whatsapp` | WhatsApp outbound queue |
| `worker-audit-export` | Audit CSV exports |
| `worker-esg` | Scheduled ESG PDF generation → notification queue |
| `worker-notifications` | Email queue (activation, registration, contact, ESG delivery) |
| `worker-subscriptions` | Subscription overdue / suspension governance |

---

## Phase 1 — Register the domain

1. Buy the domain at any registrar (e.g. co.za registrar, Namecheap, Google Domains).
2. You will point **nameservers to Cloudflare** in Phase 2 — you can buy through Cloudflare Registrar for one less step, but any registrar works.

---

## Phase 2 — Cloudflare setup

1. Add the site in [Cloudflare Dashboard](https://dash.cloudflare.com) → **Add a site**.
2. Choose the **Free** plan (sufficient to start).
3. Cloudflare shows two nameservers — set them at your registrar (replace old NS records).
4. Wait until the site status is **Active**.

### DNS records (after Railway services exist)

For each public Railway service: **Settings → Networking → Custom Domain** → add hostname → Railway shows a target like `something.up.railway.app`.

In Cloudflare **DNS → Records**:

| Type | Name | Target | Proxy |
|------|------|--------|-------|
| CNAME | `app` | Railway hostname for **web** | Proxied (orange cloud) |
| CNAME | `api` | Railway hostname for **api** | Proxied |
| CNAME | `admin` | Railway hostname for **admin-web** | Proxied |
| CNAME | `@` | Railway hostname for **web** (optional apex) | Proxied |

### SSL/TLS

- **SSL/TLS → Overview**: **Full (strict)**  
  Railway terminates TLS on its edge; Cloudflare → Railway must use HTTPS (Railway custom domains provide this).

### Caching (important)

- **api** and **admin**: create a Cache Rule → **Bypass cache** for `api.*` and `admin.*` (or disable cache on those hostnames).
- **app**: cache static assets only; do not cache `/api/*` routes on the Next app (BFF routes under `app/api`).

### Webhooks (WhatsApp / Meta)

- Meta must reach `https://api.<your-domain>/api/v1/whatsapp/...`
- Orange-cloud proxy is fine if SSL is **Full (strict)**.
- If Meta verification fails, temporarily set the `api` record to **DNS only** (grey cloud), verify, then re-enable proxy.

---

## Phase 3 — Railway project

1. Create a project at [railway.app](https://railway.app).
2. **New → GitHub Repo** → connect this repository.
3. Add **PostgreSQL** (Plugins → PostgreSQL). Note the `DATABASE_URL` reference.

### Create services (8 compute + Postgres)

Use **monorepo root** `/` for every service. Reference matrix: `infra/railway/services.json`.

| Service | Type | Build command | Start command | Public? |
|---------|------|---------------|---------------|---------|
| `api` | Web | `npm run railway:build:api` | `npm run start -w @brand2school/api` | Yes |
| `web` | Web | `npm run railway:build:web` | `npm run start -w @brand2school/web` | Yes |
| `admin-web` | Web | `npm run railway:build:admin` | `npm run start -w @brand2school/admin-web` | Yes |
| `worker-whatsapp` | Worker | `npm run railway:build:api` | `npm run start:worker:whatsapp -w @brand2school/api` | No |
| `worker-audit-export` | Worker | `npm run railway:build:api` | `npm run start:worker:audit-export -w @brand2school/api` | No |
| `worker-esg` | Worker | `npm run railway:build:api` | `npm run start:worker:esg -w @brand2school/api` | No |
| `worker-notifications` | Worker | `npm run railway:build:api` | `npm run start:worker:notifications -w @brand2school/api` | No |
| `worker-subscriptions` | Worker | `npm run railway:build:api` | `npm run start:worker:subscriptions -w @brand2school/api` | No |

**API deploy settings**

- **Pre-deploy command** (migrations): `npm run railway:migrate`
- **Healthcheck path**: `/health`
- Attach **Postgres** → `DATABASE_URL` on **api** and all **workers**.

**Variables** — copy from:

- `infra/railway/env.api.example` → `api` + workers
- `infra/railway/env.web.example` → `web`
- `infra/railway/env.admin.example` → `admin-web`

Generate secrets (PowerShell example):

```powershell
[Convert]::ToBase64String((1..48 | ForEach-Object { Get-Random -Maximum 256 }) -as [byte[]])
```

Use separate values for `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, and `INTERNAL_API_KEY`.

**Shared variables**: Railway **Shared Variables** work well for JWT/SMTP/WhatsApp keys referenced by api + workers.

### Custom domains (Railway)

On each public service:

- `api` → `api.brand2school.co.za`
- `web` → `app.brand2school.co.za`
- `admin-web` → `admin.brand2school.co.za`

Then add matching CNAMEs in Cloudflare (Phase 2).

### First production deploy checklist

1. All env vars set (see `apps/api` production checks in `env.ts`).
2. `WEB_APP_URL=https://app.<domain>`
3. `NEXT_PUBLIC_API_BASE_URL=https://api.<domain>` on **web** and **admin-web**
4. `B2S_INTERNAL_API_KEY` on **web** matches `INTERNAL_API_KEY` on **api**
5. Pre-deploy migrate succeeds
6. Hit `https://api.<domain>/health` → `{ "status": "ok" }`
7. Hit `https://api.<domain>/health/ready` → database connected
8. Seed super admin once (Railway **api** → Run command):  
   `npm run db:seed -w @brand2school/api`  
   (only on first deploy; use strong passwords in production)

---

## Phase 4 — Meta WhatsApp

In [Meta Developer Console](https://developers.facebook.com/):

| Setting | Value |
|---------|--------|
| Callback URL | `https://api.<domain>/api/v1/whatsapp/webhook` |
| Verify token | Same as `WHATSAPP_WEBHOOK_VERIFY_TOKEN` |
| App secret | Same as `WHATSAPP_APP_SECRET` |

Subscribe to message fields your integration uses.

---

## Phase 5 — Email (SMTP)

Production API **requires** `SMTP_HOST` (see `assertProductionReadiness`).

**Brand2School on Register Domain:** use **`noreply@brand2school.co.za`** only for `MAIL_FROM` / `SMTP_USER`. Human inboxes (`info@`, `schools@`, `brands@`, `support@`) are not used for SMTP.

Full mailbox list, cPanel auto-responders, and DNS (MX/SPF/DKIM — grey-cloud in Cloudflare): **[docs/email-communication.md](../email-communication.md)**.

Set `WEB_APP_URL` to your public app URL so registration emails load the logo and portal link.

---

## Phase 6 — Smoke test

From your machine (or Railway shell on `api`):

```bash
npm run smoke:test -w @brand2school/api
```

Set `SMOKE_API_BASE=https://api.<domain>` in Railway variables first.

---

## Cost & ops notes

- Expect **~6 compute services + Postgres** on Railway. Start with Hobby/usage-based; scale workers if queues back up.
- **Redis** is in Docker Compose locally but **not used in application code** — skip Redis on Railway until needed.
- **No nginx** — three hostnames instead of path-based routing (`/admin`, `/api`). Simpler cookies and caching.
- **Backups**: enable Railway Postgres backups or schedule `pg_dump` to object storage.
- **Staging**: duplicate the project with `staging-api.*` / `staging-app.*` hostnames.

---

## Troubleshooting

| Symptom | Likely fix |
|---------|------------|
| API crashes on boot in production | Missing WhatsApp/SMTP/`INTERNAL_API_KEY` — see `productionReadinessChecks` |
| Admin login works locally, not prod | `NEXT_PUBLIC_API_BASE_URL` wrong; check api URL in browser network tab |
| WhatsApp verify fails | Token mismatch; try grey-cloud DNS on `api` |
| 502 from Cloudflare | SSL mode not Full (strict); or Railway service not healthy |
| Migrations fail | `DATABASE_URL` not linked; run `npm run railway:migrate` manually once |
| Web analytics empty | `B2S_INTERNAL_API_KEY` missing on **web** |

---

## Quick reference

```bash
# Local parity
npm run db:setup
npm run dev:all

# Production build (same as Railway)
npm run railway:build:api
npm run railway:build:web
npm run railway:build:admin
```

Related files:

- `infra/railway/services.json` — service matrix
- `infra/railway/env.*.example` — variable templates
