import type { Metadata } from "next";
import Link from "next/link";
import { Award, MessageCircle, School } from "lucide-react";
import { LiveCampaignsPanel } from "../../components/landing/LiveCampaignsPanel";
import { LiveImpactBand } from "../../components/landing/LiveImpactBand";
import { LiveMovementPanel } from "../../components/landing/LiveMovementPanel";
import { LivePlatformProvider } from "../../components/landing/LivePlatformProvider";
import { LiveTicker } from "../../components/landing/LiveTicker";
import { SectionHeader } from "../../components/landing/SectionHeader";
import { FadeIn } from "../../components/landing/FadeIn";
import { PartnerRankingsPanel } from "../../components/partners/PartnerRankingsPanel";
import { ProvinceNominationForm } from "../../components/campaigns/ProvinceNominationForm";
import { CampaignPerformancePanel } from "../../components/landing/CampaignPerformancePanel";
import { emptyPlatformCredibility, fetchPlatformCredibility } from "../../lib/platformCredibility";
import { emptyPlatformLiveOffline, fetchPlatformLive } from "../../lib/platformLive";
import { fetchPlatformRankings } from "../../lib/platformPublic";

export const metadata: Metadata = {
  title: "The Movement — Live School Participation | Brand2School",
  description:
    "Watch verified school participation grow in real time — leaderboards, campaigns, and province momentum across South Africa."
};

export default async function MovementPage(): Promise<JSX.Element> {
  const [liveInitial, rankings, credibilityInitial] = await Promise.all([
    fetchPlatformLive(),
    fetchPlatformRankings(),
    fetchPlatformCredibility()
  ]);
  const live = liveInitial ?? emptyPlatformLiveOffline();
  const credibility = credibilityInitial ?? emptyPlatformCredibility();

  return (
    <LivePlatformProvider initial={live}>
      <div className="lp movement-page">
        <LiveTicker variant="marquee" />

        <section className="lp-hero lp-hero--movement movement-hero">
          <div className="lp-hero-glow" aria-hidden="true" />
          <div className="lp-container movement-hero-inner">
            <FadeIn>
              <p className="ds-eyebrow ds-eyebrow--pulse">National Movement</p>
              <h1 className="lp-hero-title">
                Participation You Can
                <span className="lp-hero-title-accent"> See Growing</span>
              </h1>
              <p className="lp-hero-sub lp-hero-sub--emotional">
                Every verified WhatsApp submission moves a school closer to infrastructure goals. This page updates
                live as communities participate — no app download required.
              </p>
              <div className="lp-hero-actions">
                <Link href="/schools/register" className="ds-btn ds-btn-primary ds-btn-lg">
                  Register Your School
                </Link>
                <Link href="/#how-it-works" className="ds-btn ds-btn-secondary ds-btn-lg">
                  How It Works
                </Link>
              </div>
            </FadeIn>
          </div>
        </section>

        <section className="lp-section lp-section-metrics">
          <div className="lp-container">
            <FadeIn>
              <SectionHeader
                eyebrow="Live Impact"
                title="Verified Participation Nationwide"
                subtitle="Real counters from the Brand2School trust network — schools, campaigns, and provinces."
                light
              />
            </FadeIn>
            <LiveImpactBand />
          </div>
        </section>

        <section className="lp-section lp-movement">
          <div className="lp-container">
            <FadeIn>
              <SectionHeader
                eyebrow="Movement Engine"
                title="Schools Leading The Charge"
                subtitle="Monthly rankings and province reach update as families submit product codes on WhatsApp."
              />
            </FadeIn>
            <LiveMovementPanel />
          </div>
        </section>

        {rankings ? (
          <section className="lp-section lp-section-light">
            <div className="lp-container">
              <FadeIn>
                <SectionHeader
                  eyebrow="Rankings"
                  title="Schools &amp; Partner Impact"
                  subtitle="Monthly school leaderboard and verified brand partner rankings."
                />
              </FadeIn>
              <PartnerRankingsPanel rankings={rankings} />
            </div>
          </section>
        ) : null}

        <section className="lp-section lp-section-light">
          <div className="lp-container">
            <FadeIn>
              <SectionHeader
                eyebrow="ESG Engine"
                title="Campaign Performance Analytics"
                subtitle="Verification rate, code engagement, and conversion toward infrastructure targets — the reporting layer brands and funders trust."
              />
            </FadeIn>
            <CampaignPerformancePanel rows={credibility.campaignPerformance} />
          </div>
        </section>

        <section className="lp-section lp-campaigns">
          <div className="lp-container">
            <FadeIn>
              <SectionHeader
                eyebrow="Active Missions"
                title="Campaigns Building School Ecosystems"
                subtitle="Brand partners fund infrastructure goals — sports fields, labs, nutrition, and more."
                light
              />
            </FadeIn>
            <LiveCampaignsPanel />
          </div>
        </section>

        <section className="lp-section movement-cta">
          <div className="lp-container movement-cta-inner">
            <FadeIn>
              <School size={28} />
              <h2>Your school can join today</h2>
              <p>Principals register once. Communities submit codes on WhatsApp. Progress is verified and visible.</p>
              <div className="lp-hero-actions">
                <Link href="/schools/register" className="ds-btn ds-btn-primary ds-btn-lg">
                  Register School
                </Link>
                <Link href="/brand/login" className="ds-btn ds-btn-secondary ds-btn-lg">
                  <Award size={18} />
                  Brand Partner Login
                </Link>
              </div>
            </FadeIn>
          </div>
        </section>

        <section className="lp-section lp-section-light">
          <div className="lp-container">
            <FadeIn>
              <SectionHeader
                eyebrow="Future campaigns"
                title="Nominate Your Province"
                subtitle="Brands allocate provincial packages based on demand. Tell us where the next mission should land."
              />
            </FadeIn>
            <ProvinceNominationForm />
          </div>
        </section>

        <section className="lp-section movement-wa">
          <div className="lp-container movement-wa-inner">
            <MessageCircle size={32} />
            <h3>No app. Just WhatsApp.</h3>
            <p>
              Submit: <code>SUBMIT | School Name | District | campaign-slug | PRODUCT_CODE</code>
            </p>
          </div>
        </section>
      </div>
    </LivePlatformProvider>
  );
}
