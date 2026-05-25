import type { PlatformPartner } from "./platformPartners";

/** Same-origin logo URL (proxied to API at runtime — works in client + server, no build-time API env). */
export function brandLogoDisplayPath(slug: string, cacheRev = 0): string {
  const qs = cacheRev > 0 ? `?rev=${cacheRev}` : "";
  return `/api/public/brand-logo/${encodeURIComponent(slug)}${qs}`;
}

/** Map API partner rows to web-app logo paths (never localhost from missing NEXT_PUBLIC_* at build). */
export function withWebBrandLogoUrls<T extends { slug: string; logoUrl: string | null }>(
  partners: T[]
): T[] {
  return partners.map((p) => ({
    ...p,
    logoUrl: p.logoUrl ? brandLogoDisplayPath(p.slug) : null
  }));
}

/** @deprecated Use brandLogoDisplayPath */
export const brandLogoPreviewUrl = brandLogoDisplayPath;

/** @deprecated Use withWebBrandLogoUrls */
export const withAbsoluteBrandLogoUrls = withWebBrandLogoUrls;

export type { PlatformPartner };
