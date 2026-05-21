import type { Prisma } from "../../generated/prisma/index.js";
import { prisma } from "../../lib/prisma.js";

export type ImpactMetricsSnapshot = {
  schoolsTargeted: number;
  schoolsReached: number;
  waterPhasesCompleted: number;
  activeInfrastructureProjects: number;
  validSubmissions: number;
  updatedAt: string;
};

const EMPTY: ImpactMetricsSnapshot = {
  schoolsTargeted: 0,
  schoolsReached: 0,
  waterPhasesCompleted: 0,
  activeInfrastructureProjects: 0,
  validSubmissions: 0,
  updatedAt: new Date().toISOString()
};

function parseCommitment(raw: Prisma.JsonValue | null): Partial<ImpactMetricsSnapshot> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const o = raw as Record<string, unknown>;
  return {
    schoolsTargeted: typeof o.schoolsTargeted === "number" ? o.schoolsTargeted : undefined,
    schoolsReached: typeof o.schoolsReached === "number" ? o.schoolsReached : undefined,
    waterPhasesCompleted: typeof o.waterPhasesCompleted === "number" ? o.waterPhasesCompleted : undefined,
    activeInfrastructureProjects:
      typeof o.activeInfrastructureProjects === "number" ? o.activeInfrastructureProjects : undefined
  };
}

export async function computeDeliveredImpact(campaignId: string): Promise<ImpactMetricsSnapshot> {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: {
      allowedSchoolIds: true,
      impactCommitment: true,
      submissions: {
        where: { state: "VALID" },
        select: { schoolId: true, school: { select: { developmentScores: true, currentPhase: true } } }
      }
    }
  });
  if (!campaign) return { ...EMPTY };

  const commitment = parseCommitment(campaign.impactCommitment);
  const schoolIds = new Set(campaign.submissions.map((s) => s.schoolId));
  const schoolsReached = schoolIds.size;

  let waterPhasesCompleted = 0;
  for (const sub of campaign.submissions) {
    const scores = sub.school.developmentScores;
    if (scores && typeof scores === "object" && !Array.isArray(scores)) {
      const water = (scores as Record<string, unknown>).water;
      if (water === "complete" || water === 1) {
        waterPhasesCompleted += 1;
        continue;
      }
    }
    if (sub.school.currentPhase >= 2) waterPhasesCompleted += 1;
  }

  const schoolsTargeted =
    commitment.schoolsTargeted ??
    (campaign.allowedSchoolIds.length > 0 ? campaign.allowedSchoolIds.length : schoolsReached);

  return {
    schoolsTargeted,
    schoolsReached,
    waterPhasesCompleted: commitment.waterPhasesCompleted ?? Math.min(waterPhasesCompleted, schoolsReached),
    activeInfrastructureProjects:
      commitment.activeInfrastructureProjects ?? Math.max(1, Math.floor(schoolsReached / 5)),
    validSubmissions: campaign.submissions.length,
    updatedAt: new Date().toISOString()
  };
}

export async function refreshCampaignImpactDelivered(campaignId: string): Promise<ImpactMetricsSnapshot> {
  const delivered = await computeDeliveredImpact(campaignId);
  await prisma.campaign.update({
    where: { id: campaignId },
    data: { impactDelivered: delivered as object }
  });
  return delivered;
}

export function serializeImpactComparison(
  commitment: Prisma.JsonValue | null,
  delivered: ImpactMetricsSnapshot
): { committed: ImpactMetricsSnapshot; delivered: ImpactMetricsSnapshot; variance: ImpactMetricsSnapshot } {
  const committed = { ...EMPTY, ...parseCommitment(commitment) };
  return {
    committed,
    delivered,
    variance: {
      schoolsTargeted: committed.schoolsTargeted - delivered.schoolsReached,
      schoolsReached: committed.schoolsReached - delivered.schoolsReached,
      waterPhasesCompleted: committed.waterPhasesCompleted - delivered.waterPhasesCompleted,
      activeInfrastructureProjects:
        committed.activeInfrastructureProjects - delivered.activeInfrastructureProjects,
      validSubmissions: 0,
      updatedAt: delivered.updatedAt
    }
  };
}
