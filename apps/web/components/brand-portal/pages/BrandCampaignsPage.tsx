"use client";

import { useBrandPortal } from "../BrandPortalContext";
import { BrandPageHeader } from "../BrandPageHeader";
import { campaignStatusLabel } from "../../../lib/brandPortal";
import { CONTACT, mailto } from "../../../lib/contact";
import { formatCount } from "../../../lib/formatCount";
import { CodeBatchUploadPanel } from "../CodeBatchUploadPanel";

export function BrandCampaignsPage(): JSX.Element {
  const { campaigns } = useBrandPortal();

  return (
    <div className="bp-page">
      <BrandPageHeader
        eyebrow="Campaign Management"
        title="Campaigns"
        description="Create, monitor, and analyse participation campaigns across South Africa."
      />
      <div className="bp-table-wrap">
        <table className="bp-table">
          <thead>
            <tr>
              <th>Campaign</th>
              <th>Status</th>
              <th>Target</th>
              <th>Verified</th>
              <th>Provinces</th>
              <th>Infrastructure</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((c) => (
              <tr key={c.id}>
                <td>
                  <strong>{c.name}</strong>
                  <span className="bp-muted">
                    {new Date(c.startsAt).toLocaleDateString("en-ZA")} –{" "}
                    {new Date(c.endsAt).toLocaleDateString("en-ZA")}
                  </span>
                </td>
                <td>
                  <span className={`bp-pill bp-pill--${c.status}`}>{campaignStatusLabel(c.status)}</span>
                </td>
                <td>{formatCount(c.targetSubmissions)}</td>
                <td>{formatCount(c.validSubmissions)}</td>
                <td>{c.provinces.join(", ") || "National"}</td>
                <td>{c.infrastructureGoal ?? c.category ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <CodeBatchUploadPanel
        campaigns={campaigns.map((c) => ({ id: c.id, name: c.name }))}
      />

      <article className="bp-panel bp-panel--cta">
        <h2>Create a new campaign</h2>
        <p>
          Example: &ldquo;Buy any 2L drink and support school libraries.&rdquo; Define provinces, products,
          school categories, infrastructure targets, and submission goals.
        </p>
        <p className="bp-muted">
          Campaign creation API is available — email{" "}
          <a href={mailto(CONTACT.brands)}>{CONTACT.brands}</a> to enable self-service.
        </p>
      </article>
    </div>
  );
}


