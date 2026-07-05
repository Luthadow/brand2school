"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { csrfFetch } from "../admin-client-utils";
import { useAdminSession } from "../useAdminSession";

type QueueResponse = {
  pendingUsers: Array<{ id: string; fullName: string; email: string; role: string; status: string }>;
  pendingSchools: Array<{
    id: string;
    name: string;
    province: string;
    district: string;
    status: string;
    organizationCategory?: string;
    verification?: {
      status: string;
      emisNumber: string | null;
      registrationNumber?: string | null;
      submittedAt: string | null;
      centreType?: string | null;
    } | null;
  }>;
  pendingBrands: Array<{ id: string; name: string; status: string }>;
  pageMeta: {
    pendingUsers: { page: number; totalPages: number };
    pendingSchools: { page: number; totalPages: number };
    pendingBrands: { page: number; totalPages: number };
  };
};
type Preset = { id: string; name: string; module: string; filters: { search?: string } };

const ORG_CATEGORY_LABEL: Record<string, string> = {
  SCHOOL: "School",
  NGO_NPO: "NGO",
  COMMUNITY: "Community",
  FAITH: "Faith"
};

const statusProgression = ["PENDING", "VERIFIED", "APPROVED", "ACTIVE"] as const;
const nextStatus = (status: string): string | null => {
  const idx = statusProgression.indexOf(status as (typeof statusProgression)[number]);
  return idx >= 0 && idx < statusProgression.length - 1 ? statusProgression[idx + 1] : null;
};

export function ApprovalsClient(): JSX.Element {
  const { session, loading } = useAdminSession();
  const [data, setData] = useState<QueueResponse | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState<string | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedSchools, setSelectedSchools] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [presetName, setPresetName] = useState("");
  const [presets, setPresets] = useState<Preset[]>([]);

  const loadData = async (): Promise<void> => {
    const query = new URLSearchParams({ page: String(page), pageSize: "15", search }).toString();
    const res = await csrfFetch(`/api/admin/queue?${query}`);
    if (!res.ok) return;
    setData((await res.json()) as QueueResponse);
    setSelectedUsers([]);
    setSelectedSchools([]);
    setSelectedBrands([]);
  };

  const loadPresets = async (): Promise<void> => {
    const res = await csrfFetch("/api/admin/presets?module=APPROVALS_QUEUE");
    if (!res.ok) return;
    const json = (await res.json()) as { items: Preset[] };
    setPresets(json.items);
  };

  useEffect(() => {
    void loadData();
    void loadPresets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search]);

  if (loading || !session) return <p>Loading...</p>;
  if (session.user.role !== "SUPER_ADMIN") return <p>Approvals module requires SUPER_ADMIN role.</p>;
  if (!data) return <p>Loading approvals queue...</p>;

  const approve = async (entity: "users" | "schools" | "brands", id: string, current: string): Promise<void> => {
    const next = nextStatus(current);
    if (!next) return;
    const res = await csrfFetch(`/api/admin/approvals/${entity}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next })
    });
    const json = (await res.json().catch(() => ({}))) as { message?: string; verificationStatus?: string };
    if (!res.ok) {
      setToast(json.message ?? "Action failed.");
      return;
    }
    setToast(`Status updated to ${next}.`);
    setTimeout(() => setToast(null), 2200);
    await loadData();
  };

  const removeSchool = async (id: string): Promise<void> => {
    const res = await csrfFetch(`/api/admin/approvals/schools/${id}/suspend`, { method: "PATCH" });
    const json = (await res.json().catch(() => ({}))) as { message?: string };
    if (!res.ok) {
      setToast(json.message ?? "Could not remove school.");
      return;
    }
    setToast("School removed from the approvals queue.");
    setTimeout(() => setToast(null), 2200);
    await loadData();
  };

  const bulkApprove = async (entity: "users" | "schools" | "brands", ids: string[], status: string): Promise<void> => {
    if (ids.length === 0) return;
    const res = await csrfFetch("/api/admin/approvals/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entity, ids, status })
    });
    if (!res.ok) {
      setToast("Bulk action failed.");
      return;
    }
    setToast("Bulk action completed.");
    setTimeout(() => setToast(null), 2200);
    await loadData();
  };

  const savePreset = async (): Promise<void> => {
    if (!presetName.trim()) return;
    const res = await csrfFetch("/api/admin/presets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        module: "APPROVALS_QUEUE",
        name: presetName.trim(),
        filters: { search }
      })
    });
    if (!res.ok) {
      setToast("Failed to save preset.");
      return;
    }
    setPresetName("");
    await loadPresets();
    setToast("Preset saved.");
    setTimeout(() => setToast(null), 2200);
  };

  const applyPreset = (id: string): void => {
    const preset = presets.find((x) => x.id === id);
    if (!preset) return;
    setSearch(preset.filters.search ?? "");
    setPage(1);
  };

  return (
    <>
      <h1>Approvals Module</h1>
      <div className="card" style={{ marginBottom: "1rem", display: "flex", gap: "0.75rem", alignItems: "center" }}>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users, schools, brands" />
        <button onClick={() => void loadData()}>Refresh</button>
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

      <section className="card" style={{ marginBottom: "1rem" }}>
        <h2>Users</h2>
        <div className="table-wrap"><table className="table"><thead><tr><th></th><th>Name</th><th>Email</th><th>Status</th><th>Action</th></tr></thead><tbody>
          {data.pendingUsers.map((item) => (
            <tr key={item.id}>
              <td>
                <input
                  type="checkbox"
                  checked={selectedUsers.includes(item.id)}
                  onChange={(e) =>
                    setSelectedUsers((current) =>
                      e.target.checked ? [...current, item.id] : current.filter((id) => id !== item.id)
                    )
                  }
                />
              </td>
              <td>{item.fullName}</td><td>{item.email}</td><td>{item.status}</td>
              <td><button disabled={!nextStatus(item.status)} onClick={() => void approve("users", item.id, item.status)}>Move Forward</button></td></tr>
          ))}
        </tbody></table></div>
        <button style={{ marginTop: "0.5rem" }} onClick={() => void bulkApprove("users", selectedUsers, "VERIFIED")}>
          Bulk move selected users to VERIFIED
        </button>
      </section>

      <section className="card" style={{ marginBottom: "1rem" }}>
        <h2>Organisations awaiting approval</h2>
        <p style={{ color: "#5a6d8a", fontSize: "0.9rem", marginTop: 0 }}>
          Pending registrations only. Verified and approved organisations appear on the{" "}
          <Link href="/dashboard/verified">Verified</Link> page. Use <strong>Move Forward</strong> to advance status
          (PENDING → VERIFIED → APPROVED → ACTIVE). Moving to APPROVED or ACTIVE requires the verification packet to be
          approved on the Verify screen.
        </p>
        <div className="table-wrap"><table className="table"><thead><tr><th></th><th>Name</th><th>Type</th><th>District</th><th>Status</th><th>Docs packet</th><th>Review</th><th>Action</th></tr></thead><tbody>
          {data.pendingSchools.map((item) => {
            const packetApproved = item.verification?.status === "APPROVED";
            const next = nextStatus(item.status);
            const needsDocsForNext =
              next === "APPROVED" || next === "ACTIVE" ? !packetApproved : false;
            const canAdvance = Boolean(next) && !needsDocsForNext;
            const regRef = item.verification?.emisNumber ?? item.verification?.registrationNumber;
            return (
            <tr key={item.id}>
              <td>
                <input
                  type="checkbox"
                  checked={selectedSchools.includes(item.id)}
                  onChange={(e) =>
                    setSelectedSchools((current) =>
                      e.target.checked ? [...current, item.id] : current.filter((id) => id !== item.id)
                    )
                  }
                />
              </td>
              <td>{item.name}</td>
              <td>{ORG_CATEGORY_LABEL[item.organizationCategory ?? "SCHOOL"] ?? item.organizationCategory ?? "—"}</td>
              <td>{item.district}</td>
              <td>{item.status}</td>
              <td>
                {item.verification?.status ?? "—"}
                {regRef ? ` (${regRef})` : ""}
              </td>
              <td>
                <Link href={`/dashboard/schools/${item.id}/verification`}>Verify</Link>
                {" · "}
                <Link href={`/dashboard/schools/${item.id}/infrastructure`}>Infra</Link>
              </td>
              <td>
                <button
                  disabled={!canAdvance}
                  title={
                    needsDocsForNext
                      ? "Approve verification packet first (Verify screen — provisional approval allowed)"
                      : next
                        ? `Move to ${next}`
                        : undefined
                  }
                  onClick={() => void approve("schools", item.id, item.status)}
                >
                  {next ? `Move to ${next}` : "At final step"}
                </button>
                {" "}
                <button type="button" onClick={() => void removeSchool(item.id)}>
                  Remove
                </button>
              </td>
            </tr>
            );
          })}
        </tbody></table></div>
        <button style={{ marginTop: "0.5rem" }} onClick={() => void bulkApprove("schools", selectedSchools, "VERIFIED")}>
          Bulk move selected schools to VERIFIED
        </button>
        <div style={{ marginTop: "0.75rem", display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <button type="button" disabled={page <= 1} onClick={() => setPage((v) => v - 1)}>
            Prev
          </button>
          <span>
            Page {page} of {data.pageMeta.pendingSchools.totalPages}
          </span>
          <button
            type="button"
            disabled={page >= data.pageMeta.pendingSchools.totalPages}
            onClick={() => setPage((v) => v + 1)}
          >
            Next
          </button>
        </div>
      </section>

      <section className="card">
        <h2>Brands</h2>
        <div className="table-wrap"><table className="table"><thead><tr><th></th><th>Name</th><th>Status</th><th>Review</th><th>Action</th></tr></thead><tbody>
          {data.pendingBrands.map((item) => (
            <tr key={item.id}>
              <td>
                <input
                  type="checkbox"
                  checked={selectedBrands.includes(item.id)}
                  onChange={(e) =>
                    setSelectedBrands((current) =>
                      e.target.checked ? [...current, item.id] : current.filter((id) => id !== item.id)
                    )
                  }
                />
              </td>
              <td>{item.name}</td><td>{item.status}</td>
              <td>
                <Link href={`/dashboard/commercial?brandId=${item.id}`}>Commercial</Link>
              </td>
              <td><button disabled={!nextStatus(item.status)} onClick={() => void approve("brands", item.id, item.status)}>Move Forward</button></td></tr>
          ))}
        </tbody></table></div>
        <button style={{ marginTop: "0.5rem" }} onClick={() => void bulkApprove("brands", selectedBrands, "VERIFIED")}>
          Bulk move selected brands to VERIFIED
        </button>
      </section>
      {toast ? <div className="toast success">{toast}</div> : null}
    </>
  );
}
