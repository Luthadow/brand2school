import type { VerificationDocumentDef } from "../../../lib/organizationCategories.js";
import { getOrganizationCategory } from "../../../lib/organizationCategories.js";

export type DocumentDeferralEntry = {
  willSubmitBeforeClaim: true;
};

export type DocumentDeferralMap = Record<string, DocumentDeferralEntry>;

export const REGISTRATION_DEFERRAL_KEY = "__registration__";

export function parseDocumentDeferrals(value: unknown): DocumentDeferralMap {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const out: DocumentDeferralMap = {};
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    if (entry === true || (typeof entry === "object" && entry !== null && (entry as DocumentDeferralEntry).willSubmitBeforeClaim)) {
      out[key] = { willSubmitBeforeClaim: true };
    }
  }
  return out;
}

const SCHOOL_LEGACY_PATHS: Record<string, "principalIdPath" | "schoolLetterPath" | "emisEvidencePath"> = {
  "principal-id": "principalIdPath",
  "school-letter": "schoolLetterPath",
  "emis-evidence": "emisEvidencePath"
};

export type VerificationFilesSnapshot = {
  organizationCategory?: string | null;
  emisNumber?: string | null;
  registrationNumber?: string | null;
  principalIdPath?: string | null;
  schoolLetterPath?: string | null;
  emisEvidencePath?: string | null;
  documentPaths?: Record<string, string> | null;
  registrationDeferred?: boolean;
};

export function hasDocumentFile(
  verification: VerificationFilesSnapshot,
  doc: VerificationDocumentDef
): boolean {
  const legacyKey = SCHOOL_LEGACY_PATHS[doc.storageKey];
  if (legacyKey && verification[legacyKey]) return true;
  return Boolean(verification.documentPaths?.[doc.storageKey]);
}

export function pruneDeferralsForUploadedFiles(
  verification: VerificationFilesSnapshot,
  deferrals: DocumentDeferralMap,
  documents: VerificationDocumentDef[]
): DocumentDeferralMap {
  const next: DocumentDeferralMap = { ...deferrals };
  for (const doc of documents) {
    if (hasDocumentFile(verification, doc)) {
      delete next[doc.key];
    }
  }
  return next;
}

export function validateSubmissionCoverage(input: {
  organizationCategory: string;
  verification: VerificationFilesSnapshot;
  deferrals: DocumentDeferralMap;
  filesProvided: string[];
  registrationDeferred?: boolean;
}): { ok: true } | { ok: false; message: string } {
  const category = getOrganizationCategory(input.organizationCategory);

  if (category.registrationNumber) {
    const regRequired = category.id === "SCHOOL" || category.registrationNumber.minLength > 0;
    const regValue =
      category.id === "SCHOOL" ? input.verification.emisNumber?.trim() : input.verification.registrationNumber?.trim();
    const hasReg = Boolean(regValue);
    if (regRequired && !hasReg && !input.registrationDeferred) {
      return {
        ok: false,
        message: `Provide ${category.registrationNumber.label} or tick that you will submit it before claiming.`
      };
    }
  }

  for (const doc of category.documents) {
    const hasFile = hasDocumentFile(input.verification, doc) || input.filesProvided.includes(doc.key);
    const deferred = input.deferrals[doc.key]?.willSubmitBeforeClaim === true;
    if (!hasFile && !deferred) {
      return {
        ok: false,
        message: `Upload ${doc.label} or confirm you will submit it before claiming infrastructure.`
      };
    }
  }

  return { ok: true };
}

export function listDocumentsOutstandingForClaim(verification: VerificationFilesSnapshot & { status?: string }): string[] {
  const category = getOrganizationCategory(verification.organizationCategory ?? "SCHOOL");
  const missing: string[] = [];

  if (category.registrationNumber) {
    const regRequired = category.id === "SCHOOL" || category.registrationNumber.minLength > 0;
    const regValue =
      category.id === "SCHOOL" ? verification.emisNumber?.trim() : verification.registrationNumber?.trim();
    if (regRequired && !regValue && verification.registrationDeferred) {
      missing.push(category.registrationNumber.label);
    } else if (regRequired && !regValue) {
      missing.push(category.registrationNumber.label);
    }
  }

  for (const doc of category.documents) {
    if (!hasDocumentFile(verification, doc)) {
      missing.push(doc.label);
    }
  }

  return missing;
}

export function documentsReadyForClaim(verification: VerificationFilesSnapshot): boolean {
  return listDocumentsOutstandingForClaim(verification).length === 0;
}

export function hasActiveDeferrals(
  verification: VerificationFilesSnapshot,
  deferrals: DocumentDeferralMap
): boolean {
  const category = getOrganizationCategory(verification.organizationCategory ?? "SCHOOL");
  if (verification.registrationDeferred) return true;
  for (const doc of category.documents) {
    if (!hasDocumentFile(verification, doc) && deferrals[doc.key]?.willSubmitBeforeClaim) {
      return true;
    }
  }
  return false;
}
