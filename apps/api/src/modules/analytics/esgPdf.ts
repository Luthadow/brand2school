import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import PDFDocument from "pdfkit";
import { LETTERHEAD } from "../../lib/company.js";
import type { BrandAnalytics } from "./getBrandAnalytics.js";
import { formatReportPeriod, provinceNameFromCode } from "./getBrandAnalytics.js";

const BRAND_BLUE = "#003B8E";
const BRAND_GREEN = "#6CC24A";

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const monorepoRoot = path.resolve(moduleDir, "../../../../..");

function resolveLogoPath(): string | null {
  const roots = [process.cwd(), monorepoRoot, path.resolve(moduleDir, "../../..")];
  const relPaths = [
    "brand2school.png",
    "apps/web/public/brand2school.png",
    "apps/api/assets/brand2school.png"
  ];

  for (const root of roots) {
    for (const rel of relPaths) {
      const candidate = path.resolve(root, rel);
      if (fs.existsSync(candidate)) return candidate;
    }
  }
  return null;
}

function drawFooter(doc: InstanceType<typeof PDFDocument>): void {
  const y = doc.page.height - 42;
  doc
    .moveTo(48, y - 8)
    .lineTo(doc.page.width - 48, y - 8)
    .strokeColor("#E5E7EB")
    .stroke();

  doc
    .fontSize(8)
    .font("Helvetica")
    .fillColor("#6B7280")
    .text(LETTERHEAD.productLine, 48, y, { width: doc.page.width - 96, align: "center" });

  doc
    .fontSize(7)
    .fillColor("#9CA3AF")
    .text(
      `${LETTERHEAD.companyName} · ${LETTERHEAD.registrationNo.replace("Registration No.: ", "Reg. ")} · ${LETTERHEAD.taxNo.replace("Tax No.: ", "Tax ")}`,
      48,
      y + 12,
      { width: doc.page.width - 96, align: "center" }
    );
}

function drawLetterhead(doc: InstanceType<typeof PDFDocument>): number {
  const logoPath = resolveLogoPath();
  const top = 36;
  const letterheadX = 200;

  if (logoPath) {
    doc.image(logoPath, 48, top, { fit: [130, 52] });
  } else {
    doc.fontSize(16).font("Helvetica-Bold").fillColor(BRAND_BLUE).text("Brand2School", 48, top + 12);
  }

  doc.fontSize(9).font("Helvetica-Bold").fillColor("#111827").text(LETTERHEAD.companyName, letterheadX, top);
  doc
    .fontSize(8)
    .font("Helvetica")
    .fillColor("#374151")
    .text(LETTERHEAD.registrationNo, letterheadX, top + 14)
    .text(LETTERHEAD.taxNo, letterheadX, top + 26)
    .text(LETTERHEAD.address, letterheadX, top + 38, { width: doc.page.width - letterheadX - 48 })
    .text(LETTERHEAD.phone, letterheadX, top + 62);

  doc.rect(0, 104, doc.page.width, 34).fill(BRAND_BLUE);
  doc
    .fillColor("#ffffff")
    .fontSize(13)
    .font("Helvetica-Bold")
    .text("Brand2School", 48, 112);
  doc
    .fontSize(10)
    .font("Helvetica")
    .text("Impact Intelligence — ESG / CSI Report", 48, 126);

  doc.fillColor("#1F2937");
  return 160;
}

function drawHeader(doc: InstanceType<typeof PDFDocument>, title: string): void {
  const titleY = drawLetterhead(doc);
  doc.fontSize(18).font("Helvetica-Bold").fillColor("#111827").text(title, 48, titleY);
  drawFooter(doc);
}

function drawSummary(doc: InstanceType<typeof PDFDocument>, analytics: BrandAnalytics, y: number): number {
  let cursor = y;
  doc.fontSize(10).font("Helvetica").fillColor("#4B5563").text(`Reporting period: ${formatReportPeriod(analytics)}`, 48, cursor);
  cursor += 18;
  doc.text(`Generated: ${new Date(analytics.generatedAt).toLocaleString("en-ZA")}`, 48, cursor);
  cursor += 28;

  const metrics = [
    ["Valid submissions", String(analytics.summary.validSubmissions)],
    ["Engagement rate", `${analytics.summary.engagementRate}%`],
    ["Schools reached", String(analytics.summary.schoolsReached)],
    ["Participation events", String(analytics.summary.learnersReached)],
    ["Fraud blocked", String(analytics.trust?.fraudAttemptsBlocked ?? 0)],
    ["Code utilization", `${analytics.summary.codeUtilization}%`]
  ];

  doc.fontSize(12).font("Helvetica-Bold").fillColor(BRAND_BLUE).text("Executive Summary", 48, cursor);
  cursor += 20;

  const colWidth = 240;
  metrics.forEach(([label, value], i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 48 + col * colWidth;
    const yPos = cursor + row * 36;
    doc.fontSize(9).font("Helvetica").fillColor("#6B7280").text(label, x, yPos);
    doc.fontSize(14).font("Helvetica-Bold").fillColor("#111827").text(value, x, yPos + 12);
  });

  return cursor + Math.ceil(metrics.length / 2) * 36 + 16;
}

function drawProvinceTable(doc: InstanceType<typeof PDFDocument>, analytics: BrandAnalytics, y: number): number {
  let cursor = y;
  doc.fontSize(12).font("Helvetica-Bold").fillColor(BRAND_BLUE).text("Province Participation", 48, cursor);
  cursor += 22;

  const headers = ["Province", "Schools", "Learners", "Submissions"];
  const colX = [48, 220, 300, 390];
  doc.fontSize(9).font("Helvetica-Bold").fillColor("#374151");
  headers.forEach((h, i) => doc.text(h, colX[i], cursor));
  cursor += 16;

  analytics.provinces
    .filter((p) => p.submissions > 0 || p.schools > 0)
    .sort((a, b) => b.submissions - a.submissions)
    .forEach((p) => {
      if (cursor > doc.page.height - 80) {
        doc.addPage();
        drawFooter(doc);
        cursor = 48;
      }
      doc.fontSize(9).font("Helvetica").fillColor("#1F2937");
      doc.text(provinceNameFromCode(p.code), colX[0], cursor);
      doc.text(String(p.schools), colX[1], cursor);
      doc.text(String(p.learners), colX[2], cursor);
      doc.text(String(p.submissions), colX[3], cursor);
      cursor += 14;
    });

  return cursor + 12;
}

function drawCampaignTable(doc: InstanceType<typeof PDFDocument>, analytics: BrandAnalytics, y: number): number {
  let cursor = y;
  if (cursor > doc.page.height - 120) {
    doc.addPage();
    drawFooter(doc);
    cursor = 48;
  }

  doc.fontSize(12).font("Helvetica-Bold").fillColor(BRAND_BLUE).text("Campaign Performance", 48, cursor);
  cursor += 22;

  analytics.campaigns.forEach((c) => {
    if (cursor > doc.page.height - 100) {
      doc.addPage();
      drawFooter(doc);
      cursor = 48;
    }
    doc.fontSize(10).font("Helvetica-Bold").fillColor("#111827").text(`${c.name} (${c.brandName})`, 48, cursor);
    cursor += 14;
    doc
      .fontSize(9)
      .font("Helvetica")
      .fillColor("#4B5563")
      .text(
        `Valid: ${c.validSubmissions} · Schools: ${c.schoolsReached} · Participation: ${c.learnersReached} · Code use: ${c.codeUtilization}% · Status: ${c.isActive ? "Active" : "Completed"}`,
        48,
        cursor
      );
    cursor += 22;
  });

  return cursor + 8;
}

function drawCompliance(doc: InstanceType<typeof PDFDocument>, analytics: BrandAnalytics, y: number): number {
  let cursor = y;
  if (cursor > doc.page.height - 140) {
    doc.addPage();
    drawFooter(doc);
    cursor = 48;
  }

  doc.fontSize(12).font("Helvetica-Bold").fillColor(BRAND_BLUE).text("Compliance & Data Governance", 48, cursor);
  cursor += 20;
  const lines = [
    "All metrics are derived from verified school network participation events.",
    "Personal learner data is not included in this report — aggregated school-level insights only.",
    `${LETTERHEAD.companyName} maintains POPIA-aligned data handling and immutable audit trails.`,
    `Fraud protection: ${analytics.trust?.duplicateCodesRejected ?? 0} duplicate codes rejected, ${analytics.trust?.fraudAttemptsBlocked ?? 0} abuse attempts blocked.`,
    "One code equals one verified participation event — codes cannot be reused or reset."
  ];
  doc.fontSize(9).font("Helvetica").fillColor("#374151");
  lines.forEach((line) => {
    doc.text(`• ${line}`, 48, cursor, { width: doc.page.width - 96 });
    cursor += 28;
  });

  doc
    .fontSize(8)
    .fillColor(BRAND_GREEN)
    .text("Verified participation infrastructure — not donation optics.", 48, cursor + 8);

  return cursor + 40;
}

export function buildEsgPdf(analytics: BrandAnalytics, campaignName?: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 48 });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    doc.on("pageAdded", () => drawFooter(doc));

    const title = campaignName ? `Campaign Report — ${campaignName}` : "National Impact Report";
    drawHeader(doc, title);

    let y = drawSummary(doc, analytics, 178);
    y = drawProvinceTable(doc, analytics, y);
    y = drawCampaignTable(doc, analytics, y);
    drawCompliance(doc, analytics, y);

    doc.end();
  });
}
