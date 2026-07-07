"use client";

import Link from "next/link";
import type { Route } from "next";
import { Plus } from "lucide-react";
import { useBrandPortal } from "../BrandPortalContext";
import { BrandPageHeader } from "../BrandPageHeader";
import { campaignStatusLabel } from "../../../lib/brandPortal";
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
        actions={
          <Link href={"/brand/dashboard/campaigns/new" as Route} className="bp-inv-btn bp-inv-btn--primary">
            <Plus size={16} />
            Create campaign
          </Link>
        }
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
            {campaigns.length === 0 ? (
              <tr>
                <td colSpan={6} className="bp-empty-note">
                  No campaigns yet.{" "}
                  <Link href={"/brand/dashboard/campaigns/new" as Route}>Create your first campaign</Link>.
                </td>
              </tr>
            ) : (
              campaigns.map((c) => (
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
              ))
            )}
          </tbody>
        </table>
      </div>
      {campaigns.length > 0 ? (
        <CodeBatchUploadPanel campaigns={campaigns.map((c) => ({ id: c.id, name: c.name }))} />
      ) : null}
    </div>
  );
}
