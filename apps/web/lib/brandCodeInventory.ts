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
  status?: string;
  source?: string | null;
  downloadCount?: number;
  downloadedAt?: string | null;
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

export const BATCH_STATUS_LABELS: Record<string, string> = {
  AVAILABLE: "Available",
  DISTRIBUTED: "Distributed",
  PARTIALLY_USED: "Partially used",
  USED: "Used",
  EXPIRED: "Expired"
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

export const CODE_STATUS_META: Array<{
  key: keyof Pick<
    BrandCodeInventory,
    "unused" | "pending" | "used" | "duplicate" | "invalid" | "flagged" | "expired" | "invalidated" | "blocked"
  >;
  label: string;
  color: string;
}> = [
  { key: "unused", label: "Available", color: "#4caf50" },
  { key: "used", label: "Redeemed", color: "#1565c0" },
  { key: "pending", label: "Pending", color: "#ff9800" },
  { key: "expired", label: "Expired", color: "#9e9e9e" },
  { key: "duplicate", label: "Duplicate", color: "#7b1fa2" },
  { key: "invalid", label: "Invalid", color: "#e53935" },
  { key: "flagged", label: "Flagged", color: "#f57c00" },
  { key: "blocked", label: "Blocked", color: "#c62828" },
  { key: "invalidated", label: "Invalidated", color: "#546e7a" }
];
