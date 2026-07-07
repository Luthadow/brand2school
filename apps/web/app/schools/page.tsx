import Link from "next/link";
import type { Route } from "next";
import { fetchPublicSchools } from "../../lib/platformPublic";
import { formatCount } from "../../lib/formatCount";
import { formatZar } from "../../lib/schoolPortal";

export const metadata = {
  title: "School Marketplace — Brand2School",
  description: "Browse verified South African schools and their infrastructure needs."
};

export default async function SchoolsMarketplacePage(): Promise<JSX.Element> {
  const schools = await fetchPublicSchools();

  return (
    <div className="lp pp-page ps-marketplace-page">
      <section className="lp-section lp-section-light">
        <div className="lp-container">
          <p className="ds-eyebrow">School marketplace</p>
          <h1 className="ds-section-title ds-section-title--left">Verified schools &amp; real needs</h1>
          <p className="lp-problem-text">
            Living school profiles with verified participation, priority infrastructure needs, and transparent
            progress — built for brand sponsors and community trust.
          </p>
          {schools.length === 0 ? (
            <p className="lp-live-empty" style={{ marginTop: "2rem" }}>
              Public school profiles appear when schools complete verification and reach 25% profile completion.
            </p>
          ) : (
            <div className="ps-directory-grid" style={{ marginTop: "2rem" }}>
              {schools.map((school) => (
                <Link
                  key={school.schoolCode}
                  href={`/schools/${school.schoolCode}` as Route}
                  className="card ps-directory-card"
                >
                  {school.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={school.logoUrl} alt="" className="ps-directory-logo" />
                  ) : (
                    <div className="ps-directory-logo-placeholder">{school.name.slice(0, 2).toUpperCase()}</div>
                  )}
                  <h2>{school.name}</h2>
                  <p className="ps-muted">
                    {school.district}, {school.province}
                    {school.quintile ? ` · Q${school.quintile}` : ""}
                  </p>
                  <p className="ps-directory-stats">
                    {formatCount(school.learnerCount)} learners · {formatCount(school.verifiedSubmissions)} verified
                    {school.nationalRank ? ` · #${school.nationalRank} this month` : ""}
                  </p>
                  {school.priorityNeedTitle ? (
                    <p className="ps-directory-need">
                      <strong>{school.priorityNeedTitle}</strong>
                      {school.priorityNeedCostZar ? ` · ${formatZar(school.priorityNeedCostZar)}` : ""}
                    </p>
                  ) : null}
                  {school.openNeedsCount > 0 ? (
                    <span className="ps-directory-badge">{school.openNeedsCount} open needs</span>
                  ) : null}
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
