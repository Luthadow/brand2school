import type { Metadata } from "next";
import Link from "next/link";
import {
  BarChart3,
  Building2,
  CheckCircle2,
  Globe2,
  LineChart,
  MapPin,
  ShieldCheck,
  Target,
  TrendingUp,
  Users,
  Zap
} from "lucide-react";
import { FadeIn } from "../../components/landing/FadeIn";
import { ForBrandsLiveProof } from "../../components/landing/ForBrandsLiveProof";
import { BrandApplicationForm } from "../../components/for-brands/BrandApplicationForm";
import { ProcurementPackDownload } from "../../components/for-brands/ProcurementPackDownload";
import { CONTACT, PUBLIC_CONTACT_LIST, PUBLIC_PHONE, mailto, whatsappUrl } from "../../lib/contact";
import { SectionHeader } from "../../components/landing/SectionHeader";
import {
  BILLING_WORKFLOW_STEPS,
  CODE_CONTRIBUTION_MODEL,
  COMMERCIAL_ADD_ON_SERVICES,
  COMMERCIAL_ROLLOUT_PHASES,
  COMMERCIAL_VALUE_STREAMS,
  CONTRACT_PACKAGE_REQUIREMENTS,
  INDUSTRY_PHASE_ALIGNMENT,
  INFRASTRUCTURE_PHASE_TRACK,
  PHASE_SPONSORSHIP_ADDONS,
  PREMIUM_POSITIONING,
  RECOMMENDED_PAYMENT_SCHEDULE,
  SUBSCRIPTION_LIFECYCLE,
  TERRITORIAL_PACKAGES
} from "../../lib/territorialPackages";

export const metadata: Metadata = {
  title: "For Brands — Territorial Impact Rights | Brand2School",
  description:
    "Measurable education infrastructure and ESG intelligence — territorial transformation rights for school, district, provincial, and national partners. Not a donation platform."
};

const brandWants = [
  { icon: Target, title: "Visibility", text: "Show up where communities already participate — schools, WhatsApp, retail." },
  { icon: BarChart3, title: "ESG & CSI", text: "Audit-ready impact data for boards, compliance, and annual reporting." },
  { icon: Users, title: "Engagement", text: "Turn purchases into measurable community participation at national scale." },
  { icon: ShieldCheck, title: "Trust", text: "Verified schools, fraud controls, and transparent delivery — not guesswork." }
];


const esgFeatures = [
  "PDF & board-ready impact reports",
  "Province-level participation analytics",
  "Participation reach & engagement rates",
  "Campaign performance dashboards",
  "Verified school network metrics",
  "Anonymized regional heatmaps"
];

const revenueStack = [
  { label: "Brand campaigns", pct: 40 },
  { label: "ESG reporting", pct: 20 },
  { label: "Enterprise contracts", pct: 15 },
  { label: "Retail partnerships", pct: 10 },
  { label: "White-label licensing", pct: 10 },
  { label: "Premium analytics", pct: 5 }
];

const notCharging = [
  "Schools are never charged to participate",
  "Learners are never charged to submit",
  "No donation begging or paywalls on support",
  "Personal data is never sold — only aggregated insights"
];

const benefitVariants = ["navy", "green", "orange", "sky"] as const;

export default function ForBrandsPage(): JSX.Element {
  return (
    <div className="lp">
      <section className="lp-hero lp-hero--movement">
        <div className="lp-hero-glow" aria-hidden="true" />
        <div className="lp-hero-inner lp-hero-inner--single">
          <FadeIn className="lp-hero-copy">
            <p className="ds-eyebrow ds-eyebrow--pulse">For Brands &amp; Enterprise Partners</p>
            <h1 className="lp-hero-title">
              Education Transformation Territories
              <span className="lp-hero-title-accent">Not Submission Caps.</span>
            </h1>
            <p className="lp-hero-sub lp-hero-sub--emotional">
              <strong>{PREMIUM_POSITIONING.salesPitch}</strong>
            </p>
            <p className="lp-hero-sub" style={{ fontSize: "0.95rem", opacity: 0.85 }}>
              Hybrid commercial model: <strong>one-time activation</strong>, <strong>monthly ESG infrastructure
              subscription</strong>, and an <strong>optional transformation pool</strong>.{" "}
              {PREMIUM_POSITIONING.subscriptionPositioning}
            </p>
            <div className="lp-hero-actions">
              <Link href="#register" className="ds-btn ds-btn-primary ds-btn-lg">
                Register As Enterprise Brand
              </Link>
              <Link href="#pricing" className="ds-btn ds-btn-secondary ds-btn-lg">
                Territorial Impact Packages
              </Link>
              <Link href="#contact" className="ds-btn ds-btn-secondary ds-btn-lg">
                Book A Partner Call
              </Link>
            </div>
            <ProcurementPackDownload className="lp-hero-pack" style={{ marginTop: "1.25rem" }} />
          </FadeIn>
        </div>
      </section>

      <ForBrandsLiveProof />

      <section id="positioning" className="lp-section lp-section-light">
        <div className="lp-container lp-problem-grid">
          <FadeIn>
            <p className="ds-eyebrow">Premium Positioning</p>
            <h2 className="ds-section-title ds-section-title--left">{PREMIUM_POSITIONING.tagline}</h2>
            <p className="lp-problem-text">
              {COMMERCIAL_VALUE_STREAMS.contributionPool.pitch} Your real product is measurable verified
              transformation infrastructure — not “please help schools.”
            </p>
            <ul className="lp-trust-list">
              {PREMIUM_POSITIONING.justifies.map((line) => (
                <li key={line}>
                  <CheckCircle2 size={18} />
                  {line}
                </li>
              ))}
            </ul>
          </FadeIn>
          <FadeIn delay={0.1}>
            <div className="lp-security-panel">
              <ShieldCheck size={40} style={{ color: "var(--brand-green)", marginBottom: "0.75rem" }} />
              <h3>What we are not</h3>
              <p style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "0.5rem" }}>
                {PREMIUM_POSITIONING.notPositioning}
              </p>
              <p>
                Schools and learners never pay to participate. Brands pay for platform intelligence first;
                infrastructure funding is optional, phased, and category-aligned (e.g. MTN Digital Access Phase).
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      <section id="commercial-model" className="lp-section">
        <div className="lp-container">
          <FadeIn>
            <SectionHeader
              eyebrow="Commercial Structure"
              title="Hybrid Revenue Model"
              subtitle="Activation fee + monthly subscription + optional transformation pool — platform operations never funded from school infrastructure pools."
            />
          </FadeIn>
          <div className="lp-problem-grid" style={{ marginTop: "1.5rem" }}>
            <FadeIn>
              <article className="lp-security-panel">
                <p className="ds-eyebrow">1 — Mandatory</p>
                <h3>{COMMERCIAL_VALUE_STREAMS.activationFee.label}</h3>
                <p>{COMMERCIAL_VALUE_STREAMS.activationFee.description}</p>
                <p className="lp-problem-text" style={{ marginTop: "0.5rem", fontWeight: 600 }}>
                  {COMMERCIAL_VALUE_STREAMS.activationFee.note}
                </p>
              </article>
            </FadeIn>
            <FadeIn delay={0.06}>
              <article className="lp-security-panel">
                <p className="ds-eyebrow">2 — Mandatory</p>
                <h3>{COMMERCIAL_VALUE_STREAMS.monthlySubscription.label}</h3>
                <p>{COMMERCIAL_VALUE_STREAMS.monthlySubscription.description}</p>
                <ul className="lp-trust-list" style={{ marginTop: "0.75rem" }}>
                  {COMMERCIAL_VALUE_STREAMS.monthlySubscription.includes.map((line) => (
                    <li key={line}>
                      <CheckCircle2 size={16} />
                      {line}
                    </li>
                  ))}
                </ul>
                <p className="lp-problem-text" style={{ marginTop: "0.5rem" }}>
                  Recommended minimum {COMMERCIAL_VALUE_STREAMS.monthlySubscription.minimumCommitmentMonths}
                  -month participation agreement.
                </p>
              </article>
            </FadeIn>
            <FadeIn delay={0.12}>
              <article className="lp-security-panel" style={{ borderColor: "var(--brand-green)" }}>
                <p className="ds-eyebrow">3 — Optional</p>
                <h3>{COMMERCIAL_VALUE_STREAMS.contributionPool.label}</h3>
                <p>{COMMERCIAL_VALUE_STREAMS.contributionPool.description}</p>
                <p className="lp-problem-text" style={{ marginTop: "0.75rem", fontWeight: 600 }}>
                  {COMMERCIAL_VALUE_STREAMS.contributionPool.pitch}
                </p>
              </article>
            </FadeIn>
          </div>
          <FadeIn>
            <h3 style={{ marginTop: "2rem", textAlign: "center" }}>Industry-aligned phase sponsorship</h3>
            <p className="lp-problem-text" style={{ textAlign: "center", maxWidth: 640, margin: "0.5rem auto 1rem" }}>
              Brands sponsor a measurable category they can own — not random donations.
            </p>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Infrastructure phase</th>
                    <th>Suggested brand categories</th>
                  </tr>
                </thead>
                <tbody>
                  {INDUSTRY_PHASE_ALIGNMENT.map((row) => (
                    <tr key={row.infrastructurePhase}>
                      <td>{row.infrastructurePhase}</td>
                      <td>{row.brandCategories}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="lp-problem-text" style={{ marginTop: "1rem", textAlign: "center" }}>
              <strong>{CODE_CONTRIBUTION_MODEL.description}</strong> {CODE_CONTRIBUTION_MODEL.note}
            </p>
          </FadeIn>
          <FadeIn>
            <h3 style={{ marginTop: "2rem", textAlign: "center" }}>Commercial rollout</h3>
            <div className="lp-steps" style={{ marginTop: "1rem" }}>
              {COMMERCIAL_ROLLOUT_PHASES.map((phase) => (
                <article key={phase.phase} className="lp-step">
                  <h4>{phase.title}</h4>
                  <p>
                    <strong>Platform:</strong> {phase.platformFee}
                  </p>
                  <p>
                    <strong>Impact pool:</strong> {phase.contributionPool}
                  </p>
                </article>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      <section id="contract-terms" className="lp-section">
        <div className="lp-container" style={{ maxWidth: 800, margin: "0 auto" }}>
          <FadeIn>
            <SectionHeader
              eyebrow="Recommended Contract Terms"
              title="Required Before Any Package Goes Live"
              subtitle="Every territorial impact package — school through national — follows the same commercial governance gates."
            />
          </FadeIn>
          <ul className="lp-trust-list" style={{ marginTop: "1rem" }}>
            {CONTRACT_PACKAGE_REQUIREMENTS.map((req) => (
              <li key={req.label}>
                <CheckCircle2 size={18} />
                {req.label}
              </li>
            ))}
          </ul>
          <p className="lp-problem-text" style={{ marginTop: "1rem", textAlign: "center" }}>
            <Link href="#register" className="ds-btn ds-btn-primary">
              Start enterprise application
            </Link>
          </p>
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-container">
          <FadeIn>
            <SectionHeader
              eyebrow="Why Brands Partner"
              title="Enable & Measure Community Participation"
              subtitle="You don't buy charity optics. You buy verified engagement, regional reach, and audit-ready impact intelligence."
            />
          </FadeIn>
          <div className="lp-steps">
            {brandWants.map((item, i) => {
              const Icon = item.icon;
              const colors = ["blue", "green", "orange", "sky"] as const;
              return (
                <FadeIn key={item.title} delay={i * 0.06}>
                  <article className="lp-step">
                    <div className={`lp-step-icon lp-step-icon--${colors[i]}`}>
                      <Icon size={26} />
                    </div>
                    <h3>{item.title}</h3>
                    <p>{item.text}</p>
                  </article>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </section>

      <section id="pricing" className="lp-section lp-campaigns">
        <div className="lp-container">
          <FadeIn>
            <SectionHeader
              eyebrow="Enterprise Packages"
              title="Activation + Monthly Subscription"
              subtitle="One-time activation fee plus recurring ESG infrastructure subscription. Optional transformation pool — recommended, not required at launch."
              light
            />
          </FadeIn>
          <div className="lp-pricing-grid">
            {TERRITORIAL_PACKAGES.map((tier, i) => (
              <FadeIn key={tier.id} delay={i * 0.06}>
                <article className={`lp-pricing-card${tier.featured ? " lp-pricing-card--featured" : ""}`}>
                  {tier.featured ? <span className="lp-pricing-badge">Most Popular</span> : null}
                  <h3>{tier.name}</h3>
                  <p className="lp-pricing-range">Activation: {tier.activationFee}</p>
                  <p className="lp-pricing-scope" style={{ fontSize: "0.9rem", fontWeight: 600 }}>
                    Subscription: {tier.monthlySubscription}
                  </p>
                  <p className="lp-pricing-scope" style={{ fontSize: "0.85rem" }}>
                    Impact pool: {tier.recommendedContributionPool}
                  </p>
                  <p className="lp-pricing-scope">{tier.coverage}</p>
                  <p className="lp-pricing-scope" style={{ fontSize: "0.85rem", opacity: 0.9 }}>
                    {tier.participation}
                  </p>
                  <ul className="lp-pricing-list">
                    {tier.includes.map((line) => (
                      <li key={line}>
                        <CheckCircle2 size={16} />
                        {line}
                      </li>
                    ))}
                  </ul>
                </article>
              </FadeIn>
            ))}
          </div>
          <FadeIn delay={0.15}>
            <div style={{ marginTop: "2rem", textAlign: "center" }}>
              <ProcurementPackDownload label="Download procurement pack for legal & finance" />
            </div>
          </FadeIn>
        </div>
      </section>

      <section className="lp-section lp-section-light">
        <div className="lp-container">
          <FadeIn>
            <SectionHeader
              eyebrow="Infrastructure Engine"
              title="School Phase Progression Model"
              subtitle="Brands sponsor measurable infrastructure transformation — water, power, digital access, and learning environments."
            />
          </FadeIn>
          <div className="lp-steps">
            {INFRASTRUCTURE_PHASE_TRACK.map((phase, i) => (
              <FadeIn key={phase} delay={i * 0.05}>
                <article className="lp-step">
                  <div className="lp-step-icon lp-step-icon--green">
                    <Building2 size={22} />
                  </div>
                  <h3>{phase}</h3>
                  <p>Tracked on your dashboard with verified progression and board-ready ESG evidence.</p>
                </article>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-container">
          <FadeIn>
            <SectionHeader
              eyebrow="Future Add-Ons"
              title="Infrastructure Phase Sponsorship"
              subtitle="Co-sponsor specific phases for ESG specialization and multi-brand scale."
            />
          </FadeIn>
          <div className="lp-benefits-grid">
            {PHASE_SPONSORSHIP_ADDONS.map((row, i) => (
              <FadeIn key={row.focus} delay={i * 0.06}>
                <article className={`lp-benefit-card lp-benefit-card--${benefitVariants[i % benefitVariants.length]}`}>
                  <h3>{row.focus}</h3>
                  <p>{row.example}</p>
                </article>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section id="add-ons" className="lp-section lp-section-light">
        <div className="lp-container">
          <FadeIn>
            <SectionHeader
              eyebrow="Optional Services"
              title="Add-On Services"
              subtitle="Extend your transformation territory with integrations, media, and advanced monitoring."
            />
          </FadeIn>
          <div className="table-wrap" style={{ marginTop: "1rem" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Cost</th>
                </tr>
              </thead>
              <tbody>
                {COMMERCIAL_ADD_ON_SERVICES.map((row) => (
                  <tr key={row.service}>
                    <td>{row.service}</td>
                    <td>
                      <strong>{row.cost}</strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section id="payment" className="lp-section">
        <div className="lp-container" style={{ maxWidth: 720, margin: "0 auto" }}>
          <FadeIn>
            <SectionHeader
              eyebrow="Enterprise Billing"
              title="Billing Workflow"
              subtitle="Activation fee and first subscription cycle before launch — contribution pools invoiced separately when committed."
            />
          </FadeIn>
          <ol className="lp-trust-list" style={{ marginTop: "1rem" }}>
            {BILLING_WORKFLOW_STEPS.map((step) => (
              <li key={step}>
                <CheckCircle2 size={18} />
                {step}
              </li>
            ))}
          </ol>
          <h3 style={{ marginTop: "2rem", textAlign: "center" }}>Subscription lifecycle</h3>
          <div className="table-wrap" style={{ marginTop: "1rem" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Stage</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {SUBSCRIPTION_LIFECYCLE.map((row) => (
                  <tr key={row.stage}>
                    <td>{row.stage}</td>
                    <td>{row.action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="lp-stack-panel" style={{ marginTop: "1.5rem" }}>
            {RECOMMENDED_PAYMENT_SCHEDULE.map((row) => (
              <div key={row.stage} className="lp-stack-row">
                <span>
                  {row.stage}
                  <br />
                  <small style={{ color: "#64748b" }}>{row.note}</small>
                </span>
                <div className="lp-stack-bar-wrap">
                  <div className="lp-stack-bar" style={{ width: `${row.percentage}%` }} />
                </div>
                <strong>Due</strong>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-section lp-section-light">
        <div className="lp-container lp-problem-grid">
          <FadeIn>
            <p className="ds-eyebrow">ESG / CSI Opportunity</p>
            <h2 className="ds-section-title ds-section-title--left">Impact Intelligence Platform</h2>
            <p className="lp-problem-text">
              South African enterprises need measurable CSI and ESG evidence. Brand2School already generates
              participation data, regional analytics, school metrics, and campaign engagement — packaged as
              recurring impact intelligence.
            </p>
            <p className="lp-pricing-range lp-pricing-range--inline">
              <strong>R5,000 – R100,000</strong> / month depending on scale
            </p>
            <ul className="lp-trust-list">
              {esgFeatures.map((f) => (
                <li key={f}>
                  <CheckCircle2 size={18} />
                  {f}
                </li>
              ))}
            </ul>
          </FadeIn>
          <FadeIn delay={0.1}>
            <div className="lp-security-panel">
              <LineChart size={40} style={{ color: "var(--brand-green)", marginBottom: "0.75rem" }} />
              <h3>What boards receive</h3>
              <p>Province dashboards, learner reach, engagement rates, and verified delivery evidence — not vanity metrics.</p>
              <Link href="/dashboard" className="ds-btn ds-btn-green">
                Preview Analytics Layer
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-container">
          <FadeIn>
            <SectionHeader
              eyebrow="Network Moat"
              title="Verified School Network Access"
              subtitle="Target verified schools by province, need type, or community profile — a data advantage competitors cannot copy overnight."
            />
          </FadeIn>
          <div className="lp-benefits-grid">
            {[
              { icon: MapPin, title: "Regional targeting", text: "Limpopo, Western Cape, rural clusters — precise campaign geography." },
              { icon: Building2, title: "School verification", text: "Every school verified before activation. Fraud controls on every submission." },
              { icon: Globe2, title: "National scale", text: "Infrastructure built for thousands of schools and millions of interactions." },
              { icon: Zap, title: "WhatsApp reach", text: "Africa-first engagement — codes, status, and campaigns on the channel people use." }
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <FadeIn key={item.title} delay={i * 0.06}>
                  <article className={`lp-benefit-card lp-benefit-card--${benefitVariants[i % benefitVariants.length]}`}>
                    <div className="lp-benefit-icon">
                      <Icon size={24} />
                    </div>
                    <h3>{item.title}</h3>
                    <p>{item.text}</p>
                  </article>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </section>

      <section className="lp-section lp-section-light">
        <div className="lp-container lp-problem-grid">
          <FadeIn>
            <h2 className="ds-section-title ds-section-title--left">What We Never Charge</h2>
            <p className="lp-problem-text">
              Trust is the product. Charging poor schools would weaken adoption and destroy the network effect
              that makes Brand2School valuable to brands in the first place.
            </p>
            <ul className="lp-trust-list">
              {notCharging.map((line) => (
                <li key={line}>
                  <CheckCircle2 size={18} />
                  {line}
                </li>
              ))}
            </ul>
          </FadeIn>
          <FadeIn delay={0.1}>
            <div className="lp-stack-panel">
              <h3>Future Revenue Stack</h3>
              <p className="lp-stack-note">Infrastructure economics — not donation economics.</p>
              {revenueStack.map((row) => (
                <div key={row.label} className="lp-stack-row">
                  <span>{row.label}</span>
                  <div className="lp-stack-bar-wrap">
                    <div className="lp-stack-bar" style={{ width: `${row.pct}%` }} />
                  </div>
                  <strong>{row.pct}%</strong>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-container">
          <FadeIn>
            <SectionHeader
              eyebrow="Roadmap"
              title="Additional Revenue Layers"
              subtitle="Built on the same verified participation infrastructure — scaled over time."
            />
          </FadeIn>
          <div className="lp-steps">
            {[
              { title: "Transaction fees", text: "Micro-fees per verified submission at national scale." },
              { title: "White-label licensing", text: "Retailers, NGOs, and universities run their own branded networks." },
              { title: "Retail partnerships", text: "Supermarkets and retailers — loyalty through verified community impact." },
              { title: "Government contracts", text: "Enterprise programmes for nutrition, literacy, and attendance drives." },
              { title: "Reward ecosystem", text: "Brand-sponsored learner recognition — participation, not pity." },
              { title: "Premium school tools", text: "Optional freemium analytics — schools never pay to participate." }
            ].map((item, i) => (
              <FadeIn key={item.title} delay={i * 0.05}>
                <article className="lp-step">
                  <div className="lp-step-icon lp-step-icon--blue">
                    <TrendingUp size={22} />
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </article>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="lp-section lp-section-light">
        <div className="lp-container brand-app-form-wrap">
          <FadeIn>
            <BrandApplicationForm />
          </FadeIn>
        </div>
      </section>

      <section id="partner-outreach" className="lp-section lp-final-cta">
        <FadeIn className="lp-container lp-final-cta-inner">
          <p className="ds-eyebrow">Partner With Us</p>
          <h2 className="lp-final-title">Ready To Run A Verified Campaign?</h2>
          <p>
            Pilot with 1–3 regional brands. Generate measurable impact reports. Turn data into recurring
            ESG contracts. Scale nationally on participation infrastructure.
          </p>
          <div className="lp-hero-actions">
            <a href={mailto(CONTACT.brands, "Brand partnership enquiry")} className="ds-btn ds-btn-primary ds-btn-lg">
              {CONTACT.brands}
            </a>
            <a href={PUBLIC_PHONE.telHref} className="ds-btn ds-btn-secondary ds-btn-lg">
              Call {PUBLIC_PHONE.display}
            </a>
            <a
              href={whatsappUrl("Hi Brand2School — I'd like to discuss a brand partnership.")}
              className="ds-btn ds-btn-secondary ds-btn-lg"
              target="_blank"
              rel="noopener noreferrer"
            >
              WhatsApp {PUBLIC_PHONE.display}
            </a>
            <Link href="/dashboard" className="ds-btn ds-btn-secondary ds-btn-lg">
              Preview Impact Dashboard
            </Link>
          </div>
        </FadeIn>
      </section>

      <footer className="lp-footer">
        <div className="lp-container lp-footer-grid">
          <div className="lp-footer-brand">
            <p className="lp-footer-name">Brand2School</p>
            <p className="lp-footer-tagline">
              Educational commerce infrastructure. Community impact network.
              Learner-powered participation engine.
            </p>
          </div>
          <div>
            <h4>Platform</h4>
            <ul>
              <li><Link href="/#how-it-works">How It Works</Link></li>
              <li><Link href="/for-brands">For Brands</Link></li>
              <li><Link href="/#for-schools">For Schools</Link></li>
              <li><Link href="/dashboard">Impact Dashboard</Link></li>
            </ul>
          </div>
          <div>
            <h4>Trust</h4>
            <ul>
              <li><Link href="/about">About Us</Link></li>
              <li><Link href="/#trust">Security &amp; Transparency</Link></li>
              <li><Link href="/#faq">FAQ</Link></li>
              <li><Link href="/poster">Partner Materials</Link></li>
            </ul>
          </div>
          <div>
            <h4>Contact</h4>
            <ul>
              <li>
                {PUBLIC_PHONE.label}:{" "}
                <a href={PUBLIC_PHONE.telHref}>{PUBLIC_PHONE.display}</a>
                {" · "}
                <a href={PUBLIC_PHONE.whatsappHref} target="_blank" rel="noopener noreferrer">
                  WhatsApp
                </a>
              </li>
              {PUBLIC_CONTACT_LIST.map(({ label, email }) => (
                <li key={email}>
                  {label}: <a href={mailto(email)}>{email}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="lp-container lp-footer-bottom">
          <p>&copy; {new Date().getFullYear()} Brand2School. POPIA Compliant. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
