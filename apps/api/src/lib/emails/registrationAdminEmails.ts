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

export type SchoolVerificationDocumentsEmailInput = {
  principalName: string;
  schoolName: string;
  outstandingDocuments: string[];
  documentsUrl: string;
  loginUrl: string;
  siteUrl: string;
};

function schoolPortalLoginUrl(): string {
  return `${env.WEB_APP_URL.replace(/\/$/, "")}/school/login`;
}

function publicSiteUrl(): string {
  return env.WEB_APP_URL.replace(/\/$/, "").replace(/^https?:\/\//, "");
}

export function buildSchoolVerificationDocumentsRequiredEmail(
  input: SchoolVerificationDocumentsEmailInput
): { subject: string; text: string; html: string } {
  const subject = `Action required — verification documents for ${input.schoolName}`;
  const docListText = input.outstandingDocuments.map((doc) => `• ${doc}`).join("\n");
  const docListHtml = input.outstandingDocuments.length
    ? `<ul style="margin:12px 0;padding-left:20px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#1f2937;">${input.outstandingDocuments
        .map((doc) => `<li>${escapeHtml(doc)}</li>`)
        .join("")}</ul>`
    : "";

  const text = [
    `Dear ${input.principalName},`,
    "",
    "Our team reviewed your registration and needs the following:",
    "",
    "Please upload all outstanding required verification documents through your Brand2School Dashboard.",
    "",
    "Outstanding documents:",
    docListText,
    "",
    "How to upload your documents:",
    "1. Log in to your Brand2School account.",
    "2. On your School Dashboard, open the navigation menu.",
    '3. Click on "Docs".',
    "4. Upload all the required verification documents.",
    "",
    "Please ensure that all uploaded documents are clear, valid, and match the information provided during registration.",
    "",
    "Your school can already participate in verified community code submissions while documents are outstanding. To claim infrastructure milestones and complete activation, all required verification documents must be submitted and approved.",
    "",
    "Once the required documents have been submitted, our Governance Team will review your application. You will receive a notification once the verification process has been completed.",
    "",
    "To access your dashboard, please log in at:",
    input.siteUrl,
    "",
    `School portal: ${input.documentsUrl}`,
    `Login: ${input.loginUrl}`,
    "",
    "Thank you for your cooperation. We look forward to completing your verification and welcoming you to the Brand2School community.",
    "",
    "Kind regards,",
    "Brand2School Governance Team",
    "Brand2School",
    "Where Brands Meet School Needs",
    input.siteUrl,
    "",
    CONTACT.schools,
    "",
    "— Brand2School"
  ].join("\n");

  const html = buildBrandedEmail({
    preheader: "Upload outstanding verification documents for your school",
    title: "Verification documents required",
    subtitle: input.schoolName,
    primaryCta: { label: "Open Docs in dashboard", href: input.documentsUrl },
    bodyHtml: [
      paragraphs(`Dear ${escapeHtml(input.principalName)},`, "Our team reviewed your registration and needs the following:"),
      paragraphs(
        "Please upload all outstanding required verification documents through your Brand2School Dashboard."
      ),
      input.outstandingDocuments.length
        ? `<p style="margin:0 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;color:#1f2937;">Outstanding documents</p>${docListHtml}`
        : "",
      paragraphs(
        "<strong>How to upload your documents:</strong>",
        "1. Log in to your Brand2School account.",
        "2. On your School Dashboard, open the navigation menu.",
        '3. Click on <strong>Docs</strong>.',
        "4. Upload all the required verification documents.",
        "Please ensure that all uploaded documents are clear, valid, and match the information provided during registration.",
        "Your school can already participate in verified community code submissions while documents are outstanding. To <strong>claim infrastructure milestones</strong> and complete activation, all required verification documents must be submitted and approved.",
        "Once the required documents have been submitted, our Governance Team will review your application. You will receive a notification once the verification process has been completed.",
        `To access your dashboard, please log in at: <a href="${escapeHtml(input.loginUrl)}">${escapeHtml(input.siteUrl)}</a>`,
        "Thank you for your cooperation. We look forward to completing your verification and welcoming you to the Brand2School community."
      ),
      paragraphs("Kind regards,", "<strong>Brand2School Governance Team</strong>", "Brand2School", "Where Brands Meet School Needs")
    ].join(""),
    footerNote: `${CONTACT.schools} · ${input.siteUrl}`
  });

  return { subject, text, html };
}

export type RegistrantFollowupEmailInput = {
  recipientName: string;
  entityName: string;
  message: string;
  actionUrl: string;
};

function brandPortalUrl(): string {
  return `${env.WEB_APP_URL.replace(/\/$/, "")}/brand/login`;
}

/** @deprecated Manual admin follow-up — schools receive automated document requests instead. */
export function buildSchoolRegistrationInfoRequiredEmail(
  input: RegistrantFollowupEmailInput
): { subject: string; text: string; html: string } {
  return buildSchoolVerificationDocumentsRequiredEmail({
    principalName: input.recipientName,
    schoolName: input.entityName,
    outstandingDocuments: input.message
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean),
    documentsUrl: input.actionUrl,
    loginUrl: schoolPortalLoginUrl(),
    siteUrl: publicSiteUrl()
  });
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
      "The principal receives a welcome email on registration. A separate verification-documents email is sent only if verification is rejected or an admin resends it.",
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

export function schoolPortalLoginUrlForRegistrant(): string {
  return schoolPortalLoginUrl();
}

export function publicSiteUrlForRegistrant(): string {
  return publicSiteUrl();
}

export function brandOnboardingUrlForRegistrant(): string {
  return `${env.WEB_APP_URL.replace(/\/$/, "")}/brand/dashboard`;
}
