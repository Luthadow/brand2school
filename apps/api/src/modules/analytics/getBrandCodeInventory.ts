import { prisma } from "../../lib/prisma.js";

export type BrandCodeInventory = {
  totalCodes: number;
  unused: number;
  pending: number;
  used: number;
  duplicate: number;
  invalid: number;
  flagged: number;
  expired: number;
  invalidated: number;
  blocked: number;
  utilizationPercent: number;
  batchesCount: number;
  attemptDuplicates: number;
  attemptFraudBlocked: number;
};

export type CodeBatchInventoryRow = {
  id: string;
  batchName: string;
  batchCode: string;
  codeVersion: string;
  campaignId: string;
  campaignName: string;
  createdAt: string;
  expiresAt: string | null;
  totalCodes: number;
  unused: number;
  pending: number;
  used: number;
  duplicate: number;
  invalid: number;
  flagged: number;
  expired: number;
  invalidated: number;
  blocked: number;
  utilizationPercent: number;
};

export type AttemptOutcomeRow = {
  outcome: string;
  label: string;
  count: number;
};

export type BrandCodeInventoryDashboard = {
  summary: BrandCodeInventory;
  batches: CodeBatchInventoryRow[];
  attemptOutcomes: AttemptOutcomeRow[];
  generatedAt: string;
};

const STATUS_KEYS = [
  "UNUSED",
  "PENDING",
  "USED",
  "DUPLICATE",
  "INVALID",
  "FLAGGED",
  "EXPIRED",
  "INVALIDATED",
  "BLOCKED"
] as const;

type StatusKey = (typeof STATUS_KEYS)[number];

type StatusCounts = Record<StatusKey, number>;

const OUTCOME_LABELS: Record<string, string> = {
  DUPLICATE: "Duplicate submission",
  FRAUD_BLOCKED: "Fraud blocked",
  BRUTE_FORCE: "Brute-force blocked",
  INVALID_PATTERN: "Invalid pattern",
  NOT_FOUND: "Code not found",
  CHECKSUM_FAILED: "Checksum failed",
  EXPIRED: "Code expired",
  ALREADY_USED: "Already used",
  SUCCESS: "Successful verification",
  VALID: "Valid submission"
};

function emptyCounts(): StatusCounts {
  return Object.fromEntries(STATUS_KEYS.map((k) => [k, 0])) as StatusCounts;
}

function emptyInventory(): BrandCodeInventory {
  return {
    totalCodes: 0,
    unused: 0,
    pending: 0,
    used: 0,
    duplicate: 0,
    invalid: 0,
    flagged: 0,
    expired: 0,
    invalidated: 0,
    blocked: 0,
    utilizationPercent: 0,
    batchesCount: 0,
    attemptDuplicates: 0,
    attemptFraudBlocked: 0
  };
}

function countsToSummary(counts: StatusCounts, totalCodes: number, batchesCount: number, attemptDuplicates: number, attemptFraudBlocked: number): BrandCodeInventory {
  const utilizationPercent =
    totalCodes > 0 ? Math.round((counts.USED / totalCodes) * 1000) / 10 : 0;

  return {
    totalCodes,
    unused: counts.UNUSED,
    pending: counts.PENDING,
    used: counts.USED,
    duplicate: counts.DUPLICATE,
    invalid: counts.INVALID,
    flagged: counts.FLAGGED,
    expired: counts.EXPIRED,
    invalidated: counts.INVALIDATED,
    blocked: counts.BLOCKED,
    utilizationPercent,
    batchesCount,
    attemptDuplicates,
    attemptFraudBlocked
  };
}

function mergeGroupedCounts(
  grouped: Array<{ status: string; _count: { _all: number } }>
): { counts: StatusCounts; total: number } {
  const counts = emptyCounts();
  let total = 0;
  for (const row of grouped) {
    const key = row.status as StatusKey;
    if (key in counts) {
      counts[key] = row._count._all;
      total += row._count._all;
    }
  }
  return { counts, total };
}

function batchUtilization(used: number, total: number): number {
  return total > 0 ? Math.round((used / total) * 1000) / 10 : 0;
}

function outcomeLabel(outcome: string): string {
  return OUTCOME_LABELS[outcome] ?? outcome.replace(/_/g, " ").toLowerCase();
}

async function resolveScope(campaignId?: string, brandId?: string) {
  const codeWhere = campaignId
    ? { batch: { campaignId, ...(brandId ? { campaign: { brandId } } : {}) } }
    : brandId
      ? { batch: { campaign: { brandId } } }
      : undefined;

  const attemptWhere = campaignId
    ? { campaignSlug: { in: await campaignSlugsForId(campaignId) } }
    : brandId
      ? { campaignSlug: { in: await campaignSlugsForBrand(brandId) } }
      : undefined;

  const batchWhere = campaignId
    ? { campaignId, ...(brandId ? { campaign: { brandId } } : {}) }
    : brandId
      ? { campaign: { brandId } }
      : undefined;

  return { codeWhere, attemptWhere, batchWhere };
}

export async function getBrandCodeInventory(
  campaignId?: string,
  brandId?: string
): Promise<BrandCodeInventory> {
  const dashboard = await getBrandCodeInventoryDashboard(campaignId, brandId);
  return dashboard.summary;
}

export async function getBrandCodeInventoryDashboard(
  campaignId?: string,
  brandId?: string
): Promise<BrandCodeInventoryDashboard> {
  try {
    const { codeWhere, attemptWhere, batchWhere } = await resolveScope(campaignId, brandId);

    const [statusGrouped, batchGrouped, batches, attemptDuplicates, attemptFraudBlocked, attemptOutcomesRaw] =
      await Promise.all([
        prisma.code.groupBy({
          by: ["status"],
          where: codeWhere,
          _count: { _all: true }
        }),
        prisma.code.groupBy({
          by: ["batchId", "status"],
          where: codeWhere,
          _count: { _all: true }
        }),
        prisma.codeBatch.findMany({
          where: batchWhere,
          include: { campaign: { select: { id: true, name: true } } },
          orderBy: { createdAt: "desc" }
        }),
        prisma.submissionAttempt.count({
          where: { ...attemptWhere, outcome: "DUPLICATE" }
        }),
        prisma.submissionAttempt.count({
          where: { ...attemptWhere, outcome: { in: ["FRAUD_BLOCKED", "BRUTE_FORCE"] } }
        }),
        prisma.submissionAttempt.groupBy({
          by: ["outcome"],
          where: attemptWhere,
          _count: { _all: true },
          orderBy: { _count: { outcome: "desc" } }
        })
      ]);

    if (statusGrouped.length === 0 && batches.length === 0) {
      return {
        summary: emptyInventory(),
        batches: [],
        attemptOutcomes: [],
        generatedAt: new Date().toISOString()
      };
    }

    const { counts, total } = mergeGroupedCounts(statusGrouped);
    const summary = countsToSummary(
      counts,
      total,
      batches.length,
      attemptDuplicates,
      attemptFraudBlocked
    );

    const batchStatusMap = new Map<string, StatusCounts>();
    for (const row of batchGrouped) {
      const bucket = batchStatusMap.get(row.batchId) ?? emptyCounts();
      const key = row.status as StatusKey;
      if (key in bucket) bucket[key] = row._count._all;
      batchStatusMap.set(row.batchId, bucket);
    }

    const batchRows: CodeBatchInventoryRow[] = batches.map((batch) => {
      const batchCounts = batchStatusMap.get(batch.id) ?? emptyCounts();
      const batchTotal = STATUS_KEYS.reduce((sum, key) => sum + batchCounts[key], 0);
      return {
        id: batch.id,
        batchName: batch.batchName,
        batchCode: batch.batchCode,
        codeVersion: batch.codeVersion,
        campaignId: batch.campaign.id,
        campaignName: batch.campaign.name,
        createdAt: batch.createdAt.toISOString(),
        expiresAt: batch.expiresAt?.toISOString() ?? null,
        totalCodes: batchTotal,
        unused: batchCounts.UNUSED,
        pending: batchCounts.PENDING,
        used: batchCounts.USED,
        duplicate: batchCounts.DUPLICATE,
        invalid: batchCounts.INVALID,
        flagged: batchCounts.FLAGGED,
        expired: batchCounts.EXPIRED,
        invalidated: batchCounts.INVALIDATED,
        blocked: batchCounts.BLOCKED,
        utilizationPercent: batchUtilization(batchCounts.USED, batchTotal)
      };
    });

    const attemptOutcomes: AttemptOutcomeRow[] = attemptOutcomesRaw.map((row) => ({
      outcome: row.outcome,
      label: outcomeLabel(row.outcome),
      count: row._count._all
    }));

    return {
      summary,
      batches: batchRows,
      attemptOutcomes,
      generatedAt: new Date().toISOString()
    };
  } catch {
    return {
      summary: emptyInventory(),
      batches: [],
      attemptOutcomes: [],
      generatedAt: new Date().toISOString()
    };
  }
}

async function campaignSlugsForBrand(brandId: string): Promise<string[]> {
  const campaigns = await prisma.campaign.findMany({ where: { brandId }, select: { slug: true } });
  return campaigns.map((c) => c.slug);
}

async function campaignSlugsForId(campaignId: string): Promise<string[]> {
  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId }, select: { slug: true } });
  return campaign ? [campaign.slug] : [];
}
