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

function apiBase(): string {
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";
}

export async function fetchBrandVerification(code: string): Promise<PublicBrandVerification | null> {
  try {
    const res = await fetch(
      `${apiBase()}/api/v1/platform/verify/${encodeURIComponent(code)}`,
      { cache: "no-store" }
    );
    if (!res.ok) return null;
    return (await res.json()) as PublicBrandVerification;
  } catch {
    return null;
  }
}
