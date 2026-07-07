import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ACCESS_COOKIE, apiBaseUrl, readSessionCookies } from "./auth";
import type { CommunityPortal } from "./communityPortal";
import { communityDashboardPath, isCommunityOrganization } from "./communityOrganizations";

const LOGIN_PATH = "/organisations/login?category=community";

export async function requireCommunityPortal(): Promise<CommunityPortal> {
  const hasSession = Boolean(cookies().get(ACCESS_COOKIE)?.value);
  if (!hasSession) redirect(LOGIN_PATH);

  const { accessToken } = readSessionCookies();
  const res = await fetch(`${apiBaseUrl()}/api/v1/community/portal`, {
    cache: "no-store",
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    signal: AbortSignal.timeout(15_000)
  }).catch(() => null);

  if (res?.status === 401 || res?.status === 403) {
    if (res.status === 403) {
      const data = (await res.json().catch(() => null)) as {
        organizationCategory?: string;
      } | null;
      if (data?.organizationCategory && !isCommunityOrganization(data.organizationCategory)) {
        redirect("/school/dashboard");
      }
    }
    redirect(LOGIN_PATH);
  }

  if (res?.status === 404) {
    redirect("/organisations/register?category=community");
  }

  if (!res?.ok) {
    throw new Error("PORTAL_UNAVAILABLE");
  }

  return (await res.json()) as CommunityPortal;
}

export { communityDashboardPath };
