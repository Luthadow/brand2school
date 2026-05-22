import { z } from "zod";
import { prisma } from "../../../lib/prisma.js";
import { notifyAdminsSchoolVerificationSubmitted } from "../../../lib/registrationNotify.js";
import {
  assertAllowedVerificationMime,
  saveSchoolVerificationFile,
  schoolVerificationDocPath
} from "../../../lib/schoolVerificationStorage.js";
import { getOrCreateSchoolVerification } from "./verificationGate.js";
import { serializeSchoolVerification } from "./serializeSchoolVerification.js";

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

export async function submitSchoolVerificationPacket(input: {
  schoolId: string;
  emisNumber: string;
  principalId: VerificationUploadFile;
  schoolLetter: VerificationUploadFile;
  emisEvidence: VerificationUploadFile;
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
      status: true
    }
  });
  if (!school) {
    return { ok: false as const, status: 404, message: "School not found." };
  }

  const parsedEmis = emisNumberSchema.safeParse(input.emisNumber);
  if (!parsedEmis.success) {
    return { ok: false as const, status: 400, message: parsedEmis.error.errors[0]?.message ?? "Invalid EMIS number." };
  }

  await getOrCreateSchoolVerification(school.id);
  const existing = await prisma.schoolVerification.findUnique({ where: { schoolId: school.id } });
  if (existing?.status === "APPROVED") {
    return { ok: false as const, status: 409, message: "Verification is already approved." };
  }
  if (existing?.status === "SUBMITTED" || existing?.status === "UNDER_REVIEW") {
    return { ok: false as const, status: 409, message: "A verification packet is already under review." };
  }

  for (const file of [input.principalId, input.schoolLetter, input.emisEvidence]) {
    try {
      assertAllowedVerificationMime(file.mimetype);
    } catch (err) {
      return { ok: false as const, status: 400, message: err instanceof Error ? err.message : "Invalid file type." };
    }
    if (file.buffer.length > 5 * 1024 * 1024) {
      return { ok: false as const, status: 400, message: "Each file must be 5MB or smaller." };
    }
  }

  const principalIdPath = schoolVerificationDocPath(school.id, "principal-id", input.principalId.mimetype);
  const schoolLetterPath = schoolVerificationDocPath(school.id, "school-letter", input.schoolLetter.mimetype);
  const emisEvidencePath = schoolVerificationDocPath(school.id, "emis-evidence", input.emisEvidence.mimetype);

  await saveSchoolVerificationFile(principalIdPath, input.principalId.buffer);
  await saveSchoolVerificationFile(schoolLetterPath, input.schoolLetter.buffer);
  await saveSchoolVerificationFile(emisEvidencePath, input.emisEvidence.buffer);

  const now = new Date();
  const updated = await prisma.schoolVerification.upsert({
    where: { schoolId: school.id },
    create: {
      schoolId: school.id,
      emisNumber: parsedEmis.data,
      status: "SUBMITTED",
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
      emisNumber: parsedEmis.data,
      status: "SUBMITTED",
      principalIdPath,
      schoolLetterPath,
      emisEvidencePath,
      submittedAt: now,
      rejectionReason: null,
      reviewerNotes: null,
      reviewedAt: null,
      reviewedByUserId: null
    }
  });

  await prisma.auditLog.create({
    data: {
      action: "SCHOOL_VERIFICATION_SUBMITTED",
      targetType: "School",
      targetId: school.id,
      payload: { emisNumber: parsedEmis.data, verificationId: updated.id }
    }
  });

  void notifyAdminsSchoolVerificationSubmitted({
    schoolId: school.id,
    schoolName: school.name,
    province: school.province,
    district: school.district,
    emisNumber: parsedEmis.data,
    principalName: school.principalName
  });

  return { ok: true as const, status: 200, verification: serializeSchoolVerification(updated) };
}
