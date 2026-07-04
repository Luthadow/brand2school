import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { generateSchoolCode } from "../../lib/codes.js";
import { queueEmail } from "../../lib/notifications/dispatch.js";
import { notifyAdminsNewSchoolRegistration } from "../../lib/registrationNotify.js";
import { normalizePhone } from "../../lib/phones.js";
import { env } from "../../config/env.js";

import { isOrganizationCategoryId, getOrganizationCategory } from "../../lib/organizationCategories.js";

export const schoolRegisterSchema = z
  .object({
    organizationCategory: z.enum(["SCHOOL", "NGO_NPO", "COMMUNITY", "FAITH"]).default("SCHOOL"),
    name: z.string().min(3),
    province: z.string().min(2),
    district: z.string().min(2),
    principalName: z.string().min(2),
    contactEmail: z.string().email(),
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
    whatsappPhone: z.string().min(8)
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"]
  });

export type SchoolRegisterInput = z.infer<typeof schoolRegisterSchema>;

async function uniqueSchoolCode(
  name: string,
  province: string,
  organizationCategory: string
): Promise<string> {
  for (let i = 0; i < 8; i += 1) {
    const schoolCode = generateSchoolCode(name, province, organizationCategory);
    const exists = await prisma.school.findUnique({ where: { schoolCode } });
    if (!exists) return schoolCode;
  }
  throw new Error("Could not generate unique school code.");
}

export async function registerSchool(input: Omit<SchoolRegisterInput, "confirmPassword">) {
  const whatsappPhone = normalizePhone(input.whatsappPhone);
  const email = input.contactEmail.trim().toLowerCase();

  const existingPhone = await prisma.school.findUnique({ where: { whatsappPhone } });
  if (existingPhone) {
    return {
      ok: false as const,
      status: 409,
      payload: {
        message: "A school is already registered with this WhatsApp number.",
        schoolCode: existingPhone.schoolCode
      }
    };
  }

  const existingEmail = await prisma.user.findUnique({ where: { email } });
  if (existingEmail) {
    return {
      ok: false as const,
      status: 409,
      payload: { message: "An account with this email already exists. Try logging in at /school/login." }
    };
  }

  const organizationCategory = isOrganizationCategoryId(input.organizationCategory)
    ? input.organizationCategory
    : "SCHOOL";
  const category = getOrganizationCategory(organizationCategory);

  const schoolCode = await uniqueSchoolCode(input.name, input.province, organizationCategory);
  const passwordHash = await bcrypt.hash(input.password, 10);

  const { school, user } = await prisma.$transaction(async (tx) => {
    const createdSchool = await tx.school.create({
      data: {
        name: input.name.trim(),
        province: input.province.trim(),
        district: input.district.trim(),
        principalName: input.principalName.trim(),
        contactEmail: email,
        whatsappPhone,
        schoolCode,
        organizationCategory,
        status: "PENDING",
        annualCycleYear: new Date().getFullYear(),
        annualCycleFocus: "Safety & Sanitation"
      }
    });

    const createdUser = await tx.user.create({
      data: {
        fullName: input.principalName.trim(),
        email,
        passwordHash,
        role: "SCHOOL_ADMIN",
        status: "ACTIVE",
        schoolId: createdSchool.id
      }
    });

    await tx.schoolVerification.create({
      data: { schoolId: createdSchool.id, status: "NOT_SUBMITTED" }
    });

    await tx.auditLog.create({
      data: {
        action: "SCHOOL_REGISTERED",
        targetType: "school",
        targetId: createdSchool.id,
        payload: {
          schoolCode,
          principalEmail: email,
          source: "public_register"
        }
      }
    });

    return { school: createdSchool, user: createdUser };
  });

  const categorySlug = organizationCategory.toLowerCase().replace(/_/g, "-");
  const loginUrl = `${env.WEB_APP_URL}/organisations/login?category=${categorySlug}`;
  const documentsUrl = `${env.WEB_APP_URL.replace(/\/$/, "")}/school/dashboard/documents`;

  let emailSent = false;
  try {
    const jobId = await queueEmail({
      template: "SCHOOL_REGISTRATION",
      recipient: email,
      entityType: "SCHOOL",
      entityId: school.id,
      priority: 10,
      immediate: true,
      payload: {
        principalName: input.principalName.trim(),
        schoolName: school.name,
        schoolCode: school.schoolCode,
        whatsappPhone,
        loginUrl,
        organizationCategory,
        documentsUrl
      }
    });
    const job = await prisma.notificationJob.findUnique({
      where: { id: jobId },
      select: { status: true, lastError: true }
    });
    emailSent = job?.status === "SENT";
    if (!emailSent) {
      console.error(
        "[mail] School registration email not sent:",
        job?.lastError ?? "delivery failed"
      );
    }
  } catch (err) {
    console.error("[mail] Failed to send school registration email:", err);
  }

  void notifyAdminsNewSchoolRegistration({
    schoolId: school.id,
    schoolName: school.name,
    province: school.province,
    district: school.district,
    principalName: input.principalName.trim(),
    principalEmail: email,
    schoolCode: school.schoolCode
  });

  return {
    ok: true as const,
    status: 201,
    payload: {
      message: emailSent
        ? `${category.label} registered successfully. A welcome email was sent to ${email}. WhatsApp is linked to your number.`
        : `${category.label} registered successfully. We could not send the welcome email — save your reference code below. Check spam, or contact schools@brand2school.co.za for help.`,
      emailSent,
      organizationCategory,
      principal: { id: user.id, email: user.email },
      school: {
        id: school.id,
        name: school.name,
        schoolCode: school.schoolCode,
        status: school.status,
        province: school.province,
        district: school.district
      },
      whatsapp: {
        menuCommand: "MENU",
        submitCommand:
          organizationCategory === "SCHOOL"
            ? "Reply 1 → select province → district → school → campaign → product code"
            : "Reply 1 → select province → district → organisation → campaign → product code",
        progressCommand:
          organizationCategory === "SCHOOL"
            ? "Reply 2 → select province → district → school"
            : "Reply 2 → select province → district → organisation",
        linkedPhone: whatsappPhone
      },
      portal: { loginUrl }
    }
  };
}

export async function findSchoolByWhatsapp(from?: string) {
  if (!from) return null;
  const normalized = normalizePhone(from);
  return prisma.school.findUnique({
    where: { whatsappPhone: normalized }
  });
}

export async function findSchoolByCode(code: string) {
  return prisma.school.findUnique({
    where: { schoolCode: code.toUpperCase() }
  });
}

export async function findSchoolByNameAndDistrict(schoolName: string, district: string) {
  const normalizedDistrict = district.trim();
  const normalizedName = schoolName.trim();

  return prisma.school.findFirst({
    where: {
      district: { equals: normalizedDistrict, mode: "insensitive" },
      name: { contains: normalizedName, mode: "insensitive" },
      status: { in: ["PENDING", "ACTIVE", "APPROVED", "VERIFIED"] }
    }
  });
}

export async function getSchoolForUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { school: true }
  });
  return user?.school ?? null;
}
