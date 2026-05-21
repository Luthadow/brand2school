# Territorial impact rights & commercial structure

Brand2School sells **education transformation territories** and **measurable ESG infrastructure intelligence** — not submission caps or charity optics.

**Premium positioning:** *A measurable education infrastructure and ESG intelligence platform* — **not** a donation platform.

## Two separate value streams (critical)

| Stream | Mandatory? | What it is |
|--------|------------|------------|
| **A. Platform & ESG infrastructure fee** | **Yes** | Technology, verification, dashboards, analytics, ESG reporting, fraud prevention, campaign administration, public visibility, compliance |
| **B. Transformation contribution pool** | **No** (optional at launch) | Campaign-based funding for sanitation, water, fencing, electricity, digital infrastructure — brand chooses amount, phases, schools, territory |

**Never pitch:** “Pay us AND fund everything.”  
**Do pitch:** “Brand2School enables measurable educational transformation campaigns aligned with your ESG objectives.”

## Platform access packages (mandatory fee)

| Package | Platform access (ZAR) | Recommended impact pool (optional) |
|---------|----------------------|-----------------------------------|
| School Transformation | 15,000 – 35,000 | R50,000+ |
| District Transformation | 75,000 – 250,000 | R500,000 |
| Provincial Impact | 250,000 – 1,000,000+ | R500,000+ |
| National Transformation | 1,500,000 – 10,000,000+ | R2,000,000+ |
| Government / Institutional | Custom | PPP / grant structured |

Default **platform access invoice** uses the package **minimum** when a campaign is created. Contribution pools are separate invoices (`CONTRIBUTION_POOL`) and do **not** block launch in Phase 1.

## Phase sponsorship

Brands sponsor **named phases** (e.g. *MTN Digital Access Phase*, *Coca-Cola Water Infrastructure Phase*) — category ownership, visibility, and measurable milestones.

| Brand type | Likely focus |
|------------|--------------|
| Telecoms | Digital access |
| Banks | Libraries |
| Retailers | Nutrition |
| Beverage | Water |
| Energy | Electricity / solar |

## Participation-driven funding

Verified product codes can allocate **R0.10 – R1.00** (configurable) per submission into the transformation pool — consumers help scale infrastructure alongside brand campaigns.

## Commercial rollout

| Phase | Platform fee | Impact pool |
|-------|--------------|-------------|
| **1 — Now** | Mandatory | Optional — brand controls focus |
| **2 — Growth** | Mandatory | Recommended commitment targets |
| **3 — Mature** | Mandatory | Contractual minimums (e.g. Provincial R100k+, National R500k+) after trust & case studies |

## API

- `GET /api/v1/commercial/packages` — catalog including `valueStreams`, `rolloutPhases`, `codeContribution`
- Brand applications: `contributionPoolZar` optional; `popiaComplianceAccepted` required

## Code reference

- `apps/api/src/modules/commercial/territorialPackages.ts` (canonical)
- `apps/web/lib/territorialPackages.ts` (marketing copy)
