import {
  getOrganizationCategory,
  type OrganizationCategoryId,
  type VerificationDocumentDef
} from "../../../lib/organizationCategories.js";
import { parseDocumentDeferrals, hasDocumentFile, type DocumentDeferralMap, REGISTRATION_DEFERRAL_KEY } from "./documentDeferrals.js";

export type VerificationDocumentSnapshot = {
  status?: string;
  organizationCategory?: OrganizationCategoryId | string | null;
  emisNumber?: string | null;
  registrationNumber?: string | null;
  principalIdPath?: string | null;
  schoolLetterPath?: string | null;
  emisEvidencePath?: string | null;
  documentPaths?: Record<string, string> | null;
  documentDeferrals?: unknown;
};

const SCHOOL_LEGACY_PATHS: Record<string, keyof VerificationDocumentSnapshot> = {
  "principal-id": "principalIdPath",
  "school-letter": "schoolLetterPath",
  "emis-evidence": "emisEvidencePath"
};

function hasDocumentPath(
  verification: VerificationDocumentSnapshot,
  doc: VerificationDocumentDef
): boolean {
  const legacyKey = SCHOOL_LEGACY_PATHS[doc.storageKey];
  if (legacyKey && verification[legacyKey]) return true;
  return Boolean(verification.documentPaths?.[doc.storageKey]);
}

function deferralsFor(verification: VerificationDocumentSnapshot | null | undefined): DocumentDeferralMap {
  return parseDocumentDeferrals(verification?.documentDeferrals);
}

/** Items still missing and not deferred — used for reminder emails and onboarding nudges. */
export function listOutstandingVerificationDocuments(
  verification: VerificationDocumentSnapshot | null | undefined
): string[] {
  const category = getOrganizationCategory(verification?.organizationCategory ?? "SCHOOL");
  const deferrals = deferralsFor(verification);

  if (verification?.status === "REJECTED") {
    const missing: string[] = [];
    if (category.registrationNumber) {
      const regRequired = category.id === "SCHOOL" || category.registrationNumber.minLength > 0;
      if (regRequired) missing.push(category.registrationNumber.label);
    }
    for (const doc of category.documents) {
      if (doc.required) missing.push(doc.label);
    }
    return missing;
  }

  const missing: string[] = [];

  if (category.registrationNumber) {
    const regValue =
      category.id === "SCHOOL" ? verification?.emisNumber?.trim() : verification?.registrationNumber?.trim();
    const regRequired = category.id === "SCHOOL" || category.registrationNumber.minLength > 0;
    const regDeferred = deferrals[REGISTRATION_DEFERRAL_KEY]?.willSubmitBeforeClaim === true;
    if (regRequired && !regValue && !regDeferred) {
      missing.push(category.registrationNumber.label);
    }
  }

  for (const doc of category.documents) {
    if (!doc.required) continue;
    const deferred = deferrals[doc.key]?.willSubmitBeforeClaim === true;
    if (!verification || (!hasDocumentPath(verification, doc) && !deferred)) {
      missing.push(doc.label);
    }
  }

  return missing;
}

export function verificationDocumentUrls(
  verification: VerificationDocumentSnapshot,
  resolvePath: (path: string | null | undefined) => string | null
): Record<string, string | null> {
  const category = getOrganizationCategory(verification.organizationCategory ?? "SCHOOL");
  const urls: Record<string, string | null> = {};

  for (const doc of category.documents) {
    const legacyKey = SCHOOL_LEGACY_PATHS[doc.storageKey];
    const legacyPath = legacyKey ? (verification[legacyKey] as string | null | undefined) : null;
    const jsonPath = verification.documentPaths?.[doc.storageKey] ?? null;
    urls[doc.key] = resolvePath(legacyPath ?? jsonPath);
  }

  return urls;
}
