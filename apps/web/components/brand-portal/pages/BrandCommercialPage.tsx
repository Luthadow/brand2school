"use client";

import { useCallback, useEffect, useState } from "react";
import { FileCheck, FileUp, Download } from "lucide-react";
import { ProcurementPackDownload } from "../../for-brands/ProcurementPackDownload";
import { brandCsrfHeaders } from "../../../lib/brandClientFetch";
import {
  CONTRACT_PACKAGE_REQUIREMENTS,
  PREMIUM_POSITIONING,
  RECOMMENDED_PAYMENT_SCHEDULE,
  SUBSCRIPTION_LIFECYCLE
} from "../../../lib/territorialPackages";
import { BrandPageHeader } from "../BrandPageHeader";

type OnboardingPayload = {
  brand: {
    id: string;
    name: string;
    onboardingStatus: string;
    status: string;
    codePrefix: string;
  };
  subscription: {
    status: string | null;
    plan: string | null;
    activationFeePaid: boolean;
    recurringAmountZar: number | null;
    billingCycle: string;
    gracePeriodUntil: string | null;
    minimumCommitmentMonths: number;
    positioning: string;
  };
  billing: {
    invoices: Array<{
      id: string;
      invoiceNumber: string;
      invoiceType: string;
      amountZar: number;
      status: string;
      eftReference: string | null;
      issuedAt: string | null;
      verifiedAt: string | null;
      campaignName: string;
    }>;
    operationalRule: string;
  };
  agreement: {
    id: string;
    version: number;
    status: string;
    generatedPdfUrl: string | null;
    signedPdfUrl: string | null;
  } | null;
  campaigns: Array<{
    id: string;
    name: string;
    commercialStatus: string;
    isActive: boolean;
    workflowStage: string;
    workflowLabel: string;
    endsAt: string;
    expiry: { isExpired: boolean; isInGracePeriod: boolean; daysUntilEnd: number | null };
    impact: {
      committed: {
        schoolsTargeted: number;
        schoolsReached: number;
        waterPhasesCompleted: number;
        activeInfrastructureProjects: number;
      };
      delivered: {
        schoolsTargeted: number;
        schoolsReached: number;
        waterPhasesCompleted: number;
        activeInfrastructureProjects: number;
      };
    };
    activation: { checklist: Record<string, boolean>; blockers: string[] };
  }>;
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  AWAITING_AGREEMENT: "Awaiting agreement",
  AWAITING_PAYMENT: "Awaiting payment",
  AWAITING_CODES: "Awaiting codes",
  AWAITING_LAUNCH: "Awaiting launch approval",
  READY_FOR_APPROVAL: "Ready for launch approval",
  LIVE: "Live",
  PAUSED: "Paused",
  EXPIRED: "Expired",
  SUSPENDED: "Suspended",
  PENDING_REVIEW: "Pending review",
  UNDER_APPROVAL: "Under approval",
  AGREEMENT_PENDING: "Agreement pending",
  COMMERCIALLY_ACTIVE: "Commercially active"
};

function label(status: string): string {
  return STATUS_LABELS[status] ?? status.replace(/_/g, " ");
}

export function BrandCommercialPage(): JSX.Element {
  const [data, setData] = useState<OnboardingPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    const res = await fetch("/api/commercial/brand/onboarding", { cache: "no-store" });
    setLoading(false);
    if (!res.ok) {
      setMessage({ kind: "err", text: "Could not load commercial onboarding status." });
      return;
    }
    setData((await res.json()) as OnboardingPayload);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const uploadSigned = async (file: File): Promise<void> => {
    if (!data?.agreement) return;
    if (file.type !== "application/pdf") {
      setMessage({ kind: "err", text: "Please upload a PDF file." });
      return;
    }
    setUploading(true);
    setMessage(null);
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(
      `/api/commercial/brand/agreements/${data.agreement.id}/upload-signed`,
      { method: "POST", headers: brandCsrfHeaders(), body: form }
    );
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    setUploading(false);
    if (!res.ok) {
      setMessage({ kind: "err", text: body.message ?? "Upload failed." });
      return;
    }
    setMessage({
      kind: "ok",
      text: "Signed agreement uploaded. Our team will review and approve it before campaigns can go live."
    });
    void load();
  };

  if (loading) {
    return (
      <div className="bp-page">
        <p className="bp-muted">Loading commercial status…</p>
      </div>
    );
  }

  const agreement = data?.agreement;
  const canUpload =
    agreement &&
    (agreement.status === "AWAITING_SIGNATURE" || agreement.status === "GENERATED");

  return (
    <div className="bp-page">
      <BrandPageHeader
        eyebrow="Commercial governance"
        title="Participation agreement"
        description={PREMIUM_POSITIONING.tagline}
      />
      <p className="bp-muted" style={{ marginTop: "-0.5rem", marginBottom: "1rem" }}>
        All packages require the contract terms below before public launch. We are not a donation platform.
      </p>

      <article className="bp-panel" style={{ marginBottom: "1rem" }}>
        <h2>
          <Download size={20} /> Procurement pack
        </h2>
        <p className="bp-muted">
          Share with legal, finance, and ESG teams — pricing is synchronized with the live commercial catalog.
        </p>
        <ProcurementPackDownload
          variant="primary"
          label="Download partnership pack (ZIP)"
          className="bp-pack-download"
        />
      </article>

      {message ? (
        <p
          className="bp-panel"
          style={{ color: message.kind === "err" ? "#b91c1c" : "#166534", fontWeight: 600 }}
        >
          {message.text}
        </p>
      ) : null}

      {data?.subscription ? (
        <article className="bp-panel" style={{ marginBottom: "1rem" }}>
          <h2>Enterprise subscription</h2>
          <p className="bp-muted" style={{ marginBottom: "0.75rem" }}>
            {data.subscription.positioning}
          </p>
          <p>
            Plan: <strong>{data.subscription.plan ?? "Pending"}</strong>
            {" · "}
            Status: <strong>{data.subscription.status ? label(data.subscription.status) : "Not active"}</strong>
          </p>
          <p className="bp-muted">
            Activation fee: {data.subscription.activationFeePaid ? "Paid" : "Pending"}
            {data.subscription.recurringAmountZar != null
              ? ` · Recurring: R${data.subscription.recurringAmountZar.toLocaleString("en-ZA")}/${data.subscription.billingCycle.toLowerCase()}`
              : null}
            {data.subscription.gracePeriodUntil
              ? ` · Grace until ${new Date(data.subscription.gracePeriodUntil).toLocaleDateString("en-ZA")}`
              : null}
          </p>
          <p className="bp-muted" style={{ marginTop: "0.5rem" }}>
            Minimum {data.subscription.minimumCommitmentMonths}-month participation agreement recommended.
          </p>
        </article>
      ) : null}

      {data?.billing?.invoices && data.billing.invoices.length > 0 ? (
        <article className="bp-panel" style={{ marginBottom: "1rem" }}>
          <h2>Billing history</h2>
          <p className="bp-muted">{data.billing.operationalRule}</p>
          <div className="bp-table-wrap" style={{ marginTop: "0.75rem" }}>
            <table className="bp-table">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Type</th>
                  <th>Campaign</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.billing.invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td>
                      <code>{inv.invoiceNumber}</code>
                      {inv.eftReference ? (
                        <div className="bp-muted" style={{ fontSize: "0.8rem" }}>
                          Ref: {inv.eftReference}
                        </div>
                      ) : null}
                    </td>
                    <td>{inv.invoiceType.replace(/_/g, " ")}</td>
                    <td>{inv.campaignName}</td>
                    <td>R{inv.amountZar.toLocaleString("en-ZA")}</td>
                    <td>{label(inv.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      ) : null}

      <article className="bp-panel" style={{ marginBottom: "1rem" }}>
        <h2>Subscription lifecycle</h2>
        <div className="bp-table-wrap">
          <table className="bp-table">
            <thead>
              <tr>
                <th>Stage</th>
                <th>What happens</th>
              </tr>
            </thead>
            <tbody>
              {SUBSCRIPTION_LIFECYCLE.map((row) => (
                <tr key={row.stage}>
                  <td>{row.stage}</td>
                  <td>{row.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      <div className="bp-two-col">
        <article className="bp-panel">
          <h2>
            <FileCheck size={20} /> Brand status
          </h2>
          {data ? (
            <>
              <p>
                <strong>{data.brand.name}</strong> · prefix <code>{data.brand.codePrefix}</code>
              </p>
              <p className="bp-muted">Onboarding: {label(data.brand.onboardingStatus)}</p>
              <p className="bp-muted">Account: {label(data.brand.status)}</p>
            </>
          ) : (
            <p className="bp-muted">No onboarding data.</p>
          )}
        </article>

        <article className="bp-panel">
          <h2>
            <FileUp size={20} /> Agreement
          </h2>
          {!agreement ? (
            <p className="bp-muted">
              No agreement has been generated yet. After your application is verified, Brand2School will email
              or notify you when the PDF is ready.
            </p>
          ) : (
            <>
              <p>
                Version {agreement.version} · <strong>{label(agreement.status)}</strong>
              </p>
              {agreement.generatedPdfUrl ? (
                <p style={{ marginTop: "0.75rem" }}>
                  <a
                    href={agreement.generatedPdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bp-btn bp-btn--secondary"
                    style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}
                  >
                    <Download size={16} />
                    Download agreement PDF
                  </a>
                </p>
              ) : (
                <p className="bp-muted">PDF is being prepared.</p>
              )}
              {agreement.signedPdfUrl ? (
                <p className="bp-muted" style={{ marginTop: "0.5rem" }}>
                  Signed copy on file.{" "}
                  <a href={agreement.signedPdfUrl} target="_blank" rel="noopener noreferrer">
                    View uploaded PDF
                  </a>
                </p>
              ) : null}
              {canUpload ? (
                <label className="bp-upload" style={{ display: "block", marginTop: "1rem" }}>
                  <span className="bp-muted">Upload signed PDF (max 8MB)</span>
                  <input
                    type="file"
                    accept="application/pdf"
                    disabled={uploading || agreement.status === "APPROVED"}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void uploadSigned(file);
                      e.target.value = "";
                    }}
                    style={{ display: "block", marginTop: "0.35rem" }}
                  />
                </label>
              ) : agreement.status === "UPLOADED" ? (
                <p className="bp-muted" style={{ marginTop: "0.75rem" }}>
                  Signed agreement received — awaiting Brand2School approval.
                </p>
              ) : agreement.status === "APPROVED" ? (
                <p className="bp-muted" style={{ marginTop: "0.75rem" }}>
                  Agreement approved. Proceed with setup-fee payment per your invoice.
                </p>
              ) : null}
            </>
          )}
        </article>
      </div>

      <article className="bp-panel" style={{ marginTop: "1rem" }}>
        <h2>Contract requirements</h2>
        <ul style={{ margin: 0, paddingLeft: "1.1rem" }}>
          {CONTRACT_PACKAGE_REQUIREMENTS.map((req) => (
            <li key={req.label}>{req.label}</li>
          ))}
        </ul>
      </article>

      <article className="bp-panel" style={{ marginTop: "1rem" }}>
        <h2>Billing structure</h2>
        <p className="bp-muted">
          One-time activation fee plus first subscription cycle before public launch. Transformation
          contribution pools are optional and invoiced separately.
        </p>
        <ul style={{ margin: "0.5rem 0 0", paddingLeft: "1.1rem" }}>
          {RECOMMENDED_PAYMENT_SCHEDULE.map((row) => (
            <li key={row.stage}>
              <strong>{row.percentage}%</strong> — {row.stage} <span className="bp-muted">({row.note})</span>
            </li>
          ))}
        </ul>
        <p className="bp-muted" style={{ marginTop: "0.75rem" }}>
          <a href="/for-brands#add-ons">View add-on services &amp; pricing</a>
        </p>
      </article>

      {data && data.campaigns.length > 0 ? (
        <article className="bp-panel" style={{ marginTop: "1rem" }}>
          <h2>Infrastructure commitment vs delivered</h2>
          <p className="bp-muted">Boardroom-ready ESG metrics for your transformation territory.</p>
          {data.campaigns.map((c) => (
            <div key={c.id} style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid #e5e7eb" }}>
              <h3 style={{ margin: "0 0 0.5rem", fontSize: "1rem" }}>{c.name}</h3>
              <p className="bp-muted" style={{ margin: "0 0 0.75rem" }}>
                Workflow: <strong>{c.workflowLabel}</strong>
                {c.expiry.daysUntilEnd != null ? ` · ${c.expiry.daysUntilEnd} days until end` : null}
                {c.expiry.isInGracePeriod ? " · grace period" : null}
                {c.expiry.isExpired ? " · expired" : null}
              </p>
              <div className="bp-table-wrap">
                <table className="bp-table">
                  <thead>
                    <tr>
                      <th>Metric</th>
                      <th>Committed</th>
                      <th>Delivered</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Schools targeted</td>
                      <td>{c.impact.committed.schoolsTargeted}</td>
                      <td>{c.impact.delivered.schoolsReached}</td>
                    </tr>
                    <tr>
                      <td>Water phases completed</td>
                      <td>{c.impact.committed.waterPhasesCompleted}</td>
                      <td>{c.impact.delivered.waterPhasesCompleted}</td>
                    </tr>
                    <tr>
                      <td>Active infrastructure projects</td>
                      <td>{c.impact.committed.activeInfrastructureProjects}</td>
                      <td>{c.impact.delivered.activeInfrastructureProjects}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ))}
          <h2 style={{ marginTop: "1.5rem" }}>Campaign activation gates</h2>
          <div className="bp-table-wrap">
            <table className="bp-table">
              <thead>
                <tr>
                  <th>Campaign</th>
                  <th>Commercial</th>
                  <th>Live</th>
                  <th>Checklist</th>
                </tr>
              </thead>
              <tbody>
                {data.campaigns.map((c) => (
                  <tr key={c.id}>
                    <td>{c.name}</td>
                    <td>{label(c.commercialStatus)}</td>
                    <td>{c.isActive ? "Yes" : "No"}</td>
                    <td>
                      <small>
                        {Object.entries(c.activation.checklist)
                          .map(([k, ok]) => `${ok ? "✓" : "○"} ${k}`)
                          .join(" · ")}
                      </small>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      ) : null}
    </div>
  );
}
