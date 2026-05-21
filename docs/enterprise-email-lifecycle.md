# Enterprise brand email lifecycle

Brand2School uses **pre-activation education** and **post-submission workflow mail** so procurement, legal, and ESG teams receive formal documentation before sales calls.

**Sender:** `noreply@brand2school.co.za` (`MAIL_FROM`)  
**Reply-To:** `brands@brand2school.co.za` (lifecycle + registration guide)  
**Templates:** `apps/api/src/lib/emails/` · **Dispatch:** `apps/api/src/lib/mail.ts` · **Hooks:** `apps/api/src/modules/commercial/routes.ts`, `campaignRenewal.ts`

Pricing and commercial copy pull from **`territorialPackages.ts`** (single source of truth with API, web, admin, PDFs).

---

## Lifecycle matrix

| Stage | Email | Trigger | Status |
|-------|--------|---------|--------|
| Registration submitted | Registration & participation guide | `POST /api/v1/commercial/brand-applications` | **Live** |
| Verification approved | Brand verification successful | Admin `PATCH .../brands/:id/review` → `UNDER_APPROVAL` | **Live** |
| Agreement required | Participation agreement — signature required | Admin `POST .../agreements/generate` | **Live** |
| Payment pending | Platform access fee invoice | Admin `POST .../invoices/setup-fee` | **Live** |
| Payment verified | Payment confirmation | Admin `POST .../verify-payment` (verified) | **Live** |
| Campaign activated | Campaign activated (go-live) | Admin `POST .../approve-launch` | **Live** |
| Licence nearing expiry | Annual renewal notice (60 days) | `processAnnualLicenseRenewalGovernance()` | **Live** |
| Brand portal user active | Brand welcome (dashboard access) | Admin brand status → `ACTIVE` | **Live** (distinct from go-live) |
| Monthly ESG | Scheduled impact report + PDF | ESG schedule worker | **Live** |
| Infrastructure phase verified | Phase milestone (brands in territory + school) | School portal sync when `phaseHistory` advances | **Live** |
| Category verified | Infrastructure category verified | Same sync (skipped on first baseline seed) | **Live** |
| Maintenance cycle due | Governance maintenance alert | `schoolNeedsEngine` → `MAINTENANCE_REQUIRED` | **Live** |
| Admin infrastructure edit | Same governance alerts | `PATCH /api/v1/admin/schools/:id/infrastructure` | **Live** |
| Suspension / compliance | Brand/commercial governance alert | — | Planned |

---

## Pre-activation vs post-activation

| Purpose | When | Tone |
|---------|------|------|
| **Pre-activation guide** | Immediately on application | Educate: positioning, governance, pricing, phases, activation gates |
| **Workflow mail** | After admin/commercial actions | Formal enterprise steps: verify → agree → pay → launch → renew |
| **Post-activation welcome** | Brand user `ACTIVE` | Portal access and analytics |

---

## Planned (roadmap)

### Procurement pack download — **Live**

`GET /api/v1/commercial/procurement-pack` · optional `?package=PROVINCIAL_IMPACT`

ZIP bundle (generated from `territorialPackages.ts` + PDF builders):

- `01-Company-Profile.pdf`
- `02-Commercial-Packages-and-Pricing.pdf`
- `03-Participation-Agreement-Template.pdf`
- `04-ESG-Governance-Framework.pdf`
- `05-POPIA-Data-Protection-Summary.pdf`
- `06-Enterprise-FAQ.pdf`

**UI:** `/for-brands` (hero + pricing) and brand commercial dashboard · proxy `/api/commercial/procurement-pack`

### Lead scoring

Score applications on company size, territory, budget range, phases, engagement — prioritize enterprise leads and AM assignment.

### Book consultation

“Schedule strategy session” → Calendly / Google Calendar / internal scheduling.

---

## Local dev

Without SMTP, all mail logs as `[mail:dev]` with full text. See **`docs/email-communication.md`**.
