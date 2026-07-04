import type { Metadata } from "next";
import Link from "next/link";
import { OrganisationCategoryPicker, parseCategorySearchParam } from "../../../components/organisations/OrganisationCategoryPicker";
import { OrganisationRegisterForm } from "../../../components/organisations/OrganisationRegisterForm";
import { getOrganizationCategory } from "../../../lib/organizationCategories";

export const metadata: Metadata = {
  title: "Register Organisation — Brand2School",
  description: "Register your school or organisation on Brand2School."
};

export default function OrganisationRegisterPage({
  searchParams
}: {
  searchParams?: { category?: string };
}): JSX.Element {
  const categoryId = parseCategorySearchParam(searchParams?.category);
  const category = getOrganizationCategory(categoryId);

  return (
    <main className="reg-page">
      <div className="reg-container">
        <Link href="/" className="reg-back">
          ← Back to home
        </Link>
        <p className="ds-eyebrow">For Organisations</p>
        <h1 className="reg-title">{category.registerTitle}</h1>
        <p className="reg-intro">{category.registerIntro}</p>
        <OrganisationCategoryPicker active={categoryId} basePath="/organisations/register" mode="register" />
        <OrganisationRegisterForm categoryId={categoryId} />
      </div>
    </main>
  );
}
