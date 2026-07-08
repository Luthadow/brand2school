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

const REPORT_PAGE_MARGIN = 48;
const REPORT_BOTTOM_MARGIN = 56;
const REPORT_CONTINUATION_Y = 130;

/** Returns true when a new page was started. */
export function ensureReportSpace(doc: InstanceType<typeof PDFDocument>, needed = 72): boolean {
  const bottomY = doc.page.height - REPORT_BOTTOM_MARGIN;
  if (doc.y + needed > bottomY) {
    doc.addPage();
    drawLetterhead(doc);
    doc.x = REPORT_PAGE_MARGIN;
    doc.y = REPORT_CONTINUATION_Y;
    return true;
  }
  return false;
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
  let x = REPORT_PAGE_MARGIN;
  const y = doc.y;
  doc.fontSize(9).fillColor("#003B8E");
  for (const col of columns) {
    doc.text(col.label, x, y, { width: col.width, lineBreak: false });
    x += col.width;
  }
  doc.x = REPORT_PAGE_MARGIN;
  doc.y = y + 14;
  doc
    .moveTo(REPORT_PAGE_MARGIN, doc.y)
    .lineTo(doc.page.width - REPORT_PAGE_MARGIN, doc.y)
    .strokeColor("#E5E7EB")
    .stroke();
  doc.y += 6;
}

export function drawReportTableRow(
  doc: InstanceType<typeof PDFDocument>,
  cells: string[],
  widths: number[],
  options?: { onPageBreak?: () => void }
): void {
  if (ensureReportSpace(doc, 20)) {
    options?.onPageBreak?.();
  }
  let x = REPORT_PAGE_MARGIN;
  const y = doc.y;
  doc.fontSize(9).fillColor("#374151");
  cells.forEach((cell, i) => {
    doc.text(cell, x, y, { width: widths[i]! - 4, lineBreak: false });
    x += widths[i]!;
  });
  doc.x = REPORT_PAGE_MARGIN;
  doc.y = y + 14;
}

const MODERN_TABLE_MARGIN = REPORT_PAGE_MARGIN;
const MODERN_TABLE_PAD_X = 8;
const MODERN_TABLE_PAD_Y = 10;
const MODERN_TABLE_HEADER_H = 30;

function modernTableContentWidth(doc: InstanceType<typeof PDFDocument>): number {
  return doc.page.width - MODERN_TABLE_MARGIN * 2;
}

function drawModernTableHeaderRow(
  doc: InstanceType<typeof PDFDocument>,
  columns: Array<{ label: string; width: number }>
): void {
  ensureReportSpace(doc, MODERN_TABLE_HEADER_H + 12);
  const x = MODERN_TABLE_MARGIN;
  const y = doc.y;
  const totalWidth = columns.reduce((sum, col) => sum + col.width, 0);

  doc.rect(x, y, totalWidth, MODERN_TABLE_HEADER_H).fill(REPORT_BRAND_BLUE);
  doc.fontSize(8.5).fillColor("#FFFFFF");

  let cx = x;
  for (const col of columns) {
    doc.text(col.label, cx + MODERN_TABLE_PAD_X, y + 10, {
      width: col.width - MODERN_TABLE_PAD_X * 2,
      align: "left",
      lineBreak: false
    });
    cx += col.width;
  }

  doc.x = MODERN_TABLE_MARGIN;
  doc.y = y + MODERN_TABLE_HEADER_H + 6;
}

/** Spaced table with wrapping rows, zebra striping, and repeated headers on page breaks. */
export function createModernTable(
  doc: InstanceType<typeof PDFDocument>,
  columnDefs: Array<{ label: string; ratio: number }>
): { addRow: (cells: string[]) => void } {
  const contentWidth = modernTableContentWidth(doc);
  const ratioSum = columnDefs.reduce((sum, col) => sum + col.ratio, 0);
  const columns = columnDefs.map((col) => ({
    label: col.label,
    width: Math.floor((contentWidth * col.ratio) / ratioSum)
  }));
  const widthUsed = columns.reduce((sum, col) => sum + col.width, 0);
  columns[columns.length - 1]!.width += contentWidth - widthUsed;

  let rowIndex = 0;

  const drawHeader = (): void => {
    drawModernTableHeaderRow(doc, columns);
  };

  drawHeader();

  const addRow = (cells: string[]): void => {
    const widths = columns.map((col) => col.width);
    const texts = widths.map((_, i) => cells[i]?.trim() || "—");

    doc.fontSize(9).fillColor("#475569");
    let contentHeight = 14;
    for (let i = 0; i < texts.length; i++) {
      contentHeight = Math.max(
        contentHeight,
        doc.heightOfString(texts[i]!, { width: widths[i]! - MODERN_TABLE_PAD_X * 2, lineGap: 2 })
      );
    }
    const rowHeight = contentHeight + MODERN_TABLE_PAD_Y * 2;

    if (ensureReportSpace(doc, rowHeight + 8)) {
      drawHeader();
    }

    const x = MODERN_TABLE_MARGIN;
    const y = doc.y;
    const totalWidth = contentWidth;

    if (rowIndex % 2 === 0) {
      doc.rect(x, y, totalWidth, rowHeight).fill("#F8FAFC");
    }

    doc
      .strokeColor("#E2E8F0")
      .lineWidth(0.5)
      .moveTo(x, y + rowHeight)
      .lineTo(x + totalWidth, y + rowHeight)
      .stroke();

    let cx = x;
    for (let i = 0; i < texts.length; i++) {
      doc
        .fillColor(i === 0 ? "#0F172A" : "#475569")
        .fontSize(9)
        .text(texts[i]!, cx + MODERN_TABLE_PAD_X, y + MODERN_TABLE_PAD_Y, {
          width: widths[i]! - MODERN_TABLE_PAD_X * 2,
          align: "left",
          lineGap: 2
        });
      cx += widths[i]!;
    }

    doc.x = MODERN_TABLE_MARGIN;
    doc.y = y + rowHeight + 4;
    rowIndex += 1;
  };

  return { addRow };
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

export {
  advanceAfterChart,
  chartBox,
  CHART_COLORS,
  drawHorizontalBarChart,
  drawLineChart,
  drawStackedBarChart,
  drawStatusBreakdownChart,
  drawVerticalBarChart,
  type ChartPoint,
  type LineSeries
} from "./pdfCharts.js";
