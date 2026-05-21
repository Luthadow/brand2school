# Operational, legal, financial & scaling risk governance

Brand2School has strong **visible** product foundations: campaigns, territorial packages, enterprise onboarding, ESG positioning, code verification, and commercial workflow gates.

The dominant risks now shift to **operational, legal, financial, and scaling** exposure. This document is the board-level checklist: what is already built, what must stay non-negotiable, and what to build next.

**North star:** Protect **trust, governance, and transparency** more than rapid growth. When stakeholders believe *“Brand2School numbers are real,”* the platform becomes strategically powerful.

Related: [commercial-governance.md](commercial-governance.md) · [ecosystem-lifecycle.md](ecosystem-lifecycle.md) · [enterprise-email-lifecycle.md](enterprise-email-lifecycle.md) · [commercial-roadmap.md](commercial-roadmap.md)

---

## Risk matrix (summary)

| # | Risk area | Platform stance | Build status |
|---|-----------|-----------------|--------------|
| 1 | Cash flow / account separation | Two commercial streams in product; **bank accounts are operational** | Partial — ledger schema; **separate bank accounts required** |
| 2 | Trust & reputation | Verification, audit, fraud queue, governance emails | **Strong foundation** — independent audit partners planned |
| 3 | Government / political interference | Rules-driven eligibility, audit logs, public positioning | Partial — **policy + transparency** needed |
| 4 | School validation | Approvals workflow, portal sync, admin infra verification | Partial — district/geo/photo evidence planned |
| 5 | Infrastructure delivery | **Governance layer only** — not a construction company | **Aligned in agreements & copy** |
| 6 | Fraud & code abuse | Fraud flags, moderation, **auto-hold on velocity `high`** | **Live** — school freeze + LIVE campaign pause (audit `FRAUD_VELOCITY_*`) |
| 7 | Overpromising | “Enabling ecosystem” positioning, not “transform all schools” | **Aligned in marketing** — enforce in all sales |
| 8 | Data / POPIA | POPIA at application, audit logs, role-based access | Partial — retention & DPO policies planned |
| 9 | Platform dependency | WhatsApp + web + API; Railway deploy docs | Partial — **fallback channels & exports** planned |
| 10 | Enterprise support | Lifecycle emails, procurement pack, commercial UI | Partial — customer success / SLA ops planned |
| 11 | School expectations | Phase roadmaps, needs engine, portal notifications | **Live** — strengthen school education content |
| 12 | Human ops scalability | Admin workflow, automation hooks, notification worker | Partial — continuous automation mandate |
| 13 | Legal liability | Participation agreement sections | Partial — **explicit non-guarantee of delivery** — legal review |
| 14 | Public transparency | Movement, partners, rankings, live stats, **`/impact` dashboard** | **Live** — aggregated KPIs, fraud governance, infra & provinces |
| 15 | Maintenance & sustainability | Needs engine `MAINTENANCE_REQUIRED`, renewal governance | **Live in model** — field verification planned |
| 16 | Infrastructure intelligence data | National scores, executive analytics, provincial metrics | **Emerging asset** — protect & govern data use |
| 17 | Controlled growth | Provincial-first rollout in commercial phases | **Strategy** — enforce in sales & ops |

---

## 1. Cash flow management

**Risk:** Signing large brands while **hosting, staff, verification, and reporting** burn cash continuously. Spending infrastructure money on operations destroys trust and delivery.

**Product model (live):**

- **A — Platform & ESG fee** → Brand2School operational revenue (mandatory).
- **B — Transformation contribution pool** → optional, separate invoice, school-facing ledger (`FundingContribution`, `fundingBalanceZar`).

**Operational requirement (not automatic in software):**

| Account | Purpose |
|---------|---------|
| Operational | Salaries, hosting, admin, support |
| Transformation pool | School infrastructure only |
| Reserve | Emergencies & scaling |

**Rule:** Never spend long-term infrastructure money on operational expenses. Finance must reconcile platform invoices vs contribution pool invoices separately (see `campaignInvoice` types: `SETUP_FEE` vs contribution).

---

## 2. Trust & reputation

**Risk:** One scandal (fake schools, fake impact, fund misuse) damages the entire platform.

**Live controls:**

- School / brand **approval workflows** (SUPER_ADMIN).
- **Fraud flag** queue + bulk resolve (admin moderation).
- **Audit logs** + export jobs.
- **Activation gates** — no live campaign without agreement + payment + codes + rules.
- **Governance milestone emails** to sponsors on verified infrastructure progress.
- Pre-activation **registration guide** + procurement pack.

**Recommended:**

- Independent **verification & audit partnerships** (annual sample audits, published summaries).
- Published **fraud-clean rate** on executive analytics (roadmap: [commercial-roadmap.md](commercial-roadmap.md)).

---

## 3. Government & political interference

**Risk:** Money, schools, and public visibility attract favoritism, supplier capture, and pressure to prioritize connected schools.

**Platform defences:**

- **Geo eligibility rules** on campaigns (`allowedProvinces`, `allowedDistricts`, `allowedSchoolIds`) — participation is rules-driven, not relationship-driven.
- **Audit trail** on admin actions (approvals, infrastructure edits, commercial workflow).
- Transparent **workflow stages** on admin commercial board.

**Policy (document, not code):**

- Decline off-platform “special cases” without audit record.
- Procurement via published packages (`territorialPackages.ts` single source of truth).
- No manual campaign go-live without passing `assertCampaignCanGoLive`.

---

## 4. School validation

**Risk:** Fake schools or unverified needs exploit transformation pools.

**Live:**

- School registration + **status progression** (PENDING → VERIFIED → APPROVED → ACTIVE).
- Principal-linked accounts; WhatsApp binding.
- **Admin infrastructure verification** (`PATCH /api/v1/admin/schools/:id/infrastructure`).
- Infrastructure **phase history** + verified item thresholds.

**Gaps to close:**

| Question | Target control |
|----------|----------------|
| Is the school real? | **EMIS packet workflow** — principal upload + SUPER_ADMIN approve (`/school/dashboard/documents`) |
| Who approves needs? | District or admin sign-off workflow |
| Who confirms completion? | Admin verify + photo evidence upload |
| Geo truth? | GPS / address validation on registration |

---

## 5. Infrastructure delivery

**Risk:** Brand2School becomes a construction company — operational overload and liability.

**Position (enforce everywhere):**

Brand2School = **governance & intelligence layer** (track, verify, measure, audit, report).

**Delivery** = contractors, suppliers, NGOs, engineering partners — under brand or school-led programmes, not B2S construction.

Agreement template (`agreementPdf.ts`) and procurement pack state two value streams; strengthen legal review for **non-delivery** clauses (see §13).

---

## 6. Fraud & code abuse

**Risk:** At scale: code sharing, bots, bulk fake entries, recycled packaging.

**Live:**

- Code prefix enforcement, single-use codes, status machine (`USED`, `DUPLICATE`, `FLAGGED`, etc.).
- **Fraud flags** linked to submissions; admin moderation UI.
- Campaign **budget caps** and commercial live checks.
- Rate limits on registration / participation routes.

**Roadmap:**

- AI / rules engine: abnormal submission velocity, device fingerprints, province anomalies.
- Executive metric: verified interaction rate vs flagged rate.

---

## 7. Overpromising

**Risk:** “We will transform all schools” → political and social backlash.

**Messaging standard:**

- *Enabling transformation ecosystem* — territorial, phased, measurable.
- Schools **never exit** — they progress through maturity + maintenance (see [ecosystem-lifecycle.md](ecosystem-lifecycle.md)).
- Optional contribution pools — brands control amount and phases.

Ban in sales collateral: absolute national transformation guarantees without defined territory and term.

---

## 8. Data ownership & POPIA

**Risk:** School, consumer, geographic, and brand data become valuable — misuse destroys trust.

**Live:**

- POPIA acceptance on brand application (gate).
- POPIA summary in procurement pack.
- **Role-based access** (SUPER_ADMIN, ADMIN_STAFF, SCHOOL_ADMIN, BRAND_ADMIN).
- **Audit logs** on sensitive actions.
- Aggregated analytics for ESG (no sale of learner PII in product copy).

**Planned:**

- Data retention policy, consent records, DPO contact.
- Export / erasure procedures for POPIA requests.
- Data processing agreements for enterprise brands.

---

## 9. Platform dependency

**Risk:** Over-reliance on WhatsApp, one host, one payment rail.

**Live:**

- Web participation path + API verification.
- Deploy documentation ([deploy/railway-cloudflare.md](deploy/railway-cloudflare.md)).
- ESG PDF + audit export.

**Planned:**

- SMS / USSD fallback for verification (where viable).
- Multi-region backups; database export runbooks.
- Secondary payment verification workflow documentation.

---

## 10. Enterprise support

**Risk:** Large brands expect SLAs, account management, fast onboarding.

**Live:**

- Enterprise email lifecycle (registration → verification → agreement → payment → launch → renewal).
- Procurement pack download.
- `brands@` Reply-To on transactional mail.

**Planned:**

- Named customer success for Provincial+ packages.
- Response-time SLAs in enterprise agreements.
- Quarterly ESG review calls (calendar integration — roadmap).

---

## 11. School expectation management

**Risk:** Schools expect instant infrastructure or direct cash.

**Live:**

- School portal: **development phases**, needs engine, funding ledger visibility.
- Phase transition notifications in portal.
- Governance emails to principals on milestones (when configured).

**Strengthen:**

- Onboarding copy: campaigns are **territory + time-bound**; infrastructure is phased.
- Public FAQ for schools (not only brands).

---

## 12. Scalability of human operations

**Risk:** Manual approvals, verification, and support do not scale.

**Live automation:**

- Commercial workflow board + renewal governance job.
- Notification worker + ESG report worker.
- Bulk approvals (schools/brands).
- Infrastructure recalculate + verify from admin UI.

**Mandate:** For every repeated admin action, ask: *“How do we automate this next quarter?”*

---

## 13. Legal liability

**Risk:** Implied guarantee of construction, suppliers, or government approvals.

**Agreement must state Brand2School:**

- Facilitates, verifies, tracks, reports.
- Does **not** guarantee construction delivery, supplier timelines, government approvals, or completion dates unless in a separate written SOW with a delivery partner.

**Action:** Legal review of `agreementPdf.ts` + website terms; align with procurement pack FAQ.

---

## 14. Public dashboard transparency

**Risk:** Hidden metrics erode trust; **visible measurable systems** build credibility.

**Live (partial):**

- Public movement / live stats / partner pages.
- Campaign listings with scope badges.

**High priority build:**

- Public dashboard: active schools, phase progress (aggregated), verified campaigns, impact metrics, fraud-clean rate.
- QR verification on impact certificates (roadmap).

---

## 15. Maintenance & sustainability

**Risk:** Install-only projects fail when assets break.

**Live:**

- `schoolNeedsEngine`: `MAINTENANCE_REQUIRED`, `NEEDS_UPGRADE`, lifecycle statuses.
- Default **3-year maintenance cycle** on verified items.
- Governance email on maintenance due.
- Annual licence renewal (schools stay in ecosystem).

**Field ops:** Maintenance funding and contractor refresh cycles remain partner/school programmes — B2S tracks and reports.

---

## 16. Infrastructure intelligence data (long-term asset)

**Risk / opportunity:** The most valuable asset may be **national infrastructure intelligence**, not campaign fees alone.

**Emerging in platform:**

- Provincial heatmaps, executive analytics, national school scores.
- Infrastructure phase progression, funnel metrics.
- Territorial package + industry phase alignment data.

**Governance:**

- Aggregate public; identifiable school data restricted.
- Research / government licensing as separate commercial line (with ethics board).

---

## 17. Don’t scale too fast

**Strategy:**

- Win **one province** (or two): prove transformation, case studies, governance.
- Refine verification, fraud, and delivery partnerships before aggressive national sales.
- Commercial rollout phases in `territorialPackages.ts` (optional pool minimums only after trust exists).

---

## Implementation priorities (recommended order)

| Priority | Initiative | Ties to risk |
|----------|------------|--------------|
| P0 | Separate bank accounts + finance runbook | §1 |
| P0 | Legal review: non-guarantee + liability caps | §13 |
| ~~P1~~ | Public impact transparency dashboard (`GET /api/v1/platform/impact`, `/impact`) | §14, §2 — **shipped** |
| ~~P1~~ | School verification playbook (EMIS + evidence) — see `docs/school-verification-workflow.md` | §4 — **shipped** |
| ~~P2~~ | Fraud velocity auto-hold (school freeze + campaign pause) | §6 — **shipped** (`fraudVelocityGovernance.ts`) |
| P2 | Independent audit partner MOU | §2 |
| P3 | Data retention / POPIA register | §8 |
| P3 | Customer success SLAs for enterprise | §10 |

---

## What the codebase already enforces

Use these as **non-negotiable system behaviours** when scaling ops:

- `assertCampaignCanGoLive` — commercial activation gates.
- `getCampaignCommercialBlockReason` — no submissions on inactive commercial state.
- `schoolMatchesCampaignGeo` — territorial rules, not ad hoc inclusion.
- `processInfrastructureGovernanceAlerts` — sponsor + school notice on verified milestones.
- `processAnnualLicenseRenewalGovernance` — renewal / lapse without silent drift.
- `INFRASTRUCTURE_MILESTONE_NOTIFIED` audit dedupe — no spam, auditable comms.
- Two-stream pricing in `territorialPackages.ts` — platform fee vs contribution pool.

---

## Review cadence

- **Monthly:** fraud queue, cash reconciliation, live campaign audit sample.
- **Quarterly:** agreement & POPIA review, public metrics publication, provincial growth decision.
- **Annually:** independent infrastructure audit sample, enterprise partner satisfaction, data governance review.
