import { notifyAdminsByEmail } from "./adminNotify.js";
import { CONTACT } from "./contacts.js";
import {
  buildAdminNewBrandApplicationEmail,
  buildAdminNewSchoolRegistrationEmail
} from "./emails/registrationAdminEmails.js";
import {
  adminReviewUrlForSchool,
  buildSchoolVerificationSubmittedOpsEmail
} from "./emails/schoolVerificationEmails.js";

export async function notifyAdminsNewSchoolRegistration(input: {
  schoolId: string;
  schoolName: string;
  province: string;
  district: string;
  principalName: string;
  principalEmail: string;
  schoolCode: string;
}): Promise<void> {
  const mail = buildAdminNewSchoolRegistrationEmail(input);
  void notifyAdminsByEmail({
    subject: mail.subject,
    text: mail.text,
    html: mail.html,
    replyTo: CONTACT.schools
  }).catch((err) => console.error("[mail] admin new school notify failed:", err));
}

export async function notifyAdminsNewBrandApplication(input: {
  brandId: string;
  brandName: string;
  codePrefix: string;
  primaryContactEmail: string | null;
  registrationNumber: string | null;
  intendedProvinces: string[];
}): Promise<void> {
  const mail = buildAdminNewBrandApplicationEmail(input);
  void notifyAdminsByEmail({
    subject: mail.subject,
    text: mail.text,
    html: mail.html,
    replyTo: CONTACT.brands
  }).catch((err) => console.error("[mail] admin new brand notify failed:", err));
}

export async function notifyAdminsSchoolVerificationSubmitted(input: {
  schoolId: string;
  schoolName: string;
  province: string;
  district: string;
  emisNumber: string;
  principalName: string;
}): Promise<void> {
  const mail = buildSchoolVerificationSubmittedOpsEmail({
    ...input,
    reviewUrl: adminReviewUrlForSchool(input.schoolId)
  });
  void notifyAdminsByEmail({
    subject: mail.subject,
    text: mail.text,
    html: mail.html,
    replyTo: CONTACT.schools
  }).catch((err) => console.error("[mail] admin verification packet notify failed:", err));
}
