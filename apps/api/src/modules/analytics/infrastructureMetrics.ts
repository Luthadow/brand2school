export const INFRASTRUCTURE_CATEGORIES = [
  "Toilets",
  "Water",
  "Electricity",
  "Libraries",
  "Nutrition",
  "Digital access"
] as const;

export type InfrastructureProgressMetric = {
  category: (typeof INFRASTRUCTURE_CATEGORIES)[number];
  progressPercent: number;
  schoolsCount: number;
  verifiedDeliveries: number;
};

type CampaignInfraInput = {
  category: string | null;
  infrastructureGoal: string | null;
  validSubmissions: number;
  targetSubmissions: number;
};

type SchoolInfraItem = {
  category?: string;
  completionPercent?: number;
  verificationStatus?: string;
};

function normalizeCategoryLabel(raw: string): (typeof INFRASTRUCTURE_CATEGORIES)[number] | null {
  const text = raw.toLowerCase();
  if (/toilet|sanitation|lavatory/.test(text)) return "Toilets";
  if (/water|tank|borehole|plumb/.test(text)) return "Water";
  if (/electric|solar|power|light|energy/.test(text)) return "Electricity";
  if (/library|book|reading/.test(text)) return "Libraries";
  if (/nutrition|food|meal|feeding/.test(text)) return "Nutrition";
  if (/digital|computer|wifi|internet|lab|smart/.test(text)) return "Digital access";
  return null;
}

export function mapCampaignToInfrastructureCategory(
  category: string | null,
  infrastructureGoal: string | null
): (typeof INFRASTRUCTURE_CATEGORIES)[number] | null {
  return normalizeCategoryLabel(`${category ?? ""} ${infrastructureGoal ?? ""}`.trim());
}

export function buildInfrastructureProgressFromCampaigns(
  campaigns: CampaignInfraInput[]
): InfrastructureProgressMetric[] {
  const totals = new Map<(typeof INFRASTRUCTURE_CATEGORIES)[number], { progress: number; schools: number; verified: number }>();

  for (const category of INFRASTRUCTURE_CATEGORIES) {
    totals.set(category, { progress: 0, schools: 0, verified: 0 });
  }

  for (const campaign of campaigns) {
    const category = mapCampaignToInfrastructureCategory(campaign.category, campaign.infrastructureGoal);
    if (!category) continue;
    const bucket = totals.get(category)!;
    const target = Math.max(campaign.targetSubmissions, 1);
    const progress = Math.min(100, Math.round((campaign.validSubmissions / target) * 100));
    bucket.progress = Math.max(bucket.progress, progress);
    bucket.schools += campaign.validSubmissions > 0 ? 1 : 0;
    bucket.verified += campaign.validSubmissions;
  }

  return INFRASTRUCTURE_CATEGORIES.map((category) => {
    const bucket = totals.get(category)!;
    return {
      category,
      progressPercent: bucket.progress,
      schoolsCount: bucket.schools,
      verifiedDeliveries: bucket.verified
    };
  });
}

export function buildInfrastructureProgressFromSchools(
  schools: Array<{ id?: string; infrastructureItems: unknown }>
): InfrastructureProgressMetric[] {
  const totals = new Map<
    (typeof INFRASTRUCTURE_CATEGORIES)[number],
    { sum: number; count: number; verified: number; schools: Set<string> }
  >();

  for (const category of INFRASTRUCTURE_CATEGORIES) {
    totals.set(category, { sum: 0, count: 0, verified: 0, schools: new Set() });
  }

  for (const school of schools) {
    const items = Array.isArray(school.infrastructureItems)
      ? (school.infrastructureItems as SchoolInfraItem[])
      : [];
    for (const item of items) {
      if (!item.category) continue;
      const category = normalizeCategoryLabel(item.category);
      if (!category) continue;
      const bucket = totals.get(category)!;
      const completion = Math.max(0, Math.min(100, Number(item.completionPercent ?? 0)));
      bucket.sum += completion;
      bucket.count += 1;
      bucket.schools.add(school.id ?? "school");
      if (item.verificationStatus === "verified") bucket.verified += 1;
    }
  }

  return INFRASTRUCTURE_CATEGORIES.map((category) => {
    const bucket = totals.get(category)!;
    const progressPercent = bucket.count > 0 ? Math.round(bucket.sum / bucket.count) : 0;
    return {
      category,
      progressPercent,
      schoolsCount: bucket.schools.size,
      verifiedDeliveries: bucket.verified
    };
  });
}

export async function buildPlatformInfrastructureProgress(): Promise<InfrastructureProgressMetric[]> {
  const { prisma } = await import("../../lib/prisma.js");
  const [campaigns, schools] = await Promise.all([
    prisma.campaign.findMany({
      select: {
        category: true,
        infrastructureGoal: true,
        targetSubmissions: true,
        submissions: { where: { state: "VALID" }, select: { id: true } }
      }
    }),
    prisma.school.findMany({
      select: { id: true, infrastructureItems: true },
      take: 500
    })
  ]);

  const fromCampaigns = buildInfrastructureProgressFromCampaigns(
    campaigns.map((c) => ({
      category: c.category,
      infrastructureGoal: c.infrastructureGoal,
      validSubmissions: c.submissions.length,
      targetSubmissions: c.targetSubmissions
    }))
  );

  const schoolsWithItems = schools.filter((school) => Array.isArray(school.infrastructureItems) && school.infrastructureItems.length > 0);
  const fromSchools =
    schoolsWithItems.length > 0
      ? buildInfrastructureProgressFromSchools(schoolsWithItems)
      : fromCampaigns.map((row) => ({ ...row, progressPercent: 0, schoolsCount: 0, verifiedDeliveries: 0 }));

  return INFRASTRUCTURE_CATEGORIES.map((category, index) => {
    const campaignRow = fromCampaigns[index]!;
    const schoolRow = fromSchools[index]!;
    return {
      category,
      progressPercent: Math.max(campaignRow.progressPercent, schoolRow.progressPercent),
      schoolsCount: Math.max(campaignRow.schoolsCount, schoolRow.schoolsCount),
      verifiedDeliveries: campaignRow.verifiedDeliveries + schoolRow.verifiedDeliveries
    };
  });
}
