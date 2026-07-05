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
import {
  advanceAfterChart,
  chartBox,
  CHART_COLORS,
  drawHorizontalBarChart,
  drawLineChart,
  drawStackedBarChart,
  drawVerticalBarChart
} from "../../lib/pdf/reportLayout.js";
import { getAdminPlatformSnapshot } from "./platformSnapshot.js";
import { getPlatformExecutiveAnalytics } from "../analytics/getPlatformExecutiveAnalytics.js";
import { getCommercialWorkflowBoard } from "../commercial/getCommercialWorkflow.js";
import { WORKFLOW_STAGE_LABELS } from "../commercial/commercialWorkflow.js";
import { fetchAllVerifiedSchoolsForReport } from "./verifiedSchools.js";

export type AdminReportModule = "overview" | "analytics" | "commercial" | "brands" | "verified";

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
    case "verified":
      return buildVerifiedSchoolsReportPdf();
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

    drawSection(doc, "Registration trend (weekly)", "New organisation registrations over recent weeks.");
    ensureSpace(doc, 170);
    const trendData = snapshot.schoolRegistrationTrend.map((row) => ({
      label: row.period.slice(5),
      value: row.count
    }));
    const trendBottom = drawVerticalBarChart(doc, chartBox(doc, 155), trendData, {
      title: "Weekly registrations",
      valueSuffix: ""
    });
    advanceAfterChart(doc, trendBottom);

    drawSection(doc, "Approval pipeline mix", "Organisations and brands awaiting governance action.");
    ensureSpace(doc, 120);
    const pipelineBottom = drawStackedBarChart(
      doc,
      chartBox(doc, 100),
      [
        { label: "Pending orgs", value: snapshot.schoolsPendingApproval, color: CHART_COLORS[5] },
        { label: "In pipeline", value: snapshot.schoolsInApprovalPipeline, color: CHART_COLORS[0] },
        { label: "Active orgs", value: snapshot.schoolsActive, color: CHART_COLORS[1] },
        { label: "Pending brands", value: snapshot.pendingBrands, color: CHART_COLORS[2] }
      ],
      { title: "Governance queue" }
    );
    advanceAfterChart(doc, pipelineBottom);

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
    ensureSpace(doc, 170);
    const funnelBottom = drawVerticalBarChart(
      doc,
      chartBox(doc, 155),
      data.funnel.map((stage, i) => ({
        label: stage.stage.slice(0, 10),
        value: stage.count,
        color: CHART_COLORS[i % CHART_COLORS.length]
      })),
      { title: "Funnel stages" }
    );
    advanceAfterChart(doc, funnelBottom);

    drawSection(doc, "Submission trend (weekly)", "Verified vs total submissions nationally.");
    ensureSpace(doc, 180);
    const weekly = data.submissionTrend.weekly;
    const lineBottom = drawLineChart(
      doc,
      chartBox(doc, 165),
      [
        {
          name: "Total",
          color: CHART_COLORS[0],
          points: weekly.map((p) => ({ label: p.period.slice(5), value: p.total }))
        },
        {
          name: "Verified",
          color: CHART_COLORS[1],
          points: weekly.map((p) => ({ label: p.period.slice(5), value: p.verified }))
        }
      ],
      { title: "Weekly submissions" }
    );
    advanceAfterChart(doc, lineBottom);

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
    ensureSpace(doc, 200);
    const provChartBottom = drawHorizontalBarChart(
      doc,
      chartBox(doc, Math.min(220, 40 + data.provinces.slice(0, 9).length * 16)),
      data.provinces.slice(0, 9).map((row, i) => ({
        label: row.name,
        value: row.submissions,
        color: CHART_COLORS[i % CHART_COLORS.length]
      })),
      { title: "Submissions by province" }
    );
    advanceAfterChart(doc, provChartBottom);

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
    ensureSpace(doc, 200);
    const pipelineEntries = Object.entries(board.pipeline).filter(([, count]) => count > 0);
    const pipelineChartBottom = drawVerticalBarChart(
      doc,
      chartBox(doc, 165),
      pipelineEntries.map(([stage, count], i) => ({
        label: (WORKFLOW_STAGE_LABELS[stage as keyof typeof WORKFLOW_STAGE_LABELS] ?? stage).slice(0, 9),
        value: count,
        color: CHART_COLORS[i % CHART_COLORS.length]
      })),
      { title: "Commercial pipeline" }
    );
    advanceAfterChart(doc, pipelineChartBottom);

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

    ensureSpace(doc, 130);
    const statusCounts = ["ACTIVE", "PENDING", "VERIFIED", "APPROVED", "SUSPENDED"].map((status) => ({
      label: status,
      value: brands.filter((b) => b.status === status).length,
      color: status === "ACTIVE" ? CHART_COLORS[1] : CHART_COLORS[0]
    }));
    const statusBottom = drawVerticalBarChart(
      doc,
      chartBox(doc, 130),
      statusCounts.filter((s) => s.value > 0),
      { title: "Brands by status" }
    );
    advanceAfterChart(doc, statusBottom);

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

async function buildVerifiedSchoolsReportPdf(): Promise<Buffer> {
  const schools = await fetchAllVerifiedSchoolsForReport();
  const generated = formatGeneratedAt(new Date().toISOString());
  const approvedCount = schools.filter((s) => s.status === "APPROVED" || s.status === "ACTIVE").length;

  return createPdfBuffer((doc) => {
    drawReportBanner(doc, "Verified Organisations Report");
    drawTitle(
      doc,
      "Verified & approved organisations",
      `Generated ${generated} · ${schools.length} organisation(s) · ${approvedCount} fully approved`
    );

    drawSection(
      doc,
      "Summary",
      "Schools and organisations that have passed initial verification or been approved for participation."
    );

    drawTableHeader(doc, [
      { label: "School name", width: 120 },
      { label: "Address", width: 110 },
      { label: "Principal", width: 90 },
      { label: "Email", width: 130 }
    ]);
    const widths = [120, 110, 90, 130];

    for (const school of schools) {
      drawTableRow(
        doc,
        [school.name.slice(0, 28), school.address.slice(0, 26), school.principalName.slice(0, 22), school.email.slice(0, 32)],
        widths
      );
    }

    drawFooter(doc, `${LETTERHEAD.productLine} · Confidential verified organisations report`);
  });
}
