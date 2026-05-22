import { prisma } from "../../lib/prisma.js";
import { registeredSchoolWhere } from "../../lib/schoolMetrics.js";

export type FunnelStageMetric = {
  stage: string;
  count: number;
};

export async function buildTransformationFunnel(
  scope?: { campaignId?: string; brandId?: string }
): Promise<FunnelStageMetric[]> {
  const schoolWhere = registeredSchoolWhere;
  const submissionWhere = scope?.campaignId
    ? { campaignId: scope.campaignId, ...(scope.brandId ? { campaign: { brandId: scope.brandId } } : {}) }
    : scope?.brandId
      ? { campaign: { brandId: scope.brandId } }
      : undefined;

  const campaignWhere = {
    ...(scope?.campaignId ? { id: scope.campaignId } : {}),
    ...(scope?.brandId ? { brandId: scope.brandId } : {})
  };

  const [registered, verifiedSchoolGroups, fundedCampaigns, activeCampaigns, completedCampaigns] =
    await Promise.all([
      prisma.school.count({ where: schoolWhere }),
      prisma.submission.groupBy({
        by: ["schoolId"],
        where: { state: "VALID", ...(submissionWhere ?? {}) }
      }),
      prisma.campaign.count({
        where: {
          ...campaignWhere,
          fundingRaisedZar: { gt: 0 }
        }
      }),
      prisma.campaign.count({
        where: {
          ...campaignWhere,
          isActive: true,
          submissions: { some: { state: "VALID" } }
        }
      }),
      prisma.campaign.count({
        where: {
          ...campaignWhere,
          submissions: { some: { state: "VALID" } }
        }
      })
    ]);

  const verifiedSchools = verifiedSchoolGroups.length;
  const inProgress = Math.max(activeCampaigns - completedCampaigns, 0);

  return [
    { stage: "Registered", count: registered },
    { stage: "Verified", count: verifiedSchools },
    { stage: "Funded", count: fundedCampaigns },
    { stage: "In Progress", count: inProgress },
    { stage: "Completed", count: completedCampaigns }
  ];
}

export async function countInfrastructureMilestones(): Promise<number> {
  const schools = await prisma.school.findMany({
    select: { infrastructureItems: true, currentPhase: true },
    take: 1000
  });

  let milestones = 0;
  for (const school of schools) {
    const items = Array.isArray(school.infrastructureItems)
      ? (school.infrastructureItems as Array<{ verificationStatus?: string; completionPercent?: number }>)
      : [];
    const verifiedItems = items.filter((item) => item.verificationStatus === "verified").length;
    milestones += verifiedItems;
    if (school.currentPhase > 1) milestones += 1;
  }
  return milestones;
}
