import type { NotificationTemplate } from "../../generated/prisma/index.js";
import {
  sendBrandWelcomeEmail,
  sendContactAcknowledgement,
  sendContactInquiryToInfo,
  sendEsgReportEmail,
  sendPasswordResetEmail,
  sendSchoolApprovedEmail,
  sendSchoolRegistrationEmail
} from "../mail.js";
import { parseNotificationPayload, type NotificationPayloadMap } from "./payloads.js";

export async function deliverNotificationTemplate<T extends NotificationTemplate>(
  template: T,
  recipient: string,
  payload: NotificationPayloadMap[T]
): Promise<{ subject: string }> {
  switch (template) {
    case "SCHOOL_REGISTRATION": {
      const data = parseNotificationPayload("SCHOOL_REGISTRATION", payload);
      return sendSchoolRegistrationEmail({ to: recipient, ...data });
    }
    case "SCHOOL_APPROVED": {
      const data = parseNotificationPayload("SCHOOL_APPROVED", payload);
      return sendSchoolApprovedEmail({ to: recipient, ...data });
    }
    case "BRAND_WELCOME": {
      const data = parseNotificationPayload("BRAND_WELCOME", payload);
      return sendBrandWelcomeEmail({ to: recipient, ...data });
    }
    case "PASSWORD_RESET": {
      const data = parseNotificationPayload("PASSWORD_RESET", payload);
      return sendPasswordResetEmail({ to: recipient, ...data });
    }
    case "CONTACT_INQUIRY_INFO": {
      const data = parseNotificationPayload("CONTACT_INQUIRY_INFO", payload);
      return sendContactInquiryToInfo(data);
    }
    case "CONTACT_ACK": {
      const data = parseNotificationPayload("CONTACT_ACK", payload);
      return sendContactAcknowledgement(data);
    }
    case "ESG_REPORT": {
      const data = parseNotificationPayload("ESG_REPORT", payload);
      return sendEsgReportEmail({
        to: recipient,
        brandName: data.brandName,
        cadence: data.cadence,
        periodLabel: data.periodLabel,
        filename: data.filename,
        pdf: Buffer.from(data.pdfBase64, "base64")
      });
    }
    default: {
      const exhaustive: never = template;
      throw new Error(`Unsupported notification template: ${exhaustive}`);
    }
  }
}
