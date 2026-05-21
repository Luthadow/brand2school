import { z } from "zod";
import type { NotificationTemplate } from "../../generated/prisma/index.js";

export const schoolRegistrationPayloadSchema = z.object({
  principalName: z.string(),
  schoolName: z.string(),
  schoolCode: z.string(),
  whatsappPhone: z.string(),
  loginUrl: z.string().url()
});

export const schoolApprovedPayloadSchema = z.object({
  principalName: z.string(),
  schoolName: z.string(),
  schoolCode: z.string(),
  whatsappPhone: z.string(),
  loginUrl: z.string().url()
});

export const brandWelcomePayloadSchema = z.object({
  contactName: z.string(),
  brandName: z.string(),
  loginUrl: z.string().url()
});

export const passwordResetPayloadSchema = z.object({
  fullName: z.string(),
  resetUrl: z.string().url(),
  expiresMinutes: z.number().int().positive()
});

export const contactInquiryPayloadSchema = z.object({
  fullName: z.string(),
  email: z.string().email(),
  organisation: z.string().optional(),
  phone: z.string().optional(),
  topic: z.string(),
  message: z.string()
});

export const esgReportPayloadSchema = z.object({
  scheduleId: z.string().cuid().optional(),
  brandName: z.string(),
  cadence: z.string(),
  periodLabel: z.string(),
  filename: z.string(),
  pdfBase64: z.string()
});

export type NotificationPayloadMap = {
  SCHOOL_REGISTRATION: z.infer<typeof schoolRegistrationPayloadSchema>;
  SCHOOL_APPROVED: z.infer<typeof schoolApprovedPayloadSchema>;
  BRAND_WELCOME: z.infer<typeof brandWelcomePayloadSchema>;
  PASSWORD_RESET: z.infer<typeof passwordResetPayloadSchema>;
  CONTACT_INQUIRY_INFO: z.infer<typeof contactInquiryPayloadSchema>;
  CONTACT_ACK: z.infer<typeof contactInquiryPayloadSchema>;
  ESG_REPORT: z.infer<typeof esgReportPayloadSchema>;
};

const payloadSchemas: Record<NotificationTemplate, z.ZodTypeAny> = {
  SCHOOL_REGISTRATION: schoolRegistrationPayloadSchema,
  SCHOOL_APPROVED: schoolApprovedPayloadSchema,
  BRAND_WELCOME: brandWelcomePayloadSchema,
  PASSWORD_RESET: passwordResetPayloadSchema,
  CONTACT_INQUIRY_INFO: contactInquiryPayloadSchema,
  CONTACT_ACK: contactInquiryPayloadSchema,
  ESG_REPORT: esgReportPayloadSchema
};

export function parseNotificationPayload<T extends NotificationTemplate>(
  template: T,
  payload: unknown
): NotificationPayloadMap[T] {
  return payloadSchemas[template].parse(payload) as NotificationPayloadMap[T];
}
