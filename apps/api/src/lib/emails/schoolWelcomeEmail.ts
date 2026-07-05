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

function bulletLines(items: string[]): string {
  return items.map((item) => `• ${item}`).join("\n");
}

function bulletListHtml(items: string[]): string {
  return `<ul style="margin:12px 0;padding-left:20px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.65;color:#1f2937;">${items
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join("")}</ul>`;
}

export function buildSchoolWelcomeEmail(input: SchoolWelcomeEmailInput): {
  subject: string;
  text: string;
  html: string;
} {
  const category = getOrganizationCategory(input.organizationCategory ?? "SCHOOL");
  const isSchool = category.id === "SCHOOL";
  const entity = isSchool ? "school" : "organisation";
  const dashboardLabel = isSchool ? "School Dashboard" : "Organisation Dashboard";
  const siteUrl = publicSiteUrl();
  const subject = "Welcome to Brand2School!";

  const whoCanParticipate = [
    "Public and Independent Schools",
    "Small Businesses",
    "National Brands",
    "Community Organisations",
    "NGOs and NPOs",
    "Sports Clubs",
    "Vehicle Clubs",
    "Youth Organisations",
    "Community Leaders",
    "Municipalities",
    "Individuals who want to support education"
  ];

  const campaignSurfaces = [
    "Products",
    "Receipts",
    "Promotional Material",
    "Marketing Campaigns",
    "Community Activations"
  ];

  const schoolExpectations = [
    "Complete the verification process.",
    "Keep school information accurate and up to date.",
    "Respond to Brand2School communications.",
    "Participate in campaigns and promotional opportunities.",
    "Encourage parents, learners and the community to support participating brands.",
    "Share Brand2School campaigns through school communication channels where appropriate."
  ];

  const orgExpectations = schoolExpectations.map((line) =>
    line.replace(/school/gi, (match) => (match[0] === "S" ? "Organisation" : "organisation"))
  );

  const expectations = isSchool ? schoolExpectations : orgExpectations;
  const expectationsTitle = isSchool ? "What We Expect From Schools" : "What We Expect From Participating Organisations";

  const text = [
    `Dear ${input.principalName},`,
    "",
    "Welcome to Brand2School, and thank you for joining a growing community committed to transforming education through collaboration.",
    "",
    `We are delighted to have your ${entity} as part of our platform.`,
    "",
    "WHAT IS BRAND2SCHOOL?",
    "",
    "Brand2School is a South African digital platform that connects schools, brands, organisations, clubs, businesses, and communities to create measurable social impact.",
    "",
    "Our mission is simple:",
    "To help schools access meaningful support while giving brands and organisations a transparent way to invest in education and community development.",
    "",
    "Instead of relying only on traditional fundraising or sponsorships, Brand2School creates partnerships that benefit everyone involved.",
    "",
    "WHY BRAND2SCHOOL?",
    "",
    "Many schools have real needs that often go unnoticed.",
    "",
    "At the same time, thousands of businesses, organisations and community groups want to make a difference but don't always know:",
    "• which schools need assistance",
    "• how to contribute",
    "• how to measure their impact",
    "",
    "Brand2School bridges that gap by providing one trusted platform where support can be created, managed and measured.",
    "",
    "WHO CAN PARTICIPATE?",
    "",
    "Brand2School welcomes:",
    bulletLines(whoCanParticipate),
    "",
    "Everyone has a role to play in building stronger schools and stronger communities.",
    "",
    "HOW THE CAMPAIGN WORKS",
    "",
    `Once your ${entity} has been verified, it becomes eligible to participate in Brand2School campaigns.`,
    "",
    "Participating brands receive unique campaign codes that may appear on:",
    bulletLines(campaignSurfaces),
    "",
    "Community members simply support participating brands.",
    "",
    "Those interactions generate measurable participation that helps create visibility and opportunities for schools while giving brands measurable social impact.",
    "",
    "Every campaign is designed to be transparent, accountable and data-driven.",
    "",
    expectationsTitle.toUpperCase(),
    "",
    `To ensure the success of the platform, participating ${entityPlural(isSchool)} are expected to:`,
    bulletLines(expectations),
    "",
    `The more actively your ${entity} participates, the greater the opportunities for partnerships and community support.`,
    "",
    "GET STARTED",
    "",
    `1. Log in to your ${dashboardLabel}: ${input.loginUrl}`,
    `2. Upload required verification documents via Docs: ${input.documentsUrl}`,
    "3. Our Governance Team will review your application once documents are submitted.",
    "",
    siteUrl,
    "",
    "Kind regards,",
    "Brand2School Governance Team",
    "Brand2School",
    "Where Brands Meet School Needs",
    "",
    CONTACT.schools,
    "",
    "— Brand2School"
  ].join("\n");

  const html = buildBrandedEmail({
    preheader: "Welcome to Brand2School — your guide to participation and impact",
    title: "Welcome to Brand2School!",
    subtitle: input.schoolName,
    primaryCta: { label: `Log in to ${dashboardLabel}`, href: input.loginUrl },
    bodyHtml: paragraphs(
      `Dear ${escapeHtml(input.principalName)},`,
      "Welcome to <strong>Brand2School</strong>, and thank you for joining a growing community committed to transforming education through collaboration.",
      `We are delighted to have your ${entity} as part of our platform.`
    ),
    sections: [
      {
        title: "What is Brand2School?",
        bodyHtml: [
          paragraphs(
            "Brand2School is a South African digital platform that connects <strong>schools, brands, organisations, clubs, businesses, and communities</strong> to create measurable social impact.",
            "<strong>Our mission is simple:</strong>",
            "<strong>To help schools access meaningful support while giving brands and organisations a transparent way to invest in education and community development.</strong>",
            "Instead of relying only on traditional fundraising or sponsorships, Brand2School creates partnerships that benefit everyone involved."
          )
        ].join("")
      },
      {
        title: "Why Brand2School?",
        bodyHtml: [
          paragraphs(
            "Many schools have real needs that often go unnoticed.",
            "At the same time, thousands of businesses, organisations and community groups want to make a difference but don't always know:"
          ),
          bulletListHtml([
            "which schools need assistance",
            "how to contribute",
            "how to measure their impact"
          ]),
          paragraphs(
            "Brand2School bridges that gap by providing one trusted platform where support can be created, managed and measured."
          )
        ].join("")
      },
      {
        title: "Who Can Participate?",
        bodyHtml: [
          paragraphs("Brand2School welcomes:"),
          bulletListHtml(whoCanParticipate),
          paragraphs("Everyone has a role to play in building stronger schools and stronger communities.")
        ].join("")
      },
      {
        title: "How the Campaign Works",
        bodyHtml: [
          paragraphs(
            `Once your ${entity} has been verified, it becomes eligible to participate in Brand2School campaigns.`,
            "Participating brands receive unique campaign codes that may appear on:"
          ),
          bulletListHtml(campaignSurfaces),
          paragraphs(
            "Community members simply support participating brands.",
            "Those interactions generate measurable participation that helps create visibility and opportunities for schools while giving brands measurable social impact.",
            "Every campaign is designed to be transparent, accountable and data-driven."
          )
        ].join("")
      },
      {
        title: expectationsTitle,
        bodyHtml: [
          paragraphs(`To ensure the success of the platform, participating ${entityPlural(isSchool)} are expected to:`),
          bulletListHtml(expectations),
          paragraphs(
            `The more actively your ${entity} participates, the greater the opportunities for partnerships and community support.`
          )
        ].join("")
      },
      {
        title: "Get started",
        bodyHtml: paragraphs(
          `Log in to your ${dashboardLabel} and upload required verification documents via <strong>Docs</strong> on your dashboard.`,
          "Once your documents have been submitted, our Governance Team will review your application.",
          `You will receive a notification once your ${entity} has been verified.`,
          `<a href="${escapeHtml(input.loginUrl)}">${escapeHtml(siteUrl)}</a>`,
          "Kind regards,",
          "<strong>Brand2School Governance Team</strong>",
          "Brand2School · Where Brands Meet School Needs"
        ),
        cta: { label: "Open Docs", href: input.documentsUrl, variant: "outline" }
      }
    ],
    footerNote: `${CONTACT.schools} · ${siteUrl}`
  });

  return { subject, text, html };
}

function entityPlural(isSchool: boolean): string {
  return isSchool ? "schools" : "organisations";
}
