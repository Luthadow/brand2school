import { env } from "../../config/env.js";
import { CONTACT } from "../contacts.js";
import { buildBrandedEmail, escapeHtml, paragraphs } from "../emailTemplate.js";

export type SchoolVerificationOpsEmailInput = {
  schoolName: string;
  province: string;
  district: string;
  emisNumber: string;
  principalName: string;
  reviewUrl: string;
};

export type SchoolVerificationPrincipalEmailInput = {
  to: string;
  principalName: string;
  schoolName: string;
  documentsUrl: string;
  rejectionReason?: string;
  reviewerNotes?: string;
};

function documentsUrl(): string {
  return `${env.WEB_APP_URL.replace(/\/$/, "")}/school/dashboard/documents`;
}

function adminReviewUrl(schoolId: string): string {
  return `${env.ADMIN_WEB_APP_URL.replace(/\/$/, "")}/dashboard/schools/${schoolId}/verification`;
}

export function adminReviewUrlForSchool(schoolId: string): string {
  return adminReviewUrl(schoolId);
}

export function schoolDocumentsUrl(): string {
  return documentsUrl();
}

export function buildSchoolVerificationSubmittedOpsEmail(input: SchoolVerificationOpsEmailInput): {
  subject: string;
  text: string;
  html: string;
} {
  const subject = `School verification packet — ${input.schoolName}`;
  const text = [
    "A school submitted an EMIS verification packet for review.",
    "",
    `School: ${input.schoolName}`,
    `EMIS: ${input.emisNumber}`,
    `Province: ${input.province}`,
    `District: ${input.district}`,
    `Principal: ${input.principalName}`,
    "",
    `Review: ${input.reviewUrl}`,
    "",
    `— Brand2School (${CONTACT.schools})`
  ].join("\n");

  const html = buildBrandedEmail({
    preheader: "School verification packet awaiting review",
    title: "School verification submitted",
    subtitle: input.schoolName,
    primaryCta: { label: "Review packet", href: input.reviewUrl },
    bodyHtml: paragraphs(
      "A principal submitted EMIS number and supporting documents.",
      `EMIS number: ${escapeHtml(input.emisNumber)}`,
      `Location: ${escapeHtml(input.district)}, ${escapeHtml(input.province)}`,
      `Principal: ${escapeHtml(input.principalName)}`
    ),
    footerNote: `Governance · ${CONTACT.schools}`
  });

  return { subject, text, html };
}

export function buildSchoolVerificationApprovedPrincipalEmail(
  input: SchoolVerificationPrincipalEmailInput
): { subject: string; text: string; html: string } {
  const subject = `School verified — ${input.schoolName}`;
  const text = [
    `Dear ${input.principalName},`,
    "",
    `Your verification packet for ${input.schoolName} has been approved.`,
    "Our team will now advance your school through the activation queue. You may continue updating infrastructure evidence in your portal.",
    "",
    input.reviewerNotes ? `Note from reviewer: ${input.reviewerNotes}` : "",
    "",
    `Portal: ${input.documentsUrl}`,
    "",
    `Support: ${CONTACT.schools}`,
    "",
    "— Brand2School"
  ]
    .filter(Boolean)
    .join("\n");

  const html = buildBrandedEmail({
    preheader: "Your school verification was approved",
    title: "Verification approved",
    subtitle: input.schoolName,
    primaryCta: { label: "Open school portal", href: input.documentsUrl },
    bodyHtml: paragraphs(
      `Dear ${escapeHtml(input.principalName)},`,
      "Your EMIS verification packet has been approved. Brand2School will advance your school through the governed activation workflow.",
      input.reviewerNotes ? `Reviewer note: ${escapeHtml(input.reviewerNotes)}` : "No additional notes."
    ),
    footerNote: CONTACT.schools
  });

  return { subject, text, html };
}

export function buildSchoolVerificationRejectedPrincipalEmail(
  input: SchoolVerificationPrincipalEmailInput
): { subject: string; text: string; html: string } {
  const subject = `Action required — verification for ${input.schoolName}`;
  const reason = input.rejectionReason ?? "Documents could not be verified.";
  const text = [
    `Dear ${input.principalName},`,
    "",
    `We could not approve the verification packet for ${input.schoolName}.`,
    `Reason: ${reason}`,
    "",
    "Please upload corrected documents and resubmit.",
    "",
    `Resubmit: ${input.documentsUrl}`,
    "",
    `Support: ${CONTACT.schools}`,
    "",
    "— Brand2School"
  ].join("\n");

  const html = buildBrandedEmail({
    preheader: "Please resubmit school verification documents",
    title: "Verification needs correction",
    subtitle: input.schoolName,
    primaryCta: { label: "Resubmit documents", href: input.documentsUrl },
    bodyHtml: paragraphs(
      `Dear ${escapeHtml(input.principalName)},`,
      `Reason: ${escapeHtml(reason)}`,
      "Upload a clear principal ID, official school letter, and EMIS registry screenshot or letter, then submit again."
    ),
    footerNote: CONTACT.schools
  });

  return { subject, text, html };
}
