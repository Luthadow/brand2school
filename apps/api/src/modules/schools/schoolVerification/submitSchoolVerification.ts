import { z } from "zod";
import { prisma } from "../../../lib/prisma.js";
import {
  getOrganizationCategory,
  isCentreTypeValid,
  isOrganizationCategoryId
} from "../../../lib/organizationCategories.js";
import { notifyAdminsSchoolVerificationSubmitted } from "../../../lib/registrationNotify.js";
import {
  assertAllowedVerificationMime,
  saveSchoolVerificationFile,
  schoolVerificationDocPath
} from "../../../lib/schoolVerificationStorage.js";
import { getOrCreateSchoolVerification } from "./verificationGate.js";
import { serializeSchoolVerification } from "./serializeSchoolVerification.js";
import {
  parseDocumentDeferrals,
  pruneDeferralsForUploadedFiles,
  validateSubmissionCoverage,
  REGISTRATION_DEFERRAL_KEY,
  type DocumentDeferralMap
} from "./documentDeferrals.js";

export { REGISTRATION_DEFERRAL_KEY };

export const emisNumberSchema = z
  .string()
  .trim()
  .min(6)
  .max(20)
  .regex(/^\d{6,20}$/, "EMIS number must be 6–20 digits.");

export type VerificationUploadFile = {
  buffer: Buffer;
  mimetype: string;
};

function parseDocumentPaths(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const out: Record<string, string> = {};
  for (const [key, path] of Object.entries(value as Record<string, unknown>)) {
    if (typeof path === "string" && path.trim()) out[key] = path;
  }
  return out;
}

function buildDeferralPayload(input: {
  deferrals: DocumentDeferralMap;
  registrationDeferred: boolean;
}): DocumentDeferralMap {
  const next = { ...input.deferrals };
  if (input.registrationDeferred) {
    next[REGISTRATION_DEFERRAL_KEY] = { willSubmitBeforeClaim: true };
  } else {
    delete next[REGISTRATION_DEFERRAL_KEY];
  }
  return next;
}

export async function submitSchoolVerificationPacket(input: {
  schoolId: string;
  centreType: string;
  registrationNumber?: string;
  emisNumber?: string;
  registrationDeferred?: boolean | undefined;
  documentDeferrals?: DocumentDeferralMap;
  files: Record<string, VerificationUploadFile>;
}) {
  const school = await prisma.school.findUnique({
    where: { id: input.schoolId },
    select: {
      id: true,
      name: true,
      province: true,
      district: true,
      principalName: true,
      contactEmail: true,
      status: true,
      organizationCategory: true
    }
  });
  if (!school) {
    return { ok: false as const, status: 404, message: "Organisation not found." };
  }

  const category = getOrganizationCategory(school.organizationCategory);

  let emisNumber: string | null = null;
  let registrationNumber: string | null = null;

  if (category.id === "SCHOOL" && !input.registrationDeferred) {
    const parsedEmis = emisNumberSchema.safeParse(input.emisNumber ?? input.registrationNumber ?? "");
    if (!parsedEmis.success) {
      return {
        ok: false as const,
        status: 400,
        message: parsedEmis.error.errors[0]?.message ?? "Invalid EMIS number."
      };
    }
    emisNumber = parsedEmis.data;
  } else if (category.id === "SCHOOL" && input.emisNumber?.trim()) {
    const parsedEmis = emisNumberSchema.safeParse(input.emisNumber);
    if (parsedEmis.success) emisNumber = parsedEmis.data;
  } else if (category.registrationNumber && category.registrationNumber.minLength > 0 && !input.registrationDeferred) {
    const value = (input.registrationNumber ?? "").trim();
    if (!category.registrationNumber.pattern.test(value)) {
      return { ok: false as const, status: 400, message: category.registrationNumber.validationMessage };
    }
    registrationNumber = value;
  } else if (input.registrationNumber?.trim()) {
    registrationNumber = input.registrationNumber.trim();
  }

  await getOrCreateSchoolVerification(school.id);
  const existing = await prisma.schoolVerification.findUnique({ where: { schoolId: school.id } });
  const existingDeferrals = parseDocumentDeferrals(existing?.documentDeferrals);
  const centreType = input.centreType?.trim() || existing?.centreType || "";
  if (!centreType || !isCentreTypeValid(school.organizationCategory, centreType)) {
    return { ok: false as const, status: 400, message: "Select a valid centre type for your organisation." };
  }

  const isDeferredUpload =
    existing?.status === "SUBMITTED" || existing?.status === "APPROVED" || existing?.status === "REJECTED";

  if (existing?.status === "APPROVED" && Object.keys(input.files).length === 0 && Object.keys(existingDeferrals).length === 0) {
    return { ok: false as const, status: 409, message: "Verification is already approved." };
  }
  if (existing?.status === "UNDER_REVIEW" && Object.keys(existingDeferrals).length === 0) {
    return { ok: false as const, status: 409, message: "Your verification packet is under review." };
  }
  if (existing?.status === "SUBMITTED" && Object.keys(existingDeferrals).length === 0) {
    return { ok: false as const, status: 409, message: "Your verification packet is already submitted." };
  }

  const documentPaths: Record<string, string> = {
    ...parseDocumentPaths(existing?.documentPaths)
  };
  let principalIdPath = existing?.principalIdPath ?? null;
  let schoolLetterPath = existing?.schoolLetterPath ?? null;
  let emisEvidencePath = existing?.emisEvidencePath ?? null;

  for (const doc of category.documents) {
    const file = input.files[doc.key];
    if (!file) continue;

    try {
      assertAllowedVerificationMime(file.mimetype);
    } catch (err) {
      return { ok: false as const, status: 400, message: err instanceof Error ? err.message : "Invalid file type." };
    }
    if (file.buffer.length > 5 * 1024 * 1024) {
      return { ok: false as const, status: 400, message: "Each file must be 5MB or smaller." };
    }

    const storedPath = schoolVerificationDocPath(school.id, doc.storageKey, file.mimetype);
    await saveSchoolVerificationFile(storedPath, file.buffer);
    documentPaths[doc.storageKey] = storedPath;

    if (doc.storageKey === "principal-id") principalIdPath = storedPath;
    if (doc.storageKey === "school-letter") schoolLetterPath = storedPath;
    if (doc.storageKey === "emis-evidence") emisEvidencePath = storedPath;
  }

  const deferrals = buildDeferralPayload({
    deferrals: input.documentDeferrals ?? existingDeferrals,
    registrationDeferred:
      input.registrationDeferred ??
      Boolean(existingDeferrals[REGISTRATION_DEFERRAL_KEY]?.willSubmitBeforeClaim)
  });

  const verificationSnapshot = {
    organizationCategory: school.organizationCategory,
    emisNumber: emisNumber ?? existing?.emisNumber ?? null,
    registrationNumber: registrationNumber ?? existing?.registrationNumber ?? null,
    principalIdPath,
    schoolLetterPath,
    emisEvidencePath,
    documentPaths,
    registrationDeferred: Boolean(deferrals[REGISTRATION_DEFERRAL_KEY])
  };

  const prunedDeferrals = pruneDeferralsForUploadedFiles(verificationSnapshot, deferrals, category.documents);
  if (verificationSnapshot.emisNumber || verificationSnapshot.registrationNumber) {
    delete prunedDeferrals[REGISTRATION_DEFERRAL_KEY];
  }

  if (!isDeferredUpload) {
    const coverage = validateSubmissionCoverage({
      organizationCategory: school.organizationCategory,
      verification: verificationSnapshot,
      deferrals: prunedDeferrals,
      filesProvided: Object.keys(input.files),
      registrationDeferred: Boolean(prunedDeferrals[REGISTRATION_DEFERRAL_KEY])
    });
    if (!coverage.ok) {
      return { ok: false as const, status: 400, message: coverage.message };
    }
  }

  const now = new Date();
  const nextStatus =
    existing?.status === "APPROVED"
      ? "APPROVED"
      : existing?.status === "SUBMITTED" && Object.keys(input.files).length > 0
        ? "SUBMITTED"
        : "SUBMITTED";

  const updated = await prisma.schoolVerification.upsert({
    where: { schoolId: school.id },
    create: {
      schoolId: school.id,
      emisNumber: verificationSnapshot.emisNumber,
      registrationNumber: verificationSnapshot.registrationNumber,
      documentPaths,
      centreType,
      documentDeferrals: prunedDeferrals,
      status: nextStatus,
      principalIdPath,
      schoolLetterPath,
      emisEvidencePath,
      submittedAt: now,
      rejectionReason: null,
      reviewerNotes: null,
      reviewedAt: null,
      reviewedByUserId: null
    },
    update: {
      emisNumber: verificationSnapshot.emisNumber,
      registrationNumber: verificationSnapshot.registrationNumber,
      documentPaths,
      centreType,
      documentDeferrals: prunedDeferrals,
      status: nextStatus,
      principalIdPath,
      schoolLetterPath,
      emisEvidencePath,
      submittedAt: existing?.submittedAt ?? now,
      rejectionReason: existing?.status === "REJECTED" ? null : existing?.rejectionReason ?? null,
      reviewerNotes: existing?.reviewerNotes ?? null,
      reviewedAt: existing?.reviewedAt ?? null,
      reviewedByUserId: existing?.reviewedByUserId ?? null
    }
  });

  await prisma.auditLog.create({
    data: {
      action: "SCHOOL_VERIFICATION_SUBMITTED",
      targetType: "School",
      targetId: school.id,
      payload: {
        organizationCategory: school.organizationCategory,
        centreType,
        emisNumber: verificationSnapshot.emisNumber,
        registrationNumber: verificationSnapshot.registrationNumber,
        deferredDocuments: Object.keys(prunedDeferrals),
        verificationId: updated.id
      }
    }
  });

  if (!isDeferredUpload || Object.keys(input.files).length > 0) {
    void notifyAdminsSchoolVerificationSubmitted({
      schoolId: school.id,
      schoolName: school.name,
      province: school.province,
      district: school.district,
      emisNumber: verificationSnapshot.emisNumber ?? verificationSnapshot.registrationNumber ?? "—",
      principalName: school.principalName
    });
  }

  return {
    ok: true as const,
    status: 200,
    verification: serializeSchoolVerification(updated, school.organizationCategory)
  };
}

export const organizationCategorySchema = z.enum(["SCHOOL", "NGO_NPO", "COMMUNITY", "FAITH"]);

export function parseOrganizationCategoryInput(value: unknown) {
  if (typeof value !== "string" || !isOrganizationCategoryId(value)) return "SCHOOL" as const;
  return value;
}
