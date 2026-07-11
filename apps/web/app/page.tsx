import Image from "next/image";
import Link from "next/link";
import {
  BarChart3,
  BookOpen,
  Building2,
  CheckCircle2,
  Dumbbell,
  FileCheck,
  FlaskConical,
  Globe2,
  Handshake,
  Library,
  Lock,
  MapPin,
  MessageCircle,
  Monitor,
  School,
  Shield,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  TrendingUp,
  Users,
  UtensilsCrossed,
  Wifi
} from "lucide-react";
import { homepageFaqItems } from "../lib/chatKnowledge";
import { AudienceTabs } from "../components/landing/AudienceTabs";
import { FaqAccordion } from "../components/landing/FaqAccordion";
import { FadeIn } from "../components/landing/FadeIn";
import { ImpactAreasSection } from "../components/landing/ImpactAreasSection";
import { LearnerJourneySection } from "../components/landing/LearnerJourneySection";
import { LiveCampaignsPanel } from "../components/landing/LiveCampaignsPanel";
import { LiveHeroMonthCard, LiveHeroProofStrip } from "../components/landing/LiveHeroPulse";
import { LiveImpactBand } from "../components/landing/LiveImpactBand";
import { LiveMovementPanel } from "../components/landing/LiveMovementPanel";
import { LivePlatformProvider } from "../components/landing/LivePlatformProvider";
import { ProvinceNominationForm } from "../components/campaigns/ProvinceNominationForm";
import { BrandWishlistSection } from "../components/landing/BrandWishlistSection";
import { HomepageCredibilityBand } from "../components/landing/HomepageCredibilityBand";
import { LiveTicker } from "../components/landing/LiveTicker";
import { SectionHeader } from "../components/landing/SectionHeader";
import { ContactForm } from "../components/contact/ContactForm";
import { PUBLIC_CONTACT_LIST, PUBLIC_PHONE, mailto } from "../lib/contact";
import { emptyPlatformCredibility, fetchPlatformCredibility } from "../lib/platformCredibility";
import { emptyPlatformLive, emptyPlatformLiveOffline, fetchPlatformLive } from "../lib/platformLive";
import { fetchPlatformPartners } from "../lib/platformPartners";
import { PartnerCtaStrip, TrustedPartnersSection } from "../components/landing/TrustedPartnersSection";
import { WhoWeServiceSection } from "../components/landing/WhoWeServiceSection";
import { PublicLookupSearch } from "../components/lookup/PublicLookupSearch";

const howSteps = [
  {
    icon: ShoppingCart,
    color: "blue",
    title: "Shop",
    text: "Buy from a participating brand. Every package includes a unique code inside.",
    imageSrc: "/images/cards/shop.png"
  },
  {
    icon: MessageCircle,
    color: "orange",
    title: "Submit your code",
    text: "Use brand2school.co.za/submit or WhatsApp — school name, district, campaign, and product code. No app install.",
    imageSrc: "/images/cards/submit-whatsapp.png"
  },
  {
    icon: TrendingUp,
    color: "green",
    title: "Verify & record",
    text: "Codes sync to the school and brand databases, are verified, and count toward your school's target.",
    imageSrc: "/images/cards/verify-and-record.png"
  },
  {
    icon: Sparkles,
    color: "sky",
    title: "Transform",
    text: "As milestones are met, complete school ecosystems improve — classrooms, labs, fields, verified and visible.",
    imageSrc: "/images/cards/transform.png"
  }
] as const;

const impactCategories = [
  {
    id: "learning",
    title: "Learning Essentials",
    color: "blue" as const,
    example: "Desks, books, uniforms, classrooms equipped to learn",
    items: ["Textbooks", "Stationery", "Uniforms", "Tablets", "Printers", "Desks & chairs", "Whiteboards"],
    sponsorFit: "Retailers · Stationery brands · EdTech",
    campaign: "Campaign: Equip 500 classrooms nationally"
  },
  {
    id: "digital",
    title: "Digital Access",
    color: "sky" as const,
    example: "WiFi, labs, smart classrooms, connected learners",
    items: ["Internet", "WiFi", "Computer labs", "Coding labs", "Smart classrooms", "Projectors", "School systems"],
    sponsorFit: "Telecom · ISPs · Tech brands",
    campaign: "Campaign: Connect schools to WiFi"
  },
  {
    id: "sports",
    title: "Sports Development",
    color: "green" as const,
    example: "Fields, kits, tournaments — pride and participation",
    items: ["Soccer fields", "Netball courts", "Athletics gear", "Rugby kits", "Gym facilities", "Tournaments", "Sports uniforms"],
    sponsorFit: "Beverage brands · Sportswear · Retailers",
    campaign: "Campaign: Build sports fields for rural schools"
  },
  {
    id: "nutrition",
    title: "Nutrition Support",
    color: "orange" as const,
    example: "Feeding schemes, kitchens, water, food gardens",
    items: ["Feeding schemes", "Kitchen upgrades", "Water systems", "Food gardens", "Meal programmes"],
    sponsorFit: "Supermarkets · Food brands · Agriculture",
    campaign: "Campaign: National school nutrition upgrade"
  },
  {
    id: "infrastructure",
    title: "Infrastructure",
    color: "navy" as const,
    example: "Classrooms, roofs, solar — big visible transformation",
    items: ["Classrooms", "Toilets", "Roofs", "Fencing", "Solar power", "Libraries", "Science labs", "Assembly halls"],
    sponsorFit: "Banks · Hardware · Construction partners",
    campaign: "Campaign: Rebuild unsafe classroom blocks"
  },
  {
    id: "wellness",
    title: "Safety & Wellness",
    color: "teal" as const,
    example: "Sanitation, security, lighting, learner wellbeing",
    items: ["Sanitation", "Security", "Lighting", "Counselling rooms", "Health support"],
    sponsorFit: "Security firms · Health NGOs · Utilities",
    campaign: "Campaign: Safe schools lighting initiative"
  }
];

const buildMissions = [
  {
    title: "Classrooms",
    subtitle: "Before/after learning environments rebuilt through participation",
    color: "blue" as const,
    icon: School,
    imageSrc: "/images/cards/classrooms.png"
  },
  {
    title: "Sports Fields",
    subtitle: "Netball courts and soccer fields communities can see growing",
    color: "green" as const,
    icon: Dumbbell,
    imageSrc: "/images/cards/sports.png"
  },
  {
    title: "Computer Labs",
    subtitle: "Coding labs and devices for the next generation",
    color: "sky" as const,
    icon: Monitor,
    imageSrc: "/images/cards/technology.png"
  },
  {
    title: "Libraries",
    subtitle: "Reading spaces that change learner trajectories",
    color: "navy" as const,
    icon: Library,
    imageSrc: "/images/cards/libraries.png"
  },
  {
    title: "Feeding Schemes",
    subtitle: "Kitchens and nutrition that keep learners in school",
    color: "orange" as const,
    icon: UtensilsCrossed,
    imageSrc: "/images/cards/feeding-scheme.png"
  },
  {
    title: "Science Labs",
    subtitle: "Practical STEM infrastructure for township schools",
    color: "teal" as const,
    icon: FlaskConical,
    imageSrc: "/images/cards/science-lab.png"
  }
];

const sponsorCtas = [
  { title: "Become a Founding Sports Development Partner", href: "/for-brands#contact" },
  { title: "Help Build South Africa's Next Generation of Digital Schools", href: "/for-brands#contact" },
  { title: "Lead a National Nutrition & Feeding Mission", href: "/for-brands#contact" },
  { title: "Sponsor Infrastructure Transformation at Scale", href: "/for-brands#contact" }
];

const schoolStories = [
  {
    quote:
      "For two years we waited. Brand2School turned everyday shopping into our library. Our learners finally have a space that says: you matter.",
    role: "Principal",
    location: "Gauteng"
  },
  {
    quote:
      "My family buys groceries. I send the code on WhatsApp. That is how our science lab gets funded. It feels like the whole community is behind us.",
    role: "Grade 11 Learner",
    location: "Western Cape"
  },
  {
    quote:
      "We stopped worrying about scams. Every rand is tracked. Every delivery is verified. That is why our board approved participation.",
    role: "Centre Director",
    location: "KwaZulu-Natal"
  }
];

const trustBadges = [
  { icon: Shield, label: "POPIA Compliant" },
  { icon: FileCheck, label: "Audit Trail" },
  { icon: Lock, label: "Fraud Prevention" },
  { icon: ShieldCheck, label: "Verified Schools" },
  { icon: BarChart3, label: "Public Dashboards" }
];

const audienceTabs = [
  {
    id: "brands",
    label: "For Brands",
    icon: "building",
    headline: "Turn retail participation into measurable national impact",
    points: [
      "Live campaign analytics and ESG reporting dashboards",
      "Brand visibility across verified school communities",
      "ROI-tracked community investment with audit trails",
      "Scalable campaigns from township to national rollout"
    ],
    ctaHref: "/for-brands",
    ctaLabel: "Enterprise & Campaign Pricing"
  },
  {
    id: "schools",
    label: "For Schools",
    icon: "school",
    headline: "Fund complete school ecosystems — dignity-first participation",
    points: [
      "School verification and needs assessment before launch",
      "WhatsApp-first submission — no complex apps required",
      "Milestone-based support delivery with full transparency",
      "Live progress tracking for principals, parents, and SGBs"
    ],
    ctaHref: "/schools/register",
    ctaLabel: "Register Your School"
  },
  {
    id: "government",
    label: "For Government",
    icon: "landmark",
    headline: "National-scale education outcomes with full accountability",
    points: [
      "Province-level impact metrics and outcome reporting",
      "Transparent audit trails for every support transaction",
      "Rural and township inclusion built into campaign design",
      "Alignment with national education infrastructure goals"
    ]
  }
];

export default async function HomePage(): Promise<JSX.Element> {
  const [liveInitial, partnersRaw, credibilityInitial] = await Promise.all([
    fetchPlatformLive(),
    fetchPlatformPartners(),
    fetchPlatformCredibility()
  ]);
  const { withWebBrandLogoUrls } = await import("../lib/brandLogoSrc");
  const partners = withWebBrandLogoUrls(partnersRaw);
  const live = liveInitial ?? emptyPlatformLiveOffline();
  const credibility = credibilityInitial ?? emptyPlatformCredibility();

  return (
    <LivePlatformProvider initial={live}>
    <div className="lp">
      <LiveTicker />

      {/* HERO — movement energy, not admin panel */}
      <section id="home" className="lp-hero lp-hero--movement">
        <div className="lp-hero-glow" aria-hidden="true" />
        <div className="lp-hero-inner">
          <FadeIn className="lp-hero-copy">
            <p className="ds-eyebrow ds-eyebrow--pulse">
              <Globe2 size={14} />
              Customer engagement with verified impact
            </p>
            <h1 className="lp-hero-title">
              Brands Have the Power to Build
              <br />
              <span className="lp-hero-title-accent">Stronger Schools.</span>
            </h1>
            <p className="lp-hero-sub lp-hero-sub--emotional">
              Turn everyday purchases into measurable community impact.
            </p>
            <p className="lp-hero-sub">
              Brand2School connects brands, retailers, schools and communities through verified
              participation campaigns that increase customer engagement while delivering measurable
              educational impact.
            </p>
            <LiveHeroProofStrip />
            <div className="lp-hero-actions">
              <Link href="#contact" className="ds-btn ds-btn-primary ds-btn-lg">
                Join The Movement
              </Link>
              <Link href="#impact-areas" className="ds-btn ds-btn-secondary ds-btn-lg">
                See Impact Areas
              </Link>
            </div>
          </FadeIn>
          <FadeIn className="lp-hero-visual" delay={0.12}>
            <div className="lp-hero-image-wrap lp-hero-image-wrap--poster">
              <Image
                src="/images/landing-hero-infographic.jpg"
                alt="Brand2School: brands turn everyday purchases into verified participation and measurable school impact"
                fill
                sizes="(max-width: 900px) 100vw, 52vw"
                priority
                className="lp-hero-poster-fill"
              />
              <div className="lp-hero-badge">
                <CheckCircle2 size={18} />
                Verified &amp; POPIA Compliant
              </div>
              <LiveHeroMonthCard />
            </div>
          </FadeIn>
        </div>
      </section>

      <section id="find-school" className="lp-lookup-band">
        <div className="lp-container">
          <p className="ds-eyebrow">Registry lookup</p>
          <h2 className="ds-section-title ds-section-title--left">Is your school registered?</h2>
          <p className="lp-problem-text" style={{ marginBottom: "1rem" }}>
            Search schools, NGOs, and brand partners on Brand2School — or{" "}
            <Link href="/lookup">open the full lookup page</Link>.
          </p>
          <PublicLookupSearch compact />
        </div>
      </section>

      {/* PROBLEM — mission-first narrative */}
      <section className="lp-section lp-problem">
        <div className="lp-container lp-problem-grid">
          <FadeIn>
            <p className="ds-eyebrow">The Challenge</p>
            <h2 className="ds-section-title ds-section-title--left">
              Schools Need Infrastructure — Not Vague Promises
            </h2>
            <p className="lp-problem-text">
              Millions of learners learn in environments without desks, connectivity, sports facilities,
              or nutrition. Traditional charity drives are slow and untrusted. Brands want structured,
              visible outcomes — not &ldquo;general school support.&rdquo;
            </p>
            <p className="lp-problem-text lp-problem-text--strong">
              The shift: fund complete school ecosystems through modular, campaign-driven transformation.
            </p>
          </FadeIn>
          <FadeIn delay={0.1}>
            <div className="lp-problem-stats">
              <div className="lp-problem-stat">
                <span className="lp-problem-stat-value">23,000+</span>
                <span className="lp-problem-stat-label">Public schools in SA</span>
              </div>
              <div className="lp-problem-stat">
                <span className="lp-problem-stat-value">70%</span>
                <span className="lp-problem-stat-label">Face resource shortages</span>
              </div>
              <div className="lp-problem-stat">
                <span className="lp-problem-stat-value">R0</span>
                <span className="lp-problem-stat-label">Trust in unverified channels</span>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* SOLUTION — sharp positioning */}
      <section className="lp-section lp-solution">
        <div className="lp-container">
          <FadeIn>
            <SectionHeader
              eyebrow="The Platform"
              title="Modular Educational Transformation"
              subtitle="Different brands fund different needs. Communities participate. Schools receive measurable improvements. That scales nationally."
            />
          </FadeIn>
          <div className="lp-solution-pillars">
            {[
              { icon: ShoppingCart, title: "Commerce-Driven", text: "Every purchase powers progress" },
              { icon: Users, title: "Community-Powered", text: "Families and shoppers drive school progress" },
              { icon: ShieldCheck, title: "Trust-Verified", text: "Fraud-proof, audit-ready, POPIA-compliant" },
              { icon: Globe2, title: "National-Scale", text: "Built for all 9 provinces" }
            ].map((pillar, i) => {
              const Icon = pillar.icon;
              return (
                <FadeIn key={pillar.title} delay={i * 0.07}>
                  <article className="lp-pillar-card">
                    <div className="lp-pillar-icon">
                      <Icon size={24} />
                    </div>
                    <h3>{pillar.title}</h3>
                    <p>{pillar.text}</p>
                  </article>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </section>

      <ImpactAreasSection
        categories={impactCategories}
        buildMissions={buildMissions}
        sponsorCtas={sponsorCtas}
      />

      <TrustedPartnersSection partners={partners} />
      <PartnerCtaStrip />

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="lp-section lp-section-light">
        <div className="lp-container">
          <FadeIn>
            <SectionHeader
              eyebrow="Simple Process"
              title="How The Movement Works"
              subtitle="From purchase to verified infrastructure delivery — four steps, zero complexity."
            />
          </FadeIn>
          <div className="lp-steps">
            {howSteps.map((step, i) => (
                <FadeIn key={step.title} delay={i * 0.08} className="lp-step">
                  <span className="lp-step-num">{String(i + 1).padStart(2, "0")}</span>
                  <div className="lp-step-visual lp-step-visual--photo">
                    <Image
                      src={step.imageSrc}
                      alt={step.title}
                      fill
                      sizes="(max-width: 700px) 100vw, 25vw"
                      className="lp-step-visual-img"
                    />
                  </div>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </FadeIn>
              ))}
          </div>
        </div>
      </section>

      <LearnerJourneySection />

      {/* LIVE CAMPAIGNS — movement engine */}
      <section id="campaigns" className="lp-section lp-campaigns">
        <div className="lp-container">
          <FadeIn>
            <SectionHeader
              eyebrow="Live Now"
              title="Active Campaigns"
              subtitle="National transformation missions with visible outcomes — fields, labs, WiFi, feeding schemes."
              light
            />
          </FadeIn>
          <LiveCampaignsPanel />
        </div>
      </section>

      {/* IMPACT METRICS */}
      <section id="impact" className="lp-section lp-section-metrics">
        <div className="lp-container">
          <FadeIn>
            <SectionHeader
              eyebrow="National Impact"
              title="Proof At Scale"
              subtitle="These numbers represent real classrooms, real learners, and real community investment."
              light
            />
          </FadeIn>
          <LiveImpactBand />
        </div>
      </section>

      {/* MOVEMENT ENGINE — leaderboards + provinces */}
      <section className="lp-section lp-movement">
        <div className="lp-container">
          <FadeIn>
            <SectionHeader
              eyebrow="Movement Engine"
              title="Momentum Builds Momentum"
              subtitle="School rankings, province progress, and community achievements — because people support what they can see growing."
            />
          </FadeIn>
          <LiveMovementPanel />
        </div>
      </section>

      <BrandWishlistSection />

      {/* ENTERPRISE LAYER — audience tabs */}
      <section id="for-brands" className="lp-section lp-section-light">
        <div className="lp-container">
          <FadeIn>
            <SectionHeader
              eyebrow="Built For Every Stakeholder"
              title="National-Grade Platform"
              subtitle="Whether you are a brand, a school, or a government partner — Brand2School speaks your language."
            />
          </FadeIn>
          <FadeIn delay={0.08}>
            <AudienceTabs tabs={audienceTabs} />
          </FadeIn>
        </div>
      </section>

      <WhoWeServiceSection />

      {/* TESTIMONIALS — SA identity */}
      <section id="for-schools" className="lp-section">
        <div className="lp-container">
          <FadeIn>
            <SectionHeader
              eyebrow="Real Stories"
              title="From Township Classrooms To National Change"
              subtitle="South African learners. Local communities. Verified impact — told by the people living it."
            />
          </FadeIn>
          <div className="lp-stories-grid">
            {schoolStories.map((story, i) => (
              <FadeIn key={`${story.role}-${i}`} delay={i * 0.08}>
                <blockquote className="lp-story-card">
                  <School size={28} className="lp-story-icon" />
                  <p className="lp-story-quote">&ldquo;{story.quote}&rdquo;</p>
                  <footer>
                    <strong>{story.role}</strong>
                    <span>{story.location}</span>
                  </footer>
                </blockquote>
              </FadeIn>
            ))}
          </div>
          <FadeIn delay={0.15} className="lp-schools-cta-wrap">
            <Link href="/schools/register" className="ds-btn ds-btn-primary ds-btn-lg">
              Register Your School
            </Link>
          </FadeIn>
        </div>
      </section>

      {/* TRUST SIGNALS — POPIA, fraud, transparency */}
      <section id="trust" className="lp-section lp-section-security">
        <div className="lp-container">
          <FadeIn>
            <SectionHeader
              eyebrow="Public Trust"
              title="Built For A Country That Has Seen Too Many Scams"
              subtitle="POPIA compliance, fraud prevention, verified schools, and public audit trails — because trust is not optional in South Africa."
              light
            />
          </FadeIn>
          <div className="lp-trust-badges">
            {trustBadges.map((badge) => {
              const Icon = badge.icon;
              return (
                <FadeIn key={badge.label}>
                  <div className="lp-trust-badge">
                    <Icon size={22} />
                    <span>{badge.label}</span>
                  </div>
                </FadeIn>
              );
            })}
          </div>
          <HomepageCredibilityBand credibility={credibility} />
          <FadeIn delay={0.12} className="b2s-nominate-home">
            <h3 style={{ color: "#fff", marginBottom: "0.5rem" }}>Bring brand campaigns to your province</h3>
            <ProvinceNominationForm compact />
          </FadeIn>
          <div className="lp-security-layout">
            <FadeIn className="lp-security-copy">
              <ul className="lp-security-list">
                {[
                  "Every submission validated against verified purchase records",
                  "School identity and needs verified before any campaign goes live",
                  "Admin moderation with full audit trail on every transaction",
                  "Automated fraud detection flags suspicious patterns instantly",
                  "Public impact dashboards — anyone can verify where support goes",
                  "POPIA-compliant data handling with encryption and access controls"
                ].map((point) => (
                  <li key={point}>
                    <CheckCircle2 size={18} />
                    {point}
                  </li>
                ))}
              </ul>
            </FadeIn>
            <FadeIn delay={0.1} className="lp-security-visual">
              <div className="lp-security-panel">
                <Handshake size={48} strokeWidth={1.5} />
                <h3>Transparency Is The Product</h3>
                <p>
                  We built the backend like an enterprise platform because South African families
                  deserve the same rigour government and investors demand.
                </p>
                <Link href="/impact" className="ds-btn ds-btn-green">
                  View Live Impact Dashboard
                </Link>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="lp-section lp-section-light">
        <div className="lp-container lp-faq-wrap">
          <FadeIn>
            <SectionHeader
              eyebrow="Questions"
              title="Frequently Asked"
              subtitle="Clear answers for brands, schools, parents, and partners."
            />
          </FadeIn>
          <FadeIn delay={0.08}>
            <FaqAccordion items={[...homepageFaqItems]} />
          </FadeIn>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="lp-section lp-final-cta">
        <FadeIn className="lp-container lp-final-cta-inner">
          <p className="ds-eyebrow">The Movement Starts Here</p>
          <h2 className="lp-final-title">
            Every Purchase.
            <br />
            Every Code.
            <br />
            Every Future.
          </h2>
          <p>
            Join the national participation engine that turns South African commerce into
            verified education infrastructure — from the Cape Flats to Limpopo.
          </p>
          <div className="lp-hero-actions">
            <Link href="#contact" className="ds-btn ds-btn-primary ds-btn-lg">
              Become a Partner
            </Link>
            <Link href="/impact" className="ds-btn ds-btn-secondary ds-btn-lg">
              See Live Impact
            </Link>
          </div>
        </FadeIn>
      </section>

      <section id="contact" className="lp-section lp-section-light">
        <div className="lp-container" style={{ maxWidth: 720, margin: "0 auto" }}>
          <FadeIn>
            <SectionHeader
              eyebrow="Contact"
              title="Get in touch"
              subtitle={`Send us a message — or call / WhatsApp ${PUBLIC_PHONE.display} for a faster reply.`}
            />
            <ContactForm />
          </FadeIn>
        </div>
      </section>

      <footer className="lp-footer">
        <div className="lp-container lp-footer-grid">
          <div className="lp-footer-brand">
            <p className="lp-footer-name">Brand2School</p>
            <p className="lp-footer-tagline">
              Educational commerce infrastructure. Community impact network.
              School-first participation infrastructure.
            </p>
          </div>
          <div>
            <h4>Platform</h4>
            <ul>
              <li><Link href="#how-it-works">How It Works</Link></li>
              <li><Link href="/for-brands">For Brands</Link></li>
              <li><Link href="#for-schools">For Schools</Link></li>
              <li><Link href="#campaigns">Live Campaigns</Link></li>
              <li><Link href="/impact">Impact Dashboard</Link></li>
            </ul>
          </div>
          <div>
            <h4>Trust</h4>
            <ul>
              <li><Link href="/about">About Us</Link></li>
              <li><Link href="#trust">Security &amp; Transparency</Link></li>
              <li><Link href="#faq">FAQ</Link></li>
              <li><Link href="#impact">Impact Metrics</Link></li>
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
    </LivePlatformProvider>
  );
}
