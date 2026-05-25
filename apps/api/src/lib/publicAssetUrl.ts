import { env } from "../config/env.js";

/** Base URL for publicly served API assets (brand logos, uploads). */
export function apiPublicBaseUrl(): string {
  const fromEnv = process.env.API_PUBLIC_URL?.trim().replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  const railway = process.env.RAILWAY_PUBLIC_DOMAIN?.trim();
  if (railway) return `https://${railway.replace(/^https?:\/\//, "")}`;
  const port = env.PORT ?? "4000";
  return `http://localhost:${port}`;
}

export function toPublicAssetUrl(storedPath: string | null | undefined): string | null {
  if (!storedPath) return null;
  if (storedPath.startsWith("http://") || storedPath.startsWith("https://")) return storedPath;
  const path = storedPath.startsWith("/") ? storedPath : `/${storedPath}`;
  return `${apiPublicBaseUrl()}${path}`;
}
