import type { CampaignEligibilityReason, CampaignAlternative } from "../../campaigns/campaignEligibility.js";

export type ParticipationEligibilityPayload = {
  schoolProvince: string;
  campaignScope: string;
  allowedProvinces: string[];
  alternatives: CampaignAlternative[];
  overflowCampaign: CampaignAlternative | null;
  nominateProvince: boolean;
};

export function buildParticipationEligibilityPayload(input: {
  reason: CampaignEligibilityReason;
  schoolProvinceName: string;
  campaignScopeLabel: string;
  allowedProvinceNames: string[];
  alternatives: CampaignAlternative[];
  overflowCampaign: CampaignAlternative | null;
}): ParticipationEligibilityPayload {
  return {
    schoolProvince: input.schoolProvinceName,
    campaignScope: input.campaignScopeLabel,
    allowedProvinces: input.allowedProvinceNames,
    alternatives: input.alternatives,
    overflowCampaign: input.overflowCampaign,
    nominateProvince: input.reason === "GEO_INELIGIBLE"
  };
}
