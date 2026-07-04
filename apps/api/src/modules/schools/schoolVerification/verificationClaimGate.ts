import { prisma } from "../../../lib/prisma.js";
import {
  documentsReadyForClaim,
  listDocumentsOutstandingForClaim,
  parseDocumentDeferrals,
  REGISTRATION_DEFERRAL_KEY,
  type VerificationFilesSnapshot
} from "./documentDeferrals.js";
import { getOrganizationCategory, isCentreTypeValid } from "../../../lib/organizationCategories.js";

export async function getVerificationClaimSnapshot(schoolId: string): Promise<VerificationFilesSnapshot | null> {
  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    include: { verification: true }
  });
  if (!school?.verification) return null;

  const deferrals = parseDocumentDeferrals(school.verification.documentDeferrals);
  return {
    organizationCategory: school.organizationCategory,
    emisNumber: school.verification.emisNumber,
    registrationNumber: school.verification.registrationNumber,
    principalIdPath: school.verification.principalIdPath,
    schoolLetterPath: school.verification.schoolLetterPath,
    emisEvidencePath: school.verification.emisEvidencePath,
    documentPaths: (school.verification.documentPaths as Record<string, string> | null) ?? null,
    registrationDeferred: deferrals[REGISTRATION_DEFERRAL_KEY]?.willSubmitBeforeClaim === true
  };
}

export async function assertDocumentsReadyForClaim(
  schoolId: string
): Promise<{ ok: true } | { ok: false; message: string; outstanding: string[] }> {
  const snapshot = await getVerificationClaimSnapshot(schoolId);
  if (!snapshot) {
    return {
      ok: false,
      message: "Verification record not found. Complete your Docs profile before claiming.",
      outstanding: []
    };
  }

  const outstanding = listDocumentsOutstandingForClaim(snapshot);
  if (!documentsReadyForClaim(snapshot)) {
    return {
      ok: false,
      message:
        "All verification documents must be uploaded before claiming infrastructure milestones. Open Docs in your dashboard to complete outstanding items.",
      outstanding
    };
  }

  return { ok: true };
}

export function validateCentreType(organizationCategory: string, centreType: string | null | undefined): boolean {
  if (!centreType?.trim()) return false;
  return isCentreTypeValid(organizationCategory, centreType);
}

export function centreTypeLabel(organizationCategory: string, centreType: string | null | undefined): string | null {
  if (!centreType) return null;
  const category = getOrganizationCategory(organizationCategory);
  return category.centreTypes.find((c) => c.id === centreType)?.label ?? centreType;
}
