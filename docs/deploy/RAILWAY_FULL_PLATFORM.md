# Deploy full Brand2School platform on Railway

API is live at **https://api.brand2school.co.za**. This guide adds **web**, **admin**, **workers**, **seed**, **SMTP**, and **WhatsApp** (when ready).

**Public website (www):** [WWW_AND_PUBLIC_SITES.md](./WWW_AND_PUBLIC_SITES.md)

All services use the **same GitHub repo**, **root directory `/`**, project **abundant-grace**.

---

## 0 — Generate shared secrets (once)

PowerShell:

```powershell
[Convert]::ToBase64String((1..48 | ForEach-Object { Get-Random -Maximum 256 }) -as [byte[]])
```

Run **three times** for:

| Secret | Used on |
|--------|---------|
| `JWT_ACCESS_SECRET` | API + all workers |
| `JWT_REFRESH_SECRET` | API + all workers |
| `INTERNAL_API_KEY` | API + **web** (`B2S_INTERNAL_API_KEY`) + workers |

Save these in a password manager. Use **Railway Shared Variables** or paste on each service.

---

## 1 — Update existing API service (`brand2school`)

**Settings → Deploy**

| Field | Value |
|-------|--------|
| Root Directory | *(empty)* |
| Build | `npm run build -w @brand2school/api` |
| Start | `npm run start -w @brand2school/api` |
| Pre-deploy | `npm run railway:migrate` |
| Healthcheck | `/health` |

**Variables** (add/update):

| Variable | Value |
|----------|--------|
| `DATABASE_URL` | `${{ Postgres.DATABASE_URL }}` |
| `JWT_ACCESS_SECRET` | *(generated)* |
| `JWT_REFRESH_SECRET` | *(generated)* |
| `INTERNAL_API_KEY` | *(generated)* |
| `NODE_ENV` | `production` |
| `WEB_APP_URL` | `https://www.brand2school.co.za` |
| `ADMIN_WEB_APP_URL` | `https://admin.brand2school.co.za` |
| `MAIL_FROM` | `noreply@brand2school.co.za` |
| `SMTP_HOST` | `mail.brand2school.co.za` *(when ready)* |
| `SMTP_PORT` | `465` |
| `SMTP_SECURE` | `true` |
| `SMTP_USER` | `noreply@brand2school.co.za` |
| `SMTP_PASS` | *(cPanel mailbox password)* |

**Networking → Custom domain:** `api.brand2school.co.za` *(done)*

**Redeploy** after variable changes.

---

## 2 — Seed database (once)

**brand2school** → **Settings** → run command:

```bash
npm run railway:seed
```

Or locally with production `DATABASE_URL` (never commit URL).

**Login (admin):**

- Email: `superadmin@brand2school.co.za`
- Password: `ChangeMe123!` — change immediately after first login.

Verify: https://api.brand2school.co.za/health/ready → `"ok": true`

---

## 3 — Web app (`app.brand2school.co.za`)

**+ New Service** → same repo → name: `web`

| Setting | Value |
|---------|--------|
| Root Directory | *(empty)* |
| Build | `npm run build -w @brand2school/web` |
| Start | `npm run start -w @brand2school/web` |
| Pre-deploy | *(empty)* |
| Healthcheck | `/` |

**Variables:**

| Variable | Value |
|----------|--------|
| `NODE_ENV` | `production` |
| `NEXT_PUBLIC_API_BASE_URL` | `https://api.brand2school.co.za` |
| `B2S_INTERNAL_API_KEY` | *same as API `INTERNAL_API_KEY`* |

**Networking:** custom domain `app.brand2school.co.za`

**Cloudflare DNS:** CNAME `app` → Railway hostname, Proxied, SSL Full (strict).

**Deploy.**

---

## 4 — Admin (`admin.brand2school.co.za`)

**+ New Service** → name: `admin-web`

| Setting | Value |
|---------|--------|
| Build | `npm run build -w @brand2school/admin-web` |
| Start | `npm run start -w @brand2school/admin-web` |
| Healthcheck | `/login` |

**Variables:**

| Variable | Value |
|----------|--------|
| `NODE_ENV` | `production` |
| `NEXT_PUBLIC_API_BASE_URL` | `https://api.brand2school.co.za` |

**Networking:** `admin.brand2school.co.za`

**Cloudflare DNS:** CNAME `admin` → Railway hostname.

**Deploy.** Open https://admin.brand2school.co.za/login

---

## 5 — Background workers (no public URL)

Create **5 services** from the same repo. Each: Root `/`, **no** custom domain, **Connect** Postgres.

| Service name | Start command |
|--------------|---------------|
| `worker-notifications` | `npm run start:worker:notifications -w @brand2school/api` |
| `worker-subscriptions` | `npm run start:worker:subscriptions -w @brand2school/api` |
| `worker-whatsapp` | `npm run start:worker:whatsapp -w @brand2school/api` |
| `worker-esg` | `npm run start:worker:esg -w @brand2school/api` |
| `worker-audit-export` | `npm run start:worker:audit-export -w @brand2school/api` |

**Build (all workers):** `npm run build -w @brand2school/api`

**Variables (each worker):** copy from `infra/railway/env.worker.example`:

- `DATABASE_URL` → Postgres reference
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` → same as API
- `INTERNAL_API_KEY`, `WEB_APP_URL` → same as API
- `NODE_ENV` = `production`
- SMTP vars when email worker should send
- WhatsApp vars when Meta is configured

**Do not** run `railway:migrate` on workers (only API pre-deploy).

---

## 6 — Cloudflare DNS summary

| CNAME | Target |
|-------|--------|
| `api` | Railway **brand2school** (API) |
| `app` | Railway **web** |
| `admin` | Railway **admin-web** |

Bypass cache for `api.*` and `admin.*`.

---

## 7 — WhatsApp (when Meta app is ready)

On **API** + **worker-whatsapp**:

| Variable | Source |
|----------|--------|
| `WHATSAPP_APP_SECRET` | Meta app dashboard |
| `WHATSAPP_WEBHOOK_VERIFY_TOKEN` | your verify string |
| `WHATSAPP_ACCESS_TOKEN` | Meta |
| `WHATSAPP_PHONE_NUMBER_ID` | Meta |

**Webhook URL:** `https://api.brand2school.co.za/api/v1/whatsapp/webhook`

Redeploy API + worker-whatsapp.

---

## 8 — Smoke test

```bash
curl https://api.brand2school.co.za/health
curl -I https://app.brand2school.co.za
curl -I https://admin.brand2school.co.za/login
```

From API service shell:

```bash
npm run smoke:test -w @brand2school/api
```

---

## Checklist

- [ ] API variables + domains
- [ ] `npm run railway:seed`
- [ ] `/health/ready` OK
- [ ] Web service + `app.brand2school.co.za`
- [ ] Admin service + `admin.brand2school.co.za`
- [ ] `B2S_INTERNAL_API_KEY` matches `INTERNAL_API_KEY`
- [ ] Workers deployed (start with `worker-notifications` + `worker-subscriptions`)
- [ ] SMTP credentials (optional)
- [ ] WhatsApp credentials (optional)

Templates: `infra/railway/env.*.example`, matrix: `infra/railway/services.json`.
