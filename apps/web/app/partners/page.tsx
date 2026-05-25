import Link from "next/link";
import type { Route } from "next";
import { withWebBrandLogoUrls } from "../../lib/brandLogoSrc";
import { fetchPartnerDirectory } from "../../lib/platformPublic";
import { formatCount } from "../../lib/formatCount";

export default async function PartnersDirectoryPage(): Promise<JSX.Element> {
  const partners = withWebBrandLogoUrls(await fetchPartnerDirectory());

  return (
    <div className="lp pp-page">
      <section className="lp-section lp-section-light">
        <div className="lp-container">
          <p className="ds-eyebrow">Verified partners</p>
          <h1 className="ds-section-title ds-section-title--left">Education impact partners</h1>
          <p className="lp-problem-text">
            Brands listed here are ACTIVE on Brand2School with admin-approved public profiles. Logos and metrics
            reflect verified participation only.
          </p>
          {partners.length === 0 ? (
            <p className="lp-live-empty" style={{ marginTop: "2rem" }}>
              Partner profiles will appear as brands complete verification and are approved for public display.
            </p>
          ) : (
            <div className="pp-directory-grid" style={{ marginTop: "2rem" }}>
              {partners.map((partner) => (
                <Link key={partner.slug} href={`/brand/${partner.slug}` as Route} className="card pp-directory-card">
                  {partner.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={partner.logoUrl}
                      alt={`${partner.name} logo`}
                      width={140}
                      height={60}
                      className="lp-trust-logo-img"
                      style={{ objectFit: "contain", maxHeight: 60 }}
                    />
                  ) : (
                    <strong>{partner.name}</strong>
                  )}
                  <h2 style={{ margin: "0.75rem 0 0.25rem", fontSize: "1.1rem" }}>{partner.name}</h2>
                  {partner.description ? <p style={{ color: "#4a5f7a", fontSize: "0.9rem" }}>{partner.description}</p> : null}
                  <p style={{ marginTop: "0.75rem", fontSize: "0.85rem", color: "#003b8e" }}>
                    {formatCount(partner.validSubmissions)} verified · {partner.schoolsReached} schools ·{" "}
                    {partner.activeCampaigns} campaigns
                  </p>
                  {partner.featuredOnHome ? (
                    <span className="pp-verified-badge">Featured partner</span>
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
