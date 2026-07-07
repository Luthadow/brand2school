import type { OrganizationCategoryId } from "./organizationCategories";

export const COMMUNITY_ORGANIZATION_CATEGORIES = ["COMMUNITY", "NGO_NPO", "FAITH"] as const;

export function isCommunityOrganization(
  category: string | null | undefined
): category is OrganizationCategoryId {
  return (
    category === "COMMUNITY" || category === "NGO_NPO" || category === "FAITH"
  );
}

export function communityDashboardPath(category?: string | null): string {
  return isCommunityOrganization(category) ? "/community/dashboard" : "/school/dashboard";
}
