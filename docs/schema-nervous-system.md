# Database schema — nervous system map

This document maps **Prisma models and migrations** to **runtime features**. After any deploy, run migrations then optional backfill/bootstrap scripts.

## Quick deploy

```bash
npm run db:migrate:deploy -w @brand2school/api
npm run brand:backfill-verification    # once — INTERNAL_API_KEY
npm run railway:bootstrap-founder      # R2kay founder brand
npm run railway:bootstrap-magome       # Magome founding restaurant pilot
```

Validate locally: `npx prisma validate` (in `apps/api`).

---

## Enums

| Enum | Values | Used for |
|------|--------|----------|
| `EntityStatus` | PENDING, VERIFIED, APPROVED, ACTIVE, SUSPENDED | `User`, `School`, `Brand` operational lifecycle |
| `BrandVerificationStatus` | PENDING, VERIFIED, FOUNDER_VERIFIED, SUSPENDED, REJECTED | Public trust / certificate layer on `Brand` |
| `SchoolVerificationStatus` | NOT_SUBMITTED … REJECTED | `SchoolVerification` documents |

---

## Brand (`Brand`)

| Column | Type | Set by | Consumed by |
|--------|------|--------|-------------|
| `status` | `EntityStatus` | Admin approval | Participation gates, public profile (`ACTIVE`) |
| `verificationCode` | `String?` @unique | Register + trust sync | `/verify/:code`, QR, PDF |
| `verificationStatus` | `BrandVerificationStatus` | Trust sync, admin PATCH, founder bootstrap | Verify page, certificates |
| `verifiedAt` | `DateTime?` | Trust sync | Verify page, PDF |
| `verifiedByUserId` | `String?` → `User` | Approval / admin PATCH | Audit |
| `founderExempt` | `Boolean` | Admin / founder bootstrap | Skips R10k activation fee |
| `homeSortOrder` | `Int` | Admin / founder (`0` = first) | Homepage, directory, brand select order |
| `publicProfileEnabled` | `Boolean` | Admin | `/brand/:slug` visibility |
| `featuredOnHome` | `Boolean` | Admin | Homepage logos |
| `codePrefix` | `String` @unique | Registration | Product codes, verification code prefix |
| `slug` | `String` @unique | Registration | `/brand/:slug`, participation brand select |

**Trust sync:** `apps/api/src/modules/platform/syncBrandVerification.ts`

**Indexes:** `verificationStatus`, `(status, verificationStatus)`, `homeSortOrder`, `founderExempt`

---

## School (`School`)

| Column | Type | Used for |
|--------|------|----------|
| `province` | `String` | Submit flow: province select |
| `district` | `String` | Submit flow: district → schools in district |
| `name` | `String` | School dropdown label |
| `status` | `EntityStatus` | Only ACTIVE / APPROVED / VERIFIED appear in submit lists |
| `whatsappPhone` | `String` @unique | WhatsApp session, school status |
| `schoolCode` | `String` @unique | School portal |

**No extra tables** for participation — selects query `School` by `province` + `district`.

**Indexes:** `(province, district)`, `(status, province)` — migration `20260525150000`

**API:** `GET /api/v1/participation/school-options`, `GET /api/v1/participation/brands`

---

## WhatsApp select flow

| Model | Columns | Purpose |
|-------|---------|---------|
| `WhatsAppConversation` | `msisdn`, `step`, `data` (JSON), `updatedAt` | Menu: province → district → school → brand/campaign → code |
| `Submission` | `source` (`web` / `whatsapp`), `schoolId`, `campaignId`, `codeValue` | Verified participation record |
| `SubmissionAttempt` | `source`, `outcome`, `whatsappMsisdn` | Audit / fraud |

**Handler:** `apps/api/src/modules/whatsapp/handleConversation.ts`

---

## Campaign & codes (participation)

| Model | Role |
|-------|------|
| `Campaign` | Linked to `Brand`; brand select resolves to active `Campaign.slug` |
| `CodeBatch` | Groups imported or generated codes (`batchName`, `batchCode`, optional `expiresAt`) |
| `Code` | Product codes (`value` @unique); verified on submit; linked to `brandId`, `campaignId` |
| `Product` | Optional link when codes are generated per SKU |

**Brand file upload (no new tables):** Excel/CSV/Word → `POST .../code-batches/validate-file` then `import` creates `CodeBatch` + `Code` rows. Prefix check uses `Brand.codePrefix`.

**API:** `apps/api/src/modules/codes/importCodeBatchFromFile.ts`, `parseProductCodesFromUpload.ts`

---

## Migrations (May 2026 — apply in order)

| Migration | Database change |
|-----------|-----------------|
| `20260525100000_brand_home_sort_order` | `Brand.homeSortOrder` |
| `20260525110000_brand_founder_exempt` | `Brand.founderExempt` |
| `20260525120000_whatsapp_conversation` | Table `WhatsAppConversation` |
| `20260525130000_brand_verification_code` | Enum `BrandVerificationStatus`, `verificationCode`, `verificationStatus`, `verifiedAt`, `verifiedByUserId` |
| `20260525140000_brand_verification_wiring` | FK `verifiedByUserId` → `User`, brand indexes, WhatsApp `updatedAt` index, trust status backfill SQL |
| `20260525150000_school_participation_indexes` | `School` indexes for province/district lookups |

Earlier migrations (20260501 init through commercial governance) cover schools, brands, campaigns, submissions, commercial workflow, etc.

---

## Feature → schema checklist

| Feature | Schema support |
|---------|----------------|
| Founder brand (R2kay) | `founderExempt`, `homeSortOrder`, `verificationStatus`, `verificationCode` |
| Magome founding pilot | `founderExempt`, 6-month `subscriptionEndDate`, `REVIEW_REQUIRED` on expiry |
| Public verify + QR + PDF | `verificationCode`, `verificationStatus`, `verifiedAt` |
| `/brand/[slug]` profile | `slug`, `publicProfileEnabled`, `status` |
| Web submit (province/district/school) | `School.province`, `School.district`, `School.status` |
| Web submit (brand select) | `Brand`, `Campaign` (no new column) |
| Brand code file upload | `CodeBatch`, `Code`, `Brand.codePrefix` (existing tables) |
| WhatsApp numbered menus | `WhatsAppConversation` |
| School registration | `School` + `User` (SCHOOL_ADMIN) |
| Skip activation fee (founder) | `Brand.founderExempt` |

---

## Scripts (post-migrate)

| Script | Purpose |
|--------|---------|
| `npm run brand:backfill-verification` | Codes + trust status for existing brands |
| `npm run railway:bootstrap-founder` | R2kay Liquid Freeze founder row |
| `npm run railway:bootstrap-magome` | Magome Bakery & Eatery founding partner (6-month waiver) |
| `npm run brand:set-home-order` | Reorder homepage brands |

---

## Public API (reads schema, no extra tables)

| Route | Models read |
|-------|-------------|
| `GET /participation/school-options` | `School` |
| `GET /participation/brands` | `Brand`, `Campaign` |
| `POST /participation/submit` | `School`, `Campaign`, `Code`, `Submission` |
| `POST /campaigns/:id/code-batches/import` | `CodeBatch`, `Code`, `Campaign`, `Brand` |
| `GET /platform/verify/:code` | `Brand` |
| `GET /platform/verify/:code/certificate` | `Brand` |
