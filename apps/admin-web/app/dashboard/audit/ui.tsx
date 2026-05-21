"use client";

import { useEffect, useMemo, useState } from "react";
import { useAdminSession } from "../useAdminSession";
import { csrfFetch } from "../admin-client-utils";

type AuditLog = { id: string; action: string; targetType: string; targetId: string; actorId: string | null; createdAt: string };
type AuditResponse = { items: AuditLog[]; pageMeta: { totalPages: number } };
type ExportJob = { id: string; status: "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED"; rowCount: number | null; errorMessage: string | null; createdAt: string };

const FILTER_KEY = "b2s_admin_audit_filters";

export function AuditClient(): JSX.Element {
  const { session, loading } = useAdminSession();
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("");
  const [targetType, setTargetType] = useState("");
  const [actorId, setActorId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<AuditResponse | null>(null);
  const [jobs, setJobs] = useState<ExportJob[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem(FILTER_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw) as Record<string, string>;
    setSearch(saved.search ?? "");
    setAction(saved.action ?? "");
    setTargetType(saved.targetType ?? "");
    setActorId(saved.actorId ?? "");
    setFrom(saved.from ?? "");
    setTo(saved.to ?? "");
  }, []);

  useEffect(() => {
    localStorage.setItem(FILTER_KEY, JSON.stringify({ search, action, targetType, actorId, from, to }));
  }, [search, action, targetType, actorId, from, to]);

  const query = useMemo(() => {
    const params = new URLSearchParams({ page: String(page), pageSize: "30" });
    if (search) params.set("search", search);
    if (action) params.set("action", action);
    if (targetType) params.set("targetType", targetType);
    if (actorId) params.set("actorId", actorId);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    return params.toString();
  }, [search, action, targetType, actorId, from, to, page]);

  const loadData = async (): Promise<void> => {
    const res = await csrfFetch(`/api/admin/audit-logs?${query}`);
    if (!res.ok) return;
    setData((await res.json()) as AuditResponse);
  };

  const loadJobs = async (): Promise<void> => {
    const res = await csrfFetch("/api/admin/audit-logs/export-jobs");
    if (!res.ok) return;
    const json = (await res.json()) as { items: ExportJob[] };
    setJobs(json.items);
  };

  useEffect(() => {
    void loadData();
    void loadJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  useEffect(() => {
    const hasRunning = jobs.some((job) => job.status === "QUEUED" || job.status === "PROCESSING");
    if (!hasRunning) return;
    const handle = setInterval(() => {
      void loadJobs();
    }, 3000);
    return () => clearInterval(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobs]);

  const createExportJob = async (): Promise<void> => {
    const body = {
      search: search || undefined,
      action: action || undefined,
      targetType: targetType || undefined,
      actorId: actorId || undefined,
      from: from || undefined,
      to: to || undefined
    };
    const res = await csrfFetch("/api/admin/audit-logs/export-jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    if (!res.ok) return;
    await loadJobs();
  };

  if (loading || !session) return <p>Loading...</p>;
  if (!data) return <p>Loading audit logs...</p>;

  return (
    <>
      <h1>Audit Module</h1>
      <div className="card" style={{ marginBottom: "1rem", display: "grid", gap: "0.5rem", gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
        <input placeholder="Search" value={search} onChange={(e) => setSearch(e.target.value)} />
        <input placeholder="Action" value={action} onChange={(e) => setAction(e.target.value)} />
        <input placeholder="Target Type" value={targetType} onChange={(e) => setTargetType(e.target.value)} />
        <input placeholder="Actor ID" value={actorId} onChange={(e) => setActorId(e.target.value)} />
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        <button onClick={() => setPage(1)}>Apply Filters</button>
        <a href={`/api/admin/audit-logs/export?${query}`} style={{ alignSelf: "center" }}>Export CSV (direct)</a>
        <button onClick={() => void createExportJob()}>Create server export job</button>
      </div>
      <section className="card">
        <div className="table-wrap"><table className="table"><thead><tr><th>Time</th><th>Action</th><th>Target</th><th>Target ID</th><th>Actor</th></tr></thead><tbody>
          {data.items.map((item) => (
            <tr key={item.id}><td>{new Date(item.createdAt).toLocaleString()}</td><td>{item.action}</td><td>{item.targetType}</td><td>{item.targetId}</td><td>{item.actorId ?? "SYSTEM"}</td></tr>
          ))}
        </tbody></table></div>
        <div style={{ marginTop: "0.75rem", display: "flex", gap: "0.5rem" }}>
          <button disabled={page <= 1} onClick={() => setPage((v) => v - 1)}>Prev</button>
          <span>Page {page}</span>
          <button disabled={page >= data.pageMeta.totalPages} onClick={() => setPage((v) => v + 1)}>Next</button>
        </div>
      </section>
      <section className="card" style={{ marginTop: "1rem" }}>
        <h2>Export Jobs</h2>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Created</th><th>Status</th><th>Rows</th><th>Error</th><th>Download</th></tr></thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id}>
                  <td>{new Date(job.createdAt).toLocaleString()}</td>
                  <td>{job.status}</td>
                  <td>{job.rowCount ?? "-"}</td>
                  <td>{job.errorMessage ?? "-"}</td>
                  <td>{job.status === "COMPLETED" ? <a href={`/api/admin/audit-logs/export-jobs/${job.id}/download`}>Download</a> : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
