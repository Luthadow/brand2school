import { prisma } from "./prisma.js";
import { CONTACT } from "./contacts.js";
import {
  buildSchoolVerificationDocumentsRequiredEmail,
  publicSiteUrlForRegistrant,
  schoolDocumentsUrlForRegistrant,
  schoolPortalLoginUrlForRegistrant
} from "./emails/registrationAdminEmails.js";
import { sendBrandedMail } from "./mail.js";
import { listOutstandingVerificationDocuments } from "../modules/schools/schoolVerification/outstandingDocuments.js";

export async function notifySchoolVerificationDocumentsRequired(
  schoolId: string
): Promise<{ ok: true; emailed: string } | { ok: true; skipped: string } | { ok: false; status: number; message: string }> {
  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    include: {
      verification: true,
      adminUser: { select: { email: true } }
    }
  });

  if (!school) {
    return { ok: false, status: 404, message: "School not found." };
  }

  if (school.status === "SUSPENDED") {
    return { ok: true, skipped: "School is suspended." };
  }

  const outstandingDocuments = listOutstandingVerificationDocuments(
    school.verification
      ? {
          status: school.verification.status,
          organizationCategory: school.organizationCategory,
          emisNumber: school.verification.emisNumber,
          registrationNumber: school.verification.registrationNumber,
          principalIdPath: school.verification.principalIdPath,
          schoolLetterPath: school.verification.schoolLetterPath,
          emisEvidencePath: school.verification.emisEvidencePath,
          documentPaths: (school.verification.documentPaths as Record<string, string> | null) ?? null,
          documentDeferrals: school.verification.documentDeferrals
        }
      : { organizationCategory: school.organizationCategory }
  );
  if (outstandingDocuments.length === 0) {
    return { ok: true, skipped: "All verification documents are on file." };
  }

  const principalEmail = school.contactEmail ?? school.adminUser?.email;
  if (!principalEmail) {
    return { ok: false, status: 409, message: "School has no contact email on file." };
  }

  const mail = buildSchoolVerificationDocumentsRequiredEmail({
    principalName: school.principalName,
    schoolName: school.name,
    outstandingDocuments,
    documentsUrl: schoolDocumentsUrlForRegistrant(),
    loginUrl: schoolPortalLoginUrlForRegistrant(),
    siteUrl: publicSiteUrlForRegistrant()
  });

  try {
    await sendBrandedMail({
      to: principalEmail,
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
      replyTo: CONTACT.schools
    });
  } catch (err) {
    console.error("[mail] school verification documents required failed:", err);
    return { ok: false, status: 503, message: "Could not send verification documents email." };
  }

  await prisma.auditLog.create({
    data: {
      action: "SCHOOL_VERIFICATION_DOCUMENTS_REQUESTED",
      targetType: "School",
      targetId: school.id,
      payload: {
        emailed: principalEmail,
        outstandingDocuments
      }
    }
  });

  return { ok: true, emailed: principalEmail };
}
