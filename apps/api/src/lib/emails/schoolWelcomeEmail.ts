import { CONTACT } from "../contacts.js";
import { env } from "../../config/env.js";
import { buildBrandedEmail, escapeHtml, paragraphs } from "../emailTemplate.js";
import { getOrganizationCategory } from "../organizationCategories.js";

export type SchoolWelcomeEmailInput = {
  principalName: string;
  schoolName: string;
  loginUrl: string;
  documentsUrl: string;
  organizationCategory?: string;
};

function publicSiteUrl(): string {
  return env.WEB_APP_URL.replace(/\/$/, "").replace(/^https?:\/\//, "");
}

export function buildSchoolWelcomeEmail(input: SchoolWelcomeEmailInput): {
  subject: string;
  text: string;
  html: string;
} {
  const category = getOrganizationCategory(input.organizationCategory ?? "SCHOOL");
  const isSchool = category.id === "SCHOOL";
  const entity = isSchool ? "school" : "organisation";
  const entityPlural = isSchool ? "schools" : "organisations";
  const dashboardLabel = isSchool ? "School Dashboard" : "Organisation Dashboard";

  const siteUrl = publicSiteUrl();
  const subject = "Welcome to Brand2School!";

  const text = [
    `Dear ${input.principalName},`,
    "",
    "Welcome to Brand2School!",
    "",
    `Thank you for registering your ${entity} and becoming part of a growing movement dedicated to connecting ${entityPlural}, brands, businesses, and communities to create measurable social impact.`,
    "",
    `We are excited to have your ${entity} on board.`,
    "",
    "What's Next?",
    "",
    `To activate your ${entity}'s participation on the Brand2School platform, please complete the following steps:`,
    "",
    `✅ Log in to your ${dashboardLabel}`,
    `✅ Complete your ${entity} profile (if applicable)`,
    '✅ Upload the required verification documents by selecting "Docs" from the navigation menu on your dashboard.',
    "",
    "Once your documents have been successfully submitted, our Governance Team will review your application.",
    `You will receive an email notification once your ${entity} has been verified.`,
    "",
    "Why Verification?",
    "",
    "Verification helps us:",
    `• Protect ${entityPlural} from fraudulent registrations`,
    "• Build trust with participating brands and partners",
    "• Ensure transparency and accountability",
    "• Create a safe and credible platform for all participants",
    "",
    "Access Your Dashboard",
    siteUrl,
    "",
    `Login: ${input.loginUrl}`,
    "",
    "Thank you for joining us on this exciting journey.",
    "",
    `Together, we are creating stronger partnerships between ${entityPlural}, businesses, and communities to unlock new opportunities for learners across South Africa.`,
    "",
    `We look forward to welcoming your ${entity} as a verified Brand2School partner.`,
    "",
    "Kind regards,",
    "Brand2School Governance Team",
    "Brand2School",
    "Where Brands Meet School Needs",
    siteUrl,
    "",
    CONTACT.schools,
    "",
    "— Brand2School"
  ].join("\n");

  const html = buildBrandedEmail({
    preheader: "Welcome to Brand2School — here's what to do next",
    title: "Welcome to Brand2School!",
    subtitle: input.schoolName,
    primaryCta: { label: `Log in to ${dashboardLabel}`, href: input.loginUrl },
    bodyHtml: [
      paragraphs(
        `Dear ${escapeHtml(input.principalName)},`,
        "Welcome to Brand2School!",
        `Thank you for registering your ${entity} and becoming part of a growing movement dedicated to connecting ${entityPlural}, brands, businesses, and communities to create measurable social impact.`,
        `We are excited to have your ${entity} on board.`
      )
    ].join(""),
    sections: [
      {
        title: "What's Next?",
        bodyHtml: paragraphs(
          `To activate your ${entity}'s participation on the Brand2School platform, please complete the following steps:`,
          `✅ Log in to your ${dashboardLabel}`,
          `✅ Complete your ${entity} profile (if applicable)`,
          '✅ Upload the required verification documents by selecting <strong>Docs</strong> from the navigation menu on your dashboard.',
          "Once your documents have been successfully submitted, our Governance Team will review your application.",
          `You will receive an email notification once your ${entity} has been verified.`
        ),
        cta: { label: "Open Docs", href: input.documentsUrl, variant: "outline" }
      },
      {
        title: "Why Verification?",
        bodyHtml: paragraphs(
          "Verification helps us:",
          `• Protect ${entityPlural} from fraudulent registrations`,
          "• Build trust with participating brands and partners",
          "• Ensure transparency and accountability",
          "• Create a safe and credible platform for all participants"
        )
      },
      {
        title: "Access Your Dashboard",
        bodyHtml: paragraphs(
          `<a href="${escapeHtml(input.loginUrl)}">${escapeHtml(siteUrl)}</a>`,
          "Thank you for joining us on this exciting journey.",
          `Together, we are creating stronger partnerships between ${entityPlural}, businesses, and communities to unlock new opportunities for learners across South Africa.`,
          `We look forward to welcoming your ${entity} as a verified Brand2School partner.`,
          "Kind regards,",
          "<strong>Brand2School Governance Team</strong>",
          "Brand2School",
          "Where Brands Meet School Needs"
        )
      }
    ],
    footerNote: `Brand2School Governance Team · ${CONTACT.schools} · ${siteUrl}`
  });

  return { subject, text, html };
}
