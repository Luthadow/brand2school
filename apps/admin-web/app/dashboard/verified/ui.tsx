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

const DEFAULT_PROGRESS_MESSAGE =
  "Thank you for being part of Brand2School. We wanted to share a brief update on platform progress and what it means for your organisation.\n\n" +
  "Please log in to your dashboard to review your profile, documents, and participation status. Our team is here if you need support.";

export function VerifiedClient(): JSX.Element {
  const { session, loading } = useAdminSession();
  const [data, setData] = useState<VerifiedResponse | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState<string | null>(null);
  const [sendingWelcomeId, setSendingWelcomeId] = useState<string | null>(null);
  const [progressSchool, setProgressSchool] = useState<VerifiedSchool | null>(null);
  const [progressSubject, setProgressSubject] = useState("");
  const [progressMessage, setProgressMessage] = useState(DEFAULT_PROGRESS_MESSAGE);
  const [sendingProgress, setSendingProgress] = useState(false);

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

  const showToast = (message: string): void => {
    setToast(message);
    setTimeout(() => setToast(null), 2800);
  };

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
      showToast(json.message ?? "Could not update status.");
      return;
    }
    showToast(`Status updated to ${next}.`);
    await loadData();
  };

  const sendWelcomeEmail = async (school: VerifiedSchool): Promise<void> => {
    if (school.email === "—") {
      showToast("No email address on file for this organisation.");
      return;
    }
    setSendingWelcomeId(school.id);
    const res = await csrfFetch(`/api/admin/verified-schools/${school.id}/emails/welcome`, { method: "POST" });
    const json = (await res.json().catch(() => ({}))) as { message?: string };
    setSendingWelcomeId(null);
    if (!res.ok) {
      showToast(json.message ?? "Could not send welcome email.");
      return;
    }
    showToast(json.message ?? "Welcome email sent.");
  };

  const openProgressPanel = (school: VerifiedSchool): void => {
    setProgressSchool(school);
    setProgressSubject("");
    setProgressMessage(DEFAULT_PROGRESS_MESSAGE);
  };

  const sendProgressEmail = async (): Promise<void> => {
    if (!progressSchool) return;
    if (progressSchool.email === "—") {
      showToast("No email address on file for this organisation.");
      return;
    }
    setSendingProgress(true);
    const res = await csrfFetch(`/api/admin/verified-schools/${progressSchool.id}/emails/progress`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject: progressSubject.trim() || undefined,
        message: progressMessage
      })
    });
    const json = (await res.json().catch(() => ({}))) as { message?: string };
    setSendingProgress(false);
    if (!res.ok) {
      showToast(json.message ?? "Could not send progress update.");
      return;
    }
    setProgressSchool(null);
    showToast(json.message ?? "Progress update sent.");
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
        Schools and organisations that have been verified or approved. Send welcome or progress update emails from the
        Email column.
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
                <th>Email</th>
                <th>Review</th>
              </tr>
            </thead>
            <tbody>
              {data.items.length === 0 ? (
                <tr>
                  <td colSpan={8}>No verified organisations found.</td>
                </tr>
              ) : (
                data.items.map((item) => {
                  const next = nextStatus(item.status);
                  const emailDisabled = item.email === "—";
                  return (
                    <tr key={item.id}>
                      <td>{item.name}</td>
                      <td>{item.address}</td>
                      <td>{item.principalName}</td>
                      <td>{item.email}</td>
                      <td>{ORG_CATEGORY_LABEL[item.organizationCategory ?? "SCHOOL"] ?? item.organizationCategory ?? "—"}</td>
                      <td>{item.status}</td>
                      <td>
                        <div className="verified-email-actions">
                          <button
                            type="button"
                            className="verified-email-actions__btn verified-email-actions__btn--welcome"
                            disabled={emailDisabled || sendingWelcomeId === item.id}
                            title={emailDisabled ? "No email on file" : "Send welcome email"}
                            onClick={() => void sendWelcomeEmail(item)}
                          >
                            {sendingWelcomeId === item.id ? "Sending…" : "Welcome"}
                          </button>
                          <button
                            type="button"
                            className="verified-email-actions__btn verified-email-actions__btn--update"
                            disabled={emailDisabled}
                            title={emailDisabled ? "No email on file" : "Send progress update"}
                            onClick={() => openProgressPanel(item)}
                          >
                            Update
                          </button>
                        </div>
                      </td>
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

      {progressSchool ? (
        <div className="verified-email-modal" role="dialog" aria-modal="true" aria-labelledby="verified-email-modal-title">
          <div className="verified-email-modal__backdrop" onClick={() => setProgressSchool(null)} />
          <div className="verified-email-modal__panel card">
            <h2 id="verified-email-modal-title" style={{ marginTop: 0 }}>
              Send progress update
            </h2>
            <p style={{ color: "#5a6d8a", marginTop: 0 }}>
              To <strong>{progressSchool.name}</strong> · {progressSchool.email}
            </p>
            <label style={{ display: "block", marginBottom: "0.75rem" }}>
              <span style={{ display: "block", marginBottom: "0.35rem", fontWeight: 600 }}>Subject (optional)</span>
              <input
                value={progressSubject}
                onChange={(e) => setProgressSubject(e.target.value)}
                placeholder={`Brand2School update — ${progressSchool.name}`}
                style={{ width: "100%" }}
              />
            </label>
            <label style={{ display: "block", marginBottom: "0.75rem" }}>
              <span style={{ display: "block", marginBottom: "0.35rem", fontWeight: 600 }}>Message</span>
              <textarea
                value={progressMessage}
                onChange={(e) => setProgressMessage(e.target.value)}
                rows={8}
                style={{ width: "100%", resize: "vertical" }}
              />
            </label>
            <p style={{ fontSize: "0.85rem", color: "#5a6d8a", marginTop: 0 }}>
              Platform stats (registered schools, verified submissions, active partners) are added automatically.
            </p>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <button type="button" disabled={sendingProgress} onClick={() => void sendProgressEmail()}>
                {sendingProgress ? "Sending…" : "Send email"}
              </button>
              <button type="button" onClick={() => setProgressSchool(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {toast ? <div className="toast success">{toast}</div> : null}
    </>
  );
}
