import { resolveSchoolVerificationPublicUrl } from "../../../lib/schoolVerificationStorage.js";
import type { SchoolVerification } from "../../../generated/prisma/index.js";

export function serializeSchoolVerification(row: SchoolVerification) {
  return {
    id: row.id,
    schoolId: row.schoolId,
    emisNumber: row.emisNumber,
    status: row.status,
    principalIdUrl: resolveSchoolVerificationPublicUrl(row.principalIdPath),
    schoolLetterUrl: resolveSchoolVerificationPublicUrl(row.schoolLetterPath),
    emisEvidenceUrl: resolveSchoolVerificationPublicUrl(row.emisEvidencePath),
    submittedAt: row.submittedAt?.toISOString() ?? null,
    reviewedAt: row.reviewedAt?.toISOString() ?? null,
    reviewerNotes: row.reviewerNotes,
    rejectionReason: row.rejectionReason
  };
}
