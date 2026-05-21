export const BRAND_ACCESS_COOKIE = "b2s_brand_access_token";
export const BRAND_REFRESH_COOKIE = "b2s_brand_refresh_token";
export const BRAND_CSRF_COOKIE = "b2s_brand_csrf_token";

const BRAND_ROLES = new Set(["BRAND_ADMIN", "SUPER_ADMIN", "ADMIN_STAFF"]);

export function isBrandPortalRole(role: string): boolean {
  return BRAND_ROLES.has(role);
}
