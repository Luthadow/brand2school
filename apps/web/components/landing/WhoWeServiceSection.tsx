import Link from "next/link";
import type { Route } from "next";
import { Building2, Church, HandHeart, School } from "lucide-react";
import {
  ORGANIZATION_CATEGORY_LIST,
  categoryToSearchParam,
  type OrganizationCategoryId
} from "../../lib/organizationCategories";
import { FadeIn } from "./FadeIn";
import { SectionHeader } from "./SectionHeader";

const CATEGORY_ICONS: Record<OrganizationCategoryId, typeof School> = {
  SCHOOL: School,
  NGO_NPO: HandHeart,
  COMMUNITY: Building2,
  FAITH: Church
};

type WhoWeServiceSectionProps = {
  variant?: "section" | "panel";
  showRegisterLinks?: boolean;
};

export function WhoWeServiceSection({
  variant = "section",
  showRegisterLinks = true
}: WhoWeServiceSectionProps): JSX.Element {
  const content = (
    <div className="lp-who-we-service-grid">
      {ORGANIZATION_CATEGORY_LIST.map((category, index) => {
        const Icon = CATEGORY_ICONS[category.id];
        const registerHref = `/organisations/register?category=${categoryToSearchParam(category.id)}` as Route;
        return (
          <FadeIn key={category.id} delay={index * 0.06}>
            <article className="lp-who-we-service-card">
              <div className="lp-who-we-service-card__icon" aria-hidden="true">
                <Icon size={24} strokeWidth={1.75} />
              </div>
              <h3>{category.label}</h3>
              <p>{category.description}</p>
              <ul className="lp-who-we-service-types">
                {category.centreTypes.map((centre) => (
                  <li key={centre.id}>{centre.label}</li>
                ))}
              </ul>
              {showRegisterLinks ? (
                <Link href={registerHref} className="lp-who-we-service-link">
                  Register as {category.shortLabel.toLowerCase()} →
                </Link>
              ) : null}
            </article>
          </FadeIn>
        );
      })}
    </div>
  );

  if (variant === "panel") {
    return (
      <section className="impact-section lp-who-we-service lp-who-we-service--panel" aria-labelledby="who-we-service-title">
        <h2 id="who-we-service-title" className="impact-section-title">
          Who we service
        </h2>
        <p className="impact-section-sub">
          Verified schools, NGOs, community structures, and faith-based partners — one participation platform for
          education impact across South Africa.
        </p>
        {content}
        <p className="lp-who-we-service-foot">
          <Link href={"/organisations/register" as Route}>Browse all organisation types</Link>
          {" · "}
          <Link href={"/lookup" as Route}>Check if you are already registered</Link>
        </p>
      </section>
    );
  }

  return (
    <section id="who-we-service" className="lp-section lp-who-we-service" aria-labelledby="who-we-service-heading">
      <div className="lp-container">
        <FadeIn>
          <SectionHeader
            eyebrow="Verified organisations"
            title="Who We Service"
            subtitle="Brand2School is built for every verified organisation driving education outcomes — not only traditional schools."
          />
        </FadeIn>
        {content}
      </div>
    </section>
  );
}
