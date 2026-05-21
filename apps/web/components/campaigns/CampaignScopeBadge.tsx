import { scopeBadgeVariant, formatScopeBadge, type CampaignScopeInput } from "../../lib/campaignScope";

export function CampaignScopeBadge({ campaign }: { campaign: CampaignScopeInput }): JSX.Element | null {
  const label = formatScopeBadge(campaign);
  if (!label) return null;

  const variant = scopeBadgeVariant(campaign.scopeType);
  return (
    <span className={`b2s-scope-badge b2s-scope-badge--${variant}`} title={campaign.scopeLabel ?? label}>
      {label}
    </span>
  );
}
