"use client";

import { CheckCircle2, PauseCircle } from "lucide-react";
import type { CampaignMetric } from "../../lib/analytics";
import { formatCount } from "../../lib/formatCount";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}

export function CampaignMetricsTable({
  campaigns,
  selectedId,
  onSelect
}: {
  campaigns: CampaignMetric[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}): JSX.Element {
  return (
    <div className="ba-table-wrap">
      <table className="ba-table">
        <thead>
          <tr>
            <th>Campaign</th>
            <th>Brand</th>
            <th>Valid</th>
            <th>Schools</th>
            <th>Participations</th>
            <th>Code use</th>
            <th>Period</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {campaigns.map((c) => (
            <tr
              key={c.id}
              className={selectedId === c.id ? "ba-table-row--active" : undefined}
              onClick={() => onSelect(selectedId === c.id ? null : c.id)}
            >
              <td>
                <strong>{c.name}</strong>
              </td>
              <td>{c.brandName}</td>
              <td>{formatCount(c.validSubmissions)}</td>
              <td>{c.schoolsReached}</td>
              <td>{formatCount(c.learnersReached)}</td>
              <td>{c.codeUtilization}%</td>
              <td className="ba-table-dates">
                {formatDate(c.startsAt)} – {formatDate(c.endsAt)}
              </td>
              <td>
                <span className={`ba-status ${c.isActive ? "ba-status--active" : "ba-status--done"}`}>
                  {c.isActive ? <CheckCircle2 size={14} /> : <PauseCircle size={14} />}
                  {c.isActive ? "Active" : "Completed"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
