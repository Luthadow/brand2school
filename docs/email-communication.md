# Brand2School — Email & communication structure

Domain and mailboxes are hosted on **Register Domain** (cPanel). The application sends automated mail only from **`noreply@brand2school.co.za`**. All other addresses are human-managed inboxes (with optional cPanel auto-responders).

## Mailbox roles

| Email | Purpose | Used by app SMTP? |
|-------|---------|-------------------|
| `info@brand2school.co.za` | General enquiries | No |
| `schools@brand2school.co.za` | School onboarding support | No |
| `brands@brand2school.co.za` | Brand partnerships | No |
| `support@brand2school.co.za` | Technical support | No |
| `admin@brand2school.co.za` | Internal administration | No |
| `superadmin@brand2school.co.za` | Platform owner login (seed user) | No |
| `noreply@brand2school.co.za` | System notifications (registration, ESG PDF) | **Yes** (`MAIL_FROM`, `SMTP_USER`) |

**Do not** send automated mail from `info@`, `schools@`, or `brands@` — those should stay trusted human inboxes.

## Public vs internal

**Public website / footers**

- `info@`, `schools@`, `brands@`, `support@`

**Internal / admin**

- `noreply@` (SMTP only — do not advertise for replies)
- `admin@`, `superadmin@`

## Application automated emails

Built in `apps/api/src/lib/mail.ts` (HTML via `buildBrandedEmail`):

1. **School registration** — sent to the principal’s email on signup (from `noreply@`).
2. **Brand registration & participation guide** — sent on **enterprise brand application** (`POST /api/v1/commercial/brand-applications`) to primary/contact email before activation. Full onboarding guide (two value streams, packages, phases, activation gates). Reply-To: `brands@`. Template: `apps/api/src/lib/emails/brandRegistrationGuide.ts`.
3. **Brand enterprise lifecycle** — verification, agreement, invoice, payment confirmation, campaign go-live, renewal notice. Reply-To: `brands@`. Templates: `brandLifecycleEmails.ts`. Full matrix: **[enterprise-email-lifecycle.md](enterprise-email-lifecycle.md)**.
4. **Infrastructure governance milestones** — phase completion, category verified, maintenance cycle alerts to LIVE campaign sponsors + school contact. Triggered on school portal sync. Templates: `governanceMilestoneEmails.ts`.
5. **School approved / activated** — when admin sets school status to `APPROVED` or `ACTIVE`, including **bulk approvals** (from `noreply@`).
6. **Brand welcome** — when admin sets brand status to `ACTIVE`, including **bulk approvals** (all `BRAND_ADMIN` users, from `noreply@`). Distinct from registration guide and campaign go-live mail.
7. **Password reset** — forgot-password flow (from `noreply@`, Reply-To `support@`). See `docs/password-reset-security.md`.
8. **Password changed** — confirmation after successful reset (security notice).
8. **Contact form** — enquiry to `info@` (Reply-To: submitter) + acknowledgement to submitter (from `noreply@`).
9. **ESG impact report** — sent to the brand schedule’s `recipientEmail` with PDF attachment (from `noreply@`).

**PDF layout, attachment naming, and what assets you must supply:** see **[pdf-report-templates.md](pdf-report-templates.md)**.

**Queue, audit logs, worker, and admin retry:** see **[notifications.md](notifications.md)**.

Railway / API env (see `infra/railway/env.api.example`):

```env
MAIL_FROM=noreply@brand2school.co.za
SMTP_HOST=mail.brand2school.co.za
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=noreply@brand2school.co.za
SMTP_PASS=<mailbox password — set in Railway only>
WEB_APP_URL=https://app.brand2school.co.za
```

Register Domain SMTP (typical cPanel): port **465** + SSL, or **587** + STARTTLS (`SMTP_SECURE=false`).

## cPanel — create mailboxes

1. Log in: `https://brand2school.co.za/cpanel` (or client area link).
2. **Email Accounts** → create each address above with a strong unique password.
3. Store `noreply@` password only in Railway secrets (never in git or chat).

## Auto-responders (Register Domain cPanel)

Configure under **Autoresponders** for the matching mailbox. Plain-text copies below.

### 1. `info@` — General enquiry

```
Dear Valued Partner,

Thank you for contacting Brand2School.

We have received your enquiry and a member of our team will respond as soon as possible.

Brand2School is committed to connecting brands, communities and schools to create measurable social impact across South Africa.

If your matter is urgent, please include:

- Your full name
- Organisation or school name
- Contact number
- Nature of enquiry

Thank you for supporting educational transformation.

Kind regards,

Brand2School Team
www.brand2school.co.za
```

### 2. `schools@` — School registration acknowledgement (inbound email)

Use when someone emails the schools inbox. (Online registration also triggers the **app** welcome email from `noreply@`.)

```
Dear School Representative,

Thank you for registering your school with Brand2School.

Your submission has been received successfully and is currently under review by our verification team.

During this process, we may verify:

- EMIS registration
- School contact information
- Location and district details
- Project and infrastructure needs

Once verification is complete, your school profile will be activated on the platform.

We appreciate your commitment to improving education and creating opportunities for learners.

Kind regards,

Schools Verification Team
Brand2School
```

### 3. `brands@` — Brand partnership

```
Dear Partner,

Thank you for your interest in partnering with Brand2School.

We are excited about the opportunity to work together in transforming schools and empowering communities.

Your enquiry has been forwarded to our partnerships team. A representative will contact you shortly to discuss:

- Campaign opportunities
- Product participation
- Community impact initiatives
- Brand visibility and reporting

Together, we can build measurable impact for schools across South Africa.

Kind regards,

Partnerships Team
Brand2School
```

Optional: add similar short auto-replies for `support@` and `admin@` if you want instant acknowledgement on those inboxes.

## DNS (Cloudflare + Register Domain)

Email DNS is managed at your **mail host** (Register Domain), not proxied through Cloudflare.

In Cloudflare, for **MX**, **SPF**, **DKIM**, and **DMARC** records:

- Set to **DNS only** (grey cloud) — **not** proxied.

Copy exact MX / SPF / DKIM values from cPanel → **Email Deliverability** or **Zone Editor**. Do not guess SPF strings; use what cPanel generates for your server.

Website and API hostnames (`app`, `api`, `admin`) can remain **proxied** (orange cloud) with SSL Full (strict).

## Security

- Rotate any password that was shared outside a secret manager.
- Never commit SMTP passwords to the repository.
- Use Railway **Variables** for `SMTP_PASS`.

## Code references

- Addresses: `apps/api/src/lib/contacts.ts`, `apps/web/lib/contact.ts`
- Mail senders: `apps/api/src/lib/mail.ts`, `apps/api/src/lib/emailTemplate.ts`
- Deploy overview: [deploy/railway-cloudflare.md](deploy/railway-cloudflare.md)
