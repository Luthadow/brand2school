import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import {
  CheckCircle2,
  Download,
  Eye,
  Globe2,
  Handshake,
  Heart,
  Leaf,
  Lightbulb,
  MapPin,
  Scale,
  Shield,
  Target,
  Users
} from "lucide-react";
import { FadeIn } from "../../components/landing/FadeIn";
import { SectionHeader } from "../../components/landing/SectionHeader";
import { COMPANY, formatCompanyAddressLines } from "../../lib/company";
import { PUBLIC_CONTACT_LIST, PUBLIC_PHONE, mailto } from "../../lib/contact";

export const metadata: Metadata = {
  title: "About Us — Brand2School",
  description:
    "Brand2School is South Africa's Customer Participation Platform — connecting brands, schools, community organisations and communities through verified participation campaigns that create lasting social impact."
};

const initiatives = [
  "Education and school development",
  "Environmental sustainability programmes",
  "Community clean-up campaigns",
  "Feeding schemes",
  "Sports development initiatives",
  "Youth empowerment programmes",
  "Digital skills and technology projects",
  "Reading and literacy campaigns",
  "Arts and cultural development",
  "Community upliftment projects"
];

const differentiators = [
  "Campaign creation and management",
  "School and organisation participation",
  "Activity verification",
  "Real-time reporting",
  "Impact measurement",
  "Audit trails and accountability",
  "Community engagement",
  "Brand performance dashboards"
];

const verificationMethods = [
  "Unique participation codes",
  "Digital confirmations",
  "GPS validation",
  "Photo evidence",
  "Partner verification",
  "Audit trails",
  "Real-time campaign reporting"
];

const coreValues = [
  {
    icon: Scale,
    title: "Integrity",
    text: "We operate honestly, ethically and responsibly in all our activities."
  },
  {
    icon: Eye,
    title: "Transparency",
    text: "We believe impact should be measurable, visible and accountable."
  },
  {
    icon: Lightbulb,
    title: "Innovation",
    text: "We use technology to solve real-world challenges and create new opportunities."
  },
  {
    icon: Users,
    title: "Community",
    text: "We place communities at the centre of every campaign and initiative."
  },
  {
    icon: Handshake,
    title: "Collaboration",
    text: "We believe meaningful change happens when people and organisations work together."
  },
  {
    icon: Shield,
    title: "Accountability",
    text: "We take responsibility for delivering reliable and trustworthy solutions."
  },
  {
    icon: Leaf,
    title: "Sustainability",
    text: "We support initiatives that create long-term positive outcomes."
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
              Brand2School
              <span className="lp-hero-title-accent">Transforming Everyday Participation into Lasting Impact</span>
            </h1>
            <p className="lp-hero-sub lp-hero-sub--emotional">
              South Africa&apos;s Customer Participation Platform — connecting brands, schools, community
              organisations and communities through measurable campaigns.
            </p>
            <div className="lp-hero-actions">
              <a href="/api/platform/company-profile/pdf" className="ds-btn ds-btn-primary ds-btn-lg">
                <Download size={18} aria-hidden />
                Download Company Profile (PDF)
              </a>
              <Link href={"/#contact" as Route} className="ds-btn ds-btn-secondary ds-btn-lg">
                Get in Touch
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      <section className="lp-section lp-section-light">
        <div className="lp-container about-intro-grid">
          <FadeIn className="about-intro-copy">
            <SectionHeader
              eyebrow="The Platform"
              title="Participation That Creates Real Change"
              subtitle="Technology, transparency and community engagement — turned into verified social impact."
            />
            <p className="about-body">
              Brand2School is South Africa&apos;s Customer Participation Platform, designed to connect brands,
              schools, community organisations and communities through measurable participation campaigns that
              create meaningful and sustainable social impact.
            </p>
            <p className="about-body">
              We believe that every purchase, activity and act of participation has the power to contribute
              towards stronger schools, empowered communities and a better future for all.
            </p>
            <p className="about-body">
              By combining technology, transparency and community engagement, Brand2School enables organisations
              to transform everyday participation into real-world impact that can be measured, verified and
              celebrated.
            </p>
          </FadeIn>
          <FadeIn delay={0.1} className="about-intro-visual">
            <div className="about-logo-card">
              <Image
                src="/brand2school.png"
                alt="Brand2School"
                width={1536}
                height={1024}
                className="about-logo"
                priority
              />
              <p className="about-product-line">A product of Nkanyezi Tech Solutions</p>
            </div>
          </FadeIn>
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-container about-prose">
          <FadeIn>
            <SectionHeader
              eyebrow="Our Story"
              title="A Simple but Powerful Idea"
              subtitle="What if brands, communities and organisations could work together to create measurable social impact through everyday participation?"
            />
            <p className="about-body">
              Across South Africa, thousands of schools and community organisations continue to serve their
              communities despite limited resources and growing challenges. At the same time, millions of
              consumers interact with brands every day through purchases, community activities and engagement
              programmes.
            </p>
            <p className="about-body about-body--emphasis">Brand2School was created to bridge this gap.</p>
            <p className="about-body">
              Instead of relying solely on donations and once-off sponsorships, Brand2School provides a
              structured platform where participation becomes a driver of positive change. Through verified
              campaigns, brands can engage customers while supporting causes that matter to communities.
            </p>
            <p className="about-body">
              Today, Brand2School continues to grow as a platform that enables brands, schools, community
              organisations and citizens to collaborate in creating measurable outcomes that strengthen society.
            </p>
          </FadeIn>
        </div>
      </section>

      <section className="lp-section lp-section-light">
        <div className="lp-container">
          <FadeIn>
            <SectionHeader
              eyebrow="Who We Are"
              title="A Technology-Driven Social Impact Platform"
              subtitle="We help organisations launch and manage verified customer participation campaigns."
            />
            <p className="about-body about-body--narrow">
              Our platform supports a wide range of initiatives. Every campaign is designed around transparency,
              accountability and measurable impact.
            </p>
          </FadeIn>
          <FadeIn delay={0.06}>
            <ul className="about-check-list about-check-list--grid">
              {initiatives.map((item) => (
                <li key={item}>
                  <CheckCircle2 size={18} />
                  {item}
                </li>
              ))}
            </ul>
          </FadeIn>
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-container about-vision-grid">
          <FadeIn className="about-vision-card">
            <Globe2 size={28} />
            <h2>Our Vision</h2>
            <p>
              To become Africa&apos;s leading customer participation platform, where brands, organisations and
              communities work together to create measurable, transparent and sustainable social impact.
            </p>
          </FadeIn>
          <FadeIn delay={0.08} className="about-vision-card about-vision-card--mission">
            <Target size={28} />
            <h2>Our Mission</h2>
            <p>
              To provide a trusted technology platform that enables brands, schools, community organisations and
              communities to collaborate through verified participation campaigns that improve lives while
              strengthening engagement and accountability.
            </p>
          </FadeIn>
        </div>
      </section>

      <section className="lp-section lp-section-light">
        <div className="lp-container about-two-col">
          <FadeIn>
            <SectionHeader
              eyebrow="What Makes Us Different"
              title="Technology, Verification & Impact Measurement"
              subtitle="One platform that combines campaign tools with audit-ready accountability."
            />
            <p className="about-body">
              Through our verification engine, every qualifying activity can be tracked, validated and reported,
              providing confidence for both participating organisations and beneficiaries.
            </p>
            <ul className="about-check-list">
              {differentiators.map((item) => (
                <li key={item}>
                  <CheckCircle2 size={18} />
                  {item}
                </li>
              ))}
            </ul>
          </FadeIn>
          <FadeIn delay={0.08}>
            <article className="about-company-card about-trust-card">
              <Shield size={28} className="about-trust-card__icon" />
              <p className="about-company-eyebrow">Transparency &amp; Accountability</p>
              <h3>Trust is at the heart of everything we do</h3>
              <p className="about-body">
                Brand2School uses structured verification processes to ensure that every campaign delivers
                credible and measurable outcomes. Depending on campaign requirements, verification may include:
              </p>
              <ul className="about-check-list">
                {verificationMethods.map((item) => (
                  <li key={item}>
                    <CheckCircle2 size={18} />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="about-body">
                This commitment to transparency helps brands, organisations and communities see the true impact
                of their participation.
              </p>
            </article>
          </FadeIn>
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-container">
          <FadeIn>
            <SectionHeader
              eyebrow="What Guides Us"
              title="Our Values"
              subtitle="The principles behind every campaign and every system we build."
            />
          </FadeIn>
          <div className="about-values-grid">
            {coreValues.map((value, i) => {
              const Icon = value.icon;
              return (
                <FadeIn key={value.title} delay={i * 0.04}>
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
          </div>
        </div>
      </section>

      <section className="lp-section lp-section-light">
        <div className="lp-container">
          <FadeIn>
            <SectionHeader
              eyebrow="Our Company"
              title="A Product of Nkanyezi Tech Solutions"
              subtitle="Proudly developed and operated by Nkanyezi Tech Solutions (Pty) Ltd — a South African technology company focused on innovative digital solutions with meaningful social impact."
            />
          </FadeIn>
          <div className="about-nkanyezi-grid">
            <FadeIn className="about-nkanyezi-copy">
              <p className="about-body">
                Nkanyezi Tech Solutions develops technology platforms that empower businesses, educational
                institutions, communities and organisations through innovation, digital transformation and
                sustainable development.
              </p>
              <p className="about-body">
                Brand2School represents the company&apos;s commitment to using technology as a force for positive
                change across South Africa and beyond.
              </p>
              <div className="about-founder">
                <Heart size={22} />
                <div>
                  <h3>About the Founder</h3>
                  <p className="about-body">
                    Brand2School was founded by <strong>Raphael Luthando Sogoni</strong>, a South African
                    entrepreneur, technology innovator and founder of Nkanyezi Tech Solutions.
                  </p>
                  <p className="about-body">
                    Driven by a passion for technology, community development and social impact, Raphael
                    established Brand2School with the vision of creating a platform where brands and communities
                    can work together to address real challenges through measurable participation and transparent
                    impact.
                  </p>
                  <p className="about-body">
                    His vision continues to guide the platform&apos;s growth as Brand2School expands its reach and
                    empowers organisations to create lasting change across South Africa.
                  </p>
                </div>
              </div>
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

      <section className="lp-section about-cta">
        <div className="lp-container about-cta-inner">
          <FadeIn>
            <p className="ds-eyebrow">Building South Africa Together</p>
            <h2>Brand2School is more than a platform</h2>
            <p>
              It is a movement that believes meaningful change happens when brands, schools, community
              organisations and communities work together toward a common purpose. Every campaign represents an
              opportunity to transform participation into impact, engagement into empowerment and everyday actions
              into extraordinary outcomes.
            </p>
            <p className="about-cta-closing">
              Together, we are building stronger schools, stronger communities and a brighter future for South
              Africa.
            </p>
            <div className="lp-hero-actions">
              <a href="/api/platform/company-profile/pdf" className="ds-btn ds-btn-primary ds-btn-lg">
                <Download size={18} aria-hidden />
                Download Company Profile
              </a>
              <Link href={"/for-brands" as Route} className="ds-btn ds-btn-secondary ds-btn-lg">
                For Brands
              </Link>
              <Link href={"/schools/register" as Route} className="ds-btn ds-btn-green ds-btn-lg">
                Register A School
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
