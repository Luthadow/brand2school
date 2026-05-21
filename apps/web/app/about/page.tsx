import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import {
  Building2,
  CheckCircle2,
  Eye,
  Globe2,
  Heart,
  Lightbulb,
  MapPin,
  Scale,
  Shield,
  TrendingUp
} from "lucide-react";
import { FadeIn } from "../../components/landing/FadeIn";
import { SectionHeader } from "../../components/landing/SectionHeader";
import { COMPANY, formatCompanyAddressLines } from "../../lib/company";
import { PUBLIC_CONTACT_LIST, PUBLIC_PHONE, mailto } from "../../lib/contact";

export const metadata: Metadata = {
  title: "About Us — Brand2School",
  description:
    "Brand2School is a technology-driven educational impact platform developed by NKANYEZI TECH SOLUTIONS (Pty) Ltd — connecting brands, communities, and schools through verified participation."
};

const impactAreas = [
  "Learning essentials",
  "Sports development",
  "Digital access",
  "School infrastructure",
  "Nutrition support",
  "Safety and wellness programs"
];

const missionPoints = [
  "To strengthen schools through verified community participation",
  "To provide transparent and measurable impact systems",
  "To create trusted infrastructure for educational support campaigns",
  "To bridge technology, commerce, and community development",
  "To help build sustainable educational ecosystems across South Africa"
];

const nkanyeziFocus = [
  "Educational technology",
  "Community participation systems",
  "Verification and anti-fraud technologies",
  "Data analytics and reporting",
  "Digital engagement platforms",
  "Impact tracking infrastructure"
];

const coreValues = [
  {
    icon: Lightbulb,
    title: "Innovation",
    text: "We use technology to create practical and scalable solutions for real-world challenges."
  },
  {
    icon: Eye,
    title: "Transparency",
    text: "We prioritize accountability, verification, and measurable impact across all systems."
  },
  {
    icon: Heart,
    title: "Community Empowerment",
    text: "We believe technology should help strengthen communities and improve opportunities."
  },
  {
    icon: Scale,
    title: "Integrity",
    text: "We are committed to ethical, secure, and responsible technology development."
  },
  {
    icon: TrendingUp,
    title: "Scalability",
    text: "We build systems designed for long-term sustainability and national growth."
  }
];

export default function AboutPage(): JSX.Element {
  return (
    <div className="lp">
      <section className="lp-hero lp-hero--movement about-hero">
        <div className="lp-hero-glow" aria-hidden="true" />
        <div className="lp-hero-inner lp-hero-inner--single">
          <FadeIn className="lp-hero-copy">
            <p className="ds-eyebrow ds-eyebrow--pulse">About Us</p>
            <h1 className="lp-hero-title">
              Technology-Driven
              <span className="lp-hero-title-accent">Educational Impact</span>
            </h1>
            <p className="lp-hero-sub lp-hero-sub--emotional">
              Brand2School is developed and operated by NKANYEZI TECH SOLUTIONS (Pty) Ltd — building
              innovative digital systems that create measurable community transformation across South Africa.
            </p>
          </FadeIn>
        </div>
      </section>

      <section className="lp-section lp-section-light">
        <div className="lp-container about-intro-grid">
          <FadeIn className="about-intro-copy">
            <SectionHeader
              eyebrow="The Platform"
              title="Connecting Brands, Communities & Schools"
              subtitle="Verified participation campaigns that support educational development and infrastructure growth."
            />
            <p className="about-body">
              Brand2School was created to help connect brands, communities, and schools through verified
              participation campaigns that support educational development and infrastructure growth.
            </p>
            <p className="about-body">
              The platform enables participating brands to create measurable impact initiatives where everyday
              community participation contributes toward real school development goals such as:
            </p>
            <ul className="about-check-list">
              {impactAreas.map((area) => (
                <li key={area}>
                  <CheckCircle2 size={18} />
                  {area}
                </li>
              ))}
            </ul>
            <p className="about-body">
              Through secure code verification, participation tracking, audit systems, and real-time campaign
              analytics, Brand2School provides a transparent and scalable model for educational support in
              South Africa.
            </p>
          </FadeIn>
          <FadeIn delay={0.1} className="about-intro-visual">
            <div className="about-logo-card">
              <Image src="/brand2school.png" alt="Brand2School" width={1536} height={1024} className="about-logo" priority />
              <p className="about-product-line">A product of nkanyezi Tech Solutions</p>
            </div>
          </FadeIn>
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-container about-vision-grid">
          <FadeIn className="about-vision-card">
            <Globe2 size={28} />
            <h2>Our Vision</h2>
            <p>
              To build a national educational participation ecosystem that empowers communities, supports
              schools, and enables brands to create measurable social impact through technology.
            </p>
          </FadeIn>
          <FadeIn delay={0.08} className="about-vision-card about-vision-card--mission">
            <Building2 size={28} />
            <h2>Our Mission</h2>
            <ul className="about-mission-list">
              {missionPoints.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </FadeIn>
        </div>
      </section>

      <section className="lp-section lp-section-light">
        <div className="lp-container">
          <FadeIn>
            <SectionHeader
              eyebrow="Our Company"
              title="About NKANYEZI TECH SOLUTIONS (Pty) Ltd"
              subtitle="A South African technology company focused on scalable digital infrastructure, engagement systems, and community-driven technology platforms."
            />
          </FadeIn>
          <div className="about-nkanyezi-grid">
            <FadeIn className="about-nkanyezi-copy">
              <p className="about-body">
                NKANYEZI TECH SOLUTIONS is a South African technology company focused on developing scalable
                digital infrastructure, engagement systems, and community-driven technology platforms.
              </p>
              <h3>The company develops solutions in:</h3>
              <ul className="about-check-list">
                {nkanyeziFocus.map((item) => (
                  <li key={item}>
                    <CheckCircle2 size={18} />
                    {item}
                  </li>
                ))}
              </ul>
            </FadeIn>
            <FadeIn delay={0.1}>
              <article className="about-company-card">
                <p className="about-company-eyebrow">Company Information</p>
                <h3>{COMPANY.legalName}</h3>
                <dl className="about-company-dl">
                  <div>
                    <dt>Registration Number</dt>
                    <dd>{COMPANY.registrationNumber}</dd>
                  </div>
                  <div>
                    <dt>Tax Number</dt>
                    <dd>{COMPANY.taxNumber}</dd>
                  </div>
                  <div>
                    <dt>Enterprise Type</dt>
                    <dd>{COMPANY.enterpriseType}</dd>
                  </div>
                  <div>
                    <dt>Status</dt>
                    <dd>{COMPANY.status}</dd>
                  </div>
                  <div>
                    <dt>Registration Date</dt>
                    <dd>{COMPANY.registrationDate}</dd>
                  </div>
                  <div>
                    <dt>Financial Year End</dt>
                    <dd>{COMPANY.financialYearEnd}</dd>
                  </div>
                  <div>
                    <dt>
                      <MapPin size={16} />
                      Registered Office
                    </dt>
                    <dd>
                      {formatCompanyAddressLines().map((line) => (
                        <span key={line}>
                          {line}
                          <br />
                        </span>
                      ))}
                    </dd>
                  </div>
                  <div>
                    <dt>{PUBLIC_PHONE.label}</dt>
                    <dd>
                      <a href={PUBLIC_PHONE.telHref}>{PUBLIC_PHONE.display}</a>
                      {" · "}
                      <a href={PUBLIC_PHONE.whatsappHref} target="_blank" rel="noopener noreferrer">
                        WhatsApp
                      </a>
                    </dd>
                  </div>
                  <div>
                    <dt>Email</dt>
                    <dd>
                      {PUBLIC_CONTACT_LIST.map(({ label, email }, i) => (
                        <span key={email}>
                          {i > 0 ? <br /> : null}
                          {label}: <a href={mailto(email)}>{email}</a>
                        </span>
                      ))}
                    </dd>
                  </div>
                </dl>
              </article>
            </FadeIn>
          </div>
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-container">
          <FadeIn>
            <SectionHeader
              eyebrow="What Guides Us"
              title="Core Values"
              subtitle="The principles behind every system we build."
            />
          </FadeIn>
          <div className="about-values-grid">
            {coreValues.map((value, i) => {
              const Icon = value.icon;
              return (
                <FadeIn key={value.title} delay={i * 0.05}>
                  <article className="about-value-card">
                    <div className="about-value-icon">
                      <Icon size={24} />
                    </div>
                    <h3>{value.title}</h3>
                    <p>{value.text}</p>
                  </article>
                </FadeIn>
              );
            })}
            <FadeIn delay={0.25}>
              <article className="about-value-card about-value-card--shield">
                <div className="about-value-icon">
                  <Shield size={24} />
                </div>
                <h3>Verified Impact</h3>
                <p>
                  Every submission is verified. Every campaign is measurable. Every contribution is
                  traceable.
                </p>
              </article>
            </FadeIn>
          </div>
        </div>
      </section>

      <section className="lp-section about-cta">
        <div className="lp-container about-cta-inner">
          <FadeIn>
            <h2>Join The National Participation Ecosystem</h2>
            <p>
              Whether you are a brand, school, or community partner — Brand2School is built for measurable,
              transparent educational transformation.
            </p>
            <div className="lp-hero-actions">
              <Link href={"/for-brands" as Route} className="ds-btn ds-btn-primary ds-btn-lg">
                For Brands
              </Link>
              <Link href={"/schools/register" as Route} className="ds-btn ds-btn-secondary ds-btn-lg">
                Register A School
              </Link>
              <Link href={"/dashboard" as Route} className="ds-btn ds-btn-green ds-btn-lg">
                Impact Dashboard
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
