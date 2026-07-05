import type PDFDocument from "pdfkit";
import { prisma } from "../../lib/prisma.js";
import { LETTERHEAD } from "../../lib/company.js";
import {
  createPdfBuffer,
  drawBulletList,
  drawFooter,
  drawLetterhead,
  drawSection,
  drawTitle
} from "../../lib/pdf/pdfKitHelpers.js";
import { getAdminPlatformSnapshot } from "./platformSnapshot.js";
import { getPlatformExecutiveAnalytics } from "../analytics/getPlatformExecutiveAnalytics.js";
import { getCommercialWorkflowBoard } from "../commercial/getCommercialWorkflow.js";
import { WORKFLOW_STAGE_LABELS } from "../commercial/commercialWorkflow.js";

export type AdminReportModule = "overview" | "analytics" | "commercial" | "brands";

const BRAND_BLUE = "#003B8E";

function formatGeneratedAt(iso: string): string {
  return new Date(iso).toLocaleString("en-ZA", { dateStyle: "medium", timeStyle: "short" });
}

function reportFilename(module: AdminReportModule): string {
  const date = new Date().toISOString().slice(0, 10);
  return `brand2school-admin-${module}-report-${date}.pdf`;
}

function drawReportBanner(doc: InstanceType<typeof PDFDocument>, reportTitle: string): void {
  drawLetterhead(doc);
  doc.rect(0, 118, doc.page.width, 28).fill(BRAND_BLUE);
  doc.fillColor("#ffffff").fontSize(11).text(reportTitle, 48, 125);
  doc.fillColor("#374151");
  doc.y = 160;
}

function ensureSpace(doc: InstanceType<typeof PDFDocument>, needed = 72): void {
  if (doc.y > doc.page.height - needed) {
    doc.addPage();
    drawLetterhead(doc);
    doc.y = 130;
  }
}

function drawKeyValues(doc: InstanceType<typeof PDFDocument>, rows: Array<{ label: string; value: string }>): void {
  for (const row of rows) {
    ensureSpace(doc, 24);
    const y = doc.y;
    doc.fontSize(10).fillColor("#003B8E").text(row.label, 48, y, { width: 200 });
    doc.fillColor("#374151").text(row.value, 240, y, { width: doc.page.width - 288 });
    doc.y = y + 16;
  }
  doc.moveDown(0.5);
}

function drawTableHeader(
  doc: InstanceType<typeof PDFDocument>,
  columns: Array<{ label: string; width: number }>
): void {
  ensureSpace(doc, 28);
  let x = 48;
  const y = doc.y;
  doc.fontSize(9).fillColor("#003B8E");
  for (const col of columns) {
    doc.text(col.label, x, y, { width: col.width });
    x += col.width;
  }
  doc.y = y + 14;
  doc
    .moveTo(48, doc.y)
    .lineTo(doc.page.width - 48, doc.y)
    .strokeColor("#E5E7EB")
    .stroke();
  doc.y += 6;
}

function drawTableRow(
  doc: InstanceType<typeof PDFDocument>,
  cells: string[],
  widths: number[]
): void {
  ensureSpace(doc, 20);
  let x = 48;
  const y = doc.y;
  doc.fontSize(9).fillColor("#374151");
  cells.forEach((cell, i) => {
    doc.text(cell, x, y, { width: widths[i] - 4, lineBreak: false });
    x += widths[i];
  });
  doc.y = y + 14;
}

export function adminReportContentDisposition(module: AdminReportModule): string {
  return `attachment; filename="${reportFilename(module)}"`;
}

export async function buildAdminReportPdf(module: AdminReportModule): Promise<Buffer> {
  switch (module) {
    case "overview":
      return buildOverviewReportPdf();
    case "analytics":
      return buildAnalyticsReportPdf();
    case "commercial":
      return buildCommercialReportPdf();
    case "brands":
      return buildBrandsReportPdf();
    default:
      throw new Error("Unknown report module.");
  }
}

async function buildOverviewReportPdf(): Promise<Buffer> {
  const snapshot = await getAdminPlatformSnapshot();
  const generated = formatGeneratedAt(snapshot.generatedAt);

  return createPdfBuffer((doc) => {
    drawReportBanner(doc, "Governance Overview Report");
    drawTitle(doc, "Platform overview", `Generated ${generated}`);

    drawSection(
      doc,
      "Executive summary",
      "This report summarises registered organisations, approval pipeline volume, participation metrics, and governance alerts across the Brand2School platform."
    );

    drawKeyValues(doc, [
      { label: "Schools & organisations registered", value: String(snapshot.schoolsRegistered) },
      { label: "Awaiting approval (PENDING)", value: String(snapshot.schoolsPendingApproval) },
      { label: "In approval pipeline", value: String(snapshot.schoolsInApprovalPipeline) },
      { label: "Active organisations", value: String(snapshot.schoolsActive) },
      { label: "Brands in approval pipeline", value: String(snapshot.pendingBrands) },
      { label: "Users in approval pipeline", value: String(snapshot.pendingUsers) },
      { label: "Open fraud flags", value: String(snapshot.openFraudFlags) },
      { label: "Total submissions", value: String(snapshot.totalSubmissions) },
      { label: "Verified submissions", value: String(snapshot.verifiedSubmissions) }
    ]);

    drawSection(doc, "Registration trend (weekly)", "Last 12 weeks with at least one registration.");
    drawBulletList(
      doc,
      snapshot.schoolRegistrationTrend.map((row) => `${row.period}: ${row.count} registration(s)`)
    );

    drawFooter(doc, `${LETTERHEAD.productLine} · Confidential governance report`);
  });
}

async function buildAnalyticsReportPdf(): Promise<Buffer> {
  const data = await getPlatformExecutiveAnalytics();
  const generated = formatGeneratedAt(data.generatedAt);

  return createPdfBuffer((doc) => {
    drawReportBanner(doc, "Executive Analytics Report");
    drawTitle(doc, "Executive intelligence", `Generated ${generated}`);

    drawSection(doc, "Key performance indicators", "National participation, verification, and impact metrics.");
    drawKeyValues(
      doc,
      data.kpis.map((kpi) => ({
        label: kpi.label,
        value: kpi.format === "percent" ? `${kpi.value}%` : kpi.value.toLocaleString("en-ZA")
      }))
    );

    drawSection(doc, "Transformation funnel", "Participation journey from registration to infrastructure milestones.");
    drawBulletList(doc, data.funnel.map((stage) => `${stage.stage}: ${stage.count.toLocaleString("en-ZA")}`));

    drawSection(doc, "Top brand rankings", "By valid submissions and schools reached.");
    drawTableHeader(doc, [
      { label: "#", width: 28 },
      { label: "Brand", width: 140 },
      { label: "Submissions", width: 72 },
      { label: "Schools", width: 56 },
      { label: "Score", width: 48 }
    ]);
    const widths = [28, 140, 72, 56, 48];
    for (const row of data.brandRankings.slice(0, 15)) {
      drawTableRow(
        doc,
        [
          String(row.rank),
          row.brandName.slice(0, 32),
          String(row.validSubmissions),
          String(row.schoolsReached),
          String(row.impactScore)
        ],
        widths
      );
    }

    drawSection(doc, "Provincial activity", "Valid submissions and registered schools by province.");
    drawTableHeader(doc, [
      { label: "Province", width: 120 },
      { label: "Submissions", width: 72 },
      { label: "Schools", width: 56 },
      { label: "Intensity", width: 56 }
    ]);
    const provWidths = [120, 72, 56, 56];
    for (const row of data.provinces.slice(0, 9)) {
      drawTableRow(
        doc,
        [row.name, String(row.submissions), String(row.schools), `${row.intensity}%`],
        provWidths
      );
    }

    drawSection(doc, "Trust & fraud velocity", "Platform integrity indicators.");
    drawKeyValues(doc, [
      { label: "Fraud attempts blocked", value: String(data.trust.fraudAttemptsBlocked) },
      { label: "Duplicate codes rejected", value: String(data.trust.duplicateCodesRejected) },
      { label: "Flagged submissions", value: String(data.trust.flaggedSubmissions) },
      { label: "Velocity status (24h)", value: data.fraudVelocity.statusLabel },
      { label: "Flagged/rejected (24h)", value: String(data.fraudVelocity.flaggedOrRejectedLast24h) }
    ]);

    drawFooter(doc, `${LETTERHEAD.productLine} · Confidential analytics report`);
  });
}

async function buildCommercialReportPdf(): Promise<Buffer> {
  const board = await getCommercialWorkflowBoard();
  const generated = formatGeneratedAt(new Date().toISOString());

  return createPdfBuffer((doc) => {
    drawReportBanner(doc, "Commercial Pipeline Report");
    drawTitle(doc, "Commercial workflow", `Generated ${generated}`);

    drawSection(doc, "Pipeline summary", "Brand and campaign counts by workflow stage.");
    drawKeyValues(
      doc,
      Object.entries(board.pipeline).map(([stage, count]) => ({
        label: WORKFLOW_STAGE_LABELS[stage as keyof typeof WORKFLOW_STAGE_LABELS] ?? stage,
        value: String(count)
      }))
    );

    drawSection(doc, "Activation chain", "Enterprise onboarding sequence.");
    drawBulletList(
      doc,
      board.activationChain.map((step) => `${step.step}. ${step.label}`)
    );

    drawSection(doc, "Brand portfolio", "Up to 40 brands with current workflow stage.");
    drawTableHeader(doc, [
      { label: "Brand", width: 130 },
      { label: "Stage", width: 110 },
      { label: "Campaigns", width: 56 },
      { label: "Agreement", width: 72 }
    ]);
    const widths = [130, 110, 56, 72];
    for (const brand of board.brands.slice(0, 40)) {
      drawTableRow(
        doc,
        [
          brand.name.slice(0, 28),
          brand.brandWorkflowLabel.slice(0, 24),
          String(brand.campaigns.length),
          brand.agreementStatus ?? "—"
        ],
        widths
      );
    }

    drawFooter(doc, `${LETTERHEAD.productLine} · Confidential commercial report`);
  });
}

async function buildBrandsReportPdf(): Promise<Buffer> {
  const brands = await prisma.brand.findMany({
    orderBy: [{ homeSortOrder: "asc" }, { updatedAt: "desc" }],
    take: 60,
    select: {
      name: true,
      codePrefix: true,
      slug: true,
      status: true,
      verificationStatus: true,
      featuredOnHome: true,
      onboardingStatus: true,
      primaryContactEmail: true,
      createdAt: true
    }
  });
  const generated = formatGeneratedAt(new Date().toISOString());

  return createPdfBuffer((doc) => {
    drawReportBanner(doc, "Brand Registry Report");
    drawTitle(doc, "Brand registry", `Generated ${generated} · ${brands.length} brand(s) listed`);

    drawSection(
      doc,
      "Summary",
      `Active: ${brands.filter((b) => b.status === "ACTIVE").length} · Pending pipeline: ${brands.filter((b) => ["PENDING", "VERIFIED", "APPROVED"].includes(b.status)).length} · Featured on home: ${brands.filter((b) => b.featuredOnHome).length}`
    );

    drawTableHeader(doc, [
      { label: "Brand", width: 100 },
      { label: "Prefix", width: 44 },
      { label: "Status", width: 56 },
      { label: "Trust", width: 72 },
      { label: "Featured", width: 44 }
    ]);
    const widths = [100, 44, 56, 72, 44];
    for (const brand of brands) {
      drawTableRow(
        doc,
        [
          brand.name.slice(0, 22),
          brand.codePrefix,
          brand.status,
          brand.verificationStatus,
          brand.featuredOnHome ? "Yes" : "No"
        ],
        widths
      );
    }

    drawFooter(doc, `${LETTERHEAD.productLine} · Confidential brand registry report`);
  });
}
