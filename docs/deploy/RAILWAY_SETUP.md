# Railway setup — brand2school API (copy-paste)

**Full platform (web + admin + workers):** [RAILWAY_FULL_PLATFORM.md](./RAILWAY_FULL_PLATFORM.md)

Use this for a **single API service** named `brand2school` connected to GitHub `Luthadow/brand2school`.

## Service settings

| Setting | Value |
|---------|--------|
| **Root Directory** | *(empty — repo root, NOT `apps/api`)* |
| **Build command** | `npm run build -w @brand2school/api` |
| **Start command** | `npm run start -w @brand2school/api` |
| **Pre-deploy command** | `npm run railway:migrate` |
| **Healthcheck path** | `/health` |
| **Healthcheck timeout** | `300` |

Config-as-code (API only): `railway.api.toml`, `nixpacks.toml` at repo root. Web uses `railway.web.toml` + `nixpacks.web.toml` (no pre-deploy).

---

## PostgreSQL

1. **+ New → Database → PostgreSQL** (service name is often `Postgres`).
2. **Postgres → Connect** → select **brand2school** (line between services on canvas).
3. On **brand2school → Variables**, confirm `DATABASE_URL` resolves to `postgresql://...` (eye icon).  
   Reference form: `${{ Postgres.DATABASE_URL }}` — `Postgres` must match the database service name exactly.

If reference stays empty, copy **Private Network** connection URL from **Connect to Postgres** and paste as raw `DATABASE_URL`.

---

## Required variables (brand2school)

| Variable | Example / notes |
|----------|-----------------|
| `DATABASE_URL` | From Postgres reference or pasted private URL |
| `JWT_ACCESS_SECRET` | Random 32+ chars (unique) |
| `JWT_REFRESH_SECRET` | Random 32+ chars (unique) |
| `NODE_ENV` | `production` |

Generate secrets (PowerShell):

```powershell
[Convert]::ToBase64String((1..48 | ForEach-Object { Get-Random -Maximum 256 }) -as [byte[]])
```

### Optional at launch (API still starts)

WhatsApp, SMTP, `INTERNAL_API_KEY` — missing values only log `[production-readiness]` warnings.

| Variable | When needed |
|----------|-------------|
| `WEB_APP_URL` | `https://app.brand2school.co.za` |
| `ADMIN_WEB_APP_URL` | `https://admin.brand2school.co.za` |
| `SMTP_HOST` | Outbound email |
| `INTERNAL_API_KEY` | Server-to-server / analytics |
| `WHATSAPP_*` | Meta WhatsApp Cloud API |

---

## Deploy flow

1. Push latest `main` to GitHub.
2. **Deployments → Deploy** (or auto-deploy on push).
3. **Build logs** must show:
   - `npm ci --include=dev`
   - `✔ Generated Prisma Client`
   - `copy-prisma-client: copied ... -> dist/generated`
4. **Pre-deploy** must show:
   - `18 migrations found`
   - `All migrations have been successfully applied` (or resolve + apply)
5. **Deploy logs** must show:
   - `Brand2School API listening`

Test: `https://<your-railway-domain>/health` → `{"status":"ok","service":"brand2school-api"}`

---

## Fix P3009 (failed migration stuck)

Error:

```text
P3009 ... 20260521180000_commercial_workflow_expiry ... failed
```

### Option A — automatic (default)

Latest `npm run railway:migrate` resolves that migration as rolled back, then runs `migrate deploy`. Just **redeploy latest `main`**.

### Option B — manual pre-deploy once

1. **Pre-deploy command** → `npm run railway:migrate:resolve-failed`
2. **Deploy** once
3. **Pre-deploy command** → `npm run railway:migrate`
4. **Deploy** again

### Option C — SQL on Postgres

```sql
UPDATE "_prisma_migrations"
SET "rolled_back_at" = NOW(), "finished_at" = NULL
WHERE "migration_name" = '20260521180000_commercial_workflow_expiry'
  AND "finished_at" IS NULL;
```

Then deploy with `npm run railway:migrate`.

### Option D — fresh database (no data)

Delete Postgres → add new PostgreSQL → Connect → Deploy.

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `apps/api does not exist` | Root Directory must be **empty** (repo root) |
| `Missing script: railway:build:api` | Root Directory was `apps/api`; use repo root + `npm run build -w @brand2school/api` |
| `EBUSY` on `node_modules/.cache` | Do not run `npm ci` twice; build = `npm run build -w @brand2school/api` only |
| `tsc: not found` (exit 127) | Use `npm ci --include=dev` (see `nixpacks.toml`) |
| `dist/generated/prisma/index.js` missing | Build must run `copy-prisma-client.mjs` (in `apps/api` build script) |
| `DATABASE_URL` empty | Connect Postgres or paste private URL |
| Healthcheck fails before listen | Migrations run in **pre-deploy** only; server listens on `0.0.0.0` immediately |
| `Brand.homeSortOrder` does not exist (P2022) | DB behind schema — set **Pre-deploy** to `npm run railway:migrate`, or redeploy (API runs `migrate deploy` on startup in production) |
| `res.status is not a function` | Fixed in API error handler — redeploy latest `main` |
| `[production-readiness] WHATSAPP_*` | Warnings only — set Meta WhatsApp env vars when enabling WhatsApp |
| `Super admin bootstrap failed` | Usually missing migrations or `DATABASE_URL`; fix migrate first, then redeploy |
| P3009 commercial_workflow_expiry | See above |

---

## Seed admin (first deploy only)

Railway run command on **brand2school**:

```bash
npm run railway:seed
```

Login: see **[SUPERADMIN_SETUP.md](../SUPERADMIN_SETUP.md)** — `superadmin@brand2school.co.za` (bootstrap password in docs).

---

## Full platform (api + web + admin + workers)

See [railway-cloudflare.md](./railway-cloudflare.md) and `infra/railway/services.json`.
