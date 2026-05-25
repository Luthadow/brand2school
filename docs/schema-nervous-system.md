# Database schema — nervous system map

This document maps **Prisma models** to **runtime features** so schema, migrations, and API wiring stay aligned.

## Brand trust & public profile

| Column | Type | Set by | Consumed by |
|--------|------|--------|-------------|
| `status` | `EntityStatus` | Admin approval `PATCH /approvals/brands/:id/status` | Participation gates, public profile gate (`ACTIVE`) |
| `verificationCode` | `String?` unique | Enterprise register; `ensureBrandVerificationCode` when trusted | `/verify/:code`, QR, PDF certificate |
| `verificationStatus` | `BrandVerificationStatus` | `applyBrandVerificationSideEffects` (approval); admin PATCH; founder bootstrap | Public verify page, certificate eligibility |
| `verifiedAt` | `DateTime?` | Trust sync when `VERIFIED` / `FOUNDER_VERIFIED` | Verify page, PDF |
| `verifiedByUserId` | `String?` → `User` | Approval / manual trust PATCH | Audit trail |
| `founderExempt` | `Boolean` | Admin PATCH; founder bootstrap | Skips R10k activation fee (`campaignActivation`) |
| `homeSortOrder` | `Int` | Admin PATCH; founder bootstrap (`0` = first) | Homepage + partner directory sort |
| `publicProfileEnabled` | `Boolean` | Admin PATCH | `/brand/:slug`, `/partners/:slug` visibility |
| `featuredOnHome` | `Boolean` | Admin PATCH | Homepage logo strip |

### Trust sync (single source of truth)

- `apps/api/src/modules/platform/syncBrandVerification.ts`
  - `applyBrandVerificationSideEffects` — runs after **entity status** approval
  - `applyManualBrandVerificationPatch` — runs after **admin brand PATCH** (`verificationStatus`, `founderExempt`)

### Registration flow

1. `POST /api/v1/commercial/register` → creates brand with `verificationCode` + `verificationStatus: PENDING`
2. Admin approves → `ACTIVE` → trust layer → `VERIFIED` or `FOUNDER_VERIFIED` + `verifiedAt` + code confirmed
3. Founder bootstrap → `FOUNDER_VERIFIED` + `founderExempt` + `homeSortOrder: 0` immediately

## WhatsApp select flow

| Model | Purpose |
|-------|---------|
| `WhatsAppConversation` | Session per `msisdn` (`step` + `data` JSON), ~45 min TTL via `updatedAt` index |
| `Submission.source` | `"whatsapp"` or `"web"` |
| `SubmissionAttempt.source` | Same |

Handler: `apps/api/src/modules/whatsapp/handleConversation.ts`

## Migrations (May 2026 rollout)

| Migration | Adds |
|-----------|------|
| `20260525100000_brand_home_sort_order` | `homeSortOrder` |
| `20260525110000_brand_founder_exempt` | `founderExempt` |
| `20260525120000_whatsapp_conversation` | `WhatsAppConversation` |
| `20260525130000_brand_verification_code` | `BrandVerificationStatus`, code + trust columns |
| `20260525140000_brand_verification_wiring` | Indexes, FK `verifiedByUserId`, status backfill SQL |

## Deploy checklist

```bash
npm run db:migrate:deploy -w @brand2school/api
npm run brand:backfill-verification    # after deploy (INTERNAL_API_KEY)
npm run railway:bootstrap-founder      # R2kay founder brand
```

## Public asset endpoints (no DB — reads Brand)

| Route | Output |
|-------|--------|
| `GET /api/v1/platform/verify/:code` | JSON trust profile |
| `GET /api/v1/platform/verify/:code/qr` | PNG QR → verify URL |
| `GET /api/v1/platform/verify/:code/certificate` | PDF certificate |
| `GET /api/v1/platform/brands/:slug/qr` | PNG QR → `/brand/:slug` |
