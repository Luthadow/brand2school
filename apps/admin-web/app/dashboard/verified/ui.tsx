"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { csrfFetch } from "../admin-client-utils";
import { useAdminSession } from "../useAdminSession";

type VerifiedSchool = {
  id: string;
  name: string;
  address: string;
  principalName: string;
  email: string;
  status: string;
  organizationCategory?: string;
};

type VerifiedResponse = {
  items: VerifiedSchool[];
  pageMeta: { page: number; pageSize: number; total: number; totalPages: number };
};

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

export function VerifiedClient(): JSX.Element {
  const { session, loading } = useAdminSession();
  const [data, setData] = useState<VerifiedResponse | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState<string | null>(null);

  const loadData = async (): Promise<void> => {
    const query = new URLSearchParams({ page: String(page), pageSize: "25", search }).toString();
    const res = await csrfFetch(`/api/admin/verified-schools?${query}`);
    if (!res.ok) return;
    setData((await res.json()) as VerifiedResponse);
  };

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search]);

  const advanceStatus = async (id: string, current: string): Promise<void> => {
    const next = nextStatus(current);
    if (!next) return;
    const res = await csrfFetch(`/api/admin/approvals/schools/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next })
    });
    const json = (await res.json().catch(() => ({}))) as { message?: string };
    if (!res.ok) {
      setToast(json.message ?? "Could not update status.");
      return;
    }
    setToast(`Status updated to ${next}.`);
    setTimeout(() => setToast(null), 2200);
    await loadData();
  };

  if (loading || !session) return <p>Loading...</p>;
  if (session.user.role !== "SUPER_ADMIN") return <p>Verified module requires SUPER_ADMIN role.</p>;
  if (!data) return <p>Loading verified organisations...</p>;

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
        <h1 style={{ margin: 0 }}>Verified Organisations</h1>
        <a href="/api/admin/reports/verified/pdf" className="btn" style={{ textDecoration: "none" }}>
          Download PDF report
        </a>
      </div>
      <p style={{ color: "#5a6d8a", marginTop: "0.5rem" }}>
        Schools and organisations that have been verified or approved. Pending registrations remain on the Approvals page.
      </p>

      <div className="card" style={{ marginBottom: "1rem", display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search by name, address, principal, or email"
        />
        <button type="button" onClick={() => void loadData()}>
          Refresh
        </button>
        <span style={{ color: "#5a6d8a", fontSize: "0.9rem" }}>
          {data.pageMeta.total} organisation(s)
        </span>
      </div>

      <section className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>School name</th>
                <th>Address</th>
                <th>Principal name</th>
                <th>Email address</th>
                <th>Type</th>
                <th>Status</th>
                <th>Review</th>
              </tr>
            </thead>
            <tbody>
              {data.items.length === 0 ? (
                <tr>
                  <td colSpan={7}>No verified organisations found.</td>
                </tr>
              ) : (
                data.items.map((item) => {
                  const next = nextStatus(item.status);
                  return (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>{item.address}</td>
                    <td>{item.principalName}</td>
                    <td>{item.email}</td>
                    <td>{ORG_CATEGORY_LABEL[item.organizationCategory ?? "SCHOOL"] ?? item.organizationCategory ?? "—"}</td>
                    <td>{item.status}</td>
                    <td>
                      <Link href={`/dashboard/schools/${item.id}/verification`}>Verify</Link>
                      {" · "}
                      <Link href={`/dashboard/schools/${item.id}/infrastructure`}>Infra</Link>
                      {next ? (
                        <>
                          {" · "}
                          <button type="button" onClick={() => void advanceStatus(item.id, item.status)}>
                            Move to {next}
                          </button>
                        </>
                      ) : null}
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: "0.75rem", display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <button type="button" disabled={page <= 1} onClick={() => setPage((v) => v - 1)}>
            Prev
          </button>
          <span>
            Page {data.pageMeta.page} of {data.pageMeta.totalPages}
          </span>
          <button type="button" disabled={page >= data.pageMeta.totalPages} onClick={() => setPage((v) => v + 1)}>
            Next
          </button>
        </div>
      </section>
      {toast ? <div className="toast success">{toast}</div> : null}
    </>
  );
}
