"use client";

import Link from "next/link";
import type { Route } from "next";
import {
  ORGANIZATION_CATEGORY_LIST,
  categoryToSearchParam,
  type OrganizationCategoryId
} from "../../lib/organizationCategories";

export function OrganisationCategoryPicker({
  active,
  basePath
}: {
  active: OrganizationCategoryId;
  basePath: "/organisations/login" | "/organisations/register";
}): JSX.Element {
  return (
    <div className="org-category-picker" role="tablist" aria-label="Organisation type">
      {ORGANIZATION_CATEGORY_LIST.map((category) => {
        const selected = category.id === active;
        const href = `${basePath}?category=${categoryToSearchParam(category.id)}` as Route;
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
