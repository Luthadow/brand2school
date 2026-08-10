import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { CampaignMilestonePanel } from "../../../components/campaigns/CampaignMilestonePanel";
import { ProvinceNominationForm } from "../../../components/campaigns/ProvinceNominationForm";
import { ParticipationSubmitForm } from "../../../components/participation/ParticipationSubmitForm";
import { fetchPublicCampaign } from "../../../lib/platformPublic";
import { formatCount } from "../../../lib/formatCount";

function formatZar(value: string): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return `R${value}`;
  return `R${n.toLocaleString("en-ZA", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export default async function PublicCampaignPage({
  params
}: {
  params: { slug: string };
}): Promise<JSX.Element> {
  const campaign = await fetchPublicCampaign(params.slug);
  if (!campaign) notFound();

  const accent = campaign.brandColor ?? "#003b8e";
  const generated = campaign.schoolSupportGeneratedZar ?? campaign.fundingRaisedZar;

  return (
    <div className="lp pp-page">
      <section className="lp-section lp-section-light" style={{ borderBottom: `4px solid ${accent}` }}>
        <div className="lp-container">
          <p className="ds-eyebrow">
            <Link href={`/brand/${campaign.brandSlug}` as Route}>{campaign.brandName}</Link>
            {campaign.category ? ` · ${campaign.category}` : ""}
          </p>
          <h1 className="ds-section-title ds-section-title--left">{campaign.name}</h1>
          <p className="lp-problem-text">
            Helping turn everyday purchases into school support.
            {campaign.infrastructureGoal ? ` ${campaign.infrastructureGoal}` : ""}
          </p>
          <div className="pp-profile-stats">
            <div>
              <strong>{formatCount(campaign.validSubmissions)}</strong>
              <span>Verified codes</span>
            </div>
            <div>
              <strong>{formatZar(generated)}</strong>
              <span>School Support Generated</span>
            </div>
            <div>
              <strong>{campaign.percentToTarget}%</strong>
              <span>Campaign progress</span>
            </div>
          </div>
          {campaign.brandLogoUrl ? (
            <Image
              src={campaign.brandLogoUrl}
              alt=""
              width={120}
              height={48}
              className="lp-trust-logo-img"
              style={{ marginTop: "1rem" }}
            />
          ) : null}
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-container" style={{ maxWidth: "48rem" }}>
          <CampaignMilestonePanel campaign={campaign} />
        </div>
      </section>

      <section className="lp-section lp-section-light">
        <div className="lp-container pp-campaign-detail-grid">
          <div className="card">
            <h2>How to participate</h2>
            <p>{campaign.participationHint}</p>
            <p style={{ marginTop: "1rem" }}>
              <strong>Campaign slug:</strong> <code>{campaign.slug}</code>
            </p>
            <div style={{ marginTop: "1rem", display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
              <Link href={`/submit?campaign=${campaign.slug}` as Route} className="ds-btn ds-btn-primary">
                Submit a code online
              </Link>
              <Link href="/schools/register" className="ds-btn ds-btn-secondary">
                Register your school
              </Link>
            </div>
          </div>
          <div className="card">
            <h2>Verified impact</h2>
            <ul className="lp-trust-list">
              <li>
                Contribution per verified code: <strong>{formatZar(campaign.contributionPerCodeZar)}</strong>
              </li>
              <li>
                School Support Generated: <strong>{formatZar(generated)}</strong>
              </li>
              <li>
                {formatCount(campaign.validSubmissions)} verified × {formatZar(campaign.contributionPerCodeZar)}
              </li>
              <li>
                Runs: {new Date(campaign.startsAt).toLocaleDateString("en-ZA")} –{" "}
                {new Date(campaign.endsAt).toLocaleDateString("en-ZA")}
              </li>
              <li>Target: {formatCount(campaign.targetSubmissions)} verified participations</li>
              <li>Scope: {campaign.scopeLabel}</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-container" style={{ maxWidth: "42rem" }}>
          <h2 className="ds-section-title ds-section-title--left">Submit on the website</h2>
          <p className="lp-problem-text" style={{ marginBottom: "1.25rem" }}>
            Use the form below or WhatsApp — same verification engine. Contribution only increases after a code is
            verified.
          </p>
          <ParticipationSubmitForm
            defaultBrandSlug={campaign.brandSlug}
            defaultCampaignSlug={campaign.slug}
          />
        </div>
      </section>

      {campaign.scopeType !== "NATIONAL" ? (
        <section className="lp-section lp-section-light">
          <div className="lp-container">
            <h2 className="ds-section-title ds-section-title--left">Request campaigns in your province</h2>
            <p className="lp-problem-text">
              This package is limited to specific regions. If your school is elsewhere, nominate your province for
              future brand investment.
            </p>
            <ProvinceNominationForm
              campaignSlug={campaign.slug}
              defaultProvinceCode={campaign.eligibleProvinces?.[0]}
            />
          </div>
        </section>
      ) : null}
    </div>
  );
}
