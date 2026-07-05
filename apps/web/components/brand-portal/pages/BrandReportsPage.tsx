"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { useBrandPortal } from "../BrandPortalContext";
import { BrandPageHeader } from "../BrandPageHeader";
import { formatCount } from "../../../lib/formatCount";

export function BrandReportsPage(): JSX.Element {
  const { analytics, overview } = useBrandPortal();
  const [exporting, setExporting] = useState(false);

  async function exportPdf(): Promise<void> {
    setExporting(true);
    try {
      const res = await fetch("/api/analytics/brand/reports/reports/pdf");
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "brand2school-esg-report.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  const reports = [
    "PDF impact report",
    "ESG / sustainability report",
    "CSI compliance summary",
    "Campaign participation analytics",
    "Audit & verification trail"
  ];

  return (
    <div className="bp-page">
      <BrandPageHeader
        eyebrow="Reporting & ESG"
        title="Board-ready reports"
        description="Download evidence packs that help corporate South Africa justify and renew CSI budgets."
        actions={
          <button type="button" className="ds-btn ds-btn-primary" onClick={() => void exportPdf()} disabled={exporting}>
            <Download size={18} />
            {exporting ? "Generating…" : "Download ESG PDF"}
          </button>
        }
      />
      <div className="bp-report-grid">
        {reports.map((title) => (
          <article key={title} className="bp-panel">
            <h3>{title}</h3>
            <ul className="bp-metrics-list">
              <li>{formatCount(overview.estimatedLivesImpacted)} learners impacted</li>
              <li>{overview.provincesReached} provinces reached</li>
              <li>{formatCount(overview.verifiedSubmissions)} verified submissions</li>
              <li>{analytics.summary.engagementRate}% engagement rate</li>
            </ul>
            <button type="button" className="ds-btn ds-btn-secondary" onClick={() => void exportPdf()}>
              Export
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}
