import type { OrganizationCategoryId } from "./organizationCategories.js";

export const COMMUNITY_ORGANIZATION_CATEGORIES = ["COMMUNITY", "NGO_NPO", "FAITH"] as const;

export type CommunityOrganizationCategory = (typeof COMMUNITY_ORGANIZATION_CATEGORIES)[number];

export function isCommunityOrganization(
  category: string | null | undefined
): category is CommunityOrganizationCategory {
  return COMMUNITY_ORGANIZATION_CATEGORIES.includes(category as CommunityOrganizationCategory);
}

export function isSchoolOrganization(category: string | null | undefined): boolean {
  return category === "SCHOOL" || !category;
}

export function communityDashboardPath(category?: OrganizationCategoryId | string): string {
  return isCommunityOrganization(category) ? "/community/dashboard" : "/school/dashboard";
}
