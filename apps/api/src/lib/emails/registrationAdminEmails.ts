import { CONTACT } from "../contacts.js";
import { adminApprovalsUrl, adminBrandReviewUrl, adminSchoolReviewUrl } from "../adminNotify.js";
import { env } from "../../config/env.js";
import { buildBrandedEmail, escapeHtml, paragraphs } from "../emailTemplate.js";

export type AdminNewSchoolEmailInput = {
  schoolId: string;
  schoolName: string;
  province: string;
  district: string;
  principalName: string;
  principalEmail: string;
  schoolCode: string;
};

export type AdminNewBrandEmailInput = {
  brandId: string;
  brandName: string;
  codePrefix: string;
  primaryContactEmail: string | null;
  registrationNumber: string | null;
  intendedProvinces: string[];
};

export type RegistrantFollowupEmailInput = {
  recipientName: string;
  entityName: string;
  message: string;
  actionUrl: string;
};

function schoolPortalLoginUrl(): string {
  return `${env.WEB_APP_URL.replace(/\/$/, "")}/school/login`;
}

function brandPortalUrl(): string {
  return `${env.WEB_APP_URL.replace(/\/$/, "")}/brand/login`;
}

export function buildAdminNewSchoolRegistrationEmail(input: AdminNewSchoolEmailInput): {
  subject: string;
  text: string;
  html: string;
} {
  const reviewUrl = adminSchoolReviewUrl(input.schoolId);
  const approvalsUrl = adminApprovalsUrl();
  const subject = `New school registration — ${input.schoolName}`;
  const text = [
    "A school registered on Brand2School and is awaiting review.",
    "",
    `School: ${input.schoolName}`,
    `Code: ${input.schoolCode}`,
    `Province: ${input.province}`,
    `District: ${input.district}`,
    `Principal: ${input.principalName}`,
    `Email: ${input.principalEmail}`,
    "",
    `Review school: ${reviewUrl}`,
    `Approvals queue: ${approvalsUrl}`,
    "",
    `— Brand2School (${CONTACT.schools})`
  ].join("\n");

  const html = buildBrandedEmail({
    preheader: "New school registration awaiting admin review",
    title: "New school registration",
    subtitle: input.schoolName,
    primaryCta: { label: "Review school", href: reviewUrl },
    bodyHtml: paragraphs(
      "A principal completed public school registration.",
      `School code: ${escapeHtml(input.schoolCode)}`,
      `Location: ${escapeHtml(input.district)}, ${escapeHtml(input.province)}`,
      `Principal: ${escapeHtml(input.principalName)} (${escapeHtml(input.principalEmail)})`,
      "You can approve the entity after EMIS documents are verified, or request documents from the school profile.",
      `Approvals queue: <a href="${escapeHtml(approvalsUrl)}">${escapeHtml(approvalsUrl)}</a>`
    ),
    footerNote: `Governance · ${CONTACT.schools}`
  });

  return { subject, text, html };
}

export function buildAdminNewBrandApplicationEmail(input: AdminNewBrandEmailInput): {
  subject: string;
  text: string;
  html: string;
} {
  const reviewUrl = adminBrandReviewUrl(input.brandId);
  const subject = `New brand application — ${input.brandName}`;
  const provinces = input.intendedProvinces.length ? input.intendedProvinces.join(", ") : "—";
  const text = [
    "A brand submitted a partnership application on Brand2School.",
    "",
    `Brand: ${input.brandName}`,
    `Code prefix: ${input.codePrefix}`,
    `Registration: ${input.registrationNumber ?? "—"}`,
    `Contact: ${input.primaryContactEmail ?? "—"}`,
    `Provinces: ${provinces}`,
    "",
    `Review application: ${reviewUrl}`,
    "",
    `— Brand2School (${CONTACT.brands})`
  ].join("\n");

  const html = buildBrandedEmail({
    preheader: "New brand application awaiting commercial review",
    title: "New brand application",
    subtitle: input.brandName,
    primaryCta: { label: "Review brand", href: reviewUrl },
    bodyHtml: paragraphs(
      "A company completed the public brand application form.",
      `Code prefix: ${escapeHtml(input.codePrefix)}`,
      `Registration number: ${escapeHtml(input.registrationNumber ?? "—")}`,
      `Contact: ${escapeHtml(input.primaryContactEmail ?? "—")}`,
      `Intended provinces: ${escapeHtml(provinces)}`
    ),
    footerNote: `Commercial · ${CONTACT.brands}`
  });

  return { subject, text, html };
}

export function buildSchoolRegistrationInfoRequiredEmail(
  input: RegistrantFollowupEmailInput
): { subject: string; text: string; html: string } {
  const subject = `Action required — ${input.entityName} registration`;
  const text = [
    `Dear ${input.recipientName},`,
    "",
    `Brand2School needs additional information for ${input.entityName}:`,
    "",
    input.message,
    "",
    `School portal: ${input.actionUrl}`,
    `Login: ${schoolPortalLoginUrl()}`,
    "",
    `Support: ${CONTACT.schools}`,
    "",
    "— Brand2School"
  ].join("\n");

  const html = buildBrandedEmail({
    preheader: "Additional documents or information required",
    title: "Information required",
    subtitle: input.entityName,
    primaryCta: { label: "Open school portal", href: input.actionUrl },
    bodyHtml: paragraphs(
      `Dear ${escapeHtml(input.recipientName)},`,
      "Our team reviewed your registration and needs the following:",
      input.message
        .split("\n")
        .map((line) => escapeHtml(line))
        .join("<br />")
    ),
    footerNote: CONTACT.schools
  });

  return { subject, text, html };
}

export function buildBrandRegistrationInfoRequiredEmail(
  input: RegistrantFollowupEmailInput
): { subject: string; text: string; html: string } {
  const subject = `Action required — ${input.entityName} application`;
  const text = [
    `Dear ${input.recipientName},`,
    "",
    `Brand2School needs additional information for your brand application (${input.entityName}):`,
    "",
    input.message,
    "",
    `Brand portal: ${input.actionUrl}`,
    `Login: ${brandPortalUrl()}`,
    "",
    `Partnerships: ${CONTACT.brands}`,
    "",
    "— Brand2School"
  ].join("\n");

  const html = buildBrandedEmail({
    preheader: "Additional commercial documents or information required",
    title: "Application — information required",
    subtitle: input.entityName,
    primaryCta: { label: "Open brand portal", href: input.actionUrl },
    bodyHtml: paragraphs(
      `Dear ${escapeHtml(input.recipientName)},`,
      "Our commercial team reviewed your application and needs the following:",
      input.message
        .split("\n")
        .map((line) => escapeHtml(line))
        .join("<br />")
    ),
    footerNote: CONTACT.brands
  });

  return { subject, text, html };
}

export function schoolDocumentsUrlForRegistrant(): string {
  return `${env.WEB_APP_URL.replace(/\/$/, "")}/school/dashboard/documents`;
}

export function brandOnboardingUrlForRegistrant(): string {
  return `${env.WEB_APP_URL.replace(/\/$/, "")}/brand/dashboard`;
}
