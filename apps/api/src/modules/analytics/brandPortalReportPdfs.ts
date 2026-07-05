import { prisma } from "../../lib/prisma.js";
import {
  createPdfBuffer,
  drawBulletList,
  drawSection
} from "../../lib/pdf/pdfKitHelpers.js";
import {
  drawReportBanner,
  drawReportFooter,
  drawReportKeyValues,
  drawReportTableHeader,
  drawReportTableRow,
  drawReportTitleBlock,
  formatReportGeneratedAt,
  formatZarReport,
  LETTERHEAD,
  reportContentDisposition
} from "../../lib/pdf/reportLayout.js";
import { buildEsgPdf } from "./esgPdf.js";
import { getBrandAnalytics } from "./getBrandAnalytics.js";
import { getBrandPortal, type BrandPortal } from "./getBrandPortal.js";

export type BrandReportModule =
  | "overview"
  | "campaigns"
  | "schools"
  | "submissions"
  | "analytics"
  | "map"
  | "reports"
  | "financials"
  | "media"
  | "commercial";

const MODULES = new Set<BrandReportModule>([
  "overview",
  "campaigns",
  "schools",
  "submissions",
  "analytics",
  "map",
  "reports",
  "financials",
  "media",
  "commercial"
]);

export function isBrandReportModule(value: string): value is BrandReportModule {
  return MODULES.has(value as BrandReportModule);
}

export function brandReportContentDisposition(module: BrandReportModule): string {
  return reportContentDisposition("brand2school-brand", module);
}

export async function buildBrandPortalReportPdf(
  brandId: string,
  module: BrandReportModule,
  campaignId?: string
): Promise<Buffer> {
  if (module === "analytics" || module === "reports") {
    const analytics = await getBrandAnalytics(campaignId, brandId);
    const campaign = campaignId ? analytics.campaigns.find((c) => c.id === campaignId) : undefined;
    return buildEsgPdf(analytics, campaign?.name);
  }

  const portal = await getBrandPortal(campaignId, brandId);

  switch (module) {
    case "overview":
      return buildOverviewPdf(portal);
    case "campaigns":
      return buildCampaignsPdf(portal);
    case "schools":
      return buildSchoolsPdf(portal);
    case "submissions":
      return buildSubmissionsPdf(portal);
    case "map":
      return buildMapPdf(portal);
    case "financials":
      return buildFinancialsPdf(portal);
    case "media":
      return buildMediaPdf(portal);
    case "commercial":
      return buildCommercialPdf(brandId, portal);
    default:
      throw new Error("Unknown brand report module.");
  }
}

function brandSubtitle(portal: BrandPortal): string {
  return `${portal.brand.name} · brand2school.co.za/brand/${portal.brand.slug}`;
}

function buildOverviewPdf(portal: BrandPortal): Promise<Buffer> {
  const generated = formatReportGeneratedAt(new Date().toISOString());
  return createPdfBuffer((doc) => {
    drawReportBanner(doc, "Brand Partner Portal — Overview Report");
    drawReportTitleBlock(doc, "Impact overview", `${brandSubtitle(portal)} · Generated ${generated}`);

    drawSection(doc, "Key metrics", "National participation and verified impact.");
    drawReportKeyValues(doc, [
      { label: "Total submissions", value: String(portal.overview.totalSubmissions) },
      { label: "Verified submissions", value: String(portal.overview.verifiedSubmissions) },
      { label: "Verification rate", value: `${portal.overview.verificationRate}%` },
      { label: "Schools supported", value: String(portal.overview.schoolsSupported) },
      { label: "Provinces reached", value: String(portal.overview.provincesReached) },
      { label: "Active campaigns", value: String(portal.overview.activeCampaigns) },
      { label: "Lives impacted (est.)", value: String(portal.overview.estimatedLivesImpacted) },
      { label: "Impact value", value: formatZarReport(portal.overview.impactValueZar) },
      { label: "Monthly growth", value: `${portal.overview.monthlyGrowthPercent}%` }
    ]);

    drawReportFooter(doc, `${LETTERHEAD.productLine} · Brand partner report`);
  });
}

function buildCampaignsPdf(portal: BrandPortal): Promise<Buffer> {
  const generated = formatReportGeneratedAt(new Date().toISOString());
  return createPdfBuffer((doc) => {
    drawReportBanner(doc, "Brand Partner Portal — Campaigns Report");
    drawReportTitleBlock(doc, "Campaign portfolio", `${brandSubtitle(portal)} · Generated ${generated}`);

    drawReportTableHeader(doc, [
      { label: "Campaign", width: 110 },
      { label: "Status", width: 56 },
      { label: "Valid", width: 44 },
      { label: "Target", width: 44 }
    ]);
    const widths = [110, 56, 44, 44];
    for (const c of portal.campaigns) {
      drawReportTableRow(
        doc,
        [c.name.slice(0, 24), c.status, String(c.validSubmissions), String(c.targetSubmissions)],
        widths
      );
    }

    drawReportFooter(doc, `${LETTERHEAD.productLine} · Campaigns report`);
  });
}

function buildSchoolsPdf(portal: BrandPortal): Promise<Buffer> {
  const generated = formatReportGeneratedAt(new Date().toISOString());
  return createPdfBuffer((doc) => {
    drawReportBanner(doc, "Brand Partner Portal — School Needs Report");
    drawReportTitleBlock(doc, "School & organisation needs", `${brandSubtitle(portal)} · Generated ${generated}`);

    drawReportTableHeader(doc, [
      { label: "School", width: 100 },
      { label: "Province", width: 72 },
      { label: "Need", width: 80 },
      { label: "Progress", width: 48 }
    ]);
    const widths = [100, 72, 80, 48];
    for (const s of portal.schoolNeeds.slice(0, 40)) {
      drawReportTableRow(
        doc,
        [s.name.slice(0, 20), s.province, s.priorityNeed.slice(0, 18), `${s.progressPercent}%`],
        widths
      );
    }

    drawReportFooter(doc, `${LETTERHEAD.productLine} · School needs report`);
  });
}

function buildSubmissionsPdf(portal: BrandPortal): Promise<Buffer> {
  const generated = formatReportGeneratedAt(new Date().toISOString());
  return createPdfBuffer((doc) => {
    drawReportBanner(doc, "Brand Partner Portal — Submissions Report");
    drawReportTitleBlock(doc, "Impact pipeline", `${brandSubtitle(portal)} · Generated ${generated}`);

    drawReportTableHeader(doc, [
      { label: "School", width: 90 },
      { label: "Campaign", width: 90 },
      { label: "Stage", width: 72 },
      { label: "Province", width: 56 }
    ]);
    const widths = [90, 90, 72, 56];
    for (const row of portal.impactPipeline.slice(0, 50)) {
      drawReportTableRow(
        doc,
        [row.schoolName.slice(0, 18), row.campaignName.slice(0, 18), row.stage, row.province],
        widths
      );
    }

    drawReportFooter(doc, `${LETTERHEAD.productLine} · Submissions report`);
  });
}

function buildMapPdf(portal: BrandPortal): Promise<Buffer> {
  const generated = formatReportGeneratedAt(new Date().toISOString());
  const provinces = portal.analytics.provinces ?? [];
  return createPdfBuffer((doc) => {
    drawReportBanner(doc, "Brand Partner Portal — Impact Map Report");
    drawReportTitleBlock(doc, "Provincial impact", `${brandSubtitle(portal)} · Generated ${generated}`);

    drawReportTableHeader(doc, [
      { label: "Province", width: 120 },
      { label: "Submissions", width: 72 },
      { label: "Schools", width: 56 }
    ]);
    const widths = [120, 72, 56];
    for (const p of provinces) {
      drawReportTableRow(doc, [p.name, String(p.submissions), String(p.schools)], widths);
    }

    drawReportFooter(doc, `${LETTERHEAD.productLine} · Impact map report`);
  });
}

function buildFinancialsPdf(portal: BrandPortal): Promise<Buffer> {
  const generated = formatReportGeneratedAt(new Date().toISOString());
  const f = portal.financials;
  return createPdfBuffer((doc) => {
    drawReportBanner(doc, "Brand Partner Portal — Financials Report");
    drawReportTitleBlock(doc, "Financial summary", `${brandSubtitle(portal)} · Generated ${generated}`);

    drawReportKeyValues(doc, [
      { label: "Funds allocated", value: formatZarReport(f.fundsAllocatedZar) },
      { label: "Funds used", value: formatZarReport(f.fundsUsedZar) },
      { label: "Remaining target", value: formatZarReport(f.remainingTargetZar) },
      { label: "Verified expenses", value: formatZarReport(f.verifiedExpensesZar) },
      {
        label: "Transformation pool committed",
        value: formatZarReport(f.transformationPoolCommittedZar ?? 0)
      },
      { label: "Transformation pool used", value: formatZarReport(f.transformationPoolUsedZar ?? 0) }
    ]);

    drawSection(doc, "Projects", "Budget utilisation by project.");
    drawReportTableHeader(doc, [
      { label: "Project", width: 120 },
      { label: "Budget", width: 72 },
      { label: "Spent", width: 72 },
      { label: "Status", width: 56 }
    ]);
    const widths = [120, 72, 72, 56];
    for (const p of f.projects) {
      drawReportTableRow(
        doc,
        [p.name.slice(0, 22), formatZarReport(p.budgetZar), formatZarReport(p.spentZar), p.status],
        widths
      );
    }

    drawReportFooter(doc, `${LETTERHEAD.productLine} · Financials report`);
  });
}

function buildMediaPdf(portal: BrandPortal): Promise<Buffer> {
  const generated = formatReportGeneratedAt(new Date().toISOString());
  return createPdfBuffer((doc) => {
    drawReportBanner(doc, "Brand Partner Portal — Media Report");
    drawReportTitleBlock(doc, "Media & stories", `${brandSubtitle(portal)} · Generated ${generated}`);

    for (const story of portal.media.slice(0, 20)) {
      drawBulletList(doc, [
        `${story.title} — ${story.schoolName}, ${story.province} (${story.type})`,
        story.excerpt.slice(0, 120)
      ]);
    }

    drawReportFooter(doc, `${LETTERHEAD.productLine} · Media report`);
  });
}

async function buildCommercialPdf(brandId: string, portal: BrandPortal): Promise<Buffer> {
  const brand = await prisma.brand.findUnique({
    where: { id: brandId },
    include: { agreements: { orderBy: { version: "desc" }, take: 1 } }
  });
  const agreement = brand?.agreements[0];
  const generated = formatReportGeneratedAt(new Date().toISOString());

  return createPdfBuffer((doc) => {
    drawReportBanner(doc, "Brand Partner Portal — Commercial Report");
    drawReportTitleBlock(doc, "Agreement & onboarding", `${brandSubtitle(portal)} · Generated ${generated}`);

    drawReportKeyValues(doc, [
      { label: "Onboarding status", value: brand?.onboardingStatus ?? "—" },
      { label: "Entity status", value: brand?.status ?? "—" },
      { label: "Activation fee paid", value: brand?.activationFeePaid ? "Yes" : "No" },
      { label: "Subscription status", value: brand?.subscriptionStatus ?? "—" },
      {
        label: "Recurring amount",
        value: brand?.recurringAmountZar ? formatZarReport(Number(brand.recurringAmountZar)) : "—"
      },
      { label: "Latest agreement", value: agreement?.status ?? "None on file" },
      {
        label: "Agreement version",
        value: agreement ? `v${agreement.version}` : "—"
      }
    ]);

    drawReportFooter(doc, `${LETTERHEAD.productLine} · Commercial report`);
  });
}
