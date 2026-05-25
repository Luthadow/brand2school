import type { PlatformPartner } from "./platformPartners";

/** Ensure partner logos use an absolute API URL (works with next/image and plain img). */
export function withAbsoluteBrandLogoUrls<T extends { slug: string; logoUrl: string | null }>(
  partners: T[]
): T[] {
  const apiBase = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000").replace(/\/$/, "");
  return partners.map((p) => {
    if (!p.logoUrl) return p;
    if (p.logoUrl.startsWith("http://") || p.logoUrl.startsWith("https://")) return p;
    if (p.logoUrl.startsWith("/api/public/")) {
      return { ...p, logoUrl: `${apiBase}/api/v1/platform/brand-logo/${encodeURIComponent(p.slug)}` };
    }
    if (p.logoUrl.startsWith("/api/v1/")) {
      return { ...p, logoUrl: `${apiBase}${p.logoUrl}` };
    }
    return p;
  });
}

export function brandLogoPreviewUrl(slug: string, cacheRev = 0): string {
  const apiBase = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000").replace(/\/$/, "");
  const qs = cacheRev > 0 ? `?rev=${cacheRev}` : "";
  return `${apiBase}/api/v1/platform/brand-logo/${encodeURIComponent(slug)}${qs}`;
}

export type { PlatformPartner };
