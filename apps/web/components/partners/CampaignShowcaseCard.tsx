import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import { formatCount } from "../../lib/formatCount";
import { CampaignScopeBadge } from "../campaigns/CampaignScopeBadge";
import type { PublicCampaignCard } from "../../lib/platformPublic";

export function CampaignShowcaseCard({ campaign }: { campaign: PublicCampaignCard }): JSX.Element {
  return (
    <Link href={`/campaigns/${campaign.slug}` as Route} className="lp-campaign-card pp-campaign-link">
      <div className="lp-campaign-header">
        <div>
          <h3>{campaign.name}</h3>
          <CampaignScopeBadge campaign={campaign} />
          <span className="lp-campaign-province">
            {campaign.brandLogoUrl ? (
              <Image src={campaign.brandLogoUrl} alt="" width={64} height={24} className="lp-trust-logo-img" />
            ) : null}
            {campaign.brandName}
            {campaign.category ? ` · ${campaign.category}` : ""}
          </span>
        </div>
        <span className="lp-campaign-learners">{campaign.schoolsParticipating} schools</span>
      </div>
      <p className="lp-campaign-goal">
        {campaign.infrastructureGoal ?? "Verified participation toward school infrastructure goals."}
      </p>
      <div className="lp-campaign-bar-wrap">
        <div className="lp-campaign-bar" style={{ width: `${Math.max(campaign.percentToTarget, 3)}%` }} />
      </div>
      <div className="lp-campaign-footer">
        <span className="lp-campaign-pct">
          {campaign.percentToTarget}% · {formatCount(campaign.validSubmissions)} /{" "}
          {formatCount(campaign.targetSubmissions)} verified
        </span>
        {campaign.isActive ? (
          <span className="lp-campaign-live">
            <span className="ds-live-dot" />
            Live
          </span>
        ) : null}
      </div>
    </Link>
  );
}
