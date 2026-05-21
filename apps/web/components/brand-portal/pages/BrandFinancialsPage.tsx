"use client";

import { useBrandPortal } from "../BrandPortalContext";
import { BrandPageHeader } from "../BrandPageHeader";
import { formatZar } from "../../../lib/brandPortal";
import { PREMIUM_POSITIONING } from "../../../lib/territorialPackages";

export function BrandFinancialsPage(): JSX.Element {
  const { financials } = useBrandPortal();
  const platformZar = financials.platformOperationalZar ?? 0;
  const poolCommitted = financials.transformationPoolCommittedZar ?? financials.fundsAllocatedZar;
  const poolUsed = financials.transformationPoolUsedZar ?? financials.fundsUsedZar;
  const usedPct =
    poolCommitted > 0 ? Math.round((poolUsed / poolCommitted) * 100) : poolUsed > 0 ? 100 : 0;

  return (
    <div className="bp-page">
      <BrandPageHeader
        eyebrow="Financial Transparency"
        title="Platform operations & transformation funding"
        description={`${PREMIUM_POSITIONING.subscriptionPositioning} Operational subscriptions and transformation pools are tracked separately.`}
      />

      <div className="bp-stat-grid">
        <article className="bp-stat-card bp-stat-card--wide">
          <strong>{formatZar(platformZar)}</strong>
          <span>Platform &amp; subscription (verified)</span>
        </article>
        <article className="bp-stat-card bp-stat-card--wide">
          <strong>{formatZar(poolCommitted)}</strong>
          <span>Transformation pool committed</span>
        </article>
        <article className="bp-stat-card bp-stat-card--wide">
          <strong>{formatZar(poolUsed)}</strong>
          <span>Transformation pool deployed ({usedPct}%)</span>
        </article>
        <article className="bp-stat-card bp-stat-card--wide">
          <strong>{formatZar(Math.max(0, poolCommitted - poolUsed))}</strong>
          <span>Remaining pool allocation</span>
        </article>
      </div>

      {poolCommitted > 0 ? (
        <div className="bp-progress bp-progress--lg">
          <span style={{ width: `${Math.min(100, usedPct)}%` }} />
        </div>
      ) : null}

      <p className="bp-muted" style={{ margin: "1rem 0" }}>
        Transformation contribution pools must never fund operational overhead. Platform subscriptions
        fund technology, governance, analytics, and support only.
      </p>

      {financials.projects.length > 0 ? (
        <div className="bp-table-wrap">
          <table className="bp-table">
            <thead>
              <tr>
                <th>Project</th>
                <th>Budget</th>
                <th>Spent</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {financials.projects.map((p) => (
                <tr key={p.name}>
                  <td>{p.name}</td>
                  <td>{formatZar(p.budgetZar)}</td>
                  <td>{formatZar(p.spentZar)}</td>
                  <td>{p.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="bp-muted">
          No transformation pool projects configured yet. Optional pools can be added at launch or later.
        </p>
      )}
    </div>
  );
}
