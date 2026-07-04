import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ACCESS_COOKIE, apiBaseUrl, readSessionCookies } from "./auth";
import type { SchoolPortal } from "./schoolPortal";

const LOGIN_PATH = "/organisations/login?category=school";

export async function requireSchoolPortal(): Promise<SchoolPortal> {
  const hasSession = Boolean(cookies().get(ACCESS_COOKIE)?.value);
  if (!hasSession) redirect(LOGIN_PATH);

  const { accessToken } = readSessionCookies();
  const res = await fetch(`${apiBaseUrl()}/api/v1/schools/portal`, {
    cache: "no-store",
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    signal: AbortSignal.timeout(15_000)
  }).catch(() => null);

  if (res?.status === 401 || res?.status === 403) redirect(LOGIN_PATH);

  if (res?.status === 404) {
    redirect("/organisations/register?category=school");
  }

  if (!res?.ok) {
    throw new Error("PORTAL_UNAVAILABLE");
  }

  return (await res.json()) as SchoolPortal;
}
