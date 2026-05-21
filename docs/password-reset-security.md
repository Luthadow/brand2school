# Password reset security (Brand2School)

Passwords are **never retrievable**. Users can only **reset** via a one-time secure link.

## Rules enforced

| Rule | Implementation |
|------|----------------|
| Hashed storage | `bcrypt` on `User.passwordHash` only |
| Reset token hashed | `PasswordResetToken.tokenHash` = SHA-256(raw token) |
| Token expiry | Default **30 minutes** — `PASSWORD_RESET_EXPIRES_MINUTES` |
| Per-user reset cap | Default **5 / hour** — `PASSWORD_RESET_MAX_PER_HOUR` |
| Admin reset base URL | `ADMIN_WEB_APP_URL` (default `http://localhost:3001`) |
| Single use | `usedAt` set on success; prior tokens invalidated |
| No password in email | Reset + changed emails contain links/notices only |
| Generic forgot response | Same message whether email exists or not |
| Suspended accounts | No reset email sent |
| Rate limits | 5 forgot-password requests / hour / IP; 5 tokens / user / hour |
| Session revoke | All refresh sessions revoked after reset |
| Strength policy | 8+ chars, upper, lower, number, special |

## API routes

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/v1/auth/forgot-password` | Request reset email |
| GET | `/api/v1/auth/reset-password/validate?token=` | Validate link before form |
| POST | `/api/v1/auth/reset-password` | Set new password |

## Frontend

| App | Forgot | Reset |
|-----|--------|-------|
| Web (school + brand) | `/forgot-password` | `/reset-password` |
| Admin | `/forgot-password` | `/reset-password` |

Admin reset links use `ADMIN_WEB_APP_URL`; school/brand use `WEB_APP_URL`.

## Emails (from `noreply@`, Reply-To `support@`)

1. **Reset Your Password — Brand2School** — one-time link
2. **Your Password Was Changed — Brand2School** — security confirmation

## Environment (`apps/api/.env`)

| Variable | Default | Purpose |
|----------|---------|---------|
| `PASSWORD_RESET_EXPIRES_MINUTES` | `30` | Reset link validity (15–1440) |
| `PASSWORD_RESET_MAX_PER_HOUR` | `5` | Max reset emails per user per hour |
| `ADMIN_WEB_APP_URL` | `http://localhost:3001` | Reset link host for admin roles |
| `WEB_APP_URL` | `http://localhost:3000` | Reset link host for school / brand roles |

Set `ADMIN_WEB_APP_URL` in production to your admin portal origin (e.g. `https://admin.brand2school.co.za`).

## What we never do

- Email existing passwords
- Show passwords to admins
- Store plain-text passwords
- Log passwords

## Follow-ups (not yet implemented)

- Login activity monitoring (device, IP, failed attempts)
- Two-factor authentication (2FA) for SUPER_ADMIN and enterprise accounts
