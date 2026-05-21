"use client";

import { useBrandPortal } from "../BrandPortalContext";
import { BrandPageHeader } from "../BrandPageHeader";
import { ProvinceHeatmap } from "../../analytics/ProvinceHeatmap";
import { formatCount } from "../../../lib/formatCount";

export function BrandMapPage(): JSX.Element {
  const { analytics, overview } = useBrandPortal();

  return (
    <div className="bp-page">
      <BrandPageHeader
        eyebrow="Live Map of Impact"
        title="National impact map"
        description="Schools supported, active campaigns, infrastructure projects, and participation density across South Africa."
      />
      <ProvinceHeatmap provinces={analytics.provinces} />
      <div className="bp-stat-grid bp-stat-grid--compact">
        <article className="bp-stat-card">
          <strong>{overview.provincesReached}</strong>
          <span>Provinces with activity</span>
        </article>
        <article className="bp-stat-card">
          <strong>{formatCount(overview.schoolsSupported)}</strong>
          <span>Schools on map</span>
        </article>
        <article className="bp-stat-card">
          <strong>{formatCount(overview.infrastructureProjectsFunded)}</strong>
          <span>Infrastructure projects</span>
        </article>
      </div>
    </div>
  );
}
