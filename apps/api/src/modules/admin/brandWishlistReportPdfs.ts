import type PDFDocument from "pdfkit";
import { createPdfBuffer, drawFooter, drawSection } from "../../lib/pdf/pdfKitHelpers.js";
import {
  createModernTable,
  drawReportBanner,
  drawReportKeyValues,
  drawReportTitleBlock,
  ensureReportSpace,
  formatReportGeneratedAt
} from "../../lib/pdf/reportLayout.js";
import { getBrandWishlistBrandReportData } from "./brandWishlistAdmin.js";

function slugifyBrandId(brandId: string): string {
  return brandId.replace(/[^a-z0-9-]/gi, "-").toLowerCase();
}

export function brandWishlistReportContentDisposition(brandId: string, brandName: string): string {
  const date = new Date().toISOString().slice(0, 10);
  const slug = slugifyBrandId(brandId);
  const safeName = brandName.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase();
  return `attachment; filename="brand2school-wishlist-${safeName || slug}-${date}.pdf"`;
}

function drawCommentsSection(
  doc: InstanceType<typeof PDFDocument>,
  nominations: Array<{
    createdAt: string;
    provinceName: string;
    contactName: string | null;
    schoolName: string | null;
    reason: string | null;
  }>
): void {
  const withComments = nominations.filter((n) => n.reason?.trim());
  drawSection(
    doc,
    "Community comments",
    withComments.length > 0
      ? "Written reasons submitted by nominators — primary insight for brand outreach."
      : "No written comments have been submitted for this brand yet."
  );

  if (withComments.length === 0) return;

  for (const row of withComments) {
    ensureReportSpace(doc, 56);
    const submitted = formatReportGeneratedAt(row.createdAt);
    const who = [row.contactName, row.schoolName].filter(Boolean).join(" · ") || "Anonymous";
    doc.fontSize(9).fillColor("#003B8E").text(`${submitted} · ${row.provinceName} · ${who}`, 48, doc.y, {
      width: doc.page.width - 96
    });
    doc.moveDown(0.25);
    doc.fontSize(9.5).fillColor("#374151").text(row.reason!.trim(), 48, doc.y, {
      width: doc.page.width - 96,
      align: "left"
    });
    doc.moveDown(0.75);
    doc
      .moveTo(48, doc.y)
      .lineTo(doc.page.width - 48, doc.y)
      .strokeColor("#E5E7EB")
      .stroke();
    doc.moveDown(0.5);
  }
}

export async function buildBrandWishlistBrandReportPdf(brandId: string): Promise<Buffer | null> {
  const data = await getBrandWishlistBrandReportData(brandId);
  if (!data) return null;

  const generated = formatReportGeneratedAt(data.generatedAt);

  return createPdfBuffer((doc) => {
    drawReportBanner(doc, "Brand Wishlist — Community Nomination Report");
    drawReportTitleBlock(doc, data.brandName, `${data.categoryLabel} · Generated ${generated}`);

    drawReportKeyValues(doc, [
      { label: "Total nominations", value: String(data.totalNominations) },
      { label: "Written comments", value: String(data.commentsCount) },
      { label: "Provinces represented", value: String(data.provinceBreakdown.length) }
    ]);

    drawSection(
      doc,
      "Disclaimer",
      data.disclaimer
    );

    if (data.provinceBreakdown.length > 0) {
      drawSection(doc, "Nominations by province", "Geographic spread of community interest.");
      const provinceTable = createModernTable(doc, [
        { label: "Province", ratio: 3 },
        { label: "Nominations", ratio: 1 }
      ]);
      for (const row of data.provinceBreakdown) {
        provinceTable.addRow([row.provinceName, String(row.count)]);
      }
    }

    if (data.nominations.length > 0) {
      drawSection(doc, "All nominations", "Chronological register of community submissions.");
      const nominationsTable = createModernTable(doc, [
        { label: "Date", ratio: 1.2 },
        { label: "Province", ratio: 1.4 },
        { label: "Nominator", ratio: 1.4 },
        { label: "Organisation", ratio: 1.6 },
        { label: "Comment", ratio: 1 }
      ]);
      for (const row of data.nominations) {
        nominationsTable.addRow([
          new Date(row.createdAt).toLocaleDateString("en-ZA"),
          row.provinceName,
          row.contactName ?? "—",
          row.schoolName ?? "—",
          row.reason?.trim() ? "Yes" : "—"
        ]);
      }
    }

    drawCommentsSection(doc, data.nominations);

    drawFooter(doc, "Brand2School · Brand Wishlist · Confidential outreach intelligence");
  });
}
