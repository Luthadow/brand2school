"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { csrfFetch } from "../admin-client-utils";
import { useAdminSession } from "../useAdminSession";

type BrandApplication = {
  id: string;
  name: string;
  legalName: string | null;
  codePrefix: string;
  onboardingStatus: string;
  registrationNumber: string | null;
  primaryContactEmail: string | null;
  intendedProvinces: string[];
  campaignIntention: string | null;
  createdAt: string;
  campaignCount: number;
};

type CampaignRow = {
  id: string;
  brandId: string;
  brandName: string;
  name: string;
  slug: string;
  isActive: boolean;
};

type CampaignInvoiceRow = {
  id: string;
  invoiceNumber: string;
  invoiceType: string;
  amountZar: number;
  status: string;
  eftReference: string | null;
  issuedAt: string | null;
  verifiedAt: string | null;
};

type ActivationPayload = {
  id: string;
  name: string;
  commercialStatus: string;
  brandSubscription?: {
    status: string | null;
    plan: string | null;
    activationFeePaid: boolean;
    recurringAmountZar: number | null;
    billingCycle: string;
    gracePeriodUntil: string | null;
  };
  invoices?: CampaignInvoiceRow[];
  activation: {
    canActivate: boolean;
    blockers: string[];
    checklist: Record<string, boolean>;
  };
};

type WorkflowStage =
  | "PENDING"
  | "UNDER_REVIEW"
  | "AWAITING_AGREEMENT"
  | "AWAITING_PAYMENT"
  | "AWAITING_CODES"
  | "READY_FOR_APPROVAL"
  | "ACTIVE"
  | "SUSPENDED"
  | "EXPIRED";

type WorkflowBoard = {
  activationChain: Array<{ step: number; key: string; label: string }>;
  pipeline: Record<WorkflowStage, number>;
  licenseRenewal?: { pendingRenewal: number; lapsed: number };
  subscriptionGovernance?: { markedPastDue: number; suspended: number };
  brands: Array<{
    id: string;
    name: string;
    codePrefix: string;
    brandWorkflowStage: WorkflowStage;
    brandWorkflowLabel: string;
    onboardingStatus: string;
    campaigns: Array<{
      id: string;
      name: string;
      workflowStage: WorkflowStage;
      workflowLabel: string;
      commercialStatus: string;
      isActive: boolean;
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
    }>;
  }>;
};

const STAGE_COLORS: Record<WorkflowStage, string> = {
  PENDING: "#94a3b8",
  UNDER_REVIEW: "#6366f1",
  AWAITING_AGREEMENT: "#f59e0b",
  AWAITING_PAYMENT: "#ea580c",
  AWAITING_CODES: "#0ea5e9",
  READY_FOR_APPROVAL: "#8b5cf6",
  ACTIVE: "#16a34a",
  SUSPENDED: "#dc2626",
  EXPIRED: "#64748b"
};

export function CommercialGovernanceClient(): JSX.Element {
  const { session, loading } = useAdminSession();
  const [applications, setApplications] = useState<BrandApplication[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [workflow, setWorkflow] = useState<WorkflowBoard | null>(null);
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [activation, setActivation] = useState<ActivationPayload | null>(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [lastAgreementId, setLastAgreementId] = useState<string | null>(null);
  const [impactSchools, setImpactSchools] = useState("");
  const [impactWater, setImpactWater] = useState("");
  const [impactProjects, setImpactProjects] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [infoRequest, setInfoRequest] = useState("");
  const searchParams = useSearchParams();

  const selectedBrand = applications.find((b) => b.id === selectedBrandId) ?? null;
  const brandCampaigns = campaigns.filter((c) => c.brandId === selectedBrandId);
  const selectedWorkflowBrand = workflow?.brands.find((b) => b.id === selectedBrandId);

  const load = useCallback(async (): Promise<void> => {
    const [appsRes, campRes, workflowRes] = await Promise.all([
      csrfFetch("/api/admin/commercial/brand-applications"),
      csrfFetch("/api/admin/campaigns"),
      csrfFetch("/api/admin/commercial/workflow")
    ]);
    if (appsRes.ok) setApplications((await appsRes.json()) as BrandApplication[]);
    if (campRes.ok) setCampaigns((await campRes.json()) as CampaignRow[]);
    if (workflowRes.ok) setWorkflow((await workflowRes.json()) as WorkflowBoard);
  }, []);

  const loadActivation = useCallback(async (campaignId: string): Promise<void> => {
    const res = await csrfFetch(`/api/admin/commercial/campaigns/${campaignId}/activation`);
    if (res.ok) {
      const payload = (await res.json()) as ActivationPayload;
      setActivation(payload);
      const pending = payload.invoices?.find((i) => i.status === "ISSUED" || i.status === "PAYMENT_REPORTED");
      setSelectedInvoiceId(pending?.id ?? payload.invoices?.[0]?.id ?? null);
    }
  }, []);

  useEffect(() => {
    if (!loading && session) void load();
  }, [loading, session, load]);

  useEffect(() => {
    const brandId = searchParams.get("brandId");
    if (brandId) setSelectedBrandId(brandId);
  }, [searchParams]);

  useEffect(() => {
    if (selectedCampaignId) void loadActivation(selectedCampaignId);
    else setActivation(null);
  }, [selectedCampaignId, loadActivation]);

  const run = async (label: string, fn: () => Promise<Response>): Promise<void> => {
    setBusy(true);
    setToast(null);
    try {
      const res = await fn();
      const data = (await res.json().catch(() => ({}))) as {
        message?: string;
        invoice?: { id: string };
        id?: string;
        blockers?: string[];
      };
      if (!res.ok) {
        setToast(data.message ?? (data.blockers?.join(" ") || `${label} failed.`));
        return;
      }
      if (data.invoice?.id) setSelectedInvoiceId(data.invoice.id);
      if (data.id && label.toLowerCase().includes("agreement")) setLastAgreementId(data.id);
      setToast(`${label} succeeded.`);
      await load();
      if (selectedCampaignId) await loadActivation(selectedCampaignId);
    } finally {
      setBusy(false);
    }
  };

  if (loading || !session) return <p>Loading session…</p>;

  const pipelineStages: WorkflowStage[] = [
    "PENDING",
    "UNDER_REVIEW",
    "AWAITING_AGREEMENT",
    "AWAITING_PAYMENT",
    "AWAITING_CODES",
    "READY_FOR_APPROVAL",
    "ACTIVE",
    "SUSPENDED",
    "EXPIRED"
  ];

  return (
    <div className="card">
      <h1>Commercial workflow</h1>
      <p style={{ color: "#4b5563", marginBottom: "0.5rem" }}>
        Measurable education infrastructure &amp; ESG intelligence — not a donation platform.
      </p>
      <p style={{ color: "#4b5563", marginBottom: "1rem", fontSize: "0.9rem" }}>
        Activation gates: registration → POPIA → agreement → brand review → payment → rules → codes →
        launch.
      </p>
      {toast ? (
        <p style={{ padding: "0.5rem", background: "#eef2ff", borderRadius: 8, marginBottom: "1rem" }}>{toast}</p>
      ) : null}

      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1rem" }}>
        <button
          type="button"
          disabled={busy}
          onClick={() =>
            void run("Subscription governance", () =>
              csrfFetch("/api/admin/commercial/governance/subscriptions/run", { method: "POST" })
            )
          }
        >
          Run subscription governance now
        </button>
        {workflow?.subscriptionGovernance ? (
          <span style={{ fontSize: "0.85rem", color: "#64748b", alignSelf: "center" }}>
            Last tick: {workflow.subscriptionGovernance.markedPastDue} past-due ·{" "}
            {workflow.subscriptionGovernance.suspended} suspended
          </span>
        ) : null}
      </div>

      {workflow ? (
        <section style={{ marginBottom: "1.5rem" }}>
          <h2>Pipeline</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
              gap: "0.5rem",
              marginBottom: "1rem"
            }}
          >
            {pipelineStages.map((stage) => (
              <div
                key={stage}
                style={{
                  padding: "0.5rem",
                  borderRadius: 8,
                  borderLeft: `4px solid ${STAGE_COLORS[stage]}`,
                  background: "#f8fafc"
                }}
              >
                <div style={{ fontSize: "0.7rem", color: "#64748b" }}>{stage.replace(/_/g, " ")}</div>
                <strong style={{ fontSize: "1.25rem" }}>{workflow.pipeline[stage] ?? 0}</strong>
              </div>
            ))}
          </div>

          <h3>Activation chain</h3>
          <ol style={{ fontSize: "0.9rem", color: "#374151", marginBottom: "1rem" }}>
            {workflow.activationChain.map((step) => (
              <li key={step.key}>
                {step.step}. {step.label}
              </li>
            ))}
          </ol>

          <h3>Campaigns by stage</h3>
          <div style={{ maxHeight: 280, overflow: "auto", fontSize: "0.85rem" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>
                  <th style={{ padding: "0.35rem" }}>Brand</th>
                  <th>Campaign</th>
                  <th>Stage</th>
                  <th>Impact</th>
                </tr>
              </thead>
              <tbody>
                {workflow.brands.flatMap((b) =>
                  b.campaigns.length > 0
                    ? b.campaigns.map((c) => (
                        <tr
                          key={c.id}
                          style={{ borderBottom: "1px solid #f1f5f9", cursor: "pointer" }}
                          onClick={() => {
                            setSelectedBrandId(b.id);
                            setSelectedCampaignId(c.id);
                          }}
                        >
                          <td style={{ padding: "0.35rem" }}>{b.name}</td>
                          <td>{c.name}</td>
                          <td>
                            <span
                              style={{
                                color: STAGE_COLORS[c.workflowStage],
                                fontWeight: 600
                              }}
                            >
                              {c.workflowLabel}
                            </span>
                            {c.expiry.isInGracePeriod ? " (grace)" : null}
                            {c.expiry.isExpired ? " (expired)" : null}
                          </td>
                          <td>
                            {c.impact.delivered.schoolsReached}/{c.impact.committed.schoolsTargeted} schools
                          </td>
                        </tr>
                      ))
                    : [
                        <tr key={b.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "0.35rem" }}>{b.name}</td>
                          <td colSpan={3}>
                            <span style={{ color: STAGE_COLORS[b.brandWorkflowStage] }}>
                              {b.brandWorkflowLabel}
                            </span>{" "}
                            (no campaigns)
                          </td>
                        </tr>
                      ]
                )}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <section>
          <h2>Brand applications</h2>
          <ul style={{ listStyle: "none", padding: 0, maxHeight: 360, overflow: "auto" }}>
            {applications.map((b) => (
              <li key={b.id} style={{ marginBottom: "0.5rem" }}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedBrandId(b.id);
                    setSelectedCampaignId(null);
                  }}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "0.5rem",
                    borderRadius: 8,
                    border: selectedBrandId === b.id ? "2px solid #003B8E" : "1px solid #d1d5db",
                    background: "#fff"
                  }}
                >
                  <strong>{b.name}</strong> ({b.codePrefix})
                  <br />
                  <small>
                    {b.onboardingStatus} · {b.campaignCount} campaign(s)
                    {selectedWorkflowBrand?.id === b.id
                      ? ` · ${selectedWorkflowBrand.brandWorkflowLabel}`
                      : null}
                  </small>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2>Brand actions</h2>
          {!selectedBrand ? (
            <p>Select a brand application.</p>
          ) : (
            <>
              <p>
                <strong>{selectedBrand.name}</strong>
                <br />
                Reg: {selectedBrand.registrationNumber ?? "—"}
                <br />
                Contact: {selectedBrand.primaryContactEmail ?? "—"}
                <br />
                Provinces: {selectedBrand.intendedProvinces.join(", ") || "—"}
              </p>
              <label style={{ display: "block", marginTop: "0.75rem" }}>
                Request documents or information (emailed to applicant)
                <textarea
                  value={infoRequest}
                  onChange={(e) => setInfoRequest(e.target.value)}
                  rows={3}
                  placeholder="e.g. CIPC registration certificate, signed POPIA acknowledgement, VAT letter."
                  style={{ width: "100%", marginTop: "0.35rem" }}
                />
              </label>
              <button
                type="button"
                disabled={busy || infoRequest.trim().length < 10}
                style={{ marginTop: "0.35rem" }}
                onClick={() =>
                  void run("Email requirements", () =>
                    csrfFetch(`/api/admin/commercial/brands/${selectedBrand.id}/request-info`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ message: infoRequest.trim() })
                    }).then((res) => {
                      if (res.ok) setInfoRequest("");
                      return res;
                    })
                  )
                }
              >
                Email requirements to brand
              </button>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.75rem" }}>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    void run("Move to under approval", () =>
                      csrfFetch(`/api/admin/commercial/brands/${selectedBrand.id}/review`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ onboardingStatus: "UNDER_APPROVAL", status: "VERIFIED" })
                      })
                    )
                  }
                >
                  Verify (under approval)
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    void run("Generate agreement PDF", () =>
                      csrfFetch(`/api/admin/commercial/brands/${selectedBrand.id}/agreements/generate`, {
                        method: "POST"
                      })
                    )
                  }
                >
                  Generate agreement
                </button>
                <button
                  type="button"
                  disabled={busy || !lastAgreementId}
                  onClick={() =>
                    void run("Approve signed agreement", () =>
                      csrfFetch(`/api/admin/commercial/agreements/${lastAgreementId}/approve`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ approved: true })
                      })
                    )
                  }
                >
                  Approve signed agreement
                </button>
              </div>
              <h3 style={{ marginTop: "1rem" }}>Campaigns</h3>
              <ul style={{ listStyle: "none", padding: 0 }}>
                {brandCampaigns.map((c) => {
                  const wf = selectedWorkflowBrand?.campaigns.find((x) => x.id === c.id);
                  return (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedCampaignId(c.id)}
                        style={{
                          marginBottom: "0.35rem",
                          padding: "0.35rem 0.5rem",
                          borderRadius: 6,
                          border: selectedCampaignId === c.id ? "2px solid #6CC24A" : "1px solid #ccc",
                          background: "#fafafa",
                          width: "100%",
                          textAlign: "left"
                        }}
                      >
                        {c.name} {c.isActive ? "· LIVE" : "· draft"}
                        {wf ? (
                          <>
                            <br />
                            <small style={{ color: STAGE_COLORS[wf.workflowStage] }}>{wf.workflowLabel}</small>
                          </>
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </section>
      </div>

      {selectedCampaignId && activation ? (
        <section className="card" style={{ marginTop: "1rem" }}>
          <h2>Campaign activation: {activation.name}</h2>
          <p>
            Status: <strong>{activation.commercialStatus}</strong>
          </p>
          {selectedWorkflowBrand?.campaigns.find((c) => c.id === selectedCampaignId)?.impact ? (
            <div style={{ fontSize: "0.9rem", marginBottom: "0.75rem" }}>
              {(() => {
                const imp = selectedWorkflowBrand.campaigns.find((c) => c.id === selectedCampaignId)!.impact;
                return (
                  <table className="table" style={{ maxWidth: 480 }}>
                    <thead>
                      <tr>
                        <th>Metric</th>
                        <th>Committed</th>
                        <th>Delivered</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Schools</td>
                        <td>{imp.committed.schoolsTargeted}</td>
                        <td>{imp.delivered.schoolsReached}</td>
                      </tr>
                      <tr>
                        <td>Water phases</td>
                        <td>{imp.committed.waterPhasesCompleted}</td>
                        <td>{imp.delivered.waterPhasesCompleted}</td>
                      </tr>
                      <tr>
                        <td>Infra projects</td>
                        <td>{imp.committed.activeInfrastructureProjects}</td>
                        <td>{imp.delivered.activeInfrastructureProjects}</td>
                      </tr>
                    </tbody>
                  </table>
                );
              })()}
            </div>
          ) : null}
          <div style={{ display: "grid", gap: "0.5rem", maxWidth: 420, marginBottom: "0.75rem" }}>
            <strong>Set impact commitment (targets)</strong>
            <label>
              Schools targeted
              <input
                type="number"
                min={0}
                value={impactSchools}
                onChange={(e) => setImpactSchools(e.target.value)}
                style={{ display: "block", width: "100%" }}
              />
            </label>
            <label>
              Water phases (target)
              <input
                type="number"
                min={0}
                value={impactWater}
                onChange={(e) => setImpactWater(e.target.value)}
                style={{ display: "block", width: "100%" }}
              />
            </label>
            <label>
              Active infrastructure projects (target)
              <input
                type="number"
                min={0}
                value={impactProjects}
                onChange={(e) => setImpactProjects(e.target.value)}
                style={{ display: "block", width: "100%" }}
              />
            </label>
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                void run("Save impact commitment", () =>
                  csrfFetch(`/api/admin/commercial/campaigns/${selectedCampaignId}/impact-commitment`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      schoolsTargeted: impactSchools ? Number(impactSchools) : undefined,
                      waterPhasesCompleted: impactWater ? Number(impactWater) : undefined,
                      activeInfrastructureProjects: impactProjects ? Number(impactProjects) : undefined
                    })
                  })
                )
              }
            >
              Save commitment targets
            </button>
          </div>
          {activation.brandSubscription ? (
            <p style={{ fontSize: "0.9rem", marginBottom: "0.75rem" }}>
              Subscription: <strong>{activation.brandSubscription.status ?? "Not set"}</strong>
              {activation.brandSubscription.plan ? ` · ${activation.brandSubscription.plan}` : null}
              {activation.brandSubscription.recurringAmountZar != null
                ? ` · R${activation.brandSubscription.recurringAmountZar.toLocaleString("en-ZA")}/${activation.brandSubscription.billingCycle.toLowerCase()}`
                : null}
              {activation.brandSubscription.gracePeriodUntil
                ? ` · grace until ${new Date(activation.brandSubscription.gracePeriodUntil).toLocaleDateString("en-ZA")}`
                : null}
            </p>
          ) : null}

          {activation.invoices && activation.invoices.length > 0 ? (
            <div style={{ marginBottom: "0.75rem" }}>
              <strong>Invoices</strong>
              <table className="table" style={{ marginTop: "0.35rem", fontSize: "0.85rem" }}>
                <thead>
                  <tr>
                    <th />
                    <th>Number</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {activation.invoices.map((inv) => (
                    <tr key={inv.id}>
                      <td>
                        <input
                          type="radio"
                          name="verify-invoice"
                          checked={selectedInvoiceId === inv.id}
                          onChange={() => setSelectedInvoiceId(inv.id)}
                        />
                      </td>
                      <td>
                        <code>{inv.invoiceNumber}</code>
                      </td>
                      <td>{inv.invoiceType.replace(/_/g, " ")}</td>
                      <td>R{inv.amountZar.toLocaleString("en-ZA")}</td>
                      <td>{inv.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          <ul>
            {Object.entries(activation.activation.checklist).map(([key, ok]) => (
              <li key={key}>
                {ok ? "✅" : "⬜"} {key.replace(/([A-Z])/g, " $1").trim()}
              </li>
            ))}
          </ul>
          {!activation.activation.canActivate && activation.activation.blockers.length > 0 ? (
            <div style={{ background: "#fef3c7", padding: "0.75rem", borderRadius: 8 }}>
              <strong>Blockers</strong>
              <ul>
                {activation.activation.blockers.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            </div>
          ) : null}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.75rem" }}>
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                void run("Issue activation invoice", () =>
                  csrfFetch(`/api/admin/commercial/campaigns/${selectedCampaignId}/invoices/setup-fee`, {
                    method: "POST"
                  })
                )
              }
            >
              Issue activation fee invoice (EFT)
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                void run("Issue subscription invoice", () =>
                  csrfFetch(`/api/admin/commercial/campaigns/${selectedCampaignId}/invoices/subscription`, {
                    method: "POST"
                  })
                )
              }
            >
              Issue monthly subscription invoice (EFT)
            </button>
            <button
              type="button"
              disabled={busy || !selectedInvoiceId}
              onClick={() =>
                void run("Verify payment", () =>
                  csrfFetch(`/api/admin/commercial/campaigns/${selectedCampaignId}/verify-payment`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ invoiceId: selectedInvoiceId, verified: true })
                  })
                )
              }
            >
              Verify selected EFT payment
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                void run("Approve codes", () =>
                  csrfFetch(`/api/admin/commercial/campaigns/${selectedCampaignId}/approve-codes`, {
                    method: "POST"
                  })
                )
              }
            >
              Approve codes
            </button>
            <button
              type="button"
              disabled={busy || !activation.activation.canActivate}
              onClick={() =>
                void run("Approve launch", () =>
                  csrfFetch(`/api/admin/commercial/campaigns/${selectedCampaignId}/approve-launch`, {
                    method: "POST"
                  })
                )
              }
            >
              Approve launch (go LIVE)
            </button>
          </div>
          <p style={{ fontSize: "0.85rem", color: "#6b7280", marginTop: "0.5rem" }}>
            Upload codes via Campaigns → code batch CSV import (prefix-validated). Configure scope/budget there
            before launch.
          </p>
        </section>
      ) : null}
    </div>
  );
}
