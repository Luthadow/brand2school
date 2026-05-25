/** Resolve platform asset URLs (QR PNG, certificate PDF) from API paths. */
export function apiAssetUrl(apiPath: string): string {
  const base = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000").replace(/\/$/, "");
  const path = apiPath.startsWith("/") ? apiPath : `/${apiPath}`;
  return `${base}${path}`;
}
