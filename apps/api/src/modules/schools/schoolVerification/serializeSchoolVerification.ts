import { resolveSchoolVerificationPublicUrl } from "../../../lib/schoolVerificationStorage.js";
import {
  getCentreTypeLabel,
  getOrganizationCategory,
  type OrganizationCategoryId
} from "../../../lib/organizationCategories.js";
import { verificationDocumentUrls } from "./outstandingDocuments.js";
import {
  documentsReadyForClaim,
  hasActiveDeferrals,
  parseDocumentDeferrals,
  hasDocumentFile,
  REGISTRATION_DEFERRAL_KEY,
  type VerificationFilesSnapshot
} from "./documentDeferrals.js";
import type { SchoolVerification } from "../../../generated/prisma/index.js";

function parseDocumentPaths(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const out: Record<string, string> = {};
  for (const [key, path] of Object.entries(value as Record<string, unknown>)) {
    if (typeof path === "string" && path.trim()) out[key] = path;
  }
  return out;
}

export function serializeSchoolVerification(
  row: SchoolVerification,
  organizationCategory: OrganizationCategoryId | string = "SCHOOL"
) {
  const category = getOrganizationCategory(organizationCategory);
  const documentPaths = parseDocumentPaths(row.documentPaths);
  const deferrals = parseDocumentDeferrals(row.documentDeferrals);
  const registrationDeferred = deferrals[REGISTRATION_DEFERRAL_KEY]?.willSubmitBeforeClaim === true;

  const snapshot: VerificationFilesSnapshot = {
    organizationCategory,
    emisNumber: row.emisNumber,
    registrationNumber: row.registrationNumber,
    principalIdPath: row.principalIdPath,
    schoolLetterPath: row.schoolLetterPath,
    emisEvidencePath: row.emisEvidencePath,
    documentPaths,
    registrationDeferred
  };

  const docUrls = verificationDocumentUrls(snapshot, (path) =>
    resolveSchoolVerificationPublicUrl(path ?? null)
  );

  const claimReady = documentsReadyForClaim(snapshot);
  const activeDeferrals = hasActiveDeferrals(snapshot, deferrals);

  return {
    id: row.id,
    schoolId: row.schoolId,
    organizationCategory: category.id,
    centreType: row.centreType,
    centreTypeLabel: getCentreTypeLabel(organizationCategory, row.centreType),
    emisNumber: row.emisNumber,
    registrationNumber: row.registrationNumber,
    status: row.status,
    principalIdUrl: resolveSchoolVerificationPublicUrl(row.principalIdPath),
    schoolLetterUrl: resolveSchoolVerificationPublicUrl(row.schoolLetterPath),
    emisEvidenceUrl: resolveSchoolVerificationPublicUrl(row.emisEvidencePath),
    registrationDeferred,
    claimReady,
    hasActiveDeferrals: activeDeferrals,
    documents: category.documents.map((doc) => ({
      key: doc.key,
      label: doc.label,
      required: doc.required,
      url: docUrls[doc.key] ?? null,
      uploaded: hasDocumentFile(snapshot, doc),
      deferred: deferrals[doc.key]?.willSubmitBeforeClaim === true && !hasDocumentFile(snapshot, doc)
    })),
    registrationNumberLabel: category.registrationNumber?.label ?? null,
    submittedAt: row.submittedAt?.toISOString() ?? null,
    reviewedAt: row.reviewedAt?.toISOString() ?? null,
    reviewerNotes: row.reviewerNotes,
    rejectionReason: row.rejectionReason
  };
}
