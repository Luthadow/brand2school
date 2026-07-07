const DOCUMENT_VALIDITY_DAYS = 365;

export type DocumentVaultEntry = {
  key: string;
  label: string;
  status: "uploaded" | "deferred" | "missing";
  uploadedAt: string | null;
  expiresAt: string | null;
  daysUntilExpiry: number | null;
  reminderLevel: "none" | "info" | "warning" | "urgent";
};

function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString();
}

function daysBetween(from: Date, to: Date): number {
  return Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

function reminderLevel(daysUntilExpiry: number | null): DocumentVaultEntry["reminderLevel"] {
  if (daysUntilExpiry == null) return "none";
  if (daysUntilExpiry <= 0) return "urgent";
  if (daysUntilExpiry <= 30) return "warning";
  if (daysUntilExpiry <= 90) return "info";
  return "none";
}

type InputDoc = {
  key: string;
  label: string;
  uploaded: boolean;
  deferred: boolean;
};

export function buildDocumentVault(
  documents: InputDoc[],
  submittedAt: string | null
): { entries: DocumentVaultEntry[]; expiringSoon: number; expired: number } {
  const baseUploadedAt = submittedAt ?? null;
  const now = new Date();

  const entries: DocumentVaultEntry[] = documents.map((doc) => {
    const status: DocumentVaultEntry["status"] = doc.uploaded
      ? "uploaded"
      : doc.deferred
        ? "deferred"
        : "missing";

    const uploadedAt = doc.uploaded && baseUploadedAt ? baseUploadedAt : null;
    const expiresAt = uploadedAt ? addDays(uploadedAt, DOCUMENT_VALIDITY_DAYS) : null;
    const daysUntilExpiry =
      expiresAt != null ? daysBetween(now, new Date(expiresAt)) : null;

    return {
      key: doc.key,
      label: doc.label,
      status,
      uploadedAt,
      expiresAt,
      daysUntilExpiry,
      reminderLevel: reminderLevel(daysUntilExpiry)
    };
  });

  const expiringSoon = entries.filter(
    (e) => e.reminderLevel === "info" || e.reminderLevel === "warning"
  ).length;
  const expired = entries.filter((e) => e.reminderLevel === "urgent").length;

  return { entries, expiringSoon, expired };
}
