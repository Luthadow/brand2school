import { env } from "../../../config/env.js";
import { COMPANY, LETTERHEAD } from "../../../lib/company.js";
import {
  createPdfBuffer,
  drawBulletList,
  drawFooter,
  drawLetterhead,
  drawSection,
  drawTitle
} from "../../../lib/pdf/pdfKitHelpers.js";
import { CONTACT } from "../../../lib/contacts.js";
import { buildParticipationAgreementPdf } from "../agreementPdf.js";
import {
  COMMERCIAL_ADD_ON_SERVICES,
  COMMERCIAL_ROLLOUT_PHASES,
  COMMERCIAL_VALUE_STREAMS,
  CONTRACT_PACKAGE_REQUIREMENTS,
  formatActivationFee,
  formatMonthlySubscriptionRange,
  formatZar,
  INFRASTRUCTURE_PHASE_TRACK,
  INDUSTRY_PHASE_ALIGNMENT,
  PREMIUM_POSITIONING,
  RECOMMENDED_PAYMENT_SCHEDULE,
  TERRITORIAL_PACKAGES,
  type TerritorialPackage,
  type TerritorialPackageId
} from "../territorialPackages.js";
import { serializeTransformationLicenseModel } from "../transformationLicense.js";

const PACK_VERSION = "2026.05";

export function procurementPackReadme(highlighted?: TerritorialPackage): string {
  const lines = [
    "Brand2School — Enterprise Partnership Procurement Pack",
    `Generated: ${new Date().toISOString().slice(0, 10)} · Version ${PACK_VERSION}`,
    "",
    "Contents:",
    "  01-Company-Profile.pdf",
    "  02-Commercial-Packages-and-Pricing.pdf",
    "  03-Participation-Agreement-Template.pdf",
    "  04-ESG-Governance-Framework.pdf",
    "  05-POPIA-Data-Protection-Summary.pdf",
    "  06-Enterprise-FAQ.pdf",
    "",
    "For procurement, legal, finance, and ESG teams.",
    `Partnerships: ${CONTACT.brands}`,
    `General: ${CONTACT.general}`,
    "",
    "Pricing in this pack is synchronized with the live commercial catalog (territorialPackages.ts)."
  ];
  if (highlighted) {
    lines.push("", `Highlighted package in pricing PDF: ${highlighted.name} (${highlighted.id})`);
  }
  return lines.join("\r\n");
}

export async function buildCompanyProfilePdf(): Promise<Buffer> {
  return createPdfBuffer((doc) => {
    drawLetterhead(doc);
    drawTitle(doc, "Company profile", LETTERHEAD.productLine);
    drawSection(
      doc,
      "Legal entity",
      `${COMPANY.legalName} (${COMPANY.enterpriseName})\nRegistration: ${COMPANY.registrationNumber}\nTax: ${COMPANY.taxNumber}\nType: ${COMPANY.enterpriseType} · Status: ${COMPANY.status}`
    );
    drawSection(doc, "Registered address", LETTERHEAD.address);
    drawSection(
      doc,
      "Contact",
      `${LETTERHEAD.phone}\nPartnerships: ${CONTACT.brands}\nSchools: ${CONTACT.schools}\nGeneral: ${CONTACT.general}`
    );
    drawSection(
      doc,
      "Platform purpose",
      "Brand2School is a governed national education transformation infrastructure platform — measurable ESG participation, verified campaigns, and infrastructure intelligence. It is not a donation or unverified fundraising platform."
    );
    drawFooter(doc, `${LETTERHEAD.companyName} · Confidential procurement document`);
  });
}

function packageDetailBlock(pkg: TerritorialPackage): string {
  const pool =
    pkg.recommendedContributionPoolZar != null
      ? `Recommended optional transformation pool: from ${formatZar(pkg.recommendedContributionPoolZar)}`
      : "Optional transformation pool: custom enterprise agreement";
  return [
    `${pkg.name} (${pkg.partnerTitle})`,
    `Ideal for: ${pkg.idealFor}`,
    `Coverage: ${pkg.coverage}`,
    `Activation fee: ${formatActivationFee(pkg)}`,
    `Monthly subscription: ${formatMonthlySubscriptionRange(pkg)}`,
    pool,
    `Participation: ${pkg.participation}`,
    `Focus: ${pkg.focus}`,
    `Includes: ${pkg.includes.join("; ")}`
  ].join("\n\n");
}

export async function buildCommercialPackagesPdf(highlightedId?: TerritorialPackageId): Promise<Buffer> {
  const highlighted = highlightedId ? TERRITORIAL_PACKAGES.find((p) => p.id === highlightedId) : undefined;

  return createPdfBuffer((doc) => {
    drawLetterhead(doc);
    drawTitle(
      doc,
      "Commercial packages & pricing",
      highlighted ? `Highlighted: ${highlighted.name}` : "All territorial transformation packages"
    );

    drawSection(doc, "Positioning", `${PREMIUM_POSITIONING.tagline}\n\n${PREMIUM_POSITIONING.salesPitch}`);
    drawSection(
      doc,
      `1 — ${COMMERCIAL_VALUE_STREAMS.activationFee.label}`,
      `${COMMERCIAL_VALUE_STREAMS.activationFee.description}\n\n${COMMERCIAL_VALUE_STREAMS.activationFee.note}`
    );
    drawSection(
      doc,
      `2 — ${COMMERCIAL_VALUE_STREAMS.monthlySubscription.label}`,
      `${COMMERCIAL_VALUE_STREAMS.monthlySubscription.description}\n\nIncludes: ${COMMERCIAL_VALUE_STREAMS.monthlySubscription.includes.join("; ")}`
    );
    drawSection(
      doc,
      `3 — ${COMMERCIAL_VALUE_STREAMS.contributionPool.label}`,
      `${COMMERCIAL_VALUE_STREAMS.contributionPool.description}`
    );

    doc.addPage();
    drawLetterhead(doc);
    drawTitle(doc, "Territorial packages", "Activation fee + monthly ESG infrastructure subscription");

    for (const pkg of TERRITORIAL_PACKAGES) {
      const prefix = pkg.id === highlightedId ? "★ " : "";
      drawSection(doc, `${prefix}${pkg.name}`, packageDetailBlock(pkg));
    }

    doc.addPage();
    drawLetterhead(doc);
    drawTitle(doc, "Payment schedule & add-ons", "Platform access fee milestones (mandatory stream)");
    drawBulletList(
      doc,
      RECOMMENDED_PAYMENT_SCHEDULE.map((s) => `${s.stage} (${s.percentage}%): ${s.description}`)
    );
    doc.moveDown(0.75);
    drawSection(doc, "Optional add-on services", COMMERCIAL_ADD_ON_SERVICES.map((a) => `${a.service}: ${a.costLabel}`).join("\n"));

    doc.addPage();
    drawLetterhead(doc);
    drawTitle(doc, "Commercial rollout phases", "When contribution pool minimums may apply");
    for (const phase of COMMERCIAL_ROLLOUT_PHASES) {
      const mins =
        phase.minimumPools != null
          ? Object.entries(phase.minimumPools)
              .map(([k, v]) => `${k}: ${formatZar(v)}`)
              .join(", ")
          : "No mandatory pool minimums";
      drawSection(doc, phase.title, `${phase.platformFee}\n${phase.contributionPool}\n${mins}`);
    }

    drawFooter(doc, `Catalog version ${PACK_VERSION} · ${LETTERHEAD.companyName}`);
  });
}

export async function buildParticipationAgreementTemplatePdf(
  highlightedId?: TerritorialPackageId
): Promise<Buffer> {
  const pkg =
    (highlightedId ? TERRITORIAL_PACKAGES.find((p) => p.id === highlightedId) : undefined) ??
    TERRITORIAL_PACKAGES.find((p) => p.id === "PROVINCIAL_IMPACT")!;

  return buildParticipationAgreementPdf({
    brand: {
      name: "Prospective Enterprise Partner",
      legalName: "[Your company legal name]",
      codePrefix: "PREFIX",
      registrationNumber: "[Company registration number]",
      vatNumber: "[VAT number if applicable]",
      intendedProvinces: ["As per territorial package selection"],
      campaignIntention:
        "Measurable education infrastructure transformation aligned with ESG, CSI, innovation, and sustainability objectives.",
      productsInvolved: "Products and trademarks as registered with Brand2School"
    },
    agreement: { version: 0 },
    campaigns: [
      {
        name: `Proposed — ${pkg.name}`,
        scopeType: pkg.scopeType,
        allowedProvinces: [],
        setupFeeZar: pkg.activationFeeZar as never,
        contributionPoolZar: pkg.recommendedContributionPoolZar as never,
        startsAt: new Date(),
        endsAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      }
    ]
  });
}

export async function buildEsgGovernancePdf(): Promise<Buffer> {
  const ecosystem = serializeTransformationLicenseModel();

  return createPdfBuffer((doc) => {
    drawLetterhead(doc);
    drawTitle(doc, "ESG governance framework", "Verification, reporting & public accountability");
    drawSection(doc, "Platform promise", PREMIUM_POSITIONING.salesPitch);
    drawSection(
      doc,
      "What brands report",
      "Verified consumer interactions, territorial reach, campaign engagement, infrastructure phase progression, fraud-clean rates, and board-ready PDF exports — not rand donated only."
    );
    drawSection(
      doc,
      "Infrastructure phase track",
      "Schools remain in the ecosystem as transformation matures:\n" + INFRASTRUCTURE_PHASE_TRACK.join("\n")
    );
    drawSection(
      doc,
      "Industry alignment",
      INDUSTRY_PHASE_ALIGNMENT.map((r) => `${r.infrastructurePhase}: ${r.brandCategories}`).join("\n")
    );
    drawSection(
      doc,
      "Annual transformation licence",
      `${ecosystem.principle}\nLicence: ${ecosystem.campaignModel.type} · Default term: ${ecosystem.campaignModel.termMonthsDefault} months · Renewable: ${ecosystem.campaignModel.renewable}.`
    );
    drawBulletList(doc, CONTRACT_PACKAGE_REQUIREMENTS.map((r) => `${r.label}: ${r.description}`));
    drawFooter(doc, "For ESG, CSI, and sustainability committees");
  });
}

export async function buildPopiaSummaryPdf(): Promise<Buffer> {
  return createPdfBuffer((doc) => {
    drawLetterhead(doc);
    drawTitle(doc, "POPIA data protection summary", "Protection of Personal Information Act (South Africa)");
    drawSection(
      doc,
      "Purpose",
      "Personal information is processed only for participation verification, campaign governance, fraud prevention, and aggregated analytics. Brand2School does not sell learner or consumer personal data."
    );
    drawSection(
      doc,
      "Brand obligations",
      "Brands warrant lawful collection of product codes and campaign materials, accept POPIA-aligned processing at application, and indemnify the platform for fraudulent uploads or misrepresentation."
    );
    drawSection(
      doc,
      "Data minimization",
      "Public reporting uses aggregated and anonymized metrics. Individual learners are not required to register accounts for standard school participation flows."
    );
    drawSection(
      doc,
      "Security & audit",
      "Platform maintains fraud monitoring, audit logs, and admin verification workflows. Brands may be audited for code batches and financial records per the participation agreement."
    );
    drawSection(
      doc,
      "Contact",
      `Data protection enquiries: ${CONTACT.general}\nBrand partnerships: ${CONTACT.brands}`
    );
    drawFooter(doc, `${LETTERHEAD.companyName} · POPIA summary for procurement reviewers`);
  });
}

export async function buildEnterpriseFaqPdf(): Promise<Buffer> {
  const faqs: Array<{ q: string; a: string }> = [
    {
      q: "Is Brand2School a donation platform?",
      a: `No. ${PREMIUM_POSITIONING.notPositioning} Brands pay a mandatory platform & ESG infrastructure fee and may optionally fund transformation pools for on-the-ground infrastructure.`
    },
    {
      q: "What must be paid before launch?",
      a: "Signed participation agreement, POPIA acceptance, verified platform access fee (deposit + activation tranches), approved product codes, configured campaign rules, and admin launch approval."
    },
    {
      q: "Are schools charged?",
      a: "No. Schools and learners participate without paywalls. Brands fund platform intelligence and optional infrastructure pools."
    },
    {
      q: "How is territory defined?",
      a: "By school, district, province, or national scope — participation is not capped by arbitrary submission limits; eligibility follows geography, rules, and infrastructure phases."
    },
    {
      q: "Can multiple brands sponsor one school?",
      a: "Yes over time — different infrastructure phases (water, digital, power, nutrition) may have category sponsors as the ecosystem matures."
    },
    {
      q: "How do renewals work?",
      a: "Annual transformation licences renew with platform fee and updated terms. Renewal notices are issued before expiry per commercial governance."
    },
    {
      q: "Who do we contact?",
      a: `Enterprise partnerships: ${CONTACT.brands} · General: ${CONTACT.general}`
    }
  ];

  return createPdfBuffer((doc) => {
    drawLetterhead(doc);
    drawTitle(doc, "Enterprise FAQ", "Procurement & partnership onboarding");
    for (const item of faqs) {
      drawSection(doc, item.q, item.a);
    }
    drawFooter(doc, `Apply at ${env.WEB_APP_URL.replace(/\/$/, "")}/for-brands`);
  });
}
