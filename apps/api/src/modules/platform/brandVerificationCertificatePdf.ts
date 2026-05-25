import {
  createPdfBuffer,
  drawFooter,
  drawLetterhead,
  drawTitle
} from "../../lib/pdf/pdfKitHelpers.js";
import { renderQrPng } from "../../lib/qrCode.js";
import { publicWebUrl } from "../../lib/publicWebUrl.js";

export type BrandCertificateInput = {
  brandName: string;
  verificationCode: string;
  verificationStatus: string;
  founderVerified: boolean;
  verifiedAt: Date | null;
  brandColor: string | null;
  brandLogoPath: string | null;
  verifyUrlPath: string;
  brandProfileUrlPath: string;
};

function statusTitle(status: string, founder: boolean): string {
  if (status === "FOUNDER_VERIFIED" || founder) return "Founding Verified Brand Partner";
  if (status === "VERIFIED") return "Verified Brand Partner";
  return "Brand Registration Certificate";
}

function accentHex(input: string | null): string {
  if (input && /^#[0-9A-Fa-f]{6}$/.test(input)) return input;
  return "#003B8E";
}

export async function buildBrandVerificationCertificatePdf(
  input: BrandCertificateInput
): Promise<Buffer> {
  const accent = accentHex(input.brandColor);
  const verifyUrl = publicWebUrl(input.verifyUrlPath);
  const profileUrl = publicWebUrl(input.brandProfileUrlPath);
  const verifyQr = await renderQrPng(verifyUrl, 280);
  const profileQr = await renderQrPng(profileUrl, 200);

  return createPdfBuffer((doc) => {
    drawLetterhead(doc);
    drawTitle(
      doc,
      "Brand Verification Certificate",
      "Brand2School · Measurable school infrastructure participation"
    );

    const boxY = doc.y;
    doc
      .roundedRect(48, boxY, 499, 118, 6)
      .lineWidth(2)
      .strokeColor(accent)
      .stroke();

    doc
      .fontSize(20)
      .fillColor(accent)
      .text(input.brandName, 64, boxY + 22, { width: 460 });

    doc
      .fontSize(11)
      .fillColor("#374151")
      .text(statusTitle(input.verificationStatus, input.founderVerified), 64, boxY + 54);

    doc
      .fontSize(10)
      .fillColor("#6B7280")
      .text(`Verification code: ${input.verificationCode}`, 64, boxY + 78);

    if (input.verifiedAt) {
      doc.text(
        `Verified: ${input.verifiedAt.toLocaleDateString("en-ZA", { dateStyle: "long" })}`,
        64,
        boxY + 94
      );
    }

    doc.y = boxY + 140;

    doc.fontSize(11).fillColor("#374151").text(
      "This certificate confirms that the brand named above is registered on the Brand2School platform. " +
        "Scan the QR code or visit the verification URL to confirm authenticity in real time.",
      { align: "justify" }
    );

    doc.moveDown(1.2);
    const qrY = doc.y;
    doc.image(verifyQr, 48, qrY, { width: 130 });
    doc
      .fontSize(10)
      .fillColor("#003B8E")
      .text("Verify this brand", 200, qrY + 8, { width: 340 });
    doc
      .fontSize(9)
      .fillColor("#6B7280")
      .text(verifyUrl, 200, qrY + 28, { width: 340 });
    doc.text(`Code: ${input.verificationCode}`, 200, qrY + 58, { width: 340 });

    doc.image(profileQr, 200, qrY + 88, { width: 88 });
    doc
      .fontSize(9)
      .fillColor("#6B7280")
      .text("Brand profile QR", 300, qrY + 100, { width: 240 });
    doc.text(profileUrl, 300, qrY + 116, { width: 240 });

    const partnerLogo = input.brandLogoPath;
    if (partnerLogo) {
      try {
        doc.image(partnerLogo, 420, qrY + 4, { fit: [110, 48], align: "right" });
      } catch {
        /* optional partner logo */
      }
    }

    doc.y = qrY + 200;
    doc.moveDown(0.5);
    doc
      .fontSize(9)
      .fillColor("#6B7280")
      .text(
        "Brand2School verifies partner brands through admin review, participation agreements, and auditable school code submissions. " +
          "This document is generated electronically and does not require a physical signature.",
        { align: "justify" }
      );

    drawFooter(
      doc,
      "brand2school.co.za · NKANYEZI TECH SOLUTIONS (Pty) Ltd · Reg. 2025 / 606307 / 07"
    );
  });
}
