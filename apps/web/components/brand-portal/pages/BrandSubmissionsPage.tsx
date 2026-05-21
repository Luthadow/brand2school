"use client";

import { IMPACT_STAGES } from "../../../lib/brandPortal";
import { useBrandPortal } from "../BrandPortalContext";
import { BrandPageHeader } from "../BrandPageHeader";

export function BrandSubmissionsPage(): JSX.Element {
  const { impactPipeline, analytics } = useBrandPortal();

  return (
    <div className="bp-page">
      <BrandPageHeader
        eyebrow="Verified Impact Tracking"
        title="Submissions lifecycle"
        description="Every code moves from submission to completed infrastructure — with audit trails brands can trust."
      />
      <div className="bp-lifecycle-bar">
        {IMPACT_STAGES.map((s) => (
          <span key={s.key}>{s.label}</span>
        ))}
      </div>
      <div className="bp-table-wrap">
        <table className="bp-table">
          <thead>
            <tr>
              <th>School</th>
              <th>Code</th>
              <th>Campaign</th>
              <th>Stage</th>
              <th>Province</th>
              <th>Updated</th>
            </tr>
          </thead>
          <tbody>
            {impactPipeline.map((row) => (
              <tr key={row.id}>
                <td>{row.schoolName}</td>
                <td>
                  <code>{row.codeValue}</code>
                </td>
                <td>{row.campaignName}</td>
                <td>
                  <span className="bp-pill bp-pill--active">{row.stage}</span>
                </td>
                <td>{row.province}</td>
                <td>{new Date(row.updatedAt).toLocaleString("en-ZA")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <article className="bp-panel">
        <h2>Fraud protection</h2>
        <p>{analytics.trust.protections.join(" · ")}</p>
        <p className="bp-muted">
          {analytics.trust.fraudAttemptsBlocked.toLocaleString("en-ZA")} fraud attempts blocked ·{" "}
          {analytics.trust.auditEventsLogged.toLocaleString("en-ZA")} audit events
        </p>
      </article>
    </div>
  );
}


