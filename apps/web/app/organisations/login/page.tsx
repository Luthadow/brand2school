import type { Metadata } from "next";
import Link from "next/link";
import { OrganisationCategoryPicker, parseCategorySearchParam } from "../../../components/organisations/OrganisationCategoryPicker";
import { OrganisationLoginForm } from "../../../components/organisations/OrganisationLoginForm";
import { getOrganizationCategory } from "../../../lib/organizationCategories";

export const metadata: Metadata = {
  title: "Organisation Login — Brand2School",
  description: "Sign in to your Brand2School organisation dashboard."
};

export default function OrganisationLoginPage({
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
        <p className="ds-eyebrow">{category.portalEyebrow}</p>
        <h1 className="reg-title">{category.loginTitle}</h1>
        <p className="reg-intro">{category.loginIntro}</p>
        <OrganisationCategoryPicker active={categoryId} basePath="/organisations/register" mode="register" />
        <p className="reg-hint" style={{ marginBottom: "1rem" }}>
          Registering a new organisation? Choose your type above. Existing accounts sign in below.
        </p>
        <OrganisationLoginForm categoryId={categoryId} />
      </div>
    </main>
  );
}
