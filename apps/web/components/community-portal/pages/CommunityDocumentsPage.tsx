"use client";

import { useState } from "react";
import { csrfHeaders } from "../../../lib/clientFetch";
import { RegistrationReferenceInput } from "../../shared/RegistrationReferenceInput";
import { useCommunityPortal } from "../CommunityPortalContext";

const STATUS_LABEL: Record<string, string> = {
  NOT_SUBMITTED: "Not submitted",
  SUBMITTED: "Submitted — awaiting review",
  UNDER_REVIEW: "Under review",
  APPROVED: "Approved",
  REJECTED: "Rejected — resubmit required"
};

export function CommunityDocumentsPage(): JSX.Element {
  const { organization, organizationMeta, verification, documentVault, refresh } = useCommunityPortal();
  const [registrationNumber, setRegistrationNumber] = useState(
    verification.emisNumber ?? verification.registrationNumber ?? ""
  );
  const [centreType, setCentreType] = useState("");
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
  const regRequired = organizationMeta.id === "NGO_NPO";

  const regField = organizationMeta.registrationNumber;

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
        `Provide ${organizationMeta.registrationNumber?.label ?? "registration details"} or confirm deferral.`
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

    for (const doc of organizationMeta.documents) {
      if (!doc.required) continue;
      const uploaded = verification.documents.find((d) => d.key === doc.key)?.uploaded;
      const hasFile = Boolean(files[doc.key]);
      const deferred = Boolean(deferrals[doc.key]);
      if (!uploaded && !hasFile && !deferred) {
        setError(`Upload ${doc.label} or defer until before claiming.`);
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
    for (const doc of organizationMeta.documents) {
      const uploaded = verification.documents.find((d) => d.key === doc.key)?.uploaded;
      if (!uploaded && !files[doc.key] && deferrals[doc.key]) {
        deferralPayload[doc.key] = { willSubmitBeforeClaim: true };
      }
    }
    form.set("documentDeferrals", JSON.stringify(deferralPayload));

    for (const doc of organizationMeta.documents) {
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

    setMessage("Verification packet submitted. Our team will review within 2–5 business days.");
    setFiles({});
    await refresh();
  }

  return (
    <div className="cp-page">
      <header className="cp-page-head">
        <p className="ds-eyebrow">Governance</p>
        <h1>{organizationMeta.documentsTitle}</h1>
        <p className="cp-muted">{organizationMeta.documentsIntro}</p>
      </header>

      {(documentVault.expiringSoon > 0 || documentVault.expired > 0) ? (
        <div className="cp-vault-alert">
          <strong>
            {documentVault.expired > 0
              ? `${documentVault.expired} document(s) may need renewal`
              : `${documentVault.expiringSoon} document(s) expiring soon`}
          </strong>
        </div>
      ) : null}

      <section className="card cp-vault-panel">
        <h2>Document vault</h2>
        <div className="cp-vault-grid">
          {documentVault.entries.map((entry) => (
            <article key={entry.key} className={`cp-vault-entry cp-vault-entry--${entry.status}`}>
              <strong>{entry.label}</strong>
              <span>{entry.status}</span>
              {entry.expiresAt ? (
                <p className="cp-muted">
                  {entry.daysUntilExpiry != null && entry.daysUntilExpiry <= 0
                    ? "May need renewal"
                    : `Valid until ${new Date(entry.expiresAt).toLocaleDateString("en-ZA")}`}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      <div className="card cp-verification-status">
        <strong>Status: {STATUS_LABEL[verification.status] ?? verification.status}</strong>
        <p className="cp-muted">{organizationMeta.label}</p>
        {verification.claimReady ? (
          <p className="cp-success-text">All documents on file — verification complete.</p>
        ) : null}
      </div>

      {verification.canSubmit ? (
        <form className="card cp-verification-form" onSubmit={(e) => void submitPacket(e)}>
          <h2>{isCompletingDeferred ? "Upload outstanding documents" : "Submit verification packet"}</h2>

          <label className="cp-field">
            <span>Centre type</span>
            <select value={centreType} onChange={(e) => setCentreType(e.target.value)} required>
              <option value="">Select centre type…</option>
              {organizationMeta.centreTypes.map((centre) => (
                <option key={centre.id} value={centre.id}>
                  {centre.label}
                </option>
              ))}
            </select>
          </label>

          {organizationMeta.registrationNumber ? (
            <label className="cp-field">
              <span>{organizationMeta.registrationNumber.label}</span>
              <RegistrationReferenceInput
                field={organizationMeta.registrationNumber}
                value={registrationNumber}
                onChange={setRegistrationNumber}
                className="registration-reference-input"
              />
            </label>
          ) : null}

          {organizationMeta.documents.map((doc) => (
            <div key={doc.key} className="cp-field">
              <label>
                <span>
                  {doc.label}
                  {doc.required ? " *" : ""}
                </span>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) =>
                    setFiles((prev) => ({ ...prev, [doc.key]: e.target.files?.[0] ?? null }))
                  }
                />
              </label>
              {!verification.documents.find((d) => d.key === doc.key)?.uploaded ? (
                <label className="cp-defer">
                  <input
                    type="checkbox"
                    checked={Boolean(deferrals[doc.key])}
                    onChange={(e) =>
                      setDeferrals((prev) => ({ ...prev, [doc.key]: e.target.checked }))
                    }
                  />
                  Will submit before claiming milestones
                </label>
              ) : null}
            </div>
          ))}

          {error ? <p className="cp-error">{error}</p> : null}
          {message ? <p className="cp-success-text">{message}</p> : null}

          <button type="submit" className="ds-btn ds-btn-primary" disabled={busy}>
            {busy ? "Submitting…" : "Submit packet"}
          </button>
        </form>
      ) : (
        <p className="cp-muted">Organisation: {organization.name} · Code {organization.schoolCode}</p>
      )}
    </div>
  );
}
