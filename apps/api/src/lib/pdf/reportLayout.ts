import type PDFDocument from "pdfkit";
import { LETTERHEAD } from "../company.js";
import { drawLetterhead, drawTitle } from "./pdfKitHelpers.js";

export const REPORT_BRAND_BLUE = "#003B8E";

export function formatReportGeneratedAt(iso: string): string {
  return new Date(iso).toLocaleString("en-ZA", { dateStyle: "medium", timeStyle: "short" });
}

export function buildReportFilename(prefix: string, module: string): string {
  const date = new Date().toISOString().slice(0, 10);
  return `${prefix}-${module}-report-${date}.pdf`;
}

export function reportContentDisposition(prefix: string, module: string): string {
  return `attachment; filename="${buildReportFilename(prefix, module)}"`;
}

export function drawReportBanner(doc: InstanceType<typeof PDFDocument>, reportTitle: string): void {
  drawLetterhead(doc);
  doc.rect(0, 118, doc.page.width, 28).fill(REPORT_BRAND_BLUE);
  doc.fillColor("#ffffff").fontSize(11).text(reportTitle, 48, 125);
  doc.fillColor("#374151");
  doc.y = 160;
}

export function ensureReportSpace(doc: InstanceType<typeof PDFDocument>, needed = 72): void {
  if (doc.y > doc.page.height - needed) {
    doc.addPage();
    drawLetterhead(doc);
    doc.y = 130;
  }
}

export function drawReportKeyValues(
  doc: InstanceType<typeof PDFDocument>,
  rows: Array<{ label: string; value: string }>
): void {
  for (const row of rows) {
    ensureReportSpace(doc, 24);
    const y = doc.y;
    doc.fontSize(10).fillColor("#003B8E").text(row.label, 48, y, { width: 200 });
    doc.fillColor("#374151").text(row.value, 240, y, { width: doc.page.width - 288 });
    doc.y = y + 16;
  }
  doc.moveDown(0.5);
}

export function drawReportTableHeader(
  doc: InstanceType<typeof PDFDocument>,
  columns: Array<{ label: string; width: number }>
): void {
  ensureReportSpace(doc, 28);
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

export function drawReportTableRow(
  doc: InstanceType<typeof PDFDocument>,
  cells: string[],
  widths: number[]
): void {
  ensureReportSpace(doc, 20);
  let x = 48;
  const y = doc.y;
  doc.fontSize(9).fillColor("#374151");
  cells.forEach((cell, i) => {
    doc.text(cell, x, y, { width: widths[i] - 4, lineBreak: false });
    x += widths[i];
  });
  doc.y = y + 14;
}

export function drawReportTitleBlock(
  doc: InstanceType<typeof PDFDocument>,
  title: string,
  subtitle: string
): void {
  drawTitle(doc, title, subtitle);
}

export function drawReportFooter(doc: InstanceType<typeof PDFDocument>, line: string): void {
  doc.moveDown(2);
  doc.fontSize(9).fillColor("#6B7280").text(line, { align: "center" });
}

export function formatZarReport(amount: number): string {
  return `R ${Math.round(amount).toLocaleString("en-ZA")}`;
}

export { LETTERHEAD };
