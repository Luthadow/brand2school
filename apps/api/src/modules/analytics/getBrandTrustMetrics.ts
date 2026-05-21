import { prisma } from "../../lib/prisma.js";

export type BrandTrustMetrics = {
  fraudAttemptsBlocked: number;
  duplicateCodesRejected: number;
  invalidCodesRejected: number;
  flaggedSubmissions: number;
  auditEventsLogged: number;
  protectionActive: boolean;
  protections: string[];
  recentAuditEvents: Array<{
    action: string;
    targetType: string;
    createdAt: string;
    summary: string;
  }>;
  fraudByOutcome: Array<{ outcome: string; count: number }>;
};

const PROTECTIONS = [
  "Duplicate Detection",
  "Real-Time Verification",
  "Audit Tracking",
  "Abuse Monitoring",
  "Checksum Integrity",
  "Brute-Force Blocking"
];

export async function getBrandTrustMetrics(campaignId?: string, brandId?: string): Promise<BrandTrustMetrics> {
  let attemptWhere: Record<string, unknown> = {};
  if (campaignId) {
    attemptWhere = { campaignSlug: { in: await campaignSlugsForId(campaignId) } };
  } else if (brandId) {
    attemptWhere = { campaignSlug: { in: await campaignSlugsForBrand(brandId) } };
  }

  const submissionWhere = campaignId
    ? { state: "FLAGGED_FOR_REVIEW" as const, campaignId, ...(brandId ? { campaign: { brandId } } : {}) }
    : brandId
      ? { state: "FLAGGED_FOR_REVIEW" as const, campaign: { brandId } }
      : { state: "FLAGGED_FOR_REVIEW" as const };

  const [
    fraudBlocked,
    duplicates,
    invalidPatterns,
    flaggedSubmissions,
    auditCount,
    recentAudits,
    groupedOutcomes
  ] = await Promise.all([
    prisma.submissionAttempt.count({
      where: { ...attemptWhere, outcome: { in: ["FRAUD_BLOCKED", "BRUTE_FORCE"] } }
    }),
    prisma.submissionAttempt.count({ where: { ...attemptWhere, outcome: "DUPLICATE" } }),
    prisma.submissionAttempt.count({
      where: { ...attemptWhere, outcome: { in: ["INVALID_PATTERN", "NOT_FOUND", "CHECKSUM_FAILED"] } }
    }),
    prisma.submission.count({ where: submissionWhere }),
    prisma.auditLog.count({
      where: {
        action: {
          in: [
            "CODE_VERIFIED",
            "CODE_FLAGGED",
            "CODE_BATCH_GENERATED",
            "PARTICIPATION_VERIFIED",
            "ATTEMPT_DUPLICATE",
            "ATTEMPT_FRAUD_BLOCKED",
            "ATTEMPT_NOT_FOUND"
          ]
        }
      }
    }),
    prisma.auditLog.findMany({
      where: {
        action: { in: ["CODE_VERIFIED", "CODE_FLAGGED", "CODE_BATCH_GENERATED", "ATTEMPT_DUPLICATE", "ATTEMPT_FRAUD_BLOCKED"] }
      },
      orderBy: { createdAt: "desc" },
      take: 8
    }),
    prisma.submissionAttempt.groupBy({
      by: ["outcome"],
      _count: { _all: true },
      orderBy: { _count: { outcome: "desc" } },
      take: 8
    })
  ]);

  return {
    fraudAttemptsBlocked: fraudBlocked,
    duplicateCodesRejected: duplicates,
    invalidCodesRejected: invalidPatterns,
    flaggedSubmissions,
    auditEventsLogged: auditCount,
    protectionActive: true,
    protections: PROTECTIONS,
    recentAuditEvents: recentAudits.map((row) => ({
      action: row.action,
      targetType: row.targetType,
      createdAt: row.createdAt.toISOString(),
      summary: summarizeAudit(row.action, row.payload)
    })),
    fraudByOutcome: groupedOutcomes.map((g) => ({
      outcome: g.outcome,
      count: g._count._all
    }))
  };
}

async function campaignSlugsForBrand(brandId: string): Promise<string[]> {
  const campaigns = await prisma.campaign.findMany({ where: { brandId }, select: { slug: true } });
  return campaigns.map((c) => c.slug);
}

async function campaignSlugsForId(campaignId: string): Promise<string[]> {
  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId }, select: { slug: true } });
  return campaign ? [campaign.slug] : [];
}

function summarizeAudit(action: string, payload: unknown): string {
  const p = (payload ?? {}) as Record<string, unknown>;
  if (action === "CODE_VERIFIED") {
    return `Verified ${String(p.code ?? p.productCode ?? "code")} for ${String(p.schoolName ?? "school")}`;
  }
  if (action === "CODE_FLAGGED") {
    return `Flagged ${String(p.code ?? "code")} — risk ${String(p.riskScore ?? "")}`;
  }
  if (action === "CODE_BATCH_GENERATED") {
    return `Generated batch (${String(p.count ?? "")} codes)`;
  }
  if (action.startsWith("ATTEMPT_")) {
    return `Blocked attempt: ${action.replace("ATTEMPT_", "")}`;
  }
  return action;
}

