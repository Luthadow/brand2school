import { prisma } from "../../../lib/prisma.js";
import {
  computeFraudVelocitySnapshot,
  detectSuspiciousProvinces,
  type SubmissionVelocityRow
} from "../../analytics/fraudVelocity.js";
import { freezeSchoolForFraudReview } from "./anomaly.js";

const HOUR_MS = 60 * 60 * 1000;
const PLATFORM_HOLD_COOLDOWN_MS = Number(process.env.FRAUD_VELOCITY_HOLD_COOLDOWN_MS ?? String(60 * 60 * 1000));
const SCHOOL_VELOCITY_MIN_HOURLY = Number(process.env.FRAUD_VELOCITY_SCHOOL_HOURLY_MIN ?? "40");
const PROVINCE_SCHOOL_HOURLY_MIN = Number(process.env.FRAUD_VELOCITY_PROVINCE_SCHOOL_MIN ?? "60");

const PLATFORM_HOLD_AUDIT = "FRAUD_VELOCITY_PLATFORM_HOLD";

export type FraudVelocityGovernanceResult = {
  schoolVelocityStatus: "normal" | "elevated" | "high";
  platformVelocityStatus: "normal" | "elevated" | "high";
  schoolFrozen: boolean;
  schoolsFrozenInProvinces: number;
  campaignsPaused: number;
  platformHoldApplied: boolean;
};

async function loadVelocityRows(schoolId?: string, take = 4000): Promise<SubmissionVelocityRow[]> {
  const weekAgo = new Date(Date.now() - 7 * 24 * HOUR_MS);
  const rows = await prisma.submission.findMany({
    where: {
      createdAt: { gte: weekAgo },
      ...(schoolId ? { schoolId } : {})
    },
    select: {
      createdAt: true,
      state: true,
      schoolId: true,
      school: { select: { province: true } }
    },
    orderBy: { createdAt: "desc" },
    take
  });

  return rows.map((row) => ({
    createdAt: row.createdAt,
    state: row.state,
    schoolId: row.schoolId,
    schoolProvince: row.school.province
  }));
}

async function loadAttemptOutcomes(take = 2000): Promise<Array<{ createdAt: Date; outcome: string }>> {
  return prisma.submissionAttempt.findMany({
    select: { createdAt: true, outcome: true },
    orderBy: { createdAt: "desc" },
    take
  });
}

async function platformHoldRecentlyApplied(): Promise<boolean> {
  const since = new Date(Date.now() - PLATFORM_HOLD_COOLDOWN_MS);
  const recent = await prisma.auditLog.findFirst({
    where: { action: PLATFORM_HOLD_AUDIT, createdAt: { gte: since } },
    select: { id: true }
  });
  return Boolean(recent);
}

async function pauseLiveCampaignsForFraudHold(snapshot: ReturnType<typeof computeFraudVelocitySnapshot>): Promise<number> {
  if (await platformHoldRecentlyApplied()) {
    return 0;
  }

  const liveCampaigns = await prisma.campaign.findMany({
    where: { commercialStatus: "LIVE", isActive: true },
    select: { id: true, slug: true, name: true }
  });

  if (liveCampaigns.length === 0) {
    return 0;
  }

  const now = new Date();
  await prisma.$transaction([
    prisma.campaign.updateMany({
      where: { id: { in: liveCampaigns.map((c) => c.id) } },
      data: { commercialStatus: "PAUSED", isActive: false }
    }),
    prisma.auditLog.create({
      data: {
        action: PLATFORM_HOLD_AUDIT,
        targetType: "Platform",
        targetId: "fraud-velocity",
        payload: {
          campaignsPaused: liveCampaigns.map((c) => ({ id: c.id, slug: c.slug })),
          velocityRatio: snapshot.velocityRatio,
          submissionsLastHour: snapshot.submissionsLastHour,
          avgVerifiedPerHour7d: snapshot.avgVerifiedPerHour7d,
          status: snapshot.status
        }
      }
    })
  ]);

  return liveCampaigns.length;
}

async function freezeSchoolsInAlertProvinces(
  platformRows: SubmissionVelocityRow[],
  snapshot: ReturnType<typeof computeFraudVelocitySnapshot>
): Promise<number> {
  const alertProvinces = new Set(
    detectSuspiciousProvinces(platformRows)
      .filter((p) => p.alert)
      .map((p) => p.province.toLowerCase())
  );
  if (alertProvinces.size === 0) return 0;

  const hourAgo = Date.now() - HOUR_MS;
  const schoolHourly = new Map<string, { count: number; province: string }>();

  for (const row of platformRows) {
    if (row.state !== "VALID" || row.createdAt.getTime() < hourAgo || !row.schoolId) continue;
    const provinceKey = (row.schoolProvince ?? "").trim().toLowerCase();
    if (!alertProvinces.has(provinceKey)) continue;
    const bucket = schoolHourly.get(row.schoolId) ?? { count: 0, province: row.schoolProvince ?? "" };
    bucket.count += 1;
    schoolHourly.set(row.schoolId, bucket);
  }

  let frozen = 0;
  for (const [schoolId, stats] of schoolHourly) {
    if (stats.count < PROVINCE_SCHOOL_HOURLY_MIN) continue;
    const didFreeze = await freezeSchoolForFraudReview(schoolId, {
      reason: "PROVINCE_VELOCITY_ALERT",
      province: stats.province,
      hourlyValidSubmissions: stats.count,
      platformVelocityRatio: snapshot.velocityRatio,
      threshold: PROVINCE_SCHOOL_HOURLY_MIN
    });
    if (didFreeze) frozen += 1;
  }

  return frozen;
}

/**
 * After a verified participation, evaluate fraud velocity and apply holds:
 * - School-level `high` → SCHOOL_AUTO_FROZEN (FRAUD_VELOCITY_HIGH)
 * - Platform-level `high` → pause LIVE campaigns + freeze hot schools in alert provinces
 */
export async function enforceFraudVelocityGovernance(input: {
  schoolId: string;
  schoolProvince?: string;
  now?: Date;
}): Promise<FraudVelocityGovernanceResult> {
  const now = input.now ?? new Date();

  const [schoolRows, platformRows, attempts] = await Promise.all([
    loadVelocityRows(input.schoolId, 3000),
    loadVelocityRows(undefined, 5000),
    loadAttemptOutcomes()
  ]);

  const schoolSnapshot = computeFraudVelocitySnapshot(schoolRows, attempts);
  let schoolFrozen = false;

  if (
    schoolSnapshot.status === "high" &&
    schoolSnapshot.submissionsLastHour >= SCHOOL_VELOCITY_MIN_HOURLY
  ) {
    schoolFrozen = await freezeSchoolForFraudReview(input.schoolId, {
      reason: "FRAUD_VELOCITY_HIGH",
      velocityRatio: schoolSnapshot.velocityRatio,
      submissionsLastHour: schoolSnapshot.submissionsLastHour,
      avgVerifiedPerHour7d: schoolSnapshot.avgVerifiedPerHour7d,
      province: input.schoolProvince ?? null
    });
  }

  const platformSnapshot = computeFraudVelocitySnapshot(platformRows, attempts);
  let campaignsPaused = 0;
  let schoolsFrozenInProvinces = 0;
  let platformHoldApplied = false;

  const shouldEvaluatePlatform =
    schoolSnapshot.status !== "normal" || platformSnapshot.status !== "normal";

  if (shouldEvaluatePlatform && platformSnapshot.status === "high") {
    campaignsPaused = await pauseLiveCampaignsForFraudHold(platformSnapshot);
    platformHoldApplied = campaignsPaused > 0 || (await platformHoldRecentlyApplied());
    schoolsFrozenInProvinces = await freezeSchoolsInAlertProvinces(platformRows, platformSnapshot);
  }

  if (platformSnapshot.status === "elevated" && !platformHoldApplied) {
    schoolsFrozenInProvinces += await freezeSchoolsInAlertProvinces(platformRows, platformSnapshot);
  }

  return {
    schoolVelocityStatus: schoolSnapshot.status,
    platformVelocityStatus: platformSnapshot.status,
    schoolFrozen,
    schoolsFrozenInProvinces,
    campaignsPaused,
    platformHoldApplied
  };
}
