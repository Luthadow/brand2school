import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ACCESS_COOKIE, apiBaseUrl, readSessionCookies } from "./auth";
import type { SchoolPortal } from "./schoolPortal";

export async function requireSchoolPortal(): Promise<SchoolPortal> {
  const hasSession = Boolean(cookies().get(ACCESS_COOKIE)?.value);
  if (!hasSession) redirect("/school/login");

  const { accessToken } = readSessionCookies();
  const res = await fetch(`${apiBaseUrl()}/api/v1/schools/portal`, {
    cache: "no-store",
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {}
  }).catch(() => null);

  if (res?.status === 401 || res?.status === 403) redirect("/school/login");
  if (!res?.ok) {
    throw new Error("Could not load your school dashboard. Please try again.");
  }
  return (await res.json()) as SchoolPortal;
}
