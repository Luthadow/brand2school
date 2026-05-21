import { cookies } from "next/headers";
import { BRAND_ACCESS_COOKIE } from "./brandCookies";
import { internalApiHeaders } from "./internalApi";

export function analyticsRequestHeaders(): Record<string, string> {
  const token = cookies().get(BRAND_ACCESS_COOKIE)?.value;
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return internalApiHeaders();
}
