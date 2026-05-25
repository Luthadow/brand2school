# Email on Railway — why SMTP vars alone may not work

## The issue

If **SMTP_HOST**, **SMTP_USER**, and **SMTP_PASS** are set on the API service but mail still never sends, the most common cause is **Railway plan limits**, not missing variables.

On **Free, Trial, and Hobby** plans, Railway **blocks outbound SMTP** (ports **465** and **587**). The API cannot reach `mail.brand2school.co.za` from the container — connections time out. cPanel credentials can be correct and mail still fails.

Reference: [Railway outbound networking — email delivery](https://docs.railway.com/networking/outbound-networking)

## Fix A — Resend (recommended on Hobby)

Resend uses **HTTPS** and works on every Railway plan.

1. Create an account at [resend.com](https://resend.com).
2. Add domain **brand2school.co.za** and add the DNS records Resend shows (in Cloudflare, DNS only / grey cloud).
3. Create an API key.
4. On Railway → **brand2school** (API) service → **Variables**:

```env
RESEND_API_KEY=re_xxxxxxxx
MAIL_FROM=noreply@brand2school.co.za
NOTIFICATION_DELIVERY=sync
```

5. **Redeploy** the API.
6. Check **https://api.brand2school.co.za/health/email** — expect `"transport": "resend"` and `"verified": true`.

You can keep the SMTP_* variables for local dev; when `RESEND_API_KEY` is set, the API uses Resend first.

Test from your machine:

```bash
B2S_INTERNAL_API_KEY=your_key npm run verify:smtp:remote -- --send-to you@example.com
```

## Fix B — Railway Pro + cPanel SMTP

If you want to keep using **mail.brand2school.co.za** directly:

1. Upgrade the Railway workspace to **Pro** (or higher).
2. **Redeploy** the API after upgrading (required for SMTP egress).
3. Keep:

```env
SMTP_HOST=mail.brand2school.co.za
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=noreply@brand2school.co.za
SMTP_PASS=<cPanel password>
MAIL_FROM=noreply@brand2school.co.za
```

4. Do **not** set `RESEND_API_KEY` if you want SMTP only.
5. Check `/health/email` — expect `"transport": "smtp"` and `"verified": true`.

## After deploy — confirm in logs

API startup should log one of:

- `Resend API verified for noreply mail`
- `SMTP connection verified for noreply mail`
- `SMTP verify failed — on Railway Hobby outbound SMTP is blocked; use RESEND_API_KEY instead`

## Variables must be on the API service

SMTP and Resend variables belong on the service that runs **`npm run start -w @brand2school/api`** (your **brand2school** API), not on **web** or **admin-web** alone.
