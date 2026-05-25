/** Base URL for Next.js route handlers proxying to the Express API (server-side only). */
export function serverApiBaseUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    process.env.API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:4000";
  return raw.replace(/\/$/, "");
}
