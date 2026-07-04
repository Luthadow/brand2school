import { z } from "zod";
import { prisma } from "../../../lib/prisma.js";
import {
  buildSchoolVerificationApprovedPrincipalEmail,
  buildSchoolVerificationRejectedPrincipalEmail,
  schoolDocumentsUrl
} from "../../../lib/emails/schoolVerificationEmails.js";
import { notifySchoolVerificationDocumentsRequired } from "../../../lib/schoolVerificationDocumentNotify.js";
import {
  sendSchoolVerificationApprovedEmail,
  sendSchoolVerificationRejectedEmail
} from "../../../lib/mail.js";
import { serializeSchoolVerification } from "./serializeSchoolVerification.js";

const reviewSchema = z.object({
  action: z.enum(["APPROVE", "REJECT", "MARK_UNDER_REVIEW"]),
  reviewerNotes: z.string().max(2000).optional(),
  rejectionReason: z.string().min(10).max(2000).optional()
});

export async function reviewSchoolVerificationPacket(input: {
  schoolId: string;
  reviewerUserId: string;
  body: unknown;
}) {
  const payload = reviewSchema.safeParse(input.body);
  if (!payload.success) {
    return { ok: false as const, status: 400, message: "Validation failed.", issues: payload.error.flatten() };
  }

  if (payload.data.action === "REJECT" && !payload.data.rejectionReason?.trim()) {
    return { ok: false as const, status: 400, message: "Rejection reason is required." };
  }

  const school = await prisma.school.findUnique({
    where: { id: input.schoolId },
    include: { verification: true, adminUser: { select: { email: true } } }
  });
  if (!school || !school.verification) {
    return { ok: false as const, status: 404, message: "School verification packet not found." };
  }

  const v = school.verification;
  if (v.status === "NOT_SUBMITTED") {
    return { ok: false as const, status: 409, message: "School has not submitted a verification packet yet." };
  }

  const now = new Date();
  let nextStatus: typeof v.status = v.status;
  if (payload.data.action === "MARK_UNDER_REVIEW") nextStatus = "UNDER_REVIEW";
  if (payload.data.action === "APPROVE") nextStatus = "APPROVED";
  if (payload.data.action === "REJECT") nextStatus = "REJECTED";

  const updated = await prisma.schoolVerification.update({
    where: { id: v.id },
    data: {
      status: nextStatus,
      reviewedAt: now,
      reviewedByUserId: input.reviewerUserId,
      reviewerNotes: payload.data.reviewerNotes?.trim() || null,
      rejectionReason: payload.data.action === "REJECT" ? payload.data.rejectionReason?.trim() ?? null : null
    }
  });

  await prisma.auditLog.create({
    data: {
      actorId: input.reviewerUserId,
      action:
        payload.data.action === "APPROVE"
          ? "SCHOOL_VERIFICATION_APPROVED"
          : payload.data.action === "REJECT"
            ? "SCHOOL_VERIFICATION_REJECTED"
            : "SCHOOL_VERIFICATION_UNDER_REVIEW",
      targetType: "School",
      targetId: school.id,
      payload: {
        verificationId: updated.id,
        reviewerNotes: updated.reviewerNotes,
        rejectionReason: updated.rejectionReason
      }
    }
  });

  const principalEmail = school.contactEmail ?? school.adminUser?.email;
  const docsUrl = schoolDocumentsUrl();

  if (payload.data.action === "APPROVE" && principalEmail) {
    const mail = buildSchoolVerificationApprovedPrincipalEmail({
      to: principalEmail,
      principalName: school.principalName,
      schoolName: school.name,
      documentsUrl: docsUrl,
      reviewerNotes: updated.reviewerNotes ?? undefined
    });
    void sendSchoolVerificationApprovedEmail({
      to: principalEmail,
      subject: mail.subject,
      text: mail.text,
      html: mail.html
    }).catch((err) => console.error("[mail] verification approved notify failed:", err));
  }

  if (payload.data.action === "REJECT" && principalEmail) {
    const mail = buildSchoolVerificationRejectedPrincipalEmail({
      to: principalEmail,
      principalName: school.principalName,
      schoolName: school.name,
      documentsUrl: docsUrl,
      rejectionReason: updated.rejectionReason ?? undefined
    });
    void sendSchoolVerificationRejectedEmail({
      to: principalEmail,
      subject: mail.subject,
      text: mail.text,
      html: mail.html
    }).catch((err) => console.error("[mail] verification rejected notify failed:", err));

    void notifySchoolVerificationDocumentsRequired(school.id).catch((err) =>
      console.error("[mail] Auto verification documents email after reject failed:", err)
    );
  }

  return { ok: true as const, status: 200, verification: serializeSchoolVerification(updated, school.organizationCategory) };
}
