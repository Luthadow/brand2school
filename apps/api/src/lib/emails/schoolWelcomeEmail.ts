import { CONTACT } from "../contacts.js";
import { env } from "../../config/env.js";
import { buildBrandedEmail, escapeHtml, paragraphs } from "../emailTemplate.js";

export type SchoolWelcomeEmailInput = {
  principalName: string;
  schoolName: string;
  loginUrl: string;
  documentsUrl: string;
};

function publicSiteUrl(): string {
  return env.WEB_APP_URL.replace(/\/$/, "").replace(/^https?:\/\//, "");
}

export function buildSchoolWelcomeEmail(input: SchoolWelcomeEmailInput): {
  subject: string;
  text: string;
  html: string;
} {
  const siteUrl = publicSiteUrl();
  const subject = "Welcome to Brand2School!";

  const text = [
    `Dear ${input.principalName},`,
    "",
    "Welcome to Brand2School!",
    "",
    "Thank you for registering your school and becoming part of a growing movement dedicated to connecting schools, brands, businesses, and communities to create measurable social impact.",
    "",
    "We are excited to have your school on board.",
    "",
    "What's Next?",
    "",
    "To activate your school's participation on the Brand2School platform, please complete the following steps:",
    "",
    "✅ Log in to your School Dashboard",
    "✅ Complete your school profile (if applicable)",
    '✅ Upload the required verification documents by selecting "Docs" from the navigation menu on your dashboard.',
    "",
    "Once your documents have been successfully submitted, our Governance Team will review your application.",
    "You will receive an email notification once your school has been verified.",
    "",
    "Why Verification?",
    "",
    "Verification helps us:",
    "• Protect schools from fraudulent registrations",
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
    "Together, we are creating stronger partnerships between schools, businesses, and communities to unlock new opportunities for learners across South Africa.",
    "",
    "We look forward to welcoming your school as a verified Brand2School partner.",
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
    primaryCta: { label: "Log in to School Dashboard", href: input.loginUrl },
    bodyHtml: [
      paragraphs(
        `Dear ${escapeHtml(input.principalName)},`,
        "Welcome to Brand2School!",
        "Thank you for registering your school and becoming part of a growing movement dedicated to connecting schools, brands, businesses, and communities to create measurable social impact.",
        "We are excited to have your school on board."
      )
    ].join(""),
    sections: [
      {
        title: "What's Next?",
        bodyHtml: paragraphs(
          "To activate your school's participation on the Brand2School platform, please complete the following steps:",
          "✅ Log in to your School Dashboard",
          "✅ Complete your school profile (if applicable)",
          '✅ Upload the required verification documents by selecting <strong>Docs</strong> from the navigation menu on your dashboard.',
          "Once your documents have been successfully submitted, our Governance Team will review your application.",
          "You will receive an email notification once your school has been verified."
        ),
        cta: { label: "Open Docs", href: input.documentsUrl, variant: "outline" }
      },
      {
        title: "Why Verification?",
        bodyHtml: paragraphs(
          "Verification helps us:",
          "• Protect schools from fraudulent registrations",
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
          "Together, we are creating stronger partnerships between schools, businesses, and communities to unlock new opportunities for learners across South Africa.",
          "We look forward to welcoming your school as a verified Brand2School partner.",
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
