import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { BrandPortal } from "./brandPortal";
import { analyticsRequestHeaders } from "./analyticsAuth";
import { apiBaseUrl, BRAND_ACCESS_COOKIE } from "./brandAuth";

export async function requireBrandPortal(): Promise<BrandPortal> {
  const hasBrandSession = Boolean(cookies().get(BRAND_ACCESS_COOKIE)?.value);
  const hasInternalKey = Boolean(process.env.B2S_INTERNAL_API_KEY);

  if (!hasBrandSession && !hasInternalKey) {
    redirect("/brand/login");
  }

  const res = await fetch(`${apiBaseUrl()}/api/v1/analytics/brand/portal`, {
    cache: "no-store",
    headers: analyticsRequestHeaders()
  }).catch(() => null);

  if (res?.status === 401 || res?.status === 403) redirect("/brand/login");
  if (!res?.ok) {
    throw new Error("Could not load your brand dashboard. Please try again.");
  }

  return (await res.json()) as BrandPortal;
}
