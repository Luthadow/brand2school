import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import PDFDocument from "pdfkit";
import { LETTERHEAD } from "../company.js";

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const monorepoRoot = path.resolve(moduleDir, "../../../../..");

export function resolveBrandLogoPath(): string | null {
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

export function createPdfBuffer(build: (doc: InstanceType<typeof PDFDocument>) => void): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 48 });
    const chunks: Buffer[] = [];
    doc.on("data", (c) => chunks.push(c as Buffer));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    build(doc);
    doc.end();
  });
}

/** Standard Brand2School letterhead block (top of page). */
export function drawLetterhead(doc: InstanceType<typeof PDFDocument>): void {
  const logoPath = resolveBrandLogoPath();
  if (logoPath) {
    try {
      doc.image(logoPath, 48, 40, { width: 72 });
    } catch {
      /* optional */
    }
  }
  doc
    .fontSize(10)
    .fillColor("#374151")
    .text(LETTERHEAD.companyName, 140, 44)
    .text(LETTERHEAD.registrationNo, 140, 58)
    .text(LETTERHEAD.taxNo, 140, 72)
    .text(LETTERHEAD.productLine, 140, 86);
  doc.y = 130;
}

export function drawTitle(doc: InstanceType<typeof PDFDocument>, title: string, subtitle?: string): void {
  doc.fontSize(16).fillColor("#003B8E").text(title, { align: "left" });
  if (subtitle) {
    doc.moveDown(0.35);
    doc.fontSize(10).fillColor("#6B7280").text(subtitle);
  }
  doc.moveDown(1);
}

export function drawSection(doc: InstanceType<typeof PDFDocument>, title: string, body: string): void {
  doc.moveDown(0.5);
  doc.fontSize(11).fillColor("#003B8E").text(title);
  doc.fontSize(10).fillColor("#374151").text(body, { align: "justify" });
}

export function drawBulletList(doc: InstanceType<typeof PDFDocument>, items: string[]): void {
  doc.fontSize(10).fillColor("#374151");
  for (const item of items) {
    doc.text(`• ${item}`, { indent: 12, align: "left" });
  }
}

export function drawFooter(doc: InstanceType<typeof PDFDocument>, line: string): void {
  doc.moveDown(2);
  doc.fontSize(9).fillColor("#6B7280").text(line, { align: "center" });
}
