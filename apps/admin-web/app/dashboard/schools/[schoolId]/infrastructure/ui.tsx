"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { csrfFetch } from "../../../admin-client-utils";
import { useAdminSession } from "../../../useAdminSession";

type InfraItem = {
  key: string;
  phase: number;
  category: string;
  needed: number | string;
  current: number | string;
  completionPercent: number;
  verificationStatus: string;
};

type InfraPayload = {
  school: { id: string; name: string; province: string; district: string; status: string };
  validSubmissions: number;
  phaseCompletionThreshold: number;
  development: {
    currentPhase: number;
    tier: number;
    tierLabel: string;
    nationalScore: number;
    phases: Array<{ phase: number; title: string; status: string; progressPercent: number }>;
    infrastructure: { items: InfraItem[]; phases: Array<{ phase: number; title: string; isComplete: boolean }> };
  };
  needsSummary: { complete: number; inProgress: number; maintenanceRequired: number; pending: number };
};

export function SchoolInfrastructureClient({ schoolId }: { schoolId: string }): JSX.Element {
  const { session, loading } = useAdminSession();
  const [data, setData] = useState<InfraPayload | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const load = useCallback(async (): Promise<void> => {
    const res = await csrfFetch(`/api/admin/schools/${schoolId}/infrastructure`);
    if (!res.ok) {
      setToast("Could not load infrastructure.");
      return;
    }
    setData((await res.json()) as InfraPayload);
  }, [schoolId]);

  useEffect(() => {
    void load();
  }, [load]);

  const verifyItem = async (item: InfraItem): Promise<void> => {
    setSavingKey(item.key);
    setToast(null);
    const current =
      typeof item.needed === "number"
        ? item.needed
        : typeof item.current === "string"
          ? item.needed
          : item.current;

    const res = await csrfFetch(`/api/admin/schools/${schoolId}/infrastructure`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        itemPatches: [
          {
            key: item.key,
            verificationStatus: "verified",
            current,
            completionPercent: 100
          }
        ],
        adminNote: `Admin verified ${item.category}`
      })
    });
    setSavingKey(null);
    const body = (await res.json().catch(() => ({}))) as {
      message?: string;
      governanceNotified?: number;
    };
    if (!res.ok) {
      setToast(body.message ?? "Update failed.");
      return;
    }
    setToast(
      body.governanceNotified
        ? `${body.message ?? "Saved."} Governance emails sent: ${body.governanceNotified}.`
        : body.message ?? "Infrastructure updated."
    );
    await load();
  };

  const recalculate = async (): Promise<void> => {
    setToast(null);
    const res = await csrfFetch(`/api/admin/schools/${schoolId}/infrastructure`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recalculate: true })
    });
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    if (!res.ok) {
      setToast(body.message ?? "Recalculate failed.");
      return;
    }
    setToast(body.message ?? "Recalculated.");
    await load();
  };

  if (loading || !session) return <p>Loading...</p>;
  if (session.user.role !== "SUPER_ADMIN") return <p>SUPER_ADMIN required.</p>;
  if (!data) return <p>Loading school infrastructure…</p>;

  const { development: dev } = data;

  return (
    <div>
      <p style={{ marginBottom: "0.75rem" }}>
        <Link href="/dashboard/approvals">← Approvals</Link>
      </p>
      <h1 style={{ marginBottom: "0.25rem" }}>{data.school.name}</h1>
      <p style={{ color: "#475569", marginBottom: "1rem" }}>
        {data.school.district}, {data.school.province} · Phase {dev.currentPhase} · {dev.tierLabel} ·
        National score {dev.nationalScore}% · {data.validSubmissions} valid submissions
      </p>

      {toast ? (
        <p style={{ padding: "0.5rem", background: "#ecfdf5", borderRadius: 8, marginBottom: "1rem" }}>{toast}</p>
      ) : null}

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        <button type="button" onClick={() => void recalculate()}>
          Recalculate from engine
        </button>
        <span style={{ fontSize: "0.9rem", color: "#64748b" }}>
          Needs: {data.needsSummary.complete} complete · {data.needsSummary.inProgress} in progress ·{" "}
          {data.needsSummary.maintenanceRequired} maintenance · threshold {data.phaseCompletionThreshold}%
        </span>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
        <thead>
          <tr style={{ background: "#f1f5f9", textAlign: "left" }}>
            <th style={{ padding: "0.5rem" }}>Phase</th>
            <th style={{ padding: "0.5rem" }}>Category</th>
            <th style={{ padding: "0.5rem" }}>Progress</th>
            <th style={{ padding: "0.5rem" }}>Status</th>
            <th style={{ padding: "0.5rem" }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {dev.infrastructure.items.map((item) => (
            <tr key={item.key} style={{ borderBottom: "1px solid #e2e8f0" }}>
              <td style={{ padding: "0.5rem" }}>{item.phase}</td>
              <td style={{ padding: "0.5rem" }}>{item.category}</td>
              <td style={{ padding: "0.5rem" }}>
                {item.current} / {String(item.needed)} ({item.completionPercent}%)
              </td>
              <td style={{ padding: "0.5rem" }}>{item.verificationStatus}</td>
              <td style={{ padding: "0.5rem" }}>
                {item.verificationStatus !== "verified" || item.completionPercent < 100 ? (
                  <button
                    type="button"
                    disabled={savingKey === item.key}
                    onClick={() => void verifyItem(item)}
                  >
                    {savingKey === item.key ? "Saving…" : "Verify complete"}
                  </button>
                ) : (
                  <span style={{ color: "#16a34a" }}>Verified</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
