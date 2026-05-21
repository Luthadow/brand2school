import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import PDFDocument from "pdfkit";
import { LETTERHEAD } from "../../lib/company.js";
import { formatZar } from "./setupFees.js";
import type { Brand, BrandAgreement, Campaign } from "../../generated/prisma/index.js";

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const monorepoRoot = path.resolve(moduleDir, "../../../../..");

function resolveLogoPath(): string | null {
  const roots = [process.cwd(), monorepoRoot, path.resolve(moduleDir, "../../..")];
  const relPaths = ["brand2school.png", "apps/web/public/brand2school.png", "apps/api/assets/brand2school.png"];
  for (const root of roots) {
    for (const rel of relPaths) {
      const candidate = path.resolve(root, rel);
      if (fs.existsSync(candidate)) return candidate;
    }
  }
  return null;
}

type AgreementContext = {
  brand: Pick<
    Brand,
    | "name"
    | "legalName"
    | "codePrefix"
    | "registrationNumber"
    | "vatNumber"
    | "intendedProvinces"
    | "campaignIntention"
    | "productsInvolved"
  >;
  agreement: Pick<BrandAgreement, "version">;
  campaigns: Array<
    Pick<Campaign, "name" | "scopeType" | "allowedProvinces" | "setupFeeZar" | "contributionPoolZar" | "startsAt" | "endsAt">
  >;
};

export async function buildParticipationAgreementPdf(ctx: AgreementContext): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 48 });
    const chunks: Buffer[] = [];
    doc.on("data", (c) => chunks.push(c as Buffer));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const logoPath = resolveLogoPath();
    if (logoPath) {
      try {
        doc.image(logoPath, 48, 40, { width: 72 });
      } catch {
        /* optional logo */
      }
    }

    doc
      .fontSize(10)
      .fillColor("#374151")
      .text(LETTERHEAD.companyName, 140, 44)
      .text(LETTERHEAD.registrationNo, 140, 58)
      .text(LETTERHEAD.productLine, 140, 72);

    doc.moveDown(3);
    doc.fontSize(16).fillColor("#003B8E").text("Brand2School Participation Agreement", { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor("#111827").text(`Version ${ctx.agreement.version} · ${new Date().toLocaleDateString("en-ZA")}`, {
      align: "center"
    });
    doc.moveDown(1.5);

    const partyName = ctx.brand.legalName ?? ctx.brand.name;
    doc.fontSize(11).text(`Between ${LETTERHEAD.companyName} ("Platform") and ${partyName} ("Brand"), code prefix ${ctx.brand.codePrefix}.`);

    doc.moveDown(0.5);
    doc
      .fontSize(10)
      .fillColor("#374151")
      .text(
        "All territorial impact packages require: signed participation agreement, POPIA compliance acceptance, approved campaign rules, verified payment, approved product codes, and completed brand verification review before public launch.",
        { align: "justify" }
      );

    const sections: Array<{ title: string; body: string }> = [
      {
        title: "1. Territorial scope & platform access",
        body: `Brand purchases geographic transformation territory (school, district, provincial, or national) for verified participation — not arbitrary submission limits. Provinces / regions: ${ctx.brand.intendedProvinces.join(", ") || "As per schedule"}. Intention: ${ctx.brand.campaignIntention ?? "Measurable education transformation aligned with ESG objectives"}. School location determines eligibility for provincial and national products.`
      },
      {
        title: "2. Two separate value streams",
        body: ctx.campaigns.length
          ? ctx.campaigns
              .map(
                (c) =>
                  `${c.name}: (A) mandatory platform access fee ${formatZar(Number(c.setupFeeZar))}; (B) optional transformation contribution pool ${c.contributionPoolZar != null ? formatZar(Number(c.contributionPoolZar)) : "not required at launch — brand may commit later"}`
              )
              .join("; ")
          : "(A) Platform & ESG infrastructure fee is mandatory. (B) Transformation contribution pool for on-the-ground infrastructure is optional and campaign-based — brands control amount, phases, and focus."
      },
      {
        title: "3. Code issuance rules",
        body: `All product codes must use Brand prefix ${ctx.brand.codePrefix}. Codes are single-use, auditable, and may not be duplicated across campaigns without written approval.`
      },
      {
        title: "4. Phase sponsorship & infrastructure intelligence",
        body: "Brand may optionally sponsor named transformation phases (e.g. Digital Access, Water Infrastructure) via a contribution pool — category ownership, visibility, and measurable milestones. Platform reporting covers verification, territorial reach, and audit-ready ESG outcomes regardless of pool size."
      },
      {
        title: "5. Trademark permissions",
        body: `Products involved: ${ctx.brand.productsInvolved ?? "As registered"}. Logo and trademark use limited to approved campaign materials and Platform co-branding.`
      },
      {
        title: "6. Payment terms",
        body:
          "Mandatory platform access fees follow EFT invoices on a 50% / 30% / 10% / 10% milestone schedule (deposit, activation, mid-campaign, closure). Optional transformation contribution pools are invoiced separately when the brand commits. No public launch until platform fee deposit and activation tranches are verified."
      },
      {
        title: "7. Expiry rules",
        body: "Campaigns run between agreed start/end dates. Unused codes may be invalidated at campaign close per Platform policy."
      },
      {
        title: "8. Liability",
        body: "Brand warrants legitimacy of registration (Reg. " +
          (ctx.brand.registrationNumber ?? "on file") +
          ") and indemnifies Platform for fraudulent code uploads or misrepresentation."
      },
      {
        title: "9. POPIA compliance",
        body: "Personal information processed only for participation verification. No sale of learner data. Aggregated analytics only."
      },
      {
        title: "10. Audit rights",
        body: "Platform may audit code batches, submissions, and financial records for fraud prevention and transparency."
      }
    ];

    for (const section of sections) {
      doc.moveDown(0.6);
      doc.fontSize(11).fillColor("#003B8E").text(section.title);
      doc.fontSize(10).fillColor("#374151").text(section.body, { align: "justify" });
    }

    doc.moveDown(2);
    doc.fontSize(10).fillColor("#111827").text("Signed for Brand: _________________________   Date: __________");
    doc.moveDown(0.8);
    doc.text("Signed for Brand2School: _____________________   Date: __________");

    doc.end();
  });
}
