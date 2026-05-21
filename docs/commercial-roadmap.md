# Commercial roadmap — post two-stream model

Brand2School is positioned as **measurable national educational infrastructure transformation** — not school donations.

**Operational & scaling risks** (cash flow, trust, political interference, legal liability, controlled growth): see **[operational-risk-governance.md](operational-risk-governance.md)**.

## Current commercial foundation (live)

| Revenue stream | Purpose | Launch status |
|----------------|---------|---------------|
| **Platform & ESG infrastructure fee** | Brand2School operational revenue (tech, governance, reporting, verification) | Mandatory — gates activation |
| **Transformation contribution pool** | On-the-ground infrastructure (water, digital, power, nutrition) | Optional at launch — separate invoice |
| **Code micro-contributions** | Participation-driven pool growth (`contributionPerCodeZar` on campaigns) | Schema ready — configure per campaign |

**Psychology:** “Platform & ESG infrastructure fee” (enterprise) — not “administration fee” or “donation.”

**Phase sponsorship:** Brands own categories (e.g. MTN Digital Access, Coca-Cola Water) — charity → strategic infrastructure sponsorship.

**Long-term:** Multiple sponsors per school by phase (water / power / digital / nutrition) — collaborative national transformation.

Catalog & copy: `territorialPackages.ts`, `/for-brands#commercial-model`, `GET /api/v1/commercial/packages`.

---

## Ecosystem lifecycle (implemented)

Annual transformation licenses, school maturity progression, needs engine, maintenance cycles — see **`docs/ecosystem-lifecycle.md`**.

---

## Phase 1 — Now (adoption)

- [x] Two value streams (platform vs contribution pool)
- [x] Optional contribution pool at application & launch
- [x] Committed vs delivered impact (admin + brand commercial pages)
- [x] Commercial workflow stages & expiry governance
- [ ] Configure `contributionPerCodeZar` in admin campaign UI (schema exists)
- [ ] Brand-facing “ESG narrative” line: verified interactions, not rand donated only

---

## Phase 2 — ESG ROI intelligence (priority 1)

**ROI dashboard for brands** — extend brand analytics / portal:

| Metric | Why |
|--------|-----|
| Participation growth | Engagement |
| Province / territory reach | Scale |
| Campaign engagement rate | ROI |
| Verified consumer interactions | Visibility & marketable ESG line |
| Infrastructure milestones | ESG proof |
| Public trust / fraud-clean rate | Reputation |

**Outcome copy brands can use:**  
*“We enabled X million verified educational interactions across South Africa”* — measurable, reportable, ESG-friendly.

**Build on:** `getBrandAnalytics`, `impactMetrics`, live platform stats, provincial heatmaps.

---

## Phase 2 — Contribution allocation engine (priority 2)

Brands choose how optional pools deploy, e.g.:

- 40% sanitation · 30% digital · 20% electricity · 10% nutrition

**Schema direction:** `impactCommitment.allocation: Record<phaseId, percent>` on `Campaign` (JSON), validated to 100%.  
**UI:** Brand portal + admin approval before funds move to phase budgets.

---

## Phase 3 — Public impact certificates (priority 3)

Downloadable, verifiable proof for boards and annual reports:

- *Verified Provincial Transformation Partner — 2026*
- QR → public verification URL
- Campaign metrics snapshot (territory, phases, verified interactions)

**Build on:** partner profiles, public rankings, campaign slug pages, PDF/ESG report pipeline.

---

## Phase 3 — Renewal & retention engine (priority 4)

Recurring enterprise revenue:

- [x] Campaign renewal governance (`renewalStatus`: `PENDING_RENEWAL`, `RENEWED`, `LAPSED`)
- [x] **60-day renewal notice email** (`campaignRenewal.ts` + `sendBrandRenewalNoticeEmail`)
- [ ] Renewal invoice + payment confirmation (reuse setup-fee mail pattern)
- [ ] Infrastructure continuity programmes (grace period → renewal offer)

**Build on:** `campaignExpiry.ts`, `docs/enterprise-email-lifecycle.md`, ESG schedule.

---

## Phase 3 — Enterprise procurement & growth (priority 5)

- [x] **Procurement pack** download (packages, agreement, ESG, POPIA, FAQ) — `GET /api/v1/commercial/procurement-pack`
- [ ] **Lead scoring** on brand applications (territory, budget, phases, engagement)
- [ ] **Book consultation** (Calendly / calendar integration)

---

## Commercial rollout (contribution minimums)

| Phase | Platform fee | Impact pool |
|-------|--------------|-------------|
| **1 — Now** | Mandatory | Optional |
| **2 — Growth** | Mandatory | Recommended targets (e.g. Provincial R100k+) |
| **3 — Mature** | Mandatory | Contractual minimums (e.g. National R500k+) |

Only introduce pool minimums after trust, dashboards, public visibility, and case studies exist.

---

## Investor / enterprise narrative

Hybrid of:

- ESG SaaS  
- Campaign infrastructure  
- Impact intelligence  
- Transformation analytics  
- Public accountability  

**Not:** school donation platform.
