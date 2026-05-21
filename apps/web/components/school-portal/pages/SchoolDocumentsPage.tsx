"use client";

import { useState } from "react";
import { csrfHeaders } from "../../../lib/clientFetch";
import { useSchoolPortal } from "../SchoolPortalContext";

const STATUS_LABEL: Record<string, string> = {
  NOT_SUBMITTED: "Not submitted",
  SUBMITTED: "Submitted — awaiting review",
  UNDER_REVIEW: "Under review",
  APPROVED: "Approved",
  REJECTED: "Rejected — resubmit required"
};

export function SchoolDocumentsPage(): JSX.Element {
  const { school, verification, refresh } = useSchoolPortal();
  const [emisNumber, setEmisNumber] = useState(verification.emisNumber ?? "");
  const [principalId, setPrincipalId] = useState<File | null>(null);
  const [schoolLetter, setSchoolLetter] = useState<File | null>(null);
  const [emisEvidence, setEmisEvidence] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submitPacket(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);

    if (!principalId || !schoolLetter || !emisEvidence) {
      setError("All three documents are required.");
      setBusy(false);
      return;
    }

    const form = new FormData();
    form.set("emisNumber", emisNumber.trim());
    form.set("principalId", principalId);
    form.set("schoolLetter", schoolLetter);
    form.set("emisEvidence", emisEvidence);

    const res = await fetch("/api/school/verification/submit", {
      method: "POST",
      headers: csrfHeaders(),
      body: form
    });
    const json = (await res.json().catch(() => ({}))) as { message?: string };
    setBusy(false);

    if (!res.ok) {
      setError(json.message ?? "Submission failed.");
      return;
    }

    setMessage("Verification packet submitted. Our team will review within 2–5 business days.");
    setPrincipalId(null);
    setSchoolLetter(null);
    setEmisEvidence(null);
    await refresh();
  }

  return (
    <div className="sp-page">
      <header className="sp-page-head">
        <p className="ds-eyebrow">Governance &amp; compliance</p>
        <h1>School verification (EMIS)</h1>
        <p className="sp-muted">
          {school.name} must pass EMIS verification before Brand2School can advance your school to verified
          participation status. Upload official evidence only — no learner personal data.
        </p>
      </header>

      <div className="sp-verification-status card" style={{ marginBottom: "1.25rem" }}>
        <strong>Status: {STATUS_LABEL[verification.status] ?? verification.status}</strong>
        {verification.submittedAt ? (
          <p className="sp-muted" style={{ margin: "0.35rem 0 0" }}>
            Submitted {new Date(verification.submittedAt).toLocaleString("en-ZA")}
          </p>
        ) : null}
        {verification.rejectionReason ? (
          <p style={{ margin: "0.5rem 0 0", color: "#b91c1c" }}>{verification.rejectionReason}</p>
        ) : null}
      </div>

      {verification.status === "APPROVED" ? (
        <p className="sp-muted">
          Your packet is approved. Entity status: <strong>{school.status}</strong>. Our team will advance activation
          through the governed approvals queue.
        </p>
      ) : null}

      {verification.canSubmit ? (
        <form className="sp-verification-form card" onSubmit={(e) => void submitPacket(e)}>
          <h2 style={{ marginTop: 0 }}>Submit verification packet</h2>
          <label className="sp-field">
            <span>Official EMIS number</span>
            <input
              value={emisNumber}
              onChange={(e) => setEmisNumber(e.target.value)}
              placeholder="e.g. 123456789"
              pattern="\d{6,20}"
              required
            />
          </label>
          <label className="sp-field">
            <span>Principal ID (PDF or image)</span>
            <input
              type="file"
              accept=".pdf,image/jpeg,image/png,image/webp"
              required
              onChange={(e) => setPrincipalId(e.target.files?.[0] ?? null)}
            />
          </label>
          <label className="sp-field">
            <span>Official school letter (PDF or image)</span>
            <input
              type="file"
              accept=".pdf,image/jpeg,image/png,image/webp"
              required
              onChange={(e) => setSchoolLetter(e.target.files?.[0] ?? null)}
            />
          </label>
          <label className="sp-field">
            <span>EMIS registry evidence (screenshot or letter)</span>
            <input
              type="file"
              accept=".pdf,image/jpeg,image/png,image/webp"
              required
              onChange={(e) => setEmisEvidence(e.target.files?.[0] ?? null)}
            />
          </label>
          <p className="sp-muted" style={{ fontSize: "0.85rem" }}>
            Max 5MB per file. Documents are stored securely and reviewed only by Brand2School administrators.
          </p>
          <button type="submit" className="ds-btn ds-btn-primary" disabled={busy}>
            {busy ? "Submitting…" : "Submit for review"}
          </button>
          {error ? <p style={{ color: "#b91c1c" }}>{error}</p> : null}
          {message ? <p style={{ color: "#047857" }}>{message}</p> : null}
        </form>
      ) : null}

      {!verification.canSubmit && verification.status !== "APPROVED" ? (
        <p className="sp-muted">Your packet is locked while under review. Contact schools@brand2school.co.za if urgent.</p>
      ) : null}
    </div>
  );
}
