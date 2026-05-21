"use client";

import { useSchoolPortal } from "../SchoolPortalContext";
import { formatCount } from "../../../lib/formatCount";

export function SchoolProfilePage(): JSX.Element {
  const { school, overview, gamification, needs } = useSchoolPortal();

  return (
    <div className="sp-page">
      <header className="sp-page-head">
        <p className="ds-eyebrow">School profile</p>
        <h1>{school.name}</h1>
        <p className="sp-muted">Your identity in the national school needs database.</p>
      </header>
      <dl className="sp-dl">
        <dt>Principal</dt>
        <dd>{school.principalName}</dd>
        <dt>EMIS</dt>
        <dd>{school.emisNumber}</dd>
        <dt>School code</dt>
        <dd>{school.schoolCode}</dd>
        <dt>Learners</dt>
        <dd>{formatCount(school.learnerCount)}</dd>
        <dt>Location</dt>
        <dd>
          {school.district}, {school.province}
        </dd>
        <dt>Status</dt>
        <dd>{school.verificationStatus}</dd>
      </dl>
      <section className="sp-section">
        <h2>Impact badges</h2>
        <div className="sp-badges">
          {gamification.badges.map((b) => (
            <span key={b} className="sp-chip">
              {b}
            </span>
          ))}
        </div>
      </section>
      <section className="sp-section">
        <h2>Impact summary</h2>
        <p className="sp-muted">
          {needs.length} active needs · {overview.projectsCompleted} completed projects ·{" "}
          {formatCount(overview.verifiedSubmissions)} verified submissions
        </p>
      </section>
    </div>
  );
}
