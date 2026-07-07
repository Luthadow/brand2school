import Link from "next/link";
import type { Route } from "next";
import { fetchPublicSchools } from "../../lib/platformPublic";
import { formatCount } from "../../lib/formatCount";

export const metadata = {
  title: "Community Hub — Brand2School",
  description: "The third ecosystem — parents, NGOs, clubs, and civic groups driving verified school participation."
};

export default async function CommunityHubLandingPage(): Promise<JSX.Element> {
  const schools = await fetchPublicSchools({ limit: 6 });

  return (
    <div className="lp pp-page sp-community-landing">
      <section className="lp-section lp-section-light">
        <div className="lp-container">
          <p className="ds-eyebrow">Third ecosystem</p>
          <h1 className="ds-section-title ds-section-title--left">Community Hub</h1>
          <p className="lp-problem-text">
            Brands win with ROI. Schools win with resources. Communities win with belonging and recognition.
            Brand2School connects all three through verified participation — not handouts.
          </p>
          <div className="sp-community-landing-actions">
            <Link href={"/organisations/login?category=community" as Route} className="ds-btn ds-btn-primary">
              Community Hub sign in
            </Link>
            <Link href={"/schools" as Route} className="ds-btn ds-btn-secondary">
              Browse school marketplace
            </Link>
            <Link href={"/organisations/register?category=community" as Route} className="ds-btn ds-btn-secondary">
              Register organisation
            </Link>
          </div>
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-container">
          <h2 className="ds-section-title ds-section-title--left">How communities participate</h2>
          <div className="sp-community-landing-grid">
            <article className="card">
              <h3>Parents &amp; families</h3>
              <p>Submit product codes via WhatsApp — every verified code counts toward school infrastructure.</p>
            </article>
            <article className="card">
              <h3>SGBs &amp; civic groups</h3>
              <p>Coordinate ward-level participation and track community champions on the hub dashboard.</p>
            </article>
            <article className="card">
              <h3>NGOs &amp; faith partners</h3>
              <p>Register as verified organisations and link to schools in your district.</p>
            </article>
          </div>
        </div>
      </section>

      {schools.length > 0 ? (
        <section className="lp-section lp-section-light">
          <div className="lp-container">
            <h2 className="ds-section-title ds-section-title--left">Schools with active communities</h2>
            <ul className="sp-community-landing-schools">
              {schools.map((s) => (
                <li key={s.schoolCode}>
                  <Link href={s.profileUrl as Route}>
                    <strong>{s.name}</strong>
                    <span>
                      {s.district} · {formatCount(s.verifiedSubmissions)} verified
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}
    </div>
  );
}
