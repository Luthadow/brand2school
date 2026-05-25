import { env } from "../config/env.js";

/** Absolute public web URL (brand2school.co.za or local dev). */
export function publicWebUrl(path: string): string {
  const base = env.WEB_APP_URL.replace(/\/$/, "");
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}
