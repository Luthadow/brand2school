# Brand2School Platform

Production-oriented implementation of the Brand2School ecosystem.

## Current implementation status

This repository now includes:

- Monorepo scaffolding (`apps`, `packages`, `infra`)
- `@brand2school/api` service in TypeScript + Express
- PostgreSQL data model with Prisma
- Auth registration/login endpoints
- School creation + school dashboard endpoint
- Brand and campaign creation endpoints
- Participation submission validation endpoint
- WhatsApp webhook ingestion endpoint
- Learner onboarding and learner dashboard endpoint
- CSV/XLSX campaign code batch import endpoint
- Docker Compose for PostgreSQL + Redis

## Production deployment

Recommended stack: **Railway + Cloudflare + your domain**.

See **[docs/deploy/railway-cloudflare.md](docs/deploy/railway-cloudflare.md)** and `infra/railway/` for service layout, env templates, and DNS steps.

Email mailboxes, auto-responders, and SMTP: **[docs/email-communication.md](docs/email-communication.md)**.

ESG PDF reports and delivery email copy: **[docs/pdf-report-templates.md](docs/pdf-report-templates.md)**.

Notification queue, audit logs, and worker: **[docs/notifications.md](docs/notifications.md)**.

## Quick start

1. Install dependencies:

```bash
npm install
```

2. Copy env file:

```bash
copy apps\\api\\.env.example apps\\api\\.env
```

3. Start PostgreSQL and bootstrap schema + seed (one command):

```bash
npm run db:setup
```

This starts Docker Postgres, applies migrations, and seeds the **super admin only** (no demo schools or brands).

Manual steps (equivalent):

```bash
npm run db:up
npm run ops:bootstrap
```

Fresh reset (drops all data):

```bash
npm run db:reset
npm run db:seed
```

6. Run API:

```bash
npm run dev:api
```

API base URL:

`http://localhost:4000/api/v1`

## Phase 2 endpoints

- `POST /api/v1/learners` (auth required: super/admin/school admin)
- `GET /api/v1/learners/:id/dashboard` (auth required)
- `POST /api/v1/whatsapp/webhook` (message command format ingestion)
- `POST /api/v1/campaigns/:campaignId/code-batches/import` (multipart upload field: `file`)

WhatsApp command format:

`SUBMIT | CAMPAIGN_SLUG | LEARNER_CODE | PRODUCT_CODE | AREA`

Code import file requirement:

- CSV or XLSX with a `code` column (case-insensitive aliases supported)

## Phase 3 core endpoints

- `POST /api/v1/auth/refresh` (refresh-token rotation + session persistence)
- `POST /api/v1/auth/logout` (refresh-session revocation)
- `PATCH /api/v1/admin/approvals/users/:id/status`
- `PATCH /api/v1/admin/approvals/schools/:id/status`
- `PATCH /api/v1/admin/approvals/brands/:id/status`
- `GET /api/v1/admin/moderation/fraud-flags`
- `PATCH /api/v1/admin/moderation/fraud-flags/:id/resolve`
- `GET /api/v1/platform/overview?role=ADMIN_STAFF`

Approval transition rule:

- `PENDING -> VERIFIED -> APPROVED -> ACTIVE`

## Phase 4 core endpoints and features

- `GET /api/v1/auth/sessions` (list user device sessions)
- `POST /api/v1/auth/sessions/revoke` (revoke one session by `sessionId`)
- `POST /api/v1/auth/sessions/revoke-all` (revoke all active sessions)
- `GET /api/v1/admin/queue` (combined approvals + moderation queue)

Fraud engine:

- Weighted scoring policy with severity bands (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`)
- Review policy assignment (`AUTO_ACCEPT` or `QUEUE_REVIEW_*`)

Audit logging:

- Approval changes and fraud moderation decisions are now stored in `audit_logs`

## Phase 5 admin operations

- Web admin actions are now available directly from `dashboard/admin`
- Queue filtering and sorting are available for fraud flags
- Audit log viewer is available in the admin dashboard

Web proxy endpoints:

- `GET /api/admin/queue`
- `PATCH /api/admin/approvals/:entity/:id`
- `PATCH /api/admin/moderation/fraud-flags/:id`
- `GET /api/admin/audit-logs`

Backend endpoint added:

- `GET /api/v1/admin/audit-logs` (supports `action`, `targetType`, `actorId`, `limit`)

## Phase 6 security and separation

- Dedicated admin frontend app: `apps/admin-web` (separate from `apps/web`)
- Admin login/session now uses secure cookies (no environment token dependency)
- CSRF protection added for state-changing admin web actions (double-submit token)
- Optimistic UI updates and toast/error notifications in admin dashboard

Run dedicated admin frontend:

- `npm run dev:admin`

## Phase 7 module architecture

- Role-based admin modules with separate pages:
  - `/dashboard/approvals` (SUPER_ADMIN only)
  - `/dashboard/moderation` (SUPER_ADMIN, ADMIN_STAFF)
  - `/dashboard/audit` (SUPER_ADMIN, ADMIN_STAFF)
- Queue pagination and search supported via `GET /api/v1/admin/queue`
- Audit history filters now support pagination/date range/search and CSV export:
  - `GET /api/v1/admin/audit-logs`
  - `GET /api/v1/admin/audit-logs/export`
- Admin audit filter state is persisted in browser local storage

## Phase 8 scale operations

- Bulk actions:
  - `POST /api/v1/admin/approvals/bulk`
  - `POST /api/v1/admin/moderation/fraud-flags/bulk-resolve`
- Saved queue presets per admin:
  - `GET /api/v1/admin/presets`
  - `POST /api/v1/admin/presets`
  - `DELETE /api/v1/admin/presets/:id`
- Server-side audit export jobs for large datasets:
  - `POST /api/v1/admin/audit-logs/export-jobs`
  - `GET /api/v1/admin/audit-logs/export-jobs`
  - `GET /api/v1/admin/audit-logs/export-jobs/:id`
  - `GET /api/v1/admin/audit-logs/export-jobs/:id/download`

## Phase 9 worker architecture (durable queue + retry)

- Audit export jobs are now enqueued only; API no longer processes them inline
- Dedicated background worker process:
  - `npm run dev:worker:audit-export`
- Worker features:
  - durable queue from database (`audit_export_jobs`)
  - stale-lock recovery
  - retry with exponential backoff (`retryCount`, `maxRetries`, `nextRetryAt`)
  - job locking (`lockToken`, `lockedAt`) to avoid duplicate processing

## Next build targets

- WhatsApp integration adapter (Twilio/Meta webhook)
- CSV/XLSX code batch upload endpoints
- Learner onboarding endpoints and dashboard
- Fraud rule engine + review queue
- Next.js web app for dashboards and onboarding
