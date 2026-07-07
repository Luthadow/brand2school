"use client";

import Link from "next/link";
import type { Route } from "next";
import { formatCount } from "../../../lib/formatCount";
import { useCommunityPortal } from "../CommunityPortalContext";

export function CommunityLinkedSchoolsPage(): JSX.Element {
  const { organization, linkedSchools } = useCommunityPortal();

  return (
    <div className="cp-page">
      <header className="cp-page-head">
        <p className="ds-eyebrow">Mobilisation</p>
        <h1>Linked schools</h1>
        <p className="cp-muted">
          Verified schools in {organization.district} — mobilise your community toward their infrastructure needs.
        </p>
      </header>

      {linkedSchools.length > 0 ? (
        <div className="cp-schools-grid">
          {linkedSchools.map((school) => (
            <article key={school.id} className="card cp-school-card">
              <div className="cp-school-card-head">
                <div>
                  <h3>{school.name}</h3>
                  <p className="cp-muted">{school.district}</p>
                </div>
                {school.nationalRank ? (
                  <span className="cp-chip">#{school.nationalRank} nationally</span>
                ) : null}
              </div>
              <dl className="cp-school-dl">
                <dt>Verified participations</dt>
                <dd>{formatCount(school.verifiedSubmissions)}</dd>
                {school.priorityNeedTitle ? (
                  <>
                    <dt>Priority need</dt>
                    <dd>{school.priorityNeedTitle}</dd>
                  </>
                ) : null}
              </dl>
              {school.profileUrl ? (
                <Link href={school.profileUrl as Route} className="ds-btn ds-btn-secondary ds-btn-sm">
                  View public profile →
                </Link>
              ) : null}
            </article>
          ))}
        </div>
      ) : (
        <p className="cp-muted">
          No verified schools in your district yet — share participation codes as schools join Brand2School.
        </p>
      )}

      <p className="cp-muted cp-schools-foot">
        <Link href={"/schools" as Route}>Browse the national school marketplace →</Link>
      </p>
    </div>
  );
}
