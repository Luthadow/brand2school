import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { env } from "../../config/env.js";
import { CONTACT } from "../../lib/contacts.js";
import { buildSchoolProgressUpdateEmail } from "../../lib/emails/schoolProgressUpdateEmail.js";
import { sendBrandedMail } from "../../lib/mail.js";
import { queueEmail } from "../../lib/notifications/dispatch.js";
import { getAdminPlatformSnapshot } from "./platformSnapshot.js";
import { VERIFIED_SCHOOL_STATUSES, resolveSchoolEmail } from "./verifiedSchools.js";

const progressEmailSchema = z.object({
  subject: z.string().trim().min(3).max(120).optional(),
  message: z.string().trim().min(10).max(4000)
});

async function loadVerifiedSchoolForEmail(schoolId: string) {
  const school = await prisma.school.findFirst({
    where: {
      id: schoolId,
      status: { in: [...VERIFIED_SCHOOL_STATUSES] }
    },
    select: {
      id: true,
      name: true,
      schoolCode: true,
      whatsappPhone: true,
      principalName: true,
      contactEmail: true,
      organizationCategory: true,
      adminUser: { select: { email: true } }
    }
  });

  if (!school) return null;

  const email = resolveSchoolEmail(school);
  if (email === "—") {
    return { school, email: null as string | null };
  }

  return { school, email };
}

function organisationLoginUrl(organizationCategory: string): string {
  const categorySlug = organizationCategory.toLowerCase().replace(/_/g, "-");
  return `${env.WEB_APP_URL.replace(/\/$/, "")}/organisations/login?category=${categorySlug}`;
}

function schoolDashboardUrl(): string {
  return `${env.WEB_APP_URL.replace(/\/$/, "")}/school/dashboard`;
}

function documentsUrl(): string {
  return `${env.WEB_APP_URL.replace(/\/$/, "")}/school/dashboard/documents`;
}

export async function sendVerifiedSchoolWelcomeEmail(input: {
  schoolId: string;
  actorUserId: string;
}) {
  const loaded = await loadVerifiedSchoolForEmail(input.schoolId);
  if (!loaded) {
    return { ok: false as const, status: 404, message: "Verified organisation not found." };
  }
  if (!loaded.email) {
    return { ok: false as const, status: 409, message: "This organisation has no email address on file." };
  }

  const { school, email } = loaded;

  try {
    await queueEmail({
      template: "SCHOOL_REGISTRATION",
      recipient: email,
      entityType: "SCHOOL",
      entityId: school.id,
      priority: 5,
      immediate: true,
      metadata: { source: "admin_verified_welcome_resend" },
      payload: {
        principalName: school.principalName,
        schoolName: school.name,
        schoolCode: school.schoolCode,
        whatsappPhone: school.whatsappPhone,
        loginUrl: organisationLoginUrl(school.organizationCategory),
        organizationCategory: school.organizationCategory,
        documentsUrl: documentsUrl()
      }
    });
  } catch (err) {
    console.error("[mail] verified school welcome email failed:", err);
    return { ok: false as const, status: 503, message: "Could not send welcome email." };
  }

  await prisma.auditLog.create({
    data: {
      actorId: input.actorUserId,
      action: "VERIFIED_SCHOOL_WELCOME_EMAIL_SENT",
      targetType: "School",
      targetId: school.id,
      payload: { emailed: email, template: "SCHOOL_REGISTRATION" }
    }
  });

  return { ok: true as const, status: 200, emailed: email, message: `Welcome email sent to ${email}.` };
}

export async function sendVerifiedSchoolProgressEmail(input: {
  schoolId: string;
  actorUserId: string;
  body: unknown;
}) {
  const parsed = progressEmailSchema.safeParse(input.body);
  if (!parsed.success) {
    return { ok: false as const, status: 400, message: "Validation failed.", issues: parsed.error.flatten() };
  }

  const loaded = await loadVerifiedSchoolForEmail(input.schoolId);
  if (!loaded) {
    return { ok: false as const, status: 404, message: "Verified organisation not found." };
  }
  if (!loaded.email) {
    return { ok: false as const, status: 409, message: "This organisation has no email address on file." };
  }

  const { school, email } = loaded;
  const snapshot = await getAdminPlatformSnapshot();
  const activeBrandPartners = await prisma.brand.count({ where: { status: "ACTIVE" } });

  const mail = buildSchoolProgressUpdateEmail({
    principalName: school.principalName,
    schoolName: school.name,
    message: parsed.data.message,
    subject: parsed.data.subject,
    loginUrl: organisationLoginUrl(school.organizationCategory),
    dashboardUrl: schoolDashboardUrl(),
    platformStats: {
      schoolsRegistered: snapshot.schoolsRegistered,
      verifiedSubmissions: snapshot.verifiedSubmissions,
      activeBrandPartners
    }
  });

  try {
    await sendBrandedMail({
      to: email,
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
      replyTo: CONTACT.schools
    });
  } catch (err) {
    console.error("[mail] verified school progress email failed:", err);
    return { ok: false as const, status: 503, message: "Could not send progress update email." };
  }

  await prisma.auditLog.create({
    data: {
      actorId: input.actorUserId,
      action: "VERIFIED_SCHOOL_PROGRESS_EMAIL_SENT",
      targetType: "School",
      targetId: school.id,
      payload: {
        emailed: email,
        subject: mail.subject,
        messagePreview: parsed.data.message.slice(0, 200)
      }
    }
  });

  return { ok: true as const, status: 200, emailed: email, message: `Progress update sent to ${email}.` };
}
