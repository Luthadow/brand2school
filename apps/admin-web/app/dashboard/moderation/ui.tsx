"use client";

import { useEffect, useState } from "react";
import { csrfFetch } from "../admin-client-utils";
import { useAdminSession } from "../useAdminSession";

type QueueResponse = {
  openFraudFlags: Array<{
    id: string;
    reason: string;
    severity: string;
    riskScore: number;
    submission: { learner: { fullName: string }; campaign: { name: string } };
  }>;
  pageMeta: { openFraudFlags: { totalPages: number } };
};
type Preset = { id: string; name: string; filters: { search?: string; severity?: string; sortBy?: "RISK" | "NEWEST" } };

export function ModerationClient(): JSX.Element {
  const { session, loading } = useAdminSession();
  const [data, setData] = useState<QueueResponse | null>(null);
  const [search, setSearch] = useState("");
  const [severity, setSeverity] = useState("ALL");
  const [sortBy, setSortBy] = useState<"RISK" | "NEWEST">("RISK");
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [presetName, setPresetName] = useState("");
  const [presets, setPresets] = useState<Preset[]>([]);

  const loadData = async (): Promise<void> => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: "20",
      sortBy,
      search
    });
    if (severity !== "ALL") params.set("severity", severity);
    const res = await csrfFetch(`/api/admin/queue?${params.toString()}`);
    if (!res.ok) return;
    setData((await res.json()) as QueueResponse);
    setSelectedIds([]);
  };

  const loadPresets = async (): Promise<void> => {
    const res = await csrfFetch("/api/admin/presets?module=MODERATION_QUEUE");
    if (!res.ok) return;
    const json = (await res.json()) as { items: Preset[] };
    setPresets(json.items);
  };

  useEffect(() => {
    void loadData();
    void loadPresets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, severity, sortBy, page]);

  const resolve = async (id: string, action: "APPROVE_SUBMISSION" | "REJECT_SUBMISSION"): Promise<void> => {
    const prev = data;
    if (prev) {
      setData({ ...prev, openFraudFlags: prev.openFraudFlags.filter((x) => x.id !== id) });
    }
    const res = await csrfFetch(`/api/admin/moderation/fraud-flags/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, resolutionNote: action === "REJECT_SUBMISSION" ? "Rejected via moderation module." : "Approved via moderation module." })
    });
    if (!res.ok) {
      if (prev) setData(prev);
      setToast("Failed to resolve fraud flag.");
      return;
    }
    setToast("Fraud flag resolved.");
    setTimeout(() => setToast(null), 2200);
    await loadData();
  };

  const bulkResolve = async (action: "APPROVE_SUBMISSION" | "REJECT_SUBMISSION"): Promise<void> => {
    if (selectedIds.length === 0) return;
    const res = await csrfFetch("/api/admin/moderation/fraud-flags/bulk-resolve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: selectedIds, action, resolutionNote: "Bulk moderation action." })
    });
    if (!res.ok) {
      setToast("Bulk moderation failed.");
      return;
    }
    setToast("Bulk moderation completed.");
    setTimeout(() => setToast(null), 2200);
    await loadData();
  };

  const savePreset = async (): Promise<void> => {
    if (!presetName.trim()) return;
    const res = await csrfFetch("/api/admin/presets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        module: "MODERATION_QUEUE",
        name: presetName.trim(),
        filters: { search, severity, sortBy }
      })
    });
    if (!res.ok) return;
    setPresetName("");
    await loadPresets();
  };

  const applyPreset = (id: string): void => {
    const preset = presets.find((x) => x.id === id);
    if (!preset) return;
    setSearch(preset.filters.search ?? "");
    setSeverity(preset.filters.severity ?? "ALL");
    setSortBy(preset.filters.sortBy ?? "RISK");
    setPage(1);
  };

  if (loading || !session) return <p>Loading...</p>;
  if (!data) return <p>Loading moderation queue...</p>;

  return (
    <>
      <h1>Moderation Module</h1>
      <div className="card" style={{ marginBottom: "1rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search reason" />
        <select value={severity} onChange={(e) => setSeverity(e.target.value)}>
          <option value="ALL">All severities</option><option value="LOW">LOW</option><option value="MEDIUM">MEDIUM</option><option value="HIGH">HIGH</option><option value="CRITICAL">CRITICAL</option>
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as "RISK" | "NEWEST")}>
          <option value="RISK">Sort by risk</option><option value="NEWEST">Sort by newest</option>
        </select>
        <input value={presetName} onChange={(e) => setPresetName(e.target.value)} placeholder="Preset name" />
        <button onClick={() => void savePreset()}>Save preset</button>
        <select onChange={(e) => applyPreset(e.target.value)} defaultValue="">
          <option value="" disabled>
            Load preset
          </option>
          {presets.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.name}
            </option>
          ))}
        </select>
      </div>
      <section className="card">
        <div className="table-wrap"><table className="table"><thead><tr><th></th><th>Severity</th><th>Score</th><th>Reason</th><th>Learner</th><th>Campaign</th><th>Action</th></tr></thead><tbody>
          {data.openFraudFlags.map((item) => (
            <tr key={item.id}>
              <td>
                <input
                  type="checkbox"
                  checked={selectedIds.includes(item.id)}
                  onChange={(e) =>
                    setSelectedIds((current) =>
                      e.target.checked ? [...current, item.id] : current.filter((id) => id !== item.id)
                    )
                  }
                />
              </td>
              <td>{item.severity}</td><td>{item.riskScore}</td><td>{item.reason}</td><td>{item.submission.learner.fullName}</td><td>{item.submission.campaign.name}</td>
              <td style={{ display: "flex", gap: "0.5rem" }}>
                <button onClick={() => void resolve(item.id, "APPROVE_SUBMISSION")}>Approve</button>
                <button onClick={() => void resolve(item.id, "REJECT_SUBMISSION")}>Reject</button>
              </td>
            </tr>
          ))}
        </tbody></table></div>
        <div style={{ marginTop: "0.5rem", display: "flex", gap: "0.5rem" }}>
          <button onClick={() => void bulkResolve("APPROVE_SUBMISSION")}>Bulk approve selected</button>
          <button onClick={() => void bulkResolve("REJECT_SUBMISSION")}>Bulk reject selected</button>
        </div>
        <div style={{ marginTop: "0.75rem", display: "flex", gap: "0.5rem" }}>
          <button disabled={page <= 1} onClick={() => setPage((v) => v - 1)}>Prev</button>
          <span>Page {page}</span>
          <button disabled={page >= data.pageMeta.openFraudFlags.totalPages} onClick={() => setPage((v) => v + 1)}>Next</button>
        </div>
      </section>
      {toast ? <div className="toast success">{toast}</div> : null}
    </>
  );
}
