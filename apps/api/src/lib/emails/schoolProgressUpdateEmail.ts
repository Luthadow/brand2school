import { CONTACT } from "../contacts.js";
import { env } from "../../config/env.js";
import { buildBrandedEmail, escapeHtml, paragraphs } from "../emailTemplate.js";

export type SchoolProgressUpdateEmailInput = {
  principalName: string;
  schoolName: string;
  message: string;
  loginUrl: string;
  dashboardUrl: string;
  subject?: string;
  platformStats?: {
    schoolsRegistered: number;
    verifiedSubmissions: number;
    activeBrandPartners: number;
  };
};

function publicSiteUrl(): string {
  return env.WEB_APP_URL.replace(/\/$/, "").replace(/^https?:\/\//, "");
}

export function buildSchoolProgressUpdateEmail(input: SchoolProgressUpdateEmailInput): {
  subject: string;
  text: string;
  html: string;
} {
  const subject = input.subject?.trim() || `Brand2School update — ${input.schoolName}`;
  const messageParagraphs = input.message
    .split(/\n{2,}|\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const statsBlock = input.platformStats
    ? [
        "",
        "Platform progress snapshot:",
        `• ${input.platformStats.schoolsRegistered.toLocaleString("en-ZA")} organisations registered`,
        `• ${input.platformStats.verifiedSubmissions.toLocaleString("en-ZA")} verified submissions nationally`,
        `• ${input.platformStats.activeBrandPartners.toLocaleString("en-ZA")} active brand partners`,
        ""
      ]
    : [];

  const text = [
    `Dear ${input.principalName},`,
    "",
    ...messageParagraphs,
    ...statsBlock,
    "Your organisation dashboard:",
    input.dashboardUrl,
    "",
    `Login: ${input.loginUrl}`,
    "",
    "If you have questions, reply to this email or contact our schools team.",
    "",
    CONTACT.schools,
    "",
    "Kind regards,",
    "Brand2School Governance Team",
    publicSiteUrl(),
    "",
    "— Brand2School"
  ].join("\n");

  const statsHtml = input.platformStats
    ? `<ul style="margin:12px 0;padding-left:20px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#1f2937;">
        <li>${input.platformStats.schoolsRegistered.toLocaleString("en-ZA")} organisations registered</li>
        <li>${input.platformStats.verifiedSubmissions.toLocaleString("en-ZA")} verified submissions nationally</li>
        <li>${input.platformStats.activeBrandPartners.toLocaleString("en-ZA")} active brand partners</li>
      </ul>`
    : "";

  const html = buildBrandedEmail({
    preheader: `Update from Brand2School for ${input.schoolName}`,
    title: "Platform update",
    subtitle: input.schoolName,
    primaryCta: { label: "Open your dashboard", href: input.dashboardUrl },
    bodyHtml: [
      paragraphs(`Dear ${escapeHtml(input.principalName)},`, ...messageParagraphs.map((p) => escapeHtml(p))),
      statsHtml
        ? `<p style="margin:0 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;color:#1f2937;">Platform progress snapshot</p>${statsHtml}`
        : "",
      paragraphs(
        "If you have questions, reply to this email or contact our schools team.",
        "Kind regards,",
        "<strong>Brand2School Governance Team</strong>"
      )
    ].join(""),
    footerNote: `${CONTACT.schools} · ${publicSiteUrl()}`
  });

  return { subject, text, html };
}
