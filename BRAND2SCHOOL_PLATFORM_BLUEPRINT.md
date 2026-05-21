# Brand2School - Full Platform Blueprint

Developed by Nkanyezi Tech Solutions

Founder: Raphael Luthando Sogoni

Tagline: "Where brands meet real school needs."

## 1) Vision and Mission

Brand2School is a learner-powered, multi-brand participation platform that converts everyday consumer activity into measurable support for schools across South Africa.

It connects:

- Everyday activity
- Learner participation
- School progress
- Verified support delivery

Core mission:

- Connect brands to verified school needs
- Increase learner participation
- Create measurable social impact
- Enable community-driven school support
- Provide brands with auditable engagement systems
- Create scalable school support mechanisms

## 2) Stakeholders and Outcomes

Primary stakeholders:

- Learners: submit participation codes and contribute points
- Schools: onboard, track progress, and receive verified support
- Brands: run campaigns and monitor measurable impact
- Judges: validate entries and score impact-related competitions
- Administrators: govern, moderate, and audit operations
- Communities: drive participation through everyday purchases

Primary outcomes:

- Transparent school support pipeline
- Fraud-aware campaign participation
- Real-time dashboards for all key actors
- Auditable engagement and social impact reports

## 3) Product Scope (MVP -> Scale)

### MVP (Pilot, first 3-6 months)

- School onboarding and approval flow
- Learner registration and unique learner codes
- Brand onboarding and campaign setup
- Code upload (CSV/XLSX) and validation engine
- WhatsApp participation ingestion
- School and learner leaderboards
- Basic fraud checks and moderation queue
- Admin dashboard and audit logs

### Growth (6-12 months)

- Provincial expansion
- Advanced brand analytics and cohort views
- Improved fraud detection and anomaly scoring
- Judge workflows for campaigns with scored entries
- Milestone-to-support delivery tracking

### National (12-24 months)

- National rollouts across multiple brand categories
- Multi-campaign orchestration and optimization
- SLA-backed operational tooling and support desk
- Large-scale reporting for partners and regulators

## 4) High-Level Architecture

### Frontend

Suggested stack:

- Next.js (App Router)
- React + TypeScript
- TailwindCSS + component library

Apps/portals:

- Public website (awareness, onboarding, campaign visibility)
- Role-based web app (school, brand, judge, admin dashboards)

### Participation Channel

WhatsApp participation engine for:

- Code submissions
- Leaderboard checks
- Campaign interactions
- Learner notifications

Example input format:

`SUBMIT | Q4 | UBU-THA-045 | Q4-82912 | RUSTENBURG`

### Backend Services

Suggested stack:

- Node.js + Express/Fastify
- PostgreSQL (or SQL Server)
- Redis (cache, rate-limits, queues)
- JWT + refresh-token model

Core domains/services:

- Auth and RBAC
- Onboarding and approvals
- Campaign and code management
- Submission validation and scoring
- Fraud detection and moderation
- Leaderboards and analytics
- Needs verification and support delivery
- Audit and reporting

## 5) User Roles and Permissions

Roles:

- `SUPER_ADMIN`: full platform control
- `ADMIN_STAFF`: operations, moderation, approvals
- `SCHOOL_ADMIN`: manage school profile, learners, needs, dashboard
- `BRAND_ADMIN`: manage campaigns, code batches, insights
- `JUDGE`: evaluate assigned entries, finalize scores
- `LEARNER`: submit codes and view contribution history

Authorization model:

- Role-based access control with policy guards by domain and region
- Every privileged action writes an audit event

## 6) Core Workflows

### 6.1 School Registration Workflow

1. School registers and submits metadata/documents
2. Admin verifies school and location
3. Status progression:
   - `PENDING -> VERIFIED -> APPROVED -> ACTIVE`
4. Active schools can onboard learners and publish needs

### 6.2 Learner Registration Workflow

1. Learner created under active school
2. Optional guardian details captured
3. Unique learner code generated (example: `UBU-THA-045`)
4. Learner can submit campaign participation via WhatsApp

### 6.3 Brand and Campaign Workflow

1. Brand onboarding and admin approval
2. Campaign created (national/regional/category/competition)
3. Product/service code batches uploaded
4. Campaign activated with defined rules and timeline

### 6.4 Submission and Validation Workflow

On incoming submission:

1. Parse and normalize input
2. Validate learner existence
3. Validate school status (`ACTIVE`)
4. Validate campaign active window
5. Validate code existence and ownership
6. Validate code unused and not expired
7. Execute fraud checks
8. If pass:
   - mark code as `USED`
   - create valid submission record
   - update scoreboards
9. If suspicious:
   - mark submission as `FLAGGED_FOR_REVIEW`

### 6.5 Judge Workflow

State progression:

- `INVITED -> ACTIVE -> ASSIGNED -> SCORING -> FINALIZED`

Scoring categories:

- Relevance
- Creativity
- Impact
- Completeness
- Presentation

## 7) Data Model (Relational)

Suggested primary tables:

- `users` (identity, role, status)
- `schools` (profile, district, province, verification_status)
- `school_documents` (document metadata, review result)
- `learners` (school_id, grade, learner_code, status)
- `brands` (company details, status)
- `campaigns` (brand_id, type, timeline, region scope, status)
- `campaign_products` (optional product/service catalog)
- `code_batches` (campaign_id, source file, expiry)
- `codes` (batch_id, value, status, used_by_submission_id)
- `submissions` (learner_id, campaign_id, code_id, source, area, state)
- `fraud_flags` (submission_id, rule_id, severity, notes)
- `leaderboard_snapshots` (entity, period, rank, score)
- `school_needs` (category, cost_estimate, approval_status)
- `support_deliveries` (need_id, milestone, fulfillment_status, evidence)
- `judge_assignments` (judge_id, campaign_id, state)
- `judge_scores` (assignment_id, criterion, score, comments)
- `audit_logs` (actor, action, target, before/after, timestamp)

Key statuses:

- Codes: `UNUSED`, `USED`, `EXPIRED`, `INVALIDATED`
- Submissions: `VALID`, `REJECTED`, `FLAGGED_FOR_REVIEW`
- School needs: `PENDING`, `APPROVED`, `REJECTED`, `FUNDED`, `FULFILLED`

## 8) API Surface (Initial)

### Auth and Identity

- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/password-reset/request`
- `POST /auth/password-reset/confirm`

### School Domain

- `POST /schools/register`
- `GET /schools/:id/dashboard`
- `POST /schools/:id/needs`
- `GET /schools/:id/leaderboard`

### Learner Domain

- `POST /schools/:id/learners`
- `GET /learners/:id/dashboard`
- `GET /learners/:id/submissions`

### Brand and Campaign Domain

- `POST /brands/register`
- `POST /brands/:id/campaigns`
- `POST /campaigns/:id/code-batches/upload`
- `GET /campaigns/:id/analytics`

### Participation

- `POST /participation/submit` (for WhatsApp adapter to call)
- `GET /participation/status/:reference`

### Admin and Moderation

- `GET /admin/reviews/fraud`
- `POST /admin/reviews/fraud/:id/resolve`
- `GET /admin/reports/platform`

### Judge

- `GET /judge/assignments`
- `POST /judge/assignments/:id/scores`
- `POST /judge/assignments/:id/finalize`

## 9) Fraud and Trust Framework

Baseline rules:

- Duplicate code submission
- High-frequency submissions per learner/device
- Unusual geographic mismatch patterns
- Repeated template behavior in message origin
- Time-window burst anomalies

Fraud pipeline:

- Rule engine (sync checks during submission)
- Queue-based deeper analysis (async)
- Moderation console for adjudication
- Feedback loop to improve rules

## 10) Leaderboards and Scoring

Leaderboard dimensions:

- Learner
- School
- Province
- Campaign
- Brand

Scoring design:

- Points per valid submission (campaign configurable)
- Bonus multipliers (campaign windows, special products)
- Penalties or exclusion for disallowed activity (admin-controlled)

## 11) Support Delivery and Impact Tracking

Support delivery should be linked to:

- Verified participation thresholds
- Campaign milestones
- Approved school needs

Examples:

- Sanitation supplies
- Infrastructure repair
- Learning resources
- Sports development support

Impact evidence:

- Delivery confirmations
- Geo/time-stamped evidence
- Beneficiary counts
- Before/after outcome notes

## 12) Governance, Compliance, and Security

Controls:

- JWT auth + refresh token rotation
- Session expiry and revocation
- Brute-force and abuse protection
- Approval workflows for sensitive roles
- Audit trails for all privileged actions
- Account suspension and reactivation controls

Recommended compliance posture:

- POPIA-aligned data handling and retention
- Minimum data collection for minors
- Encrypted data at rest and in transit
- Access logging and periodic access review

## 13) DevOps and Environment Strategy

Environment tiers:

- `dev`
- `staging`
- `production`

Operational standards:

- CI pipeline with tests and static checks
- Infrastructure as code
- Centralized logs and metrics
- Queue monitoring and dead-letter handling
- Automated backups and restore tests

## 14) KPI Framework

Platform KPIs:

- Active schools per province
- Active learners per campaign
- Submission validity rate
- Fraud flag rate and resolution time
- Support delivery cycle time

Brand KPIs:

- Campaign participation volume
- Regional engagement spread
- Verified school impact outcomes

School KPIs:

- Learner participation growth
- Needs funded vs requested
- Support utilization progress

## 15) Recommended Build Plan

### Sprint Block A (Foundation)

- Identity, RBAC, user management
- School and brand onboarding + approvals
- Learner registration and code generation
- Campaign and code batch models

### Sprint Block B (Participation Core)

- WhatsApp adapter ingestion endpoint
- Validation pipeline and code state transitions
- Submission ledger and basic leaderboard updates
- Admin moderation queue

### Sprint Block C (Dashboards + Reporting)

- School/learner dashboards
- Brand campaign analytics
- Platform admin reports
- Exportable impact reports

### Sprint Block D (Trust + Delivery)

- Advanced fraud heuristics
- Judge workflow + score locking
- Needs-to-delivery lifecycle with evidence
- Governance hardening and audit completeness

## 16) Risk Register (Top Risks)

- Fraud abuse at scale if moderation lags
- Inconsistent code quality from brand uploads
- Regional onboarding bottlenecks for schools
- Low learner retention without incentives
- Data privacy and minor protection requirements

Mitigations:

- Automated validation and quarantine lanes
- Strong data import rules and preview checks
- Province-focused onboarding playbooks
- Engagement nudges and transparent rewards
- POPIA-focused controls and training

## 17) Brand Category Fit

High-fit categories:

- Fuel stations
- Beverages
- Confectionery
- Hygiene brands
- Snacks
- Wholesalers
- Retailers
- Telecoms
- Transport groups
- FMCG startups

## 18) Positioning Statement

Brand2School is positioned to become South Africa's largest learner-powered school impact ecosystem by linking everyday community purchases to transparent, verified, and auditable school support outcomes.

