"use client";

import Link from "next/link";
import type { Route } from "next";
import {
  ORGANIZATION_CATEGORY_LIST,
  organizationCategoryFromParam,
  type OrganizationCategoryId
} from "../../lib/organizationCategories";

export function OrganisationCategoryPicker({
  active,
  basePath,
  mode
}: {
  active: OrganizationCategoryId;
  basePath: "/organisations/login" | "/organisations/register";
  mode: "login" | "register";
}): JSX.Element {
  return (
    <div className="org-category-picker" role="tablist" aria-label="Organisation type">
      {ORGANIZATION_CATEGORY_LIST.map((category) => {
        const selected = category.id === active;
        const href =
          mode === "register"
            ? (`${basePath}?category=${category.id.toLowerCase().replace("_", "-")}` as Route)
            : basePath;
        return (
          <Link
            key={category.id}
            href={href}
            className={`org-category-pill${selected ? " org-category-pill--active" : ""}`}
            aria-current={selected ? "page" : undefined}
            title={category.description}
          >
            {category.shortLabel}
          </Link>
        );
      })}
    </div>
  );
}

export function parseCategorySearchParam(value: string | null | undefined): OrganizationCategoryId {
  return organizationCategoryFromParam(value?.replace("-", "_"));
}
