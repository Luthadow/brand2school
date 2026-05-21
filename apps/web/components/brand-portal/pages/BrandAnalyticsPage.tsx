"use client";

import { BrandAnalyticsDashboard } from "../../analytics/BrandAnalyticsDashboard";
import { useBrandPortal } from "../BrandPortalContext";
import { BrandPageHeader } from "../BrandPageHeader";

export function BrandAnalyticsPage(): JSX.Element {
  const { analytics } = useBrandPortal();

  return (
    <div className="bp-page bp-page--flush">
      <BrandPageHeader
        eyebrow="Campaign Analytics"
        title="Deep analytics"
        description="Submissions per day, province performance, growth trends, and conversion intelligence."
      />
      <BrandAnalyticsDashboard initialData={analytics} embedded />
    </div>
  );
}
