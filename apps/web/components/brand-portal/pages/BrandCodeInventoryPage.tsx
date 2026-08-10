"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Boxes,
  CheckCircle2,
  Clock,
  Download,
  Package,
  RefreshCw,
  Shield,
  ShieldCheck,
  Sparkles,
  Upload
} from "lucide-react";
import { formatCount } from "../../../lib/formatCount";
import type { BrandCodeInventoryDashboard } from "../../../lib/brandCodeInventory";
import { BATCH_STATUS_LABELS, CODE_STATUS_META } from "../../../lib/brandCodeInventory";
import { useBrandPortal } from "../BrandPortalContext";
import { BrandPageHeader } from "../BrandPageHeader";
import { CodeBatchGeneratePanel } from "../CodeBatchGeneratePanel";
import { CodeBatchUploadPanel } from "../CodeBatchUploadPanel";

function emptyDashboard(): BrandCodeInventoryDashboard {
  return {
    summary: {
      totalCodes: 0,
      unused: 0,
      pending: 0,
      used: 0,
      duplicate: 0,
      invalid: 0,
      flagged: 0,
      expired: 0,
      invalidated: 0,
      blocked: 0,
      utilizationPercent: 0,
      batchesCount: 0,
      attemptDuplicates: 0,
      attemptFraudBlocked: 0
    },
    batches: [],
    attemptOutcomes: [],
    generatedAt: new Date().toISOString()
  };
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

export function BrandCodeInventoryPage(): JSX.Element {
  const { campaigns, codeInventory: initialSummary } = useBrandPortal();
  const [data, setData] = useState<BrandCodeInventoryDashboard>(() => ({
    ...emptyDashboard(),
    summary: initialSummary
  }));
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [showGenerate, setShowGenerate] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const refresh = useCallback(async (campaignId: string | null): Promise<void> => {
    setLoading(true);
    try {
      const qs = campaignId ? `?campaignId=${encodeURIComponent(campaignId)}` : "";
      const res = await fetch(`/api/analytics/brand/code-inventory${qs}`, { cache: "no-store" });
      if (res.ok) setData((await res.json()) as BrandCodeInventoryDashboard);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh(null);
  }, [refresh]);

  function handleCampaignChange(id: string): void {
    const nextId = id === "all" ? null : id;
    setSelectedCampaignId(nextId);
    void refresh(nextId);
  }

  const { summary, batches, attemptOutcomes } = data;

  const statusSegments = useMemo(() => {
    const total = summary.totalCodes || 1;
    return CODE_STATUS_META.map((meta) => ({
      ...meta,
      count: summary[meta.key],
      share: Math.round((summary[meta.key] / total) * 1000) / 10
    })).filter((s) => s.count > 0);
  }, [summary]);

  const kpiCards = [
    { label: "Total codes", value: summary.totalCodes, icon: Package },
    { label: "Redeemed", value: summary.used, icon: CheckCircle2 },
    { label: "Available", value: summary.unused, icon: Boxes },
    { label: "Utilization", value: `${summary.utilizationPercent}%`, icon: Clock },
    { label: "Batches", value: summary.batchesCount, icon: Package },
    { label: "Duplicates blocked", value: summary.attemptDuplicates, icon: ShieldCheck },
    { label: "Fraud blocked", value: summary.attemptFraudBlocked, icon: Shield }
  ];

  const problemCodes = summary.expired + summary.invalid + summary.flagged + summary.blocked;

  return (
    <div className="bp-page">
      <BrandPageHeader
        eyebrow="Code Operations"
        title="Code inventory"
        description="Track every participation code — batch health, redemption rates, duplicates, and fraud blocks across campaigns."
        actions={
          <>
            <label className="bp-inv-select-wrap">
              <span>Campaign</span>
              <select
                className="bp-inv-select"
                value={selectedCampaignId ?? "all"}
                onChange={(e) => handleCampaignChange(e.target.value)}
                disabled={loading}
              >
                <option value="all">All campaigns</option>
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="bp-inv-btn"
              onClick={() => void refresh(selectedCampaignId)}
              disabled={loading}
            >
              <RefreshCw size={16} className={loading ? "ba-spin" : undefined} />
              Refresh
            </button>
            <button
              type="button"
              className="bp-inv-btn bp-inv-btn--primary"
              onClick={() => {
                setShowGenerate((v) => !v);
                if (!showGenerate) setShowUpload(false);
              }}
            >
              <Sparkles size={16} />
              {showGenerate ? "Hide generate" : "Generate codes"}
            </button>
            <button
              type="button"
              className="bp-inv-btn"
              onClick={() => {
                setShowUpload((v) => !v);
                if (!showUpload) setShowGenerate(false);
              }}
            >
              <Upload size={16} />
              {showUpload ? "Hide upload" : "Upload CSV"}
            </button>
          </>
        }
      />

      <section className="bp-inv-kpi-strip" aria-label="Inventory summary">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <article key={card.label} className="bp-inv-kpi">
              <Icon size={18} />
              <strong>{typeof card.value === "number" ? formatCount(card.value) : card.value}</strong>
              <span>{card.label}</span>
            </article>
          );
        })}
      </section>

      {showGenerate ? (
        <section className="bp-section">
          <CodeBatchGeneratePanel
            campaigns={campaigns.map((c) => ({ id: c.id, name: c.name }))}
            defaultCampaignId={selectedCampaignId}
            onGenerated={() => void refresh(selectedCampaignId)}
          />
        </section>
      ) : null}

      {showUpload ? (
        <section className="bp-section">
          <CodeBatchUploadPanel campaigns={campaigns.map((c) => ({ id: c.id, name: c.name }))} />
        </section>
      ) : null}

      <section className="bp-inv-grid">
        <article className="bp-panel bp-inv-panel">
          <h2>Status distribution</h2>
          <p className="bp-muted">{formatCount(summary.totalCodes)} codes in inventory</p>
          {statusSegments.length === 0 ? (
            <p className="bp-empty-note">Upload a code batch to see status breakdown.</p>
          ) : (
            <>
              <div className="bp-inv-stack-bar" aria-label="Code status distribution">
                {statusSegments.map((seg) => (
                  <div
                    key={seg.key}
                    className="bp-inv-stack-segment"
                    style={{ flexGrow: seg.count, background: seg.color }}
                    title={`${seg.label}: ${formatCount(seg.count)}`}
                  />
                ))}
              </div>
              <ul className="bp-inv-legend">
                {statusSegments.map((seg) => (
                  <li key={seg.key}>
                    <span className="bp-inv-legend-dot" style={{ background: seg.color }} />
                    <span>{seg.label}</span>
                    <strong>{formatCount(seg.count)}</strong>
                    <span className="bp-inv-legend-pct">{seg.share}%</span>
                  </li>
                ))}
              </ul>
            </>
          )}
          {problemCodes > 0 ? (
            <p className="bp-inv-alert">
              <AlertTriangle size={14} />
              {formatCount(problemCodes)} codes need attention (expired, invalid, flagged, or blocked)
            </p>
          ) : null}
        </article>

        <article className="bp-panel bp-inv-panel">
          <h2>Submission attempts</h2>
          <p className="bp-muted">Duplicates and fraud blocks from participation attempts</p>
          {attemptOutcomes.length === 0 ? (
            <p className="bp-empty-note">Attempt data appears once schools start submitting codes.</p>
          ) : (
            <ul className="bp-inv-outcomes">
              {attemptOutcomes.map((row) => (
                <li key={row.outcome}>
                  <span>{row.label}</span>
                  <strong>{formatCount(row.count)}</strong>
                </li>
              ))}
            </ul>
          )}
          <div className="bp-inv-attempt-totals">
            <div>
              <span>Duplicates</span>
              <strong>{formatCount(summary.attemptDuplicates)}</strong>
            </div>
            <div>
              <span>Fraud blocked</span>
              <strong>{formatCount(summary.attemptFraudBlocked)}</strong>
            </div>
          </div>
        </article>

        <article className="bp-panel bp-inv-panel bp-inv-panel--wide">
          <div className="bp-inv-table-head">
            <h2>Batch inventory</h2>
            <span className="bp-muted">
              Updated {new Date(data.generatedAt).toLocaleString("en-ZA")}
            </span>
          </div>
          {batches.length === 0 ? (
            <p className="bp-empty-note">
              No batches yet.{" "}
              <button type="button" className="bp-inv-link-btn" onClick={() => setShowGenerate(true)}>
                Generate codes
              </button>{" "}
              or{" "}
              <button type="button" className="bp-inv-link-btn" onClick={() => setShowUpload(true)}>
                upload a CSV
              </button>
              .
            </p>
          ) : (
            <div className="bp-table-wrap">
              <table className="bp-table bp-inv-table">
                <thead>
                  <tr>
                    <th>Batch</th>
                    <th>Campaign</th>
                    <th>Status</th>
                    <th>Qty</th>
                    <th>Used</th>
                    <th>Support generated</th>
                    <th>Downloads</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {batches.map((batch) => {
                    const status = batch.status ?? "AVAILABLE";
                    return (
                      <tr key={batch.id}>
                        <td>
                          <strong>{batch.batchName}</strong>
                          <span className="bp-muted">
                            {batch.batchCode} · {batch.codeVersion}
                          </span>
                        </td>
                        <td>{batch.campaignName}</td>
                        <td>{BATCH_STATUS_LABELS[status] ?? status}</td>
                        <td>{formatCount(batch.totalCodes)}</td>
                        <td>{formatCount(batch.used)}</td>
                        <td>
                          R
                          {(batch.schoolSupportGeneratedZar ?? 0).toLocaleString("en-ZA", {
                            maximumFractionDigits: 2
                          })}
                        </td>
                        <td>{formatCount(batch.downloadCount ?? 0)}</td>
                        <td>
                          <button
                            type="button"
                            className="bp-inv-btn"
                            disabled={downloadingId === batch.id || batch.totalCodes === 0}
                            onClick={() => {
                              setDownloadingId(batch.id);
                              window.location.href = `/api/campaigns/${batch.campaignId}/code-batches/${batch.id}/download`;
                              window.setTimeout(() => {
                                setDownloadingId(null);
                                void refresh(selectedCampaignId);
                              }, 1500);
                            }}
                          >
                            <Download size={14} />
                            {downloadingId === batch.id ? "…" : "CSV"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </article>
      </section>
    </div>
  );
}
