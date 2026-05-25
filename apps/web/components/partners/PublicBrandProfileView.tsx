import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import { PublicProvinceMap } from "./PublicProvinceMap";
import { CampaignShowcaseCard } from "./CampaignShowcaseCard";
import { BrandTrustPanel } from "../brand/BrandTrustPanel";
import type { PublicBrandProfile } from "../../lib/platformPublic";
import { formatCount } from "../../lib/formatCount";

type Props = {
  profile: PublicBrandProfile;
  /** Show verification QR + certificate sidebar (canonical /brand/ page). */
  showTrustPanel?: boolean;
};

export function PublicBrandProfileView({ profile, showTrustPanel = false }: Props): JSX.Element {
  const accent = profile.brandColor ?? "#003b8e";

  return (
    <>
      <section className="lp-section" style={{ borderBottom: `4px solid ${accent}` }}>
        <div className={`lp-container ${showTrustPanel ? "b2s-brand-profile-layout" : "pp-profile-header"}`}>
          <div className="b2s-brand-profile-main">
            {profile.logoUrl ? (
              <Image
                src={profile.logoUrl}
                alt={`${profile.name} logo`}
                width={180}
                height={72}
                className="lp-trust-logo-img"
              />
            ) : null}
            <p className="ds-eyebrow" style={{ marginTop: "1rem" }}>
              {profile.isTrusted ? "Verified education partner" : "Education partner"}
              {profile.founderVerified ? " · Founding brand" : ""}
              {profile.partnerRank ? ` · #${profile.partnerRank} by impact` : ""}
            </p>
            <h1 className="ds-section-title ds-section-title--left">{profile.name}</h1>
            {profile.description ? <p className="lp-problem-text">{profile.description}</p> : null}
            <div className="pp-profile-stats">
              <div>
                <strong>{formatCount(profile.validSubmissions)}</strong>
                <span>Verified participations</span>
              </div>
              <div>
                <strong>{profile.schoolsReached}</strong>
                <span>Schools reached</span>
              </div>
              <div>
                <strong>{profile.activeCampaigns}</strong>
                <span>Active campaigns</span>
              </div>
            </div>
            {profile.websiteUrl ? (
              <a
                href={profile.websiteUrl}
                className="ds-btn ds-btn-secondary"
                target="_blank"
                rel="noopener noreferrer"
              >
                Visit brand website
              </a>
            ) : null}
          </div>

          {showTrustPanel ? (
            <BrandTrustPanel
              brandName={profile.name}
              slug={profile.slug}
              verificationCode={profile.verificationCode}
              verificationStatus={profile.verificationStatus}
              founderVerified={profile.founderVerified}
              isTrusted={profile.isTrusted}
              verifyUrl={profile.verifyUrl}
              certificatePdfUrl={profile.certificatePdfUrl}
              verifyQrImageUrl={profile.verifyQrImageUrl}
              brandQrImageUrl={profile.brandQrImageUrl}
              accent={accent}
            />
          ) : null}
        </div>
      </section>

      <section className="lp-section lp-section-light">
        <div className="lp-container">
          <h2 className="ds-section-title ds-section-title--left">Live impact by province</h2>
          <PublicProvinceMap provinces={profile.provinces} />
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-container">
          <h2 className="ds-section-title ds-section-title--left">Campaign showcase</h2>
          {profile.campaigns.length === 0 ? (
            <p className="lp-live-empty">Campaigns will appear here when launched.</p>
          ) : (
            <div className="lp-campaign-grid">
              {profile.campaigns.map((c) => (
                <CampaignShowcaseCard
                  key={c.id}
                  campaign={{
                    slug: c.slug,
                    name: c.name,
                    brandSlug: profile.slug,
                    brandName: profile.name,
                    brandLogoUrl: profile.logoUrl,
                    category: c.category,
                    infrastructureGoal: c.infrastructureGoal,
                    validSubmissions: c.validSubmissions,
                    targetSubmissions: c.targetSubmissions,
                    schoolsParticipating: c.schoolsParticipating,
                    percentToTarget: c.percentToTarget,
                    isActive: c.isActive
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {profile.topSchools.length > 0 ? (
        <section className="lp-section lp-section-light">
          <div className="lp-container">
            <h2 className="ds-section-title ds-section-title--left">Top contributing schools</h2>
            <ol className="lp-leaderboard-list">
              {profile.topSchools.map((school) => (
                <li key={`${school.schoolName}-${school.province}`} className="lp-leaderboard-row">
                  <div className="lp-leaderboard-info">
                    <strong>{school.schoolName}</strong>
                    <span>{school.province}</span>
                  </div>
                  <span className="lp-leaderboard-score">{formatCount(school.submissions)}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>
      ) : null}

      <section className="lp-section">
        <div className="lp-container" style={{ textAlign: "center" }}>
          <Link href="/trust" className="ds-btn ds-btn-secondary">
            How we verify partners
          </Link>
          <Link href="/movement" className="ds-btn ds-btn-primary" style={{ marginLeft: "0.75rem" }}>
            See national movement
          </Link>
        </div>
      </section>
    </>
  );
}
