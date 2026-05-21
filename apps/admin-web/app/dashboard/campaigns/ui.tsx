"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { csrfFetch } from "../admin-client-utils";
import { useAdminSession } from "../useAdminSession";

type ProvinceOption = { code: string; name: string };

type CampaignRow = {
  id: string;
  brandId: string;
  brandName: string;
  name: string;
  slug: string;
  isActive: boolean;
  commercialStatus: string;
  setupFeeZar: number;
  paymentVerified: boolean;
  codesApproved: boolean;
  rulesConfigured: boolean;
  launchApproved: boolean;
  scopeType: string;
  scopeLabel: string;
  allowedProvinces: string[];
  allowedDistricts: string[];
  allowedSchoolIds: string[];
  budgetAllocatedZar: number | null;
  budgetConsumedZar: number;
  remainingBudgetZar: number | null;
  pauseOnBudgetExhausted: boolean;
  overflowCampaignId: string | null;
};

const COMMERCIAL_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  AWAITING_AGREEMENT: "Awaiting agreement",
  AWAITING_PAYMENT: "Awaiting payment",
  AWAITING_CODES: "Awaiting codes",
  AWAITING_LAUNCH: "Awaiting launch",
  LIVE: "Live",
  PAUSED: "Paused"
};

function commercialLabel(status: string): string {
  return COMMERCIAL_LABELS[status] ?? status;
}

function commercialBadgeStyle(status: string): CSSProperties {
  const base: CSSProperties = {
    display: "inline-block",
    fontSize: "0.72rem",
    fontWeight: 600,
    padding: "0.15rem 0.45rem",
    borderRadius: 6,
    marginTop: "0.2rem"
  };
  if (status === "LIVE") return { ...base, background: "#dcfce7", color: "#166534" };
  if (status === "PAUSED") return { ...base, background: "#fee2e2", color: "#991b1b" };
  if (status.startsWith("AWAITING")) return { ...base, background: "#fef3c7", color: "#92400e" };
  return { ...base, background: "#e5e7eb", color: "#374151" };
}

type NominationRow = {
  id: string;
  provinceName: string;
  schoolName: string | null;
  district: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  campaignSlug: string | null;
  message: string | null;
  status: string;
  createdAt: string;
};

export function CampaignsClient(): JSX.Element {
  const { session, loading: sessionLoading } = useAdminSession();
  const [tab, setTab] = useState<"campaigns" | "nominations">("campaigns");
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [provinces, setProvinces] = useState<ProvinceOption[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [scopeType, setScopeType] = useState("NATIONAL");
  const [allowedProvinces, setAllowedProvinces] = useState<string[]>([]);
  const [allowedDistricts, setAllowedDistricts] = useState("");
  const [allowedSchoolIds, setAllowedSchoolIds] = useState("");
  const [budgetAllocated, setBudgetAllocated] = useState("");
  const [pauseOnBudget, setPauseOnBudget] = useState(true);
  const [overflowCampaignId, setOverflowCampaignId] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [nominations, setNominations] = useState<NominationRow[]>([]);
  const [toast, setToast] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const selected = campaigns.find((c) => c.id === selectedId) ?? null;

  const loadCampaigns = async (): Promise<void> => {
    const res = await csrfFetch("/api/admin/campaigns");
    if (!res.ok) {
      setToast({ kind: "error", text: "Failed to load campaigns." });
      return;
    }
    setCampaigns((await res.json()) as CampaignRow[]);
  };

  const loadProvinces = async (): Promise<void> => {
    const res = await csrfFetch("/api/admin/campaigns/province-options");
    if (res.ok) setProvinces((await res.json()) as ProvinceOption[]);
  };

  const loadNominations = async (): Promise<void> => {
    const res = await csrfFetch("/api/admin/province-nominations?pageSize=50");
    if (!res.ok) return;
    const data = (await res.json()) as { items: NominationRow[] };
    setNominations(data.items);
  };

  useEffect(() => {
    if (sessionLoading || !session) return;
    void loadCampaigns();
    void loadProvinces();
    void loadNominations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionLoading, session]);

  useEffect(() => {
    if (!selected) return;
    setScopeType(selected.scopeType);
    setAllowedProvinces(selected.allowedProvinces);
    setAllowedDistricts(selected.allowedDistricts.join(", "));
    setAllowedSchoolIds(selected.allowedSchoolIds.join(", "));
    setBudgetAllocated(selected.budgetAllocatedZar != null ? String(selected.budgetAllocatedZar) : "");
    setPauseOnBudget(selected.pauseOnBudgetExhausted);
    setOverflowCampaignId(selected.overflowCampaignId ?? "");
    setIsActive(selected.isActive);
  }, [selected]);

  const overflowOptions = useMemo(
    () => campaigns.filter((c) => c.id !== selectedId && c.scopeType === "NATIONAL"),
    [campaigns, selectedId]
  );

  function toggleProvince(code: string): void {
    setAllowedProvinces((prev) => (prev.includes(code) ? prev.filter((p) => p !== code) : [...prev, code]));
  }

  const saveEligibility = async (): Promise<void> => {
    if (!selected) return;
    setSaving(true);
    const body = {
      scopeType,
      allowedProvinces,
      allowedDistricts: allowedDistricts
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      allowedSchoolIds: allowedSchoolIds
        .split(/[\s,]+/)
        .map((s) => s.trim())
        .filter(Boolean),
      budgetAllocatedZar: budgetAllocated.trim() ? Number(budgetAllocated) : undefined,
      pauseOnBudgetExhausted: pauseOnBudget,
      overflowCampaignId: overflowCampaignId.trim() ? overflowCampaignId : null,
      isActive
    };

    const res = await csrfFetch(`/api/admin/campaigns/${selected.id}/eligibility`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    setSaving(false);
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { message?: string };
      setToast({ kind: "error", text: err.message ?? "Save failed." });
      return;
    }
    setToast({ kind: "success", text: "Campaign eligibility rules saved." });
    void loadCampaigns();
  };

  const updateNominationStatus = async (id: string, status: string): Promise<void> => {
    const res = await csrfFetch(`/api/admin/province-nominations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    if (!res.ok) {
      setToast({ kind: "error", text: "Could not update nomination." });
      return;
    }
    void loadNominations();
  };

  if (sessionLoading || !session) {
    return <p>Loading…</p>;
  }

  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN_STAFF") {
    return <p>Campaign geo rules require SUPER_ADMIN or ADMIN_STAFF.</p>;
  }

  return (
    <div>
      <h1>Campaign eligibility &amp; budgets</h1>
      <p>Configure provincial packages, district targeting, budget caps, and review province nomination leads.</p>

      <div className="admin-tabs" style={{ display: "flex", gap: "0.5rem", margin: "1rem 0" }}>
        <button type="button" onClick={() => setTab("campaigns")} style={{ fontWeight: tab === "campaigns" ? 700 : 400 }}>
          Campaign rules
        </button>
        <button type="button" onClick={() => setTab("nominations")} style={{ fontWeight: tab === "nominations" ? 700 : 400 }}>
          Province nominations ({nominations.filter((n) => n.status === "NEW").length})
        </button>
      </div>

      {toast ? (
        <p style={{ color: toast.kind === "error" ? "#b91c1c" : "#0e9f6e", fontWeight: 600 }}>{toast.text}</p>
      ) : null}

      {tab === "campaigns" ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "1rem" }}>
          <section className="card">
            <h2>Campaigns</h2>
            <ul style={{ listStyle: "none", margin: 0, padding: 0, maxHeight: "520px", overflow: "auto" }}>
              {campaigns.map((c) => (
                <li key={c.id} style={{ marginBottom: "0.5rem" }}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(c.id)}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "0.6rem",
                      borderRadius: "8px",
                      border: selectedId === c.id ? "2px solid #003b8e" : "1px solid #dfebff",
                      background: selectedId === c.id ? "#eef4ff" : "#fff",
                      cursor: "pointer"
                    }}
                  >
                    <strong>{c.name}</strong>
                    <br />
                    <small>
                      {c.brandName} · {c.scopeType} · {c.isActive ? "Public live" : "Not live"}
                    </small>
                    <span style={commercialBadgeStyle(c.commercialStatus ?? "DRAFT")}>
                      {commercialLabel(c.commercialStatus ?? "DRAFT")}
                    </span>
                    {c.remainingBudgetZar != null ? (
                      <>
                        <br />
                        <small>Budget left: R{c.remainingBudgetZar.toLocaleString()}</small>
                      </>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section className="card">
            {selected ? (
              <>
                <h2>{selected.name}</h2>
                <p>
                  <code>{selected.slug}</code> · {selected.scopeLabel}
                </p>

                <div
                  style={{
                    marginTop: "0.75rem",
                    padding: "0.75rem",
                    borderRadius: 8,
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    fontSize: "0.88rem"
                  }}
                >
                  <strong>Territorial impact rights</strong>
                  <p style={{ margin: "0.35rem 0" }}>
                    Status:{" "}
                    <span style={commercialBadgeStyle(selected.commercialStatus ?? "DRAFT")}>
                      {commercialLabel(selected.commercialStatus ?? "DRAFT")}
                    </span>
                    {selected.setupFeeZar ? (
                      <>
                        {" "}
                        · Setup fee R{selected.setupFeeZar.toLocaleString()}
                      </>
                    ) : null}
                  </p>
                  <ul style={{ margin: "0.35rem 0 0", paddingLeft: "1.1rem" }}>
                    <li>{selected.paymentVerified ? "✅" : "⬜"} Payment verified</li>
                    <li>{selected.codesApproved ? "✅" : "⬜"} Codes approved</li>
                    <li>{selected.rulesConfigured ? "✅" : "⬜"} Rules configured</li>
                    <li>{selected.launchApproved ? "✅" : "⬜"} Launch approved</li>
                  </ul>
                  <p style={{ margin: "0.5rem 0 0", fontSize: "0.8rem", color: "#64748b" }}>
                    Full pipeline:{" "}
                    <a href="/dashboard/commercial">Commercial dashboard</a>
                  </p>
                </div>

                <label style={{ display: "block", marginTop: "0.75rem" }}>
                  Scope type
                  <select value={scopeType} onChange={(e) => setScopeType(e.target.value)} style={{ display: "block", width: "100%" }}>
                    <option value="NATIONAL">National (all provinces)</option>
                    <option value="PROVINCIAL">Provincial package</option>
                    <option value="DISTRICT">District package</option>
                    <option value="SCHOOL_CLUSTER">School cluster</option>
                  </select>
                </label>

                {scopeType === "PROVINCIAL" ? (
                  <div style={{ marginTop: "0.75rem" }}>
                    <strong>Allowed provinces</strong>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.35rem", marginTop: "0.35rem" }}>
                      {provinces.map((p) => (
                        <label key={p.code} style={{ fontSize: "0.88rem" }}>
                          <input
                            type="checkbox"
                            checked={allowedProvinces.includes(p.code)}
                            onChange={() => toggleProvince(p.code)}
                          />{" "}
                          {p.name}
                        </label>
                      ))}
                    </div>
                  </div>
                ) : null}

                {scopeType === "DISTRICT" ? (
                  <label style={{ display: "block", marginTop: "0.75rem" }}>
                    Allowed districts (comma-separated)
                    <input
                      value={allowedDistricts}
                      onChange={(e) => setAllowedDistricts(e.target.value)}
                      placeholder="Tshwane, Johannesburg"
                      style={{ display: "block", width: "100%" }}
                    />
                  </label>
                ) : null}

                {scopeType === "SCHOOL_CLUSTER" ? (
                  <label style={{ display: "block", marginTop: "0.75rem" }}>
                    School IDs (comma or space separated)
                    <textarea
                      value={allowedSchoolIds}
                      onChange={(e) => setAllowedSchoolIds(e.target.value)}
                      rows={3}
                      style={{ display: "block", width: "100%" }}
                    />
                  </label>
                ) : null}

                <label style={{ display: "block", marginTop: "0.75rem" }}>
                  Budget allocated (ZAR)
                  <input
                    type="number"
                    min={0}
                    value={budgetAllocated}
                    onChange={(e) => setBudgetAllocated(e.target.value)}
                    placeholder="e.g. 500000"
                    style={{ display: "block", width: "100%" }}
                  />
                </label>
                <p style={{ fontSize: "0.85rem", color: "#64748b" }}>
                  Consumed: R{selected.budgetConsumedZar.toLocaleString()}
                  {selected.remainingBudgetZar != null ? ` · Remaining: R${selected.remainingBudgetZar.toLocaleString()}` : ""}
                </p>

                <label style={{ display: "block", marginTop: "0.5rem" }}>
                  Overflow / national campaign
                  <select
                    value={overflowCampaignId}
                    onChange={(e) => setOverflowCampaignId(e.target.value)}
                    style={{ display: "block", width: "100%" }}
                  >
                    <option value="">None</option>
                    {overflowOptions.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.slug})
                      </option>
                    ))}
                  </select>
                </label>

                <label style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem", alignItems: "center" }}>
                  <input type="checkbox" checked={pauseOnBudget} onChange={(e) => setPauseOnBudget(e.target.checked)} />
                  Pause campaign when budget is exhausted
                </label>
                <label style={{ display: "flex", gap: "0.5rem", marginTop: "0.35rem", alignItems: "center" }}>
                  <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                  Campaign active
                </label>

                <button type="button" onClick={() => void saveEligibility()} disabled={saving} style={{ marginTop: "1rem" }}>
                  {saving ? "Saving…" : "Save eligibility rules"}
                </button>
              </>
            ) : (
              <p>Select a campaign to configure geo-fencing and budget caps.</p>
            )}
          </section>
        </div>
      ) : (
        <section className="card">
          <h2>Province nomination leads</h2>
          <p>Schools and communities requesting brand campaigns in their province.</p>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Province</th>
                  <th>School / district</th>
                  <th>Contact</th>
                  <th>Campaign</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {nominations.map((n) => (
                  <tr key={n.id}>
                    <td>{n.provinceName}</td>
                    <td>
                      {n.schoolName ?? "—"}
                      {n.district ? <br /> : null}
                      <small>{n.district ?? ""}</small>
                    </td>
                    <td>
                      {n.contactEmail ?? n.contactPhone ?? "—"}
                      {n.message ? (
                        <>
                          <br />
                          <small>{n.message}</small>
                        </>
                      ) : null}
                    </td>
                    <td>{n.campaignSlug ?? "—"}</td>
                    <td>{n.status}</td>
                    <td>
                      <select
                        defaultValue={n.status}
                        onChange={(e) => void updateNominationStatus(n.id, e.target.value)}
                        style={{ fontSize: "0.8rem" }}
                      >
                        <option value="NEW">NEW</option>
                        <option value="REVIEWED">REVIEWED</option>
                        <option value="CONTACTED">CONTACTED</option>
                        <option value="CLOSED">CLOSED</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
