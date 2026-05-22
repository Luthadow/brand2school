"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { csrfFetch } from "../../../admin-client-utils";
import { useAdminSession } from "../../../useAdminSession";

type VerificationPayload = {
  school: {
    id: string;
    name: string;
    province: string;
    district: string;
    status: string;
    principalName: string;
    contactEmail: string | null;
    schoolCode: string;
  };
  verification: {
    status: string;
    emisNumber: string | null;
    principalIdUrl: string | null;
    schoolLetterUrl: string | null;
    emisEvidenceUrl: string | null;
    submittedAt: string | null;
    rejectionReason: string | null;
    reviewerNotes: string | null;
  } | null;
};

export function SchoolVerificationClient({ schoolId }: { schoolId: string }): JSX.Element {
  const { session, loading } = useAdminSession();
  const [data, setData] = useState<VerificationPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [infoRequest, setInfoRequest] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await csrfFetch(`/api/admin/schools/${schoolId}/verification`);
    if (!res.ok) {
      setError("Could not load verification packet.");
      return;
    }
    setData((await res.json()) as VerificationPayload);
    setError(null);
  }, [schoolId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function review(action: "APPROVE" | "REJECT" | "MARK_UNDER_REVIEW"): Promise<void> {
    const res = await csrfFetch(`/api/admin/schools/${schoolId}/verification`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        reviewerNotes: notes.trim() || undefined,
        rejectionReason: action === "REJECT" ? rejectionReason.trim() : undefined
      })
    });
    const json = (await res.json().catch(() => ({}))) as { message?: string };
    if (!res.ok) {
      setToast(json.message ?? "Review action failed.");
      return;
    }
    setToast("Verification updated.");
    setTimeout(() => setToast(null), 2200);
    await load();
  }

  async function requestInfo(): Promise<void> {
    const message = infoRequest.trim();
    if (message.length < 10) {
      setToast("Enter at least 10 characters describing what the school must provide.");
      return;
    }
    const res = await csrfFetch(`/api/admin/schools/${schoolId}/verification/request-info`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message })
    });
    const json = (await res.json().catch(() => ({}))) as { message?: string; emailed?: string };
    if (!res.ok) {
      setToast(json.message ?? "Could not send request to the school.");
      return;
    }
    setToast(`Requirements emailed to ${json.emailed ?? "the principal"}.`);
    setInfoRequest("");
    setTimeout(() => setToast(null), 3200);
  }

  if (loading || !session) return <p>Loading...</p>;
  if (session.user.role !== "SUPER_ADMIN") return <p>School verification requires SUPER_ADMIN.</p>;
  if (error) return <p>{error}</p>;
  if (!data) return <p>Loading verification…</p>;

  const v = data.verification;

  return (
    <>
      <p>
        <Link href="/dashboard/approvals">← Approvals</Link>
      </p>
      <h1>EMIS verification — {data.school.name}</h1>
      <p>
        {data.school.district}, {data.school.province} · Entity status: <strong>{data.school.status}</strong> · Code{" "}
        {data.school.schoolCode}
      </p>

      <section className="card" style={{ marginTop: "1rem" }}>
        <h2 style={{ fontSize: "1.1rem", marginTop: 0 }}>Request documents or information</h2>
        <p style={{ color: "#4b5563", fontSize: "0.9rem" }}>
          Email the principal with required EMIS documents or corrections. Use{" "}
          <Link href="/dashboard/approvals">Approvals</Link> to advance entity status after verification.
        </p>
        <textarea
          value={infoRequest}
          onChange={(e) => setInfoRequest(e.target.value)}
          rows={4}
          placeholder="e.g. Upload principal ID, official school letter, and EMIS registry screenshot via the school portal."
          style={{ width: "100%", marginTop: "0.5rem" }}
        />
        <button type="button" style={{ marginTop: "0.5rem" }} onClick={() => void requestInfo()}>
          Email requirements to principal
        </button>
      </section>

      {!v ? (
        <p className="card" style={{ marginTop: "1rem" }}>No verification packet submitted yet.</p>
      ) : (
        <section className="card" style={{ marginTop: "1rem" }}>
          <p>
            <strong>Packet status:</strong> {v.status}
            {v.emisNumber ? ` · EMIS ${v.emisNumber}` : null}
          </p>
          {v.submittedAt ? <p>Submitted {new Date(v.submittedAt).toLocaleString("en-ZA")}</p> : null}
          <ul style={{ marginTop: "1rem" }}>
            {v.principalIdUrl ? (
              <li>
                <a href={v.principalIdUrl} target="_blank" rel="noreferrer">
                  Principal ID
                </a>
              </li>
            ) : null}
            {v.schoolLetterUrl ? (
              <li>
                <a href={v.schoolLetterUrl} target="_blank" rel="noreferrer">
                  School letter
                </a>
              </li>
            ) : null}
            {v.emisEvidenceUrl ? (
              <li>
                <a href={v.emisEvidenceUrl} target="_blank" rel="noreferrer">
                  EMIS evidence
                </a>
              </li>
            ) : null}
          </ul>

          <label style={{ display: "block", marginTop: "1rem" }}>
            Reviewer notes (optional)
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} style={{ width: "100%" }} />
          </label>
          <label style={{ display: "block", marginTop: "0.75rem" }}>
            Rejection reason (required if rejecting)
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={3}
              style={{ width: "100%" }}
            />
          </label>

          <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem", flexWrap: "wrap" }}>
            <button type="button" onClick={() => void review("MARK_UNDER_REVIEW")}>
              Mark under review
            </button>
            <button type="button" onClick={() => void review("APPROVE")}>
              Approve packet
            </button>
            <button type="button" onClick={() => void review("REJECT")}>
              Reject packet
            </button>
            <Link href={`/dashboard/schools/${schoolId}/infrastructure`}>Edit infrastructure</Link>
          </div>
        </section>
      )}
      {toast ? <div className="toast success">{toast}</div> : null}
    </>
  );
}
