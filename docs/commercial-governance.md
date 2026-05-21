# Commercial governance

Brand2School enterprise onboarding combines **legal agreements**, **campaign payments**, and **product code management** into one workflow. No campaign goes live without all gates passing.

**Positioning:** *A measurable education infrastructure and ESG intelligence platform* — not a donation platform.

**Roadmap:** See `docs/commercial-roadmap.md` for ROI dashboard, contribution allocation, impact certificates, and renewal engine.

## Onboarding flow

1. **Brand registers** (`POST /api/v1/commercial/brand-applications`) — company details, VAT, provinces, products, optional campaign draft. Status: `PENDING_REVIEW`.
2. **Internal verification** (admin) — move to `UNDER_APPROVAL`, verify CIPC/ESG/fraud risk.
3. **Agreement** — admin generates PDF (`POST .../brands/:id/agreements/generate`). Brand signs offline and uploads signed PDF (`POST /api/v1/commercial/brand/agreements/:id/upload-signed`). Admin approves (`POST .../agreements/:id/approve`).
4. **Payment** — admin issues **platform access fee** invoice (EFT). Finance verifies EFT (`POST .../campaigns/:id/verify-payment`). Optional **transformation contribution pool** is invoiced separately when the brand commits — not required for Phase 1 launch.
5. **Codes** — CSV import or batch generate on campaign; prefix must match `brand.codePrefix`. Admin approves code batch (`POST .../approve-codes`).
6. **Rules** — configure geo scope and budget on campaign (sets `rulesConfiguredAt`).
7. **Launch** — admin `approve-launch` sets `isActive`, `commercialStatus: LIVE`.

Public UI: `/for-brands#register`. Brand portal: `/brand/dashboard/commercial` (download agreement PDF, upload signed copy). Admin UI: `/dashboard/commercial` and commercial badges on `/dashboard/campaigns`.

## Recommended contract terms (all packages)

1. Signed participation agreement  
2. POPIA compliance acceptance (captured at brand application)  
3. Campaign rules approval (geo scope & territory)  
4. Verified platform access fee payment (contribution pool optional at launch)  
5. Approved code upload or generation  
6. Brand verification review  

## Activation gate

`assertCampaignCanGoLive` requires:

- Brand not suspended / past review
- Approved participation agreement
- Verified platform access fee payment (mandatory)
- Admin-approved codes (count > 0)
- Eligibility rules configured
- Admin launch approval

Participation verification also calls `getCampaignCommercialBlockReason` so inactive commercial state cannot accept submissions.

## Code prefix system

Every brand has `codePrefix` (e.g. `COKE`, `MTN`). Imports reject codes that do not match. Structured codes use `BRAND-CAMPAIGN-BATCH-TOKEN-CHK`; legacy codes must start with `PREFIX-`.

## Two value streams (ZAR)

See `docs/territorial-impact-packages.md`.

**A. Platform access fee (mandatory)** — Brand2School revenue for technology, verification, ESG intelligence, and campaign operations.

| Package | Scope | Default platform invoice (min) |
|---------|-------|-------------------------------|
| School Transformation | `SCHOOL_CLUSTER` | 15,000 |
| District Transformation | `DISTRICT` | 75,000 |
| Provincial Impact | `PROVINCIAL` | 250,000 |
| National Transformation | `NATIONAL` | 1,500,000 |
| Government / Institutional | Custom | Admin-set |

**B. Transformation contribution pool (optional at launch)** — separate `CONTRIBUTION_POOL` invoice when brand commits infrastructure funding. SaaS tiers remain `SAAS_SUBSCRIPTION`.

Optional **add-on services** (province activation, API, WhatsApp, media, etc.) and the **50/30/10/10 payment schedule** are defined in `territorialPackages.ts` and surfaced on `/for-brands#add-ons` and `/for-brands#payment`.

## Commercial workflow stages

Unified stages for sales, ops, and compliance (`GET /api/v1/admin/commercial/workflow`):

| Stage | Meaning |
|-------|---------|
| `PENDING` | Brand application awaiting review |
| `UNDER_REVIEW` | Internal verification in progress |
| `AWAITING_AGREEMENT` | Participation agreement not yet approved |
| `AWAITING_PAYMENT` | Platform access fee not verified |
| `AWAITING_CODES` | Codes or eligibility rules pending |
| `READY_FOR_APPROVAL` | All gates met; launch approval pending |
| `ACTIVE` | Campaign live |
| `SUSPENDED` | Brand or campaign paused |
| `EXPIRED` | Past end date + grace period |

**Enterprise activation chain:** registration → POPIA → agreement → brand review → payment → rules → codes → activated.

## Campaign expiry governance

Each campaign has `startsAt`, `endsAt`, `gracePeriodDays` (default 14), `gracePeriodEndsAt`, `renewalStatus`, and `autoSuspendOnExpiry` (default true).

- After `endsAt`, a grace window allows wind-down.
- After `gracePeriodEndsAt`, expired campaigns auto-suspend, set `commercialStatus: EXPIRED`, and stop accepting codes.
- Public campaign listings exclude expired campaigns.

## Infrastructure commitment tracking

Campaigns store `impactCommitment` (boardroom targets) and `impactDelivered` (computed from valid submissions and school phases). Admin can set commitment via `PATCH .../campaigns/:id/impact-commitment`. Delivered metrics refresh on launch approval.

## Migration

```bash
cd apps/api && npx prisma migrate deploy
```

Migrations:

- `20260521160000_commercial_governance`
- `20260521180000_commercial_workflow_expiry`

## Future

- DocuSign / Adobe Sign for agreements
- PayFast / Ozow / Stripe for online payments and recurring SaaS
