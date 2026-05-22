# noreply@brand2school.co.za — SMTP setup

The platform sends **all automated email** from `noreply@brand2school.co.za` only (registration, password reset, brand guides, ESG PDFs). Human inboxes (`info@`, `schools@`, `brands@`) are **not** used for SMTP.

## 1. cPanel mailbox (Register Domain)

You already created the mailbox. Use these **Secure SSL/TLS** settings (from cPanel → Set Up Mail Client):

| Setting | Value |
|---------|--------|
| **Username** | `noreply@brand2school.co.za` |
| **Password** | *(mailbox password you set in cPanel)* |
| **Incoming server** | `mail.brand2school.co.za` |
| **IMAP port** | 993 |
| **POP3 port** | 995 |
| **Outgoing server (SMTP)** | `mail.brand2school.co.za` |
| **SMTP port** | **465** (SSL/TLS) |

The API only needs **outgoing SMTP** — not IMAP/POP3.

## 2. Railway — API service variables

In Railway → **brand2school** (API) → **Variables**, add:

```env
MAIL_FROM=noreply@brand2school.co.za
SMTP_HOST=mail.brand2school.co.za
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=noreply@brand2school.co.za
SMTP_PASS=<your cPanel mailbox password>
```

Also ensure public URLs are set (used in email links):

```env
WEB_APP_URL=https://www.brand2school.co.za
ADMIN_WEB_APP_URL=https://admin.brand2school.co.za
```

**Redeploy the API** after saving variables.

## 3. Immediate delivery (school registration email)

School registration, password reset, and contact forms send **immediately** from the API (`immediate: true`).

You do **not** need a separate worker for those emails — but you **must** set all SMTP variables on the **API** service and redeploy.

Optional on API:

```env
NOTIFICATION_DELIVERY=sync
```

This also sends any other queued mail inline (useful if you skip `worker-notifications`).

## 4. Notification worker (optional)

For ESG PDFs and bulk mail, run **worker-notifications** with the **same** SMTP variables.

See `infra/railway/env.worker.example`.

## 5. Test from your machine

Never put the mailbox password in git. Use a local file only:

1. Copy `apps/api/.env.example` → `apps/api/.env` (if you do not have one).
2. Set `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `SMTP_PORT=465`, `SMTP_SECURE=true`, `MAIL_FROM=noreply@brand2school.co.za`.
3. Run:

```bash
npm run test:smtp
npm run test:smtp -- --send-to your-personal@email.com
```

You should see `SMTP connection verified` and receive the test email.

## 6. Test in production

After Railway redeploy:

1. Submit the **brand application** on https://www.brand2school.co.za/for-brands#contact — a registration guide email should arrive from noreply@.
2. Use **Forgot password** on school or brand login — reset email from noreply@.
3. Check API logs on Railway for `[mail:dev]` — if you still see that prefix, SMTP is **not** configured (emails are logged only, not sent).

## 7. DNS (deliverability)

In **Cloudflare**, keep MX / SPF / DKIM / DMARC records as **DNS only** (grey cloud), not proxied. Use the exact values from cPanel → **Email Deliverability**.

## 8. Security

- Rotate the mailbox password if it was ever pasted in chat or email.
- Store `SMTP_PASS` only in Railway Variables or a password manager.
- Do not commit `apps/api/.env` with real passwords.

## Code reference

- Send logic: `apps/api/src/lib/mail.ts`
- Env schema: `apps/api/src/config/env.ts`
- Full mailbox map: `docs/email-communication.md`
