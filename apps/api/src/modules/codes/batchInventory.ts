import type { CodeStatus } from "../../generated/prisma/index.js";

export const CODE_DOWNLOAD_BATCH_SIZE = 50;

export type DerivedBatchStatus =
  | "AVAILABLE"
  | "DISTRIBUTED"
  | "PARTIALLY_USED"
  | "USED"
  | "EXPIRED";

/** Derive inventory status from code counts + download/expiry metadata. */
export function deriveCodeBatchStatus(input: {
  totalCodes: number;
  usedCodes: number;
  expiredCodes: number;
  downloadCount: number;
  expiresAt: Date | null;
  now?: Date;
}): DerivedBatchStatus {
  const now = input.now ?? new Date();
  if (input.expiresAt && input.expiresAt.getTime() <= now.getTime()) return "EXPIRED";
  if (input.totalCodes > 0 && input.expiredCodes >= input.totalCodes) return "EXPIRED";
  if (input.totalCodes > 0 && input.usedCodes >= input.totalCodes) return "USED";
  if (input.usedCodes > 0) return "PARTIALLY_USED";
  if (input.downloadCount > 0) return "DISTRIBUTED";
  return "AVAILABLE";
}

export function countUsedStatuses(statuses: Array<{ status: CodeStatus; _count: number }>): {
  total: number;
  used: number;
  expired: number;
  unused: number;
} {
  let total = 0;
  let used = 0;
  let expired = 0;
  let unused = 0;
  for (const row of statuses) {
    total += row._count;
    if (row.status === "USED") used += row._count;
    else if (row.status === "EXPIRED" || row.status === "INVALIDATED") expired += row._count;
    else if (row.status === "UNUSED") unused += row._count;
  }
  return { total, used, expired, unused };
}

export function batchCsvFilename(input: {
  brandName: string;
  campaignName: string;
  batchCode: string;
}): string {
  const safe = (v: string) =>
    v
      .replace(/[^a-zA-Z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 40);
  return `${safe(input.brandName)}_${safe(input.campaignName)}_Batch_${safe(input.batchCode)}.csv`;
}

export function codesToCsv(codes: string[]): string {
  return ["code", ...codes].join("\n") + "\n";
}
