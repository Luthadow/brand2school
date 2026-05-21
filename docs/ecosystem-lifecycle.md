# Ecosystem lifecycle governance

Brand2School evolves from **campaign thinking** to **ecosystem thinking**: schools never leave; brands renew annually.

## Problem 1 — Brands pay once

**Wrong:** One-time provincial payment + campaign runs forever → platform costs exceed revenue.

**Right:** **Annual transformation licenses** — renewable territorial partnerships (12-month default).

Example: *MTN Gauteng Digital Access Partnership* — includes dashboards, verification, ESG reporting, public visibility. At renewal: continue, evolve, expand, or close.

**Never sell:** permanent provincial ownership.  
**Sell:** renewable transformation partnership rights.

Enterprise budgets (ESG, marketing, innovation) are **annual** — licenses align with procurement cycles.

### Technical

- `Campaign.licenseTermMonths` (default 12)
- `Campaign.partnershipLabel`, `Campaign.sponsorshipTrack`
- `renewalStatus`: `NONE` → `PENDING_RENEWAL` (60 days before end) → `RENEWED` | `LAPSED`
- `processAnnualLicenseRenewalGovernance()` — run on admin commercial workflow load
- `GET /api/v1/commercial/ecosystem` — public lifecycle model

## Problem 2 — School “completes” technology

**Wrong:** School exits campaign when digital phase is done.

**Right:** School **graduates** to next maturity level or enters **maintenance / upgrade** pipeline.

Schools are **dynamic infrastructure entities** — infrastructure ages, enrollment grows, technology evolves.

### Five maturity levels (aligned with `DEVELOPMENT_PHASES`)

| Level | Focus |
|-------|--------|
| 1 | Critical infrastructure — toilets, water, fencing, electricity |
| 2 | Learning infrastructure — desks, classrooms, libraries, nutrition |
| 3 | Digital enablement — internet, devices, smart classrooms |
| 4 | Innovation readiness — STEM, coding, robotics, AI |
| 5 | Sustainability & excellence — solar, monitoring, environmental |

### Phase sponsorship tracks

Brands sponsor **tracks**, not one-off items — e.g. *Digital Transformation Ecosystem* (internet, devices, maintenance, STEM, coding).

Multiple sponsors per school over time (water + power + digital + nutrition) — collaborative national transformation.

### Maintenance cycles

Verified infrastructure (`verifiedAt` + 3 years) → status **Maintenance Required** — school re-enters upgrade eligibility.

## School Needs Engine

`buildSchoolNeedsEngine()` — per-category intelligence:

| Status | Meaning |
|--------|---------|
| Complete | Verified done — school stays in network |
| In Progress / Active | Current phase work |
| Maintenance Required | Refresh cycle due |
| Needs Upgrade | Phase advanced — next-gen eligible |
| Pending | Not yet unlocked |

Exposed on school portal: `needsEngine.rows` + legacy `needs` list for UI.

## Sustainable revenue model

| Payer | Pays for |
|-------|----------|
| Brands (annual) | Platform license, visibility, ESG intelligence, governance |
| Brands (optional) | Transformation contribution pools |
| Consumers (codes) | Micro-contributions per verified submission |

**Aim:** continuously improving educational infrastructure systems — not “finished schools.”

## Code reference

- `apps/api/src/modules/commercial/transformationLicense.ts`
- `apps/api/src/modules/commercial/campaignRenewal.ts`
- `apps/api/src/modules/schools/schoolNeedsEngine.ts`
- `apps/api/src/modules/schools/schoolDevelopment.ts`
- `apps/api/src/modules/schools/infrastructureProgress.ts`
