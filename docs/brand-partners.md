# Brand partners (all phases)

Full schema ↔ feature wiring (all migrations + participation): **[docs/schema-nervous-system.md](schema-nervous-system.md)**

**Railway:** run `npm run railway:migrate` (or `db:migrate:deploy`) so migrations through `20260525150000` apply before bootstrap/backfill.

## Brand verification codes

Each registered brand receives a unique public code: **`{PREFIX}-{YY}-{ID}`** (e.g. `R2K-26-84XQ19` for R2kay).

| Verification status | Meaning |
|---------------------|---------|
| `PENDING` | Registered, awaiting approval |
| `VERIFIED` | Admin-approved partner |
| `FOUNDER_VERIFIED` | Founding partner — lifetime pass, no activation fee (`founderExempt`) |
| `SUSPENDED` | Disabled |
| `REJECTED` | Not approved |

Public lookup: `https://brand2school.co.za/verify/R2K-26-84XQ19`  
Brand profile: `https://brand2school.co.za/brand/r2kay-liquid-freeze` (QR, certificate download, impact stats).

**Assets (API):**

| Asset | URL |
|-------|-----|
| Verification QR (PNG) | `GET /api/v1/platform/verify/{code}/qr` |
| Certificate (PDF) | `GET /api/v1/platform/verify/{code}/certificate` |
| Brand profile QR | `GET /api/v1/platform/brands/{slug}/qr` |

Codes are issued on **enterprise registration** and confirmed when the brand is approved **ACTIVE** in admin.

After deploy, run once: `npm run brand:backfill-verification` (requires `B2S_INTERNAL_API_KEY`) to align legacy rows.

## Product / participation codes (campaign batches)

Brands upload **lists of codes** tied to a campaign so learners can submit them on the web or WhatsApp flow.

| Channel | How |
|---------|-----|
| Brand portal | **Campaigns → Upload product codes** — Excel (.xlsx/.xls), CSV, Word (.docx), or plain text |
| API | `POST /api/v1/campaigns/:campaignId/code-batches/validate-file` (preview) |
| API | `POST /api/v1/campaigns/:campaignId/code-batches/import` (multipart: `file`, `batchName`, optional `expiresAt`) |
| Template | `GET /api/v1/campaigns/:campaignId/code-batches/import-template` |

**File format:** one column named `code` in spreadsheets, or one code per line in Word/text. Structured codes use  
`{BRAND}-{CAMPAIGN}-{BATCH}-{TOKEN}-{CHECK}` (must match the brand’s `codePrefix`).  
Use **Check file** before **Import**; invalid or duplicate rows are reported before anything is saved.

System-generated batches: `POST .../code-batches/generate` (up to 50k codes).

## Governance

Public visibility requires **ACTIVE** status plus admin approval:

| Surface | Requirements |
|---------|----------------|
| Homepage logo strip | `featuredOnHome` + `logoUrl` |
| Partner directory `/partners` | `publicProfileEnabled` or `featuredOnHome` |
| Partner profile `/partners/[slug]` | Same as directory |
| Campaign pages | Brand `ACTIVE`, campaign exists |

Deactivating a brand clears `featuredOnHome` and `publicProfileEnabled`.

Obtain written brand consent before enabling public logos (trademark policy).

## Admin workflow

1. Approve brand → **ACTIVE** (Approvals).
2. **Logo** — brand uploads in **Brand portal → Settings → Brand logo** (PNG, min 512×512, max 15MB), or admin uploads in **Admin → Dashboard → Brands**.
3. Set **public slug**, description, website, brand color.
4. Enable **Public partner profile** and/or **Featured on homepage**.
5. Set **Homepage order** to `0` (or `1`) for your flagship partner — lower numbers appear first on the homepage strip and `/partners`.

**R2kay Liquid Freeze** (flagship founder water partner): provision with founder pass (no R10,000 activation fee), homepage order `0`, and public profile enabled.

```bash
npm run db:migrate:deploy -w @brand2school/api
FOUNDER_BRAND_ADMIN_EMAIL=siphokwape@gmail.com npm run brand:bootstrap-founder
```

Production (Railway, after API deploy + migrate):

```bash
npm run railway:bootstrap-founder
```

Requires `B2S_INTERNAL_API_KEY` and `B2S_API_URL`. Upload the logo in **admin → Brands** for the homepage strip.

### R2kay brand portal login

| | |
|--|--|
| **URL** | `https://brand2school.co.za/brand/login` |
| **Email** | `siphokwape@gmail.com` (not `siphokwapwe` — no extra `p`) |
| **Password** | `ChangeMe123!` (until you change it) |

The account is created when `npm run railway:bootstrap-founder` runs, or automatically on API startup if that user is still missing. If login says **Invalid credentials**, the user row does not exist yet — run the bootstrap command above, then try again.

### Magome Bakery & Eatery (founding restaurant pilot)

**6-month platform fee waiver** (`founderExempt`, `FOUNDER_VERIFIED`, recurring R0). Proves: Restaurant → Customer → Participation → Verification → School → Impact → Reporting.

| | |
|--|--|
| Business | Magome Bakery & Eatery |
| Location | Boitekong, Rustenburg |
| Contact | Ashley Speelman · `ashleyshimrora21@gmail.com` |
| Campaign | Magome Bakery & Eatery × Brand2School |
| Tagline | Every Meal Can Make an Impact. |
| Target | 1,000 verified participations |
| Homepage order | `1` (after R2kay) |
| Public profile | `/partners/magome-bakery-eatery` |

```bash
npm run db:migrate:deploy -w @brand2school/api
npm run brand:bootstrap-magome
```

Production:

```bash
npm run railway:bootstrap-magome
```

Logo ships from `apps/api/assets/brands/magome-bakery-eatery.png` during bootstrap. Brand portal password defaults to `ChangeMe123!` until changed.

**Partnership expiry:** subscription worker sends notices at 30 / 14 / 7 days, then sets `subscriptionStatus = REVIEW_REQUIRED` for the case-study / conversion conversation.

### Magome Bakery & Eatery (founding restaurant pilot)

**6-month Founding Brand Partner** — platform fee waived (R0), `FOUNDER_VERIFIED`, homepage order `1`, live campaign **Magome Bakery & Eatery × Brand2School** (target 1,000 verified participations).

| | |
|--|--|
| Location | Boitekong, Rustenburg (North West) |
| Contact | Ashley Speelman |
| Public profile | `/partners/magome-bakery-eatery` |
| Partnership end | `subscriptionEndDate` = start + 6 months → then `REVIEW_REQUIRED` |
| Notices | 30 / 14 / 7 days before expiry (subscription worker) |

```bash
npm run db:migrate:deploy -w @brand2school/api
MAGOME_BRAND_ADMIN_EMAIL=ashleyshimrora21@gmail.com npm run brand:bootstrap-magome
```

Production:

```bash
npm run railway:bootstrap-magome
```

Logo ships from `apps/api/assets/brands/magome-bakery-eatery.png` during bootstrap (also re-uploadable in admin).

#### Magome brand portal login

| | |
|--|--|
| **URL** | `https://brand2school.co.za/brand/login` |
| **Email** | `ashleyshimrora21@gmail.com` |
| **Password** | `ChangeMe123!` (until you change it) |

## Public API

| Endpoint | Purpose |
|----------|---------|
| `GET /api/v1/platform/partners` | Homepage featured logos |
| `GET /api/v1/platform/partners/directory` | Partner directory cards |
| `GET /api/v1/platform/partners/:slug` | Full partner profile + impact map |
| `GET /api/v1/platform/campaigns` | Campaign showcase list |
| `GET /api/v1/platform/campaigns/:slug` | Campaign detail |
| `GET /api/v1/platform/rankings` | School + partner rankings |
| `GET /api/v1/platform/trust` | Verification policy stats |

## Public web routes

| Route | Phase |
|-------|-------|
| `/partners` | 2 — directory |
| `/partners/[slug]` | 2 — profile, province map, campaigns |
| `/campaigns` | 2 — campaign gallery |
| `/campaigns/[slug]` | 2 — campaign detail |
| `/trust` | 2 — verification page |
| `/movement` | 3 — live data + rankings panel |

## Storage

- **Phase 1–2:** `apps/api/uploads/brands/{brandId}.png` served at `/uploads/brands/...`
- Set `API_PUBLIC_URL` in production (e.g. `https://api.brand2school.co.za`)
- **Phase 2+ (optional):** Cloudflare R2 — set `R2_*` env vars and add `@aws-sdk/client-s3` when ready

## Migrations

```bash
npm run db:migrate -w @brand2school/api
```

Includes `20260525100000_brand_home_sort_order` (`homeSortOrder` on `Brand`).
