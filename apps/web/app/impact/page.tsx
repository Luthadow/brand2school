import type { Metadata } from "next";
import Link from "next/link";
import { FadeIn } from "../../components/landing/FadeIn";
import { SectionHeader } from "../../components/landing/SectionHeader";
import { PublicImpactPanels } from "../../components/impact/PublicImpactPanels";
import { emptyPublicImpactDashboard, fetchPublicImpactDashboard } from "../../lib/platformImpact";

export const metadata: Metadata = {
  title: "National Impact Dashboard — Governance & Transparency | Brand2School",
  description:
    "Aggregated, POPIA-safe impact metrics: verified schools, infrastructure progress, fraud governance, and provincial participation across South Africa."
};

export default async function ImpactPage(): Promise<JSX.Element> {
  const impact = (await fetchPublicImpactDashboard()) ?? emptyPublicImpactDashboard();

  return (
    <div className="lp impact-page">
      <section className="lp-hero lp-hero--movement impact-hero">
        <div className="lp-hero-glow" aria-hidden="true" />
        <div className="lp-container">
          <FadeIn>
            <p className="ds-eyebrow">Public accountability</p>
            <h1 className="lp-hero-title">
              National Impact
              <span className="lp-hero-title-accent"> You Can Audit</span>
            </h1>
            <p className="lp-hero-sub">{impact.positioning}</p>
            <p className="impact-hero-note">
              Aggregated metrics only — no learner PII. Campaign go-live follows commercial governance (agreement,
              platform fee, approved codes, rules).
            </p>
            <div className="lp-hero-actions">
              <Link href="/movement" className="ds-btn ds-btn-secondary ds-btn-lg">
                Live Movement
              </Link>
              <Link href="/for-brands" className="ds-btn ds-btn-primary ds-btn-lg">
                Partner With Us
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      <section className="lp-section lp-section-light">
        <div className="lp-container">
          <FadeIn>
            <SectionHeader
              eyebrow="Governance-first reporting"
              title="Verified ecosystem impact"
              subtitle={`${impact.liveCampaigns} live transformation campaigns · updated from platform audit data`}
            />
          </FadeIn>
          <PublicImpactPanels data={impact} />
        </div>
      </section>
    </div>
  );
}
