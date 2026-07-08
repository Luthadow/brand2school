"use client";

import Link from "next/link";
import { useState } from "react";
import { csrfHeaders } from "../../../lib/clientFetch";
import { RegistrationReferenceInput } from "../../shared/RegistrationReferenceInput";
import { useSchoolPortal } from "../SchoolPortalContext";

const STATUS_LABEL: Record<string, string> = {
  NOT_SUBMITTED: "Not submitted",
  SUBMITTED: "Submitted — awaiting review",
  UNDER_REVIEW: "Under review",
  APPROVED: "Approved",
  REJECTED: "Rejected — resubmit required"
};

const DEFERRAL_HINT =
  "I will submit this before claiming infrastructure milestones";

export function SchoolDocumentsPage(): JSX.Element {
  const { school, organization, verification, documentVault, refresh } = useSchoolPortal();
  const [registrationNumber, setRegistrationNumber] = useState(
    verification.emisNumber ?? verification.registrationNumber ?? ""
  );
  const [centreType, setCentreType] = useState(verification.centreType ?? "");
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [deferrals, setDeferrals] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const doc of verification.documents) {
      if (doc.deferred) initial[doc.key] = true;
    }
    return initial;
  });
  const [registrationDeferred, setRegistrationDeferred] = useState(verification.registrationDeferred);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isCompletingDeferred = verification.canCompleteDocuments && verification.status !== "NOT_SUBMITTED";

  const regRequired = organization.id === "SCHOOL" || organization.id === "NGO_NPO";

  const regField = organization.registrationNumber;
  const regLooksComplete =
    !regField ||
    registrationNumber.trim().length >= regField.minLength ||
    (regField.key !== "emisNumber" && registrationNumber.trim().length > 0);

  async function submitPacket(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);

    if (!centreType) {
      setError("Select your centre type.");
      setBusy(false);
      return;
    }

    if (regRequired && !registrationNumber.trim() && !registrationDeferred) {
      setError(
        `Provide ${organization.registrationNumber?.label ?? "registration details"} or confirm you will submit before claiming.`
      );
      setBusy(false);
      return;
    }

    if (regField && registrationNumber.trim() && !registrationDeferred) {
      if (regField.key === "emisNumber" && !/^\d{6,20}$/.test(registrationNumber.trim())) {
        setError(regField.validationMessage);
        setBusy(false);
        return;
      }
      if (
        regField.key !== "emisNumber" &&
        regField.minLength > 0 &&
        registrationNumber.trim().length < regField.minLength
      ) {
        setError(regField.validationMessage);
        setBusy(false);
        return;
      }
    }

    for (const doc of organization.documents) {
      if (!doc.required) continue;
      const uploaded = verification.documents.find((d) => d.key === doc.key)?.uploaded;
      const hasFile = Boolean(files[doc.key]);
      const deferred = Boolean(deferrals[doc.key]);
      if (!uploaded && !hasFile && !deferred) {
        setError(`Upload ${doc.label} or tick that you will submit it before claiming.`);
        setBusy(false);
        return;
      }
    }

    const form = new FormData();
    form.set("centreType", centreType);

    if (regField) {
      if (regField.key === "emisNumber") {
        form.set("emisNumber", registrationNumber.trim());
      } else {
        form.set("registrationNumber", registrationNumber.trim());
      }
    }

    if (registrationDeferred) {
      form.set("registrationDeferred", "true");
    }

    const deferralPayload: Record<string, { willSubmitBeforeClaim: true }> = {};
    for (const doc of organization.documents) {
      const uploaded = verification.documents.find((d) => d.key === doc.key)?.uploaded;
      if (!uploaded && !files[doc.key] && deferrals[doc.key]) {
        deferralPayload[doc.key] = { willSubmitBeforeClaim: true };
      }
    }
    form.set("documentDeferrals", JSON.stringify(deferralPayload));

    for (const doc of organization.documents) {
      const file = files[doc.key];
      if (file) form.set(doc.key, file);
    }

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

    setMessage(
      isCompletingDeferred
        ? "Documents updated. All items must be on file before you can claim infrastructure milestones."
        : "Verification packet submitted. Our Governance Team will review within 2–5 business days."
    );
    setFiles({});
    await refresh();
  }

  return (
    <div className="sp-page">
      <header className="sp-page-head">
        <p className="ds-eyebrow">Governance &amp; compliance</p>
        <h1>{organization.documentsTitle}</h1>
        <p className="sp-muted">{organization.documentsIntro}</p>
      </header>

      {(documentVault.expiringSoon > 0 || documentVault.expired > 0) ? (
        <div className="sp-vault-alert">
          <strong>
            {documentVault.expired > 0
              ? `${documentVault.expired} document(s) may need renewal`
              : `${documentVault.expiringSoon} document(s) expiring within 90 days`}
          </strong>
          <p>Upload refreshed copies before expiry to keep your verification and claim eligibility current.</p>
        </div>
      ) : null}

      <section className="sp-vault-panel card">
        <h2>Document vault</h2>
        <p className="sp-muted">
          Uploaded documents are valid for 12 months from submission. Deferred items must be uploaded before claiming
          milestones.
        </p>
        <div className="sp-vault-grid">
          {documentVault.entries.map((entry) => (
            <article
              key={entry.key}
              className={`sp-vault-entry sp-vault-entry--${entry.status} sp-vault-entry--${entry.reminderLevel}`}
            >
              <div className="sp-vault-entry-head">
                <strong>{entry.label}</strong>
                <span className="sp-vault-status">{entry.status}</span>
              </div>
              {entry.uploadedAt ? (
                <p className="sp-muted">Uploaded {new Date(entry.uploadedAt).toLocaleDateString("en-ZA")}</p>
              ) : null}
              {entry.expiresAt ? (
                <p className="sp-vault-expiry">
                  {entry.daysUntilExpiry != null && entry.daysUntilExpiry <= 0
                    ? "May need renewal"
                    : entry.daysUntilExpiry != null && entry.daysUntilExpiry <= 90
                      ? `Expires in ${entry.daysUntilExpiry} days`
                      : `Valid until ${new Date(entry.expiresAt).toLocaleDateString("en-ZA")}`}
                </p>
              ) : entry.status === "deferred" ? (
                <p className="sp-vault-expiry sp-vault-expiry--warn">Submit before claiming</p>
              ) : (
                <p className="sp-vault-expiry sp-vault-expiry--missing">Not yet uploaded</p>
              )}
            </article>
          ))}
        </div>
      </section>

      <div className="sp-verification-status card" style={{ marginBottom: "1.25rem" }}>
        <strong>Status: {STATUS_LABEL[verification.status] ?? verification.status}</strong>
        <p className="sp-muted" style={{ margin: "0.35rem 0 0" }}>
          Organisation type: {organization.label}
          {verification.centreTypeLabel ? ` · Centre: ${verification.centreTypeLabel}` : null}
        </p>
        {verification.submittedAt ? (
          <p className="sp-muted" style={{ margin: "0.35rem 0 0" }}>
            Submitted {new Date(verification.submittedAt).toLocaleString("en-ZA")}
          </p>
        ) : null}
        {verification.hasActiveDeferrals && !verification.claimReady ? (
          <p style={{ margin: "0.5rem 0 0", color: "#b45309" }}>
            You can participate now. Outstanding documents must be uploaded before claiming infrastructure milestones.
          </p>
        ) : null}
        {verification.claimReady ? (
          <p style={{ margin: "0.5rem 0 0", color: "#047857" }}>
            All documents are on file — you are ready to claim infrastructure milestones.
          </p>
        ) : null}
        {verification.rejectionReason ? (
          <p style={{ margin: "0.5rem 0 0", color: "#b91c1c" }}>{verification.rejectionReason}</p>
        ) : null}
      </div>

      {verification.status === "APPROVED" && verification.claimReady ? (
        <p className="sp-muted">
          Your packet is approved. Entity status: <strong>{school.status}</strong>.
        </p>
      ) : null}

      {verification.status === "APPROVED" && !verification.claimReady && verification.canSubmit ? (
        <p className="sp-muted" style={{ marginBottom: "1.25rem" }}>
          Your organisation is approved to participate. Upload outstanding documents below when you have them —
          full documentation is required before claiming infrastructure milestones.
        </p>
      ) : null}

      {verification.documents.some((d) => d.uploaded || d.deferred) ? (
        <div className="card" style={{ marginBottom: "1.25rem" }}>
          <h2 style={{ marginTop: 0, fontSize: "1rem" }}>Document checklist</h2>
          <ul className="sp-muted" style={{ margin: 0, paddingLeft: "1.2rem" }}>
            {verification.documents.map((doc) => (
              <li key={doc.key}>
                {doc.label}{" "}
                {doc.uploaded ? (
                  doc.url ? (
                    <a href={doc.url} target="_blank" rel="noreferrer">
                      (uploaded)
                    </a>
                  ) : (
                    "(uploaded)"
                  )
                ) : doc.deferred ? (
                  <span style={{ color: "#b45309" }}>(deferred — submit before claim)</span>
                ) : (
                  "(missing)"
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {verification.canSubmit ? (
        <form className="sp-verification-form card" onSubmit={(e) => void submitPacket(e)}>
          <h2 style={{ marginTop: 0 }}>
            {isCompletingDeferred ? "Upload outstanding documents" : "Submit verification packet"}
          </h2>

          <label className="sp-field">
            <span>Centre type</span>
            <select
              value={centreType}
              onChange={(e) => setCentreType(e.target.value)}
              required
              disabled={Boolean(verification.centreType && isCompletingDeferred)}
            >
              <option value="">Select centre type…</option>
              {organization.centreTypes.map((centre) => (
                <option key={centre.id} value={centre.id}>
                  {centre.label}
                </option>
              ))}
            </select>
          </label>

          {organization.registrationNumber ? (
            <div className="sp-field">
              <label>
                <span>{organization.registrationNumber.label}</span>
                <RegistrationReferenceInput
                  field={organization.registrationNumber}
                  value={registrationNumber}
                  onChange={setRegistrationNumber}
                  disabled={
                    verification.registrationDeferred &&
                    isCompletingDeferred &&
                    regLooksComplete
                  }
                />
              </label>
              {regRequired ? (
                <label style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start", marginTop: "0.5rem" }}>
                  <input
                    type="checkbox"
                    checked={registrationDeferred}
                    onChange={(e) => setRegistrationDeferred(e.target.checked)}
                    disabled={Boolean(registrationNumber.trim())}
                  />
                  <span className="sp-muted" style={{ fontSize: "0.9rem" }}>
                    {DEFERRAL_HINT}
                  </span>
                </label>
              ) : null}
            </div>
          ) : null}

          {organization.documents.map((doc) => {
            const existing = verification.documents.find((d) => d.key === doc.key);
            if (existing?.uploaded && isCompletingDeferred) return null;

            return (
              <div key={doc.key} className="sp-field">
                <label>
                  <span>{doc.label}</span>
                  <input
                    type="file"
                    accept=".pdf,image/jpeg,image/png,image/webp"
                    onChange={(e) =>
                      setFiles((current) => ({ ...current, [doc.key]: e.target.files?.[0] ?? null }))
                    }
                  />
                </label>
                {doc.required && !existing?.uploaded ? (
                  <label style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start", marginTop: "0.5rem" }}>
                    <input
                      type="checkbox"
                      checked={Boolean(deferrals[doc.key])}
                      onChange={(e) =>
                        setDeferrals((current) => ({ ...current, [doc.key]: e.target.checked }))
                      }
                      disabled={Boolean(files[doc.key])}
                    />
                    <span className="sp-muted" style={{ fontSize: "0.9rem" }}>
                      {DEFERRAL_HINT}
                    </span>
                  </label>
                ) : null}
              </div>
            );
          })}

          <p className="sp-muted" style={{ fontSize: "0.85rem" }}>
            Max 5MB per file. Documents are stored securely and reviewed only by Brand2School administrators.
            You can participate in campaigns while documents are outstanding — full documentation is required only when
            claiming infrastructure milestones.
          </p>
          <button type="submit" className="ds-btn ds-btn-primary" disabled={busy}>
            {busy ? "Submitting…" : isCompletingDeferred ? "Save documents" : "Submit for review"}
          </button>
          {error ? <p style={{ color: "#b91c1c" }}>{error}</p> : null}
          {message ? <p style={{ color: "#047857" }}>{message}</p> : null}
        </form>
      ) : null}

      {!verification.canSubmit && verification.status !== "APPROVED" ? (
        <p className="sp-muted">
          Your document packet is locked while under review. You can still use the rest of the portal — open{" "}
          <Link href="/school/dashboard">Home</Link> or another section from the menu. Contact schools@brand2school.co.za
          if urgent.
        </p>
      ) : null}
    </div>
  );
}
