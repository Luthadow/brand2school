/** Fixed contribution tiers brands must pick at campaign creation (ZAR). */
export const CONTRIBUTION_PER_CODE_OPTIONS_ZAR = [2, 5, 10] as const;

export type ContributionPerCodeOptionZar = (typeof CONTRIBUTION_PER_CODE_OPTIONS_ZAR)[number];

export function isAllowedContributionPerCodeZar(value: number): value is ContributionPerCodeOptionZar {
  return (CONTRIBUTION_PER_CODE_OPTIONS_ZAR as readonly number[]).includes(value);
}

/** Campaign statuses where contribution-per-code is locked (cannot be edited). */
export function contributionPerCodeIsLocked(commercialStatus: string | null | undefined): boolean {
  return ["LIVE", "PAUSED", "SUSPENDED", "EXPIRED"].includes(commercialStatus ?? "");
}

export function schoolSupportGeneratedZar(verifiedCount: number, contributionPerCodeZar: number): number {
  return Math.round(verifiedCount * contributionPerCodeZar * 100) / 100;
}

/** Milestone checkpoints as fractions of the verified-code target. */
export const CAMPAIGN_MILESTONE_FRACTIONS = [0.1, 0.25, 0.5, 0.75, 1] as const;

export type CampaignMilestone = {
  verifiedCodes: number;
  generatedZar: number;
  fraction: number;
  reached: boolean;
  label: string;
};

export function buildCampaignMilestones(input: {
  targetSubmissions: number;
  verifiedCount: number;
  contributionPerCodeZar: number;
}): CampaignMilestone[] {
  const target = Math.max(input.targetSubmissions, 1);
  const perCode = input.contributionPerCodeZar;
  return CAMPAIGN_MILESTONE_FRACTIONS.map((fraction) => {
    const verifiedCodes = Math.round(target * fraction);
    const generatedZar = schoolSupportGeneratedZar(verifiedCodes, perCode);
    const reached = input.verifiedCount >= verifiedCodes;
    let label = `${Math.round(fraction * 100)}% of journey`;
    if (fraction === 0.1) label = "First milestone unlocked";
    if (fraction === 0.25) label = "Quarter of the journey complete";
    if (fraction === 0.5) label = "Halfway there";
    if (fraction === 0.75) label = "75% achieved";
    if (fraction === 1) label = "Campaign target reached";
    return { verifiedCodes, generatedZar, fraction, reached, label };
  });
}
