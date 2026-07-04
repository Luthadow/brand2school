import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { CONTACT } from "../../lib/contacts.js";
import {
  buildBrandRegistrationInfoRequiredEmail,
  brandOnboardingUrlForRegistrant
} from "../../lib/emails/registrationAdminEmails.js";
import { sendBrandedMail } from "../../lib/mail.js";
import { resolveBrandContact } from "../../lib/emails/brandContact.js";
import { notifySchoolVerificationDocumentsRequired } from "../../lib/schoolVerificationDocumentNotify.js";

const brandFollowupSchema = z.object({
  message: z.string().trim().min(10).max(4000)
});

export async function requestSchoolRegistrationInfo(input: {
  schoolId: string;
  actorUserId: string;
}) {
  const result = await notifySchoolVerificationDocumentsRequired(input.schoolId);

  if (!result.ok) {
    return { ok: false as const, status: result.status, message: result.message };
  }

  if ("skipped" in result) {
    return { ok: false as const, status: 409, message: result.skipped };
  }

  await prisma.auditLog.create({
    data: {
      actorId: input.actorUserId,
      action: "SCHOOL_REGISTRATION_INFO_REQUESTED",
      targetType: "School",
      targetId: input.schoolId,
      payload: { emailed: result.emailed, automated: true }
    }
  });

  return { ok: true as const, status: 200, emailed: result.emailed };
}

export async function requestBrandRegistrationInfo(input: {
  brandId: string;
  actorUserId: string;
  body: unknown;
}) {
  const payload = brandFollowupSchema.safeParse(input.body);
  if (!payload.success) {
    return { ok: false as const, status: 400, message: "Validation failed.", issues: payload.error.flatten() };
  }

  const brand = await prisma.brand.findUnique({ where: { id: input.brandId } });
  if (!brand) {
    return { ok: false as const, status: 404, message: "Brand not found." };
  }

  const contact = resolveBrandContact(brand);
  if (!contact) {
    return { ok: false as const, status: 409, message: "Brand has no contact email on file." };
  }

  const actionUrl = brandOnboardingUrlForRegistrant();
  const mail = buildBrandRegistrationInfoRequiredEmail({
    recipientName: contact.name,
    entityName: brand.name,
    message: payload.data.message,
    actionUrl
  });

  try {
    await sendBrandedMail({
      to: contact.email,
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
      replyTo: CONTACT.brands
    });
  } catch (err) {
    console.error("[mail] brand registration follow-up failed:", err);
    return { ok: false as const, status: 503, message: "Could not send email to the brand contact." };
  }

  await prisma.brand.update({
    where: { id: brand.id },
    data: {
      internalReviewNotes: payload.data.message,
      onboardingStatus: brand.onboardingStatus === "PENDING_REVIEW" ? "PENDING_REVIEW" : brand.onboardingStatus
    }
  });

  await prisma.auditLog.create({
    data: {
      actorId: input.actorUserId,
      action: "BRAND_REGISTRATION_INFO_REQUESTED",
      targetType: "Brand",
      targetId: brand.id,
      payload: { message: payload.data.message, emailed: contact.email }
    }
  });

  return { ok: true as const, status: 200, emailed: contact.email };
}
