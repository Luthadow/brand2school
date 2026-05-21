"use client";

import { useEffect, useMemo, useState } from "react";
import { csrfFetch } from "../admin-client-utils";
import { useAdminSession } from "../useAdminSession";

type DeliveryStatus = "QUEUED" | "PROCESSING" | "SENT" | "FAILED";

type NotificationJob = {
  id: string;
  status: DeliveryStatus;
  attempts: number;
  maxAttempts: number;
  scheduledAt: string;
  processedAt: string | null;
  lastError: string | null;
};

type NotificationLog = {
  id: string;
  template: string;
  recipient: string;
  subject: string | null;
  status: DeliveryStatus;
  entityType: string | null;
  entityId: string | null;
  errorMessage: string | null;
  sentAt: string | null;
  createdAt: string;
  job: NotificationJob | null;
};

type LogsResponse = {
  total: number;
  page: number;
  pageSize: number;
  logs: NotificationLog[];
};

const TEMPLATES = [
  "SCHOOL_REGISTRATION",
  "SCHOOL_APPROVED",
  "BRAND_WELCOME",
  "PASSWORD_RESET",
  "CONTACT_INQUIRY_INFO",
  "CONTACT_ACK",
  "ESG_REPORT"
] as const;

const STATUSES: DeliveryStatus[] = ["QUEUED", "PROCESSING", "SENT", "FAILED"];

const FILTER_KEY = "b2s_admin_notification_filters";

function statusStyle(status: DeliveryStatus): React.CSSProperties {
  const colors: Record<DeliveryStatus, { bg: string; border: string }> = {
    QUEUED: { bg: "#eef4ff", border: "#b8c9ff" },
    PROCESSING: { bg: "#fff7e6", border: "#f0c36d" },
    SENT: { bg: "#e8f8f0", border: "#7fd4a8" },
    FAILED: { bg: "#fdecec", border: "#f0a0a0" }
  };
  const c = colors[status];
  return {
    display: "inline-block",
    padding: "0.15rem 0.45rem",
    borderRadius: "6px",
    fontSize: "0.8rem",
    background: c.bg,
    border: `1px solid ${c.border}`
  };
}

export function NotificationsClient(): JSX.Element {
  const { session, loading } = useAdminSession();
  const [template, setTemplate] = useState("");
  const [status, setStatus] = useState("");
  const [recipient, setRecipient] = useState("");
  const [entityType, setEntityType] = useState("");
  const [entityId, setEntityId] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<LogsResponse | null>(null);
  const [toast, setToast] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem(FILTER_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw) as Record<string, string>;
    setTemplate(saved.template ?? "");
    setStatus(saved.status ?? "");
    setRecipient(saved.recipient ?? "");
    setEntityType(saved.entityType ?? "");
    setEntityId(saved.entityId ?? "");
  }, []);

  useEffect(() => {
    localStorage.setItem(
      FILTER_KEY,
      JSON.stringify({ template, status, recipient, entityType, entityId })
    );
  }, [template, status, recipient, entityType, entityId]);

  const query = useMemo(() => {
    const params = new URLSearchParams({ page: String(page), pageSize: "25" });
    if (template) params.set("template", template);
    if (status) params.set("status", status);
    if (recipient) params.set("recipient", recipient);
    if (entityType) params.set("entityType", entityType);
    if (entityId) params.set("entityId", entityId);
    return params.toString();
  }, [template, status, recipient, entityType, entityId, page]);

  const loadData = async (): Promise<void> => {
    const res = await csrfFetch(`/api/admin/notifications/logs?${query}`);
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { message?: string };
      setToast({ kind: "error", text: err.message ?? "Failed to load notification logs." });
      return;
    }
    setData((await res.json()) as LogsResponse);
  };

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const retryJob = async (jobId: string): Promise<void> => {
    setRetryingId(jobId);
    const res = await csrfFetch(`/api/admin/notifications/jobs/${jobId}/retry`, { method: "POST" });
    setRetryingId(null);
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { message?: string };
      setToast({ kind: "error", text: err.message ?? "Retry failed." });
      return;
    }
    setToast({ kind: "success", text: "Notification queued for retry." });
    setTimeout(() => setToast(null), 2500);
    await loadData();
  };

  if (loading || !session) return <p>Loading...</p>;
  if (session.user.role !== "SUPER_ADMIN") {
    return <p>Notification logs require SUPER_ADMIN role.</p>;
  }
  if (!data) return <p>Loading notification logs...</p>;

  const totalPages = Math.max(1, Math.ceil(data.total / data.pageSize));

  return (
    <>
      <h1>Notification Logs</h1>
      <p style={{ marginTop: 0, color: "#4a5f7a" }}>
        Outbound email audit trail and queue status. Failed jobs can be re-queued for the notification worker.
      </p>

      <div className="card" style={{ marginBottom: "1rem", display: "grid", gap: "0.5rem", gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
        <select value={template} onChange={(e) => setTemplate(e.target.value)}>
          <option value="">All templates</option>
          {TEMPLATES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <input placeholder="Recipient email" value={recipient} onChange={(e) => setRecipient(e.target.value)} />
        <input placeholder="Entity type" value={entityType} onChange={(e) => setEntityType(e.target.value)} />
        <input placeholder="Entity ID" value={entityId} onChange={(e) => setEntityId(e.target.value)} />
        <button
          onClick={() => {
            setPage(1);
            void loadData();
          }}
        >
          Apply filters
        </button>
      </div>

      <section className="card">
        <p style={{ marginTop: 0 }}>
          {data.total} log{data.total === 1 ? "" : "s"} · page {data.page} of {totalPages}
        </p>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Created</th>
                <th>Template</th>
                <th>Recipient</th>
                <th>Subject</th>
                <th>Status</th>
                <th>Entity</th>
                <th>Job</th>
                <th>Error</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.logs.length === 0 ? (
                <tr>
                  <td colSpan={9}>No notification logs match these filters.</td>
                </tr>
              ) : (
                data.logs.map((log) => (
                  <tr key={log.id}>
                    <td>{new Date(log.createdAt).toLocaleString()}</td>
                    <td>{log.template}</td>
                    <td>{log.recipient}</td>
                    <td>{log.subject ?? "—"}</td>
                    <td>
                      <span style={statusStyle(log.status)}>{log.status}</span>
                    </td>
                    <td>
                      {log.entityType ? `${log.entityType}` : "—"}
                      {log.entityId ? (
                        <>
                          <br />
                          <small>{log.entityId}</small>
                        </>
                      ) : null}
                    </td>
                    <td>
                      {log.job ? (
                        <>
                          <span style={statusStyle(log.job.status)}>{log.job.status}</span>
                          <br />
                          <small>
                            {log.job.attempts}/{log.job.maxAttempts} attempts
                          </small>
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      <small>{log.errorMessage ?? log.job?.lastError ?? "—"}</small>
                    </td>
                    <td>
                      {log.job && log.job.status !== "SENT" ? (
                        <button
                          disabled={retryingId === log.job.id}
                          onClick={() => void retryJob(log.job!.id)}
                        >
                          {retryingId === log.job.id ? "Retrying…" : "Retry"}
                        </button>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: "0.75rem", display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <button disabled={page <= 1} onClick={() => setPage((v) => v - 1)}>
            Prev
          </button>
          <span>
            Page {page} / {totalPages}
          </span>
          <button disabled={page >= totalPages} onClick={() => setPage((v) => v + 1)}>
            Next
          </button>
          <button style={{ marginLeft: "auto" }} onClick={() => void loadData()}>
            Refresh
          </button>
        </div>
      </section>

      {toast ? <div className={`toast ${toast.kind}`}>{toast.text}</div> : null}
    </>
  );
}
