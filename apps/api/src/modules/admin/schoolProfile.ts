import { prisma } from "../../lib/prisma.js";
import { getCentreTypeLabel } from "../../lib/organizationCategories.js";
import { getSchoolFundingLedger } from "../funding/fundingConversion.js";
import { getSchoolCampaignProgress } from "../participation/services/campaignProgress.js";
import { getSchoolRankings } from "../schools/schoolParticipation.js";
import { buildSchoolNeedsEngine, summarizeNeedsEngine } from "../schools/schoolNeedsEngine.js";
import {
  countValidSubmissionsForSchool,
  persistSchoolInfrastructure
} from "../schools/syncSchoolInfrastructure.js";
import { serializeSchoolVerification } from "../schools/schoolVerification/serializeSchoolVerification.js";
import { formatSchoolAddress, resolveSchoolEmail } from "./verifiedSchools.js";

export async function getAdminSchoolProfile(schoolId: string) {
  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    include: {
      adminUser: { select: { id: true, fullName: true, email: true, status: true } },
      verification: true
    }
  });

  if (!school) return null;

  const [
    learnerCount,
    validSubmissions,
    flaggedSubmissions,
    rejectedSubmissions,
    validCount,
    funding,
    rankings
  ] = await Promise.all([
    prisma.learner.count({ where: { schoolId: school.id } }),
    prisma.submission.count({ where: { schoolId: school.id, state: "VALID" } }),
    prisma.submission.count({ where: { schoolId: school.id, state: "FLAGGED_FOR_REVIEW" } }),
    prisma.submission.count({ where: { schoolId: school.id, state: "REJECTED" } }),
    countValidSubmissionsForSchool(school.id),
    getSchoolFundingLedger(school.id, 8),
    getSchoolRankings(50)
  ]);

  const { development } = await persistSchoolInfrastructure({
    school: {
      id: school.id,
      name: school.name,
      province: school.province,
      district: school.district,
      principalName: school.principalName,
      contactEmail: school.contactEmail,
      currentPhase: school.currentPhase,
      developmentTier: school.developmentTier,
      developmentScores: school.developmentScores,
      phaseHistory: school.phaseHistory,
      infrastructureItems: school.infrastructureItems,
      annualCycleYear: school.annualCycleYear,
      annualCycleFocus: school.annualCycleFocus
    },
    validSubmissions: validCount,
    notifyGovernance: false
  });

  const needs = buildSchoolNeedsEngine(development);
  const rankEntry = rankings.find((row) => row.schoolId === school.id);

  const activeCampaigns = await prisma.campaign.findMany({
    where: { isActive: true },
    include: { brand: { select: { name: true } } },
    orderBy: { name: "asc" },
    take: 8
  });

  const campaigns = await Promise.all(
    activeCampaigns.map(async (campaign) => {
      const progress = await getSchoolCampaignProgress(
        school.id,
        campaign.id,
        campaign.targetSubmissions
      );
      return {
        id: campaign.id,
        name: campaign.name,
        brandName: campaign.brand.name,
        validSubmissions: progress.validSubmissions,
        targetSubmissions: progress.targetSubmissions,
        percentToTarget: progress.percentToTarget
      };
    })
  );

  const verification = school.verification
    ? serializeSchoolVerification(school.verification, school.organizationCategory)
    : null;

  const infraVerified = development.infrastructure.items.filter(
    (item) => item.verificationStatus === "verified" && item.completionPercent >= 100
  ).length;

  return {
    school: {
      id: school.id,
      name: school.name,
      province: school.province,
      district: school.district,
      address: formatSchoolAddress(school),
      principalName: school.principalName,
      contactEmail: school.contactEmail,
      email: resolveSchoolEmail({
        contactEmail: school.contactEmail,
        adminUser: school.adminUser
      }),
      whatsappPhone: school.whatsappPhone,
      schoolCode: school.schoolCode,
      organizationCategory: school.organizationCategory,
      status: school.status,
      annualCycleYear: school.annualCycleYear,
      annualCycleFocus: school.annualCycleFocus,
      createdAt: school.createdAt.toISOString(),
      updatedAt: school.updatedAt.toISOString()
    },
    adminUser: school.adminUser,
    verification,
    participation: {
      learnerCount,
      validSubmissions,
      flaggedSubmissions,
      rejectedSubmissions
    },
    development: {
      currentPhase: development.currentPhase,
      tier: development.tier,
      tierLabel: development.tierLabel,
      nationalScore: development.nationalScore,
      centreTypeLabel: verification?.centreType
        ? getCentreTypeLabel(school.organizationCategory, verification.centreType)
        : null,
      phases: development.phases.map((phase) => ({
        phase: phase.phase,
        title: phase.title,
        status: phase.status,
        progressPercent: phase.progressPercent
      })),
      infrastructureTotal: development.infrastructure.items.length,
      infrastructureVerified: infraVerified
    },
    needsSummary: summarizeNeedsEngine(needs),
    funding: {
      balanceZar: funding.balanceZar,
      lifetimeGrossZar: funding.lifetimeGrossZar,
      recent: funding.recent
    },
    nationalRank: rankEntry?.rank ?? null,
    campaigns
  };
}
