"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { csrfFetch } from "../../../admin-client-utils";
import { useAdminSession } from "../../../useAdminSession";

const ORG_CATEGORY_LABEL: Record<string, string> = {
  SCHOOL: "School",
  NGO_NPO: "NGO / NPO",
  COMMUNITY: "Community",
  FAITH: "Faith"
};

type VerificationDoc = {
  key: string;
  label: string;
  required: boolean;
  url: string | null;
  uploaded: boolean;
  deferred: boolean;
};

type VerificationPayload = {
  status: string;
  organizationCategory: string;
  centreType: string | null;
  centreTypeLabel: string | null;
  emisNumber: string | null;
  registrationNumber: string | null;
  registrationNumberLabel: string | null;
  registrationDeferred: boolean;
  claimReady: boolean;
  hasActiveDeferrals: boolean;
  submittedAt: string | null;
  rejectionReason: string | null;
  reviewerNotes: string | null;
  documents: VerificationDoc[];
};

type VerificationResponse = {
  school: {
    id: string;
    name: string;
    province: string;
    district: string;
    status: string;
    principalName: string;
    contactEmail: string | null;
    schoolCode: string;
    organizationCategory: string;
  };
  verification: VerificationPayload | null;
};

export function SchoolVerificationClient({ schoolId }: { schoolId: string }): JSX.Element {
  const { session, loading } = useAdminSession();
  const [data, setData] = useState<VerificationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await csrfFetch(`/api/admin/schools/${schoolId}/verification`);
    if (!res.ok) {
      setError("Could not load verification packet.");
      return;
    }
    setData((await res.json()) as VerificationResponse);
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

  async function resendDocumentsEmail(): Promise<void> {
    const res = await csrfFetch(`/api/admin/schools/${schoolId}/verification/request-info`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({})
    });
    const json = (await res.json().catch(() => ({}))) as { message?: string; emailed?: string };
    if (!res.ok) {
      setToast(json.message ?? "Could not resend the automated documents email.");
      return;
    }
    setToast(`Automated documents email sent to ${json.emailed ?? "the contact"}.`);
    setTimeout(() => setToast(null), 3200);
  }

  if (loading || !session) return <p>Loading...</p>;
  if (session.user.role !== "SUPER_ADMIN") return <p>School verification requires SUPER_ADMIN.</p>;
  if (error) return <p>{error}</p>;
  if (!data) return <p>Loading verification…</p>;

  const v = data.verification;
  const orgLabel = ORG_CATEGORY_LABEL[data.school.organizationCategory] ?? data.school.organizationCategory;
  const regValue = v?.emisNumber ?? v?.registrationNumber;

  return (
    <>
      <p>
        <Link href={`/dashboard/schools/${schoolId}`}>← School profile</Link>
        {" · "}
        <Link href="/dashboard/verified">Verified</Link>
      </p>
      <h1>Verification — {data.school.name}</h1>
      <p>
        {orgLabel} · {data.school.district}, {data.school.province} · Entity status:{" "}
        <strong>{data.school.status}</strong> · Code {data.school.schoolCode}
      </p>

      <section className="card" style={{ marginTop: "1rem" }}>
        <h2 style={{ fontSize: "1.1rem", marginTop: 0 }}>Verification documents email</h2>
        <p style={{ color: "#4b5563", fontSize: "0.9rem" }}>
          Brand2School automatically emails a welcome message when an organisation registers. If verification is
          rejected, the contact receives a follow-up listing outstanding documents. Organisations can participate before
          documents are approved, but must submit all documents before claiming infrastructure milestones.
        </p>
        <button type="button" style={{ marginTop: "0.5rem" }} onClick={() => void resendDocumentsEmail()}>
          Resend automated documents email
        </button>
      </section>

      {!v ? (
        <p className="card" style={{ marginTop: "1rem" }}>
          No verification record yet — refresh the page or contact support.
        </p>
      ) : (
        <section className="card" style={{ marginTop: "1rem" }}>
          <p>
            <strong>Packet status:</strong> {v.status}
            {v.centreTypeLabel ? ` · Centre: ${v.centreTypeLabel}` : null}
          </p>
          {v.status === "NOT_SUBMITTED" ? (
            <p style={{ color: "#b45309" }}>
              No documents submitted yet. You can still <strong>Approve provisionally</strong> to record admin sign-off
              and move the organisation from PENDING to VERIFIED automatically.
            </p>
          ) : null}
          {regValue ? (
            <p>
              {v.registrationNumberLabel ?? "Registration"}: {regValue}
            </p>
          ) : v.registrationDeferred ? (
            <p style={{ color: "#b45309" }}>Registration reference deferred until before claim</p>
          ) : null}
          {v.submittedAt ? <p>Submitted {new Date(v.submittedAt).toLocaleString("en-ZA")}</p> : null}
          {v.hasActiveDeferrals ? (
            <p style={{ color: "#b45309" }}>
              Active deferrals — organisation can participate but is not claim-ready until documents are complete.
            </p>
          ) : null}
          {v.claimReady ? <p style={{ color: "#047857" }}>Claim-ready — all documents on file.</p> : null}

          <ul style={{ marginTop: "1rem" }}>
            {v.documents.map((doc) => (
              <li key={doc.key}>
                {doc.label}{" "}
                {doc.uploaded && doc.url ? (
                  <a href={doc.url} target="_blank" rel="noreferrer">
                    (view)
                  </a>
                ) : doc.uploaded ? (
                  "(uploaded)"
                ) : doc.deferred ? (
                  <span style={{ color: "#b45309" }}>(deferred)</span>
                ) : (
                  <span style={{ color: "#b91c1c" }}>(missing)</span>
                )}
              </li>
            ))}
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
              {v.status === "NOT_SUBMITTED" ? "Approve provisionally" : "Approve packet"}
            </button>
            <button type="button" onClick={() => void review("REJECT")}>
              Reject packet
            </button>
            <Link href={`/dashboard/schools/${schoolId}/infrastructure`}>Edit infrastructure</Link>
            {" · "}
            <Link href={`/dashboard/schools/${schoolId}`}>Profile</Link>
          </div>
        </section>
      )}
      {toast ? <div className="toast success">{toast}</div> : null}
    </>
  );
}
