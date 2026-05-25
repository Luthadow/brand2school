import { prisma } from "../../lib/prisma.js";
import { resolveLogoPublicUrl } from "../../lib/brandStorage.js";
import { publicWebUrl } from "../../lib/publicWebUrl.js";

export type PublicBrandVerification = {
  verificationCode: string;
  brandName: string;
  slug: string;
  verificationStatus: string;
  entityStatus: string;
  founderVerified: boolean;
  verifiedAt: string | null;
  publicProfileUrl: string;
  brandProfileUrl: string;
  verifyUrl: string;
  certificatePdfUrl: string;
  verifyQrImageUrl: string;
  brandQrImageUrl: string;
  logoUrl: string | null;
  brandColor: string | null;
  description: string | null;
  isTrusted: boolean;
};

const TRUSTED_VERIFICATION = new Set(["VERIFIED", "FOUNDER_VERIFIED"]);

function apiAssetPath(path: string): string {
  return `/api/v1/platform${path}`;
}

export async function getBrandByVerificationCode(
  code: string
): Promise<PublicBrandVerification | null> {
  const normalized = code.trim().toUpperCase();
  const brand = await prisma.brand.findFirst({
    where: {
      verificationCode: { equals: normalized, mode: "insensitive" }
    },
    select: {
      name: true,
      slug: true,
      verificationCode: true,
      verificationStatus: true,
      status: true,
      founderExempt: true,
      verifiedAt: true,
      logoUrl: true,
      brandColor: true,
      description: true,
      publicProfileEnabled: true,
      featuredOnHome: true
    }
  });

  if (!brand || !brand.verificationCode) return null;

  const isTrusted = TRUSTED_VERIFICATION.has(brand.verificationStatus);
  const verifyPath = `/verify/${brand.verificationCode}`;
  const brandPath = `/brand/${brand.slug}`;

  return {
    verificationCode: brand.verificationCode,
    brandName: brand.name,
    slug: brand.slug,
    verificationStatus: brand.verificationStatus,
    entityStatus: brand.status,
    founderVerified: brand.verificationStatus === "FOUNDER_VERIFIED" || brand.founderExempt,
    verifiedAt: brand.verifiedAt?.toISOString() ?? null,
    publicProfileUrl: brandPath,
    brandProfileUrl: brandPath,
    verifyUrl: verifyPath,
    certificatePdfUrl: isTrusted
      ? apiAssetPath(`/verify/${encodeURIComponent(brand.verificationCode)}/certificate`)
      : "",
    verifyQrImageUrl: apiAssetPath(`/verify/${encodeURIComponent(brand.verificationCode)}/qr`),
    brandQrImageUrl: apiAssetPath(`/brands/${encodeURIComponent(brand.slug)}/qr`),
    logoUrl: resolveLogoPublicUrl(brand.logoUrl),
    brandColor: brand.brandColor,
    description: brand.description,
    isTrusted
  };
}

/** Full absolute verify URL for QR codes and PDFs. */
export function verificationPageUrl(code: string): string {
  return publicWebUrl(`/verify/${code}`);
}
