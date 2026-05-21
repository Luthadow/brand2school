import type { Campaign, CampaignScopeType } from "../../generated/prisma/index.js";
import { prisma } from "../../lib/prisma.js";
import { contributionPerCodeFromCampaign } from "../funding/fundingConversion.js";
import { normalizeProvinceCode, provinceNameFromCode, SA_PROVINCES } from "../analytics/provinces.js";

export type SchoolGeoContext = {
  id: string;
  province: string;
  district: string;
  name?: string;
};

export type CampaignEligibilityReason =
  | "GEO_INELIGIBLE"
  | "BUDGET_EXHAUSTED"
  | "CAMPAIGN_INACTIVE"
  | "CAMPAIGN_WINDOW";

export type CampaignAlternative = {
  slug: string;
  name: string;
  brandName: string;
  scopeType: CampaignScopeType;
  scopeLabel: string;
};

export type EligibilityEvaluation =
  | {
      eligible: true;
      remainingBudgetZar: number | null;
    }
  | {
      eligible: false;
      reason: CampaignEligibilityReason;
      userMessage: string;
      schoolProvinceCode: string;
      schoolProvinceName: string;
      campaignScopeType: CampaignScopeType;
      allowedProvinceNames: string[];
    };

export function scopeTypeLabel(scopeType: CampaignScopeType): string {
  switch (scopeType) {
    case "NATIONAL":
      return "National transformation territory";
    case "PROVINCIAL":
      return "Provincial impact territory";
    case "DISTRICT":
      return "District transformation territory";
    case "SCHOOL_CLUSTER":
      return "School transformation territory";
    default:
      return scopeType;
  }
}

export function formatAllowedProvinces(codes: string[]): string[] {
  return codes.map((code) => provinceNameFromCode(normalizeProvinceCode(code)));
}

function normalizeDistrict(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function schoolMatchesCampaignGeo(
  school: SchoolGeoContext,
  campaign: Pick<Campaign, "scopeType" | "allowedProvinces" | "allowedDistricts" | "allowedSchoolIds">
): boolean {
  switch (campaign.scopeType) {
    case "NATIONAL":
      return true;
    case "PROVINCIAL": {
      if (campaign.allowedProvinces.length === 0) return false;
      const schoolCode = normalizeProvinceCode(school.province);
      return campaign.allowedProvinces.some((p) => normalizeProvinceCode(p) === schoolCode);
    }
    case "DISTRICT": {
      if (campaign.allowedDistricts.length === 0) return false;
      const schoolDistrict = normalizeDistrict(school.district);
      return campaign.allowedDistricts.some((d) => normalizeDistrict(d) === schoolDistrict);
    }
    case "SCHOOL_CLUSTER":
      return campaign.allowedSchoolIds.includes(school.id);
    default:
      return false;
  }
}

export function remainingCampaignBudgetZar(
  campaign: Pick<Campaign, "budgetAllocatedZar" | "budgetConsumedZar">
): number | null {
  if (campaign.budgetAllocatedZar == null) return null;
  const allocated = Number(campaign.budgetAllocatedZar);
  if (allocated <= 0) return null;
  const consumed = Number(campaign.budgetConsumedZar ?? 0);
  return Math.max(0, Math.round((allocated - consumed) * 100) / 100);
}

export function campaignHasBudgetForContribution(
  campaign: Pick<Campaign, "budgetAllocatedZar" | "budgetConsumedZar" | "contributionPerCodeZar">,
  contributionZar?: number
): boolean {
  const remaining = remainingCampaignBudgetZar(campaign);
  if (remaining == null) return true;
  const cost = contributionZar ?? contributionPerCodeFromCampaign(campaign);
  return remaining >= cost;
}

export function evaluateCampaignEligibility(
  campaign: Pick<
    Campaign,
    | "scopeType"
    | "allowedProvinces"
    | "allowedDistricts"
    | "allowedSchoolIds"
    | "isActive"
    | "startsAt"
    | "endsAt"
    | "budgetAllocatedZar"
    | "budgetConsumedZar"
    | "contributionPerCodeZar"
    | "name"
  >,
  school: SchoolGeoContext,
  now = new Date()
): EligibilityEvaluation {
  const schoolProvinceCode = normalizeProvinceCode(school.province);
  const schoolProvinceName = provinceNameFromCode(schoolProvinceCode);
  const allowedProvinceNames = formatAllowedProvinces(campaign.allowedProvinces);

  if (!campaign.isActive) {
    return {
      eligible: false,
      reason: "CAMPAIGN_INACTIVE",
      userMessage: `Campaign "${campaign.name}" is not active right now.`,
      schoolProvinceCode,
      schoolProvinceName,
      campaignScopeType: campaign.scopeType,
      allowedProvinceNames
    };
  }

  if (now < campaign.startsAt || now > campaign.endsAt) {
    return {
      eligible: false,
      reason: "CAMPAIGN_WINDOW",
      userMessage: `Campaign "${campaign.name}" is outside its active dates.`,
      schoolProvinceCode,
      schoolProvinceName,
      campaignScopeType: campaign.scopeType,
      allowedProvinceNames
    };
  }

  if (!schoolMatchesCampaignGeo(school, campaign)) {
    const provinceList =
      allowedProvinceNames.length > 0 ? allowedProvinceNames.join(", ") : "selected regions";
    return {
      eligible: false,
      reason: "GEO_INELIGIBLE",
      userMessage: buildGeoRedirectMessage({
        campaignName: campaign.name,
        scopeType: campaign.scopeType,
        schoolProvinceName,
        allowedProvinceNames
      }),
      schoolProvinceCode,
      schoolProvinceName,
      campaignScopeType: campaign.scopeType,
      allowedProvinceNames
    };
  }

  if (!campaignHasBudgetForContribution(campaign)) {
    return {
      eligible: false,
      reason: "BUDGET_EXHAUSTED",
      userMessage: [
        `Campaign "${campaign.name}" has reached its allocated budget for now.`,
        "",
        "Your code is still valid — try a national campaign or check back when the brand renews this package."
      ].join("\n"),
      schoolProvinceCode,
      schoolProvinceName,
      campaignScopeType: campaign.scopeType,
      allowedProvinceNames
    };
  }

  return { eligible: true, remainingBudgetZar: remainingCampaignBudgetZar(campaign) };
}

export function buildGeoRedirectMessage(input: {
  campaignName: string;
  scopeType: CampaignScopeType;
  schoolProvinceName: string;
  allowedProvinceNames: string[];
}): string {
  const target =
    input.scopeType === "PROVINCIAL" && input.allowedProvinceNames.length > 0
      ? input.allowedProvinceNames.join(", ")
      : input.scopeType === "DISTRICT"
        ? "selected districts"
        : "selected schools";

  return [
    `This campaign (${input.campaignName}) currently supports ${target} only.`,
    "",
    `Your school is in ${input.schoolProvinceName}, so this provincial allocation does not apply yet.`,
    "",
    "You can:",
    "• support a school in the eligible region, OR",
    `• join national campaigns available in ${input.schoolProvinceName}.`,
    "",
    "Your product code was NOT used — submit again with an eligible campaign slug."
  ].join("\n");
}

export async function findEligibleCampaignAlternatives(
  school: SchoolGeoContext,
  options?: { excludeCampaignId?: string; limit?: number }
): Promise<CampaignAlternative[]> {
  const now = new Date();
  const limit = options?.limit ?? 5;

  const campaigns = await prisma.campaign.findMany({
    where: {
      isActive: true,
      startsAt: { lte: now },
      endsAt: { gte: now },
      ...(options?.excludeCampaignId ? { id: { not: options.excludeCampaignId } } : {})
    },
    include: { brand: { select: { name: true, status: true } } },
    orderBy: [{ scopeType: "asc" }, { startsAt: "desc" }],
    take: 40
  });

  const matches: CampaignAlternative[] = [];
  for (const campaign of campaigns) {
    if (campaign.brand.status !== "ACTIVE") continue;
    if (!schoolMatchesCampaignGeo(school, campaign)) continue;
    if (!campaignHasBudgetForContribution(campaign)) continue;

    matches.push({
      slug: campaign.slug,
      name: campaign.name,
      brandName: campaign.brand.name,
      scopeType: campaign.scopeType,
      scopeLabel: describeCampaignScope(campaign)
    });

    if (matches.length >= limit) break;
  }

  return matches;
}

export function describeCampaignScope(
  campaign: Pick<Campaign, "scopeType" | "allowedProvinces" | "allowedDistricts" | "allowedSchoolIds">
): string {
  switch (campaign.scopeType) {
    case "NATIONAL":
      return "All provinces";
    case "PROVINCIAL":
      return formatAllowedProvinces(campaign.allowedProvinces).join(", ") || "Provincial";
    case "DISTRICT":
      return campaign.allowedDistricts.slice(0, 3).join(", ") || "District-targeted";
    case "SCHOOL_CLUSTER":
      return `${campaign.allowedSchoolIds.length} school(s)`;
    default:
      return scopeTypeLabel(campaign.scopeType);
  }
}

export async function resolveOverflowCampaign(
  campaign: Pick<Campaign, "overflowCampaignId">
): Promise<CampaignAlternative | null> {
  if (!campaign.overflowCampaignId) return null;

  const overflow = await prisma.campaign.findUnique({
    where: { id: campaign.overflowCampaignId },
    include: { brand: { select: { name: true, status: true } } }
  });

  if (!overflow || !overflow.isActive || overflow.brand.status !== "ACTIVE") return null;

  return {
    slug: overflow.slug,
    name: overflow.name,
    brandName: overflow.brand.name,
    scopeType: overflow.scopeType,
    scopeLabel: describeCampaignScope(overflow)
  };
}

export async function findDefaultNationalOverflow(): Promise<CampaignAlternative | null> {
  const now = new Date();
  const national = await prisma.campaign.findFirst({
    where: {
      isActive: true,
      scopeType: "NATIONAL",
      startsAt: { lte: now },
      endsAt: { gte: now }
    },
    include: { brand: { select: { name: true, status: true } } },
    orderBy: { startsAt: "desc" }
  });

  if (!national || national.brand.status !== "ACTIVE") return null;

  return {
    slug: national.slug,
    name: national.name,
    brandName: national.brand.name,
    scopeType: national.scopeType,
    scopeLabel: "National infrastructure pool"
  };
}

export function listProvinceOptions(): Array<{ code: string; name: string }> {
  return SA_PROVINCES.map((p) => ({ code: p.code, name: p.name }));
}
