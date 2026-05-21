import { env } from "../../config/env.js";
import { CONTACT, INTERNAL_CONTACT } from "../contacts.js";
import {
  COMMERCIAL_ADD_ON_SERVICES,
  COMMERCIAL_VALUE_STREAMS,
  formatPriceRange,
  INFRASTRUCTURE_PHASE_TRACK,
  INDUSTRY_PHASE_ALIGNMENT,
  PREMIUM_POSITIONING,
  TERRITORIAL_PACKAGES
} from "../../modules/commercial/territorialPackages.js";
import { buildBrandedEmail, escapeHtml, paragraphs, type EmailSection } from "../emailTemplate.js";

export type BrandRegistrationGuideInput = {
  to: string;
  contactName: string;
  brandName: string;
  codePrefix: string;
  packageName?: string;
  forBrandsUrl?: string;
};

function checklistHtml(items: string[]): string {
  return `<ul style="margin:0;padding-left:20px;line-height:1.65;">${items
    .map((item) => `<li style="margin-bottom:6px;">${item}</li>`)
    .join("")}</ul>`;
}

function packageBlock(pkg: (typeof TERRITORIAL_PACKAGES)[number]): string {
  const pool =
    pkg.recommendedContributionPoolZar != null
      ? `From R${pkg.recommendedContributionPoolZar.toLocaleString("en-ZA")}+ (optional)`
      : "Custom (optional)";
  return paragraphs(
    `<strong>${escapeHtml(pkg.name)}</strong> — ${escapeHtml(pkg.idealFor)}`,
    `<strong>Coverage:</strong> ${escapeHtml(pkg.coverage)}`,
    `<strong>Platform &amp; ESG fee:</strong> ${escapeHtml(formatPriceRange(pkg))} per year`,
    `<strong>Recommended transformation pool:</strong> ${escapeHtml(pool)}`,
    checklistHtml(pkg.includes.map((i) => escapeHtml(i)))
  );
}

function buildGuideSections(input: BrandRegistrationGuideInput): EmailSection[] {
  const forBrands = input.forBrandsUrl ?? `${env.WEB_APP_URL.replace(/\/$/, "")}/for-brands`;

  return [
    {
      title: "1. Platform purpose",
      bodyHtml: paragraphs(
        "Brand2School supports educational infrastructure transformation, measurable ESG participation, transparent campaign verification, and public accountability.",
        `<strong>It is NOT:</strong> a donation platform, unverified fundraising, or an informal sponsorship program.`
      )
    },
    {
      title: "2. Commercial participation model",
      bodyHtml: paragraphs(
        `<strong>1 — ${escapeHtml(COMMERCIAL_VALUE_STREAMS.activationFee.label)}</strong><br/>${escapeHtml(COMMERCIAL_VALUE_STREAMS.activationFee.description)}`,
        `<strong>2 — ${escapeHtml(COMMERCIAL_VALUE_STREAMS.monthlySubscription.label)}</strong><br/>${escapeHtml(COMMERCIAL_VALUE_STREAMS.monthlySubscription.description)}`,
        `<strong>3 — ${escapeHtml(COMMERCIAL_VALUE_STREAMS.contributionPool.label)}</strong><br/>${escapeHtml(COMMERCIAL_VALUE_STREAMS.contributionPool.description)}`
      )
    },
    {
      title: "3. Campaign coverage structure",
      bodyHtml: paragraphs(
        `<table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tr><td style="padding:6px;border:1px solid #e5e7eb;"><strong>School</strong></td><td style="padding:6px;border:1px solid #e5e7eb;">One school</td></tr>
          <tr><td style="padding:6px;border:1px solid #e5e7eb;"><strong>District</strong></td><td style="padding:6px;border:1px solid #e5e7eb;">Entire district</td></tr>
          <tr><td style="padding:6px;border:1px solid #e5e7eb;"><strong>Provincial</strong></td><td style="padding:6px;border:1px solid #e5e7eb;">Entire province</td></tr>
          <tr><td style="padding:6px;border:1px solid #e5e7eb;"><strong>National</strong></td><td style="padding:6px;border:1px solid #e5e7eb;">South Africa</td></tr>
        </table>`,
        "Participation is not capped by school count or submissions. Eligibility follows territory, school location, campaign rules, and infrastructure phase alignment."
      )
    },
    {
      title: "4. Infrastructure phase model",
      bodyHtml: paragraphs(
        "Schools remain active as transformation progresses — they do not leave the ecosystem.",
        checklistHtml(INFRASTRUCTURE_PHASE_TRACK.map((p) => escapeHtml(p)))
      )
    },
    {
      title: "5. Before campaign activation",
      bodyHtml: checklistHtml([
        "Complete registration",
        "Accept POPIA compliance",
        "Sign the Brand2School Participation Agreement",
        "Complete brand verification review",
        "Confirm platform access fee payment",
        "Approve campaign rules and territorial scope",
        "Upload or generate approved product codes"
      ])
    },
    {
      title: "6. Product code verification",
      bodyHtml: paragraphs(
        `Your assigned prefix: <strong>${escapeHtml(input.codePrefix)}</strong> (example: ${escapeHtml(input.codePrefix)}-X82KD92).`,
        "Codes may be uploaded via CSV or generated on-platform. All codes are fraud monitored, audit tracked, and campaign linked."
      )
    },
    {
      title: "7. Consumer participation",
      bodyHtml: paragraphs(
        "Buy product → find code → submit code → select school → verification → school transformation supported.",
        "Verified submissions feed engagement, infrastructure tracking, and ESG reporting."
      )
    },
    {
      title: "8. ESG reporting & analytics",
      bodyHtml: paragraphs(
        "Dashboards, fraud monitoring, province-level impact, school phase progress, infrastructure milestones, and executive summaries."
      )
    },
    {
      title: "9. Campaign duration & renewal",
      bodyHtml: paragraphs(
        "Campaigns use <strong>renewable annual transformation licenses</strong> (typically 12 months). Renewals may expand territory, phases, or campaign scope.",
        input.packageName
          ? `Your selected package: <strong>${escapeHtml(input.packageName)}</strong>.`
          : ""
      )
    },
    {
      title: "10–12. Visibility, POPIA & compliance",
      bodyHtml: paragraphs(
        "Public partner profiles and showcase pages apply to active, compliant brands.",
        "POPIA-aligned verification, audit trails, and fraud prevention are enforced platform-wide."
      )
    },
    {
      title: "13. Prepare for onboarding",
      bodyHtml: checklistHtml([
        "Company registration documents",
        "VAT information",
        "ESG / CSI objectives",
        "Campaign territory selection",
        "Product participation strategy",
        "Brand logos and assets",
        "Primary contact persons",
        "Product code batches (if pre-generated)"
      ])
    },
    {
      title: "Commercial packages (summary)",
      bodyHtml: TERRITORIAL_PACKAGES.filter((p) => p.id !== "GOVERNMENT_INSTITUTIONAL")
        .map((p) => packageBlock(p))
        .join("")
    },
    {
      title: "Optional add-on services",
      bodyHtml: `<table style="width:100%;border-collapse:collapse;font-size:14px;">
        ${COMMERCIAL_ADD_ON_SERVICES.map(
          (row) =>
            `<tr><td style="padding:6px;border:1px solid #e5e7eb;">${escapeHtml(row.service)}</td><td style="padding:6px;border:1px solid #e5e7eb;"><strong>${escapeHtml(row.costLabel)}</strong></td></tr>`
        ).join("")}
      </table>`
    },
    {
      title: "Phase sponsorship categories",
      bodyHtml: `<table style="width:100%;border-collapse:collapse;font-size:14px;">
        ${INDUSTRY_PHASE_ALIGNMENT.map(
          (row) =>
            `<tr><td style="padding:6px;border:1px solid #e5e7eb;">${escapeHtml(row.infrastructurePhase)}</td><td style="padding:6px;border:1px solid #e5e7eb;">${escapeHtml(row.brandCategories)}</td></tr>`
        ).join("")}
      </table>`
    },
    {
      title: "Contact & partnership support",
      bodyHtml: paragraphs(
        `Brands: <a href="mailto:${CONTACT.brands}">${CONTACT.brands}</a>`,
        `General: <a href="mailto:${CONTACT.general}">${CONTACT.general}</a>`,
        `Admin: <a href="mailto:${INTERNAL_CONTACT.admin}">${INTERNAL_CONTACT.admin}</a>`
      ),
      cta: { label: "View full commercial guide", href: `${forBrands}#commercial-model`, variant: "outline" }
    }
  ];
}

export function buildBrandRegistrationGuideText(input: BrandRegistrationGuideInput): string {
  const forBrands = input.forBrandsUrl ?? `${env.WEB_APP_URL.replace(/\/$/, "")}/for-brands`;
  return [
    `Dear ${input.contactName},`,
    "",
    `Thank you for registering ${input.brandName} on Brand2School.`,
    "",
    PREMIUM_POSITIONING.tagline,
    "",
    "This guide explains how participation works before your campaign is activated.",
    "",
    "TWO VALUE STREAMS:",
    `1) ${COMMERCIAL_VALUE_STREAMS.activationFee.label} — one-time onboarding & activation.`,
    `2) ${COMMERCIAL_VALUE_STREAMS.monthlySubscription.label} — recurring ESG infrastructure access.`,
    `B) ${COMMERCIAL_VALUE_STREAMS.contributionPool.label} (optional at launch) — sanitation, water, digital access, etc.`,
    "",
    `Your brand code prefix: ${input.codePrefix}`,
    input.packageName ? `Selected package: ${input.packageName}` : "",
    "",
    "BEFORE ACTIVATION YOU MUST:",
    "- Complete registration",
    "- Accept POPIA",
    "- Sign participation agreement",
    "- Pass brand verification",
    "- Pay platform access fee",
    "- Approve campaign rules",
    "- Approve product codes",
    "",
    "PACKAGES:",
    ...TERRITORIAL_PACKAGES.filter((p) => p.id !== "GOVERNMENT_INSTITUTIONAL").map(
      (p) =>
        `- ${p.name}: Platform ${formatPriceRange(p)}${p.recommendedContributionPoolZar ? `; optional pool from R${p.recommendedContributionPoolZar.toLocaleString("en-ZA")}+` : ""}`
    ),
    "",
    `Full details: ${forBrands}`,
    "",
    `Partnerships: ${CONTACT.brands}`,
    `General: ${CONTACT.general}`,
    "",
    "— Brand2School",
    `Sent from ${env.MAIL_FROM}`
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildBrandRegistrationGuideHtml(input: BrandRegistrationGuideInput): string {
  const brandName = escapeHtml(input.brandName);
  return buildBrandedEmail({
    preheader: `${input.brandName} — registration received. Review your participation guide before activation.`,
    title: "Brand Registration & Participation Guide",
    subtitle: `Welcome, <strong>${brandName}</strong> — measurable education infrastructure &amp; ESG intelligence.`,
    primaryCta: {
      label: "View packages & commercial model",
      href: `${input.forBrandsUrl ?? `${env.WEB_APP_URL.replace(/\/$/, "")}/for-brands`}#pricing`
    },
    bodyHtml: paragraphs(
      `Dear ${escapeHtml(input.contactName)},`,
      "Thank you for registering on Brand2School. Our team will review your application and send your <strong>Participation Agreement</strong> for signature.",
      "Campaigns cannot go live until governance requirements below are satisfied — including verified <strong>platform access fee</strong> payment.",
      `<strong>Positioning:</strong> ${escapeHtml(PREMIUM_POSITIONING.tagline)} We are not a donation platform.`,
      PREMIUM_POSITIONING.salesPitch
    ),
    sections: buildGuideSections(input),
    footerNote: `Partnerships: ${CONTACT.brands} · General: ${CONTACT.general} · ${INTERNAL_CONTACT.admin}`
  });
}
