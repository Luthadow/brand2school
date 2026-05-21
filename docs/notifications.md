# Notification queue & audit logs

All automated emails flow through a **queue + audit log** so bulk approvals do not block the API or hit SMTP rate limits.

## Tables

| Table | Purpose |
|-------|---------|
| `NotificationLog` | Compliance / traceability (recipient, template, status, subject, entity) |
| `NotificationJob` | Queue worker processes rows with retry + backoff |

## Templates

- `SCHOOL_REGISTRATION`
- `SCHOOL_APPROVED`
- `BRAND_WELCOME`
- `PASSWORD_RESET`
- `CONTACT_INQUIRY_INFO`
- `CONTACT_ACK`
- `ESG_REPORT`

## Delivery modes

| Env | Behaviour |
|-----|-----------|
| `NOTIFICATION_DELIVERY=queue` | Jobs stay `QUEUED` until **worker-notifications** runs (production default) |
| `NOTIFICATION_DELIVERY=sync` | Process immediately after queueing (local dev without worker) |

Password reset and contact form use `immediate: true` so users get a response in the same HTTP request (still logged).

## Workers

```bash
# Local
npm run dev:worker:notifications

# Production (Railway service worker-notifications)
npm run start:worker:notifications -w @brand2school/api
```

Poll interval: `NOTIFICATION_POLL_MS` (default 3000). Batch size: `NOTIFICATION_BATCH_SIZE` (default 25).

## Admin API (SUPER_ADMIN)

- `GET /api/v1/admin/notifications/logs` — paginated audit trail
- `POST /api/v1/admin/notifications/jobs/:id/retry` — re-queue a failed job

## Migrations

```bash
npm run db:migrate -w @brand2school/api
```

Applies `NotificationLog`, `NotificationJob`, and `PasswordResetToken` if not already applied.
