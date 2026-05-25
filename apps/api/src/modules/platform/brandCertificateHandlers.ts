import fs from "node:fs";
import { prisma } from "../../lib/prisma.js";
import { brandLogoAbsolutePath } from "../../lib/brandStorage.js";
import { publicWebUrl } from "../../lib/publicWebUrl.js";
import { renderQrPng } from "../../lib/qrCode.js";
import { getBrandByVerificationCode } from "./getBrandVerification.js";
import {
  buildBrandVerificationCertificatePdf,
  type BrandCertificateInput
} from "./brandVerificationCertificatePdf.js";

const TRUSTED = new Set(["VERIFIED", "FOUNDER_VERIFIED"]);

async function brandForCertificateByCode(code: string) {
  const profile = await getBrandByVerificationCode(code);
  if (!profile || !profile.isTrusted) return null;

  const brand = await prisma.brand.findFirst({
    where: { verificationCode: { equals: code.trim(), mode: "insensitive" } },
    select: {
      id: true,
      name: true,
      verificationCode: true,
      verificationStatus: true,
      founderExempt: true,
      verifiedAt: true,
      brandColor: true,
      logoUrl: true,
      slug: true
    }
  });
  if (!brand?.verificationCode) return null;
  return { profile, brand };
}

async function brandForCertificateBySlug(slug: string) {
  const brand = await prisma.brand.findFirst({
    where: { slug, verificationCode: { not: null } },
    select: {
      id: true,
      name: true,
      slug: true,
      verificationCode: true,
      verificationStatus: true,
      founderExempt: true,
      verifiedAt: true,
      brandColor: true,
      logoUrl: true,
      status: true
    }
  });
  if (!brand?.verificationCode || !TRUSTED.has(brand.verificationStatus)) return null;
  return brand;
}

function certificateInputFromBrand(brand: {
  id: string;
  name: string;
  verificationCode: string;
  verificationStatus: string;
  founderExempt: boolean;
  verifiedAt: Date | null;
  brandColor: string | null;
  logoUrl: string | null;
  slug: string;
}): BrandCertificateInput {
  const logoPath = brand.logoUrl && !brand.logoUrl.startsWith("http")
    ? brandLogoAbsolutePath(brand.id)
    : null;
  const partnerLogo =
    logoPath && fs.existsSync(logoPath) ? logoPath : null;

  return {
    brandName: brand.name,
    verificationCode: brand.verificationCode,
    verificationStatus: brand.verificationStatus,
    founderVerified: brand.verificationStatus === "FOUNDER_VERIFIED" || brand.founderExempt,
    verifiedAt: brand.verifiedAt,
    brandColor: brand.brandColor,
    brandLogoPath: partnerLogo,
    verifyUrlPath: `/verify/${brand.verificationCode}`,
    brandProfileUrlPath: `/brand/${brand.slug}`
  };
}

export async function buildCertificatePdfByCode(code: string): Promise<Buffer | null> {
  const row = await brandForCertificateByCode(code);
  if (!row?.brand.verificationCode) return null;
  return buildBrandVerificationCertificatePdf(
    certificateInputFromBrand({ ...row.brand, verificationCode: row.brand.verificationCode })
  );
}

export async function buildCertificatePdfBySlug(slug: string): Promise<Buffer | null> {
  const brand = await brandForCertificateBySlug(slug);
  if (!brand?.verificationCode) return null;
  return buildBrandVerificationCertificatePdf(
    certificateInputFromBrand({ ...brand, verificationCode: brand.verificationCode })
  );
}

export async function buildVerifyQrByCode(code: string): Promise<Buffer | null> {
  const profile = await getBrandByVerificationCode(code);
  if (!profile) return null;
  return renderQrPng(publicWebUrl(profile.verifyUrl));
}

export async function buildBrandProfileQrBySlug(slug: string): Promise<Buffer | null> {
  const brand = await prisma.brand.findFirst({
    where: { slug },
    select: { slug: true, status: true, publicProfileEnabled: true, featuredOnHome: true }
  });
  if (!brand) return null;
  if (brand.status !== "ACTIVE") return null;
  if (!brand.publicProfileEnabled && !brand.featuredOnHome) return null;
  return renderQrPng(publicWebUrl(`/brand/${brand.slug}`));
}
