"use client";

import { Building2, FileCheck, MapPin, Send, User } from "lucide-react";
import { useState } from "react";
import {
  CONTRACT_PACKAGE_REQUIREMENTS,
  packageById,
  TERRITORIAL_PACKAGES,
  type TerritorialPackageId
} from "../../lib/territorialPackages";

const PROVINCES = [
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "Northern Cape",
  "North West",
  "Western Cape"
];

export function BrandApplicationForm(): JSX.Element {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [selectedProvinces, setSelectedProvinces] = useState<string[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState<TerritorialPackageId>("PROVINCIAL_IMPACT");
  const selectedPackage = packageById(selectedPackageId);

  const toggleProvince = (name: string): void => {
    setSelectedProvinces((prev) => (prev.includes(name) ? prev.filter((p) => p !== name) : [...prev, name]));
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setStatus("loading");
    setMessage(null);
    const form = new FormData(e.currentTarget);
    const payload = {
      companyName: String(form.get("companyName") ?? ""),
      legalName: String(form.get("legalName") ?? "") || undefined,
      registrationNumber: String(form.get("registrationNumber") ?? ""),
      vatNumber: String(form.get("vatNumber") ?? "") || undefined,
      primaryContactEmail: String(form.get("primaryContactEmail") ?? ""),
      codePrefix: String(form.get("codePrefix") ?? "").toUpperCase() || undefined,
      intendedProvinces: selectedProvinces,
      campaignIntention: String(form.get("campaignIntention") ?? ""),
      productsInvolved: String(form.get("productsInvolved") ?? ""),
      proposedCampaignName: String(form.get("proposedCampaignName") ?? "") || undefined,
      territorialPackageId: String(form.get("territorialPackageId") ?? "PROVINCIAL_IMPACT"),
      proposedScopeType:
        TERRITORIAL_PACKAGES.find((p) => p.id === String(form.get("territorialPackageId")))?.scopeType ??
        "PROVINCIAL",
      contributionPoolZar: form.get("contributionPoolZar")
        ? Number(form.get("contributionPoolZar"))
        : undefined,
      contactPersons: [
        {
          name: String(form.get("contactName") ?? ""),
          email: String(form.get("contactEmail") ?? ""),
          role: String(form.get("contactRole") ?? "") || undefined,
          phone: String(form.get("contactPhone") ?? "") || undefined
        }
      ],
      popiaComplianceAccepted: true as const
    };

    if (form.get("popiaComplianceAccepted") !== "on") {
      setStatus("error");
      setMessage("You must accept POPIA compliance terms to apply.");
      return;
    }

    const res = await fetch("/api/commercial/brand-applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = (await res.json().catch(() => ({}))) as { message?: string; codePrefix?: string };
    if (!res.ok) {
      setStatus("error");
      setMessage(data.message ?? "Application could not be submitted.");
      return;
    }
    setStatus("done");
    setMessage(
      data.message ??
        `Application received. Your brand code prefix will be ${data.codePrefix ?? "assigned"} after review.`
    );
    e.currentTarget.reset();
    setSelectedProvinces([]);
    setSelectedPackageId("PROVINCIAL_IMPACT");
  };

  return (
    <form className="reg-form brand-app-form" onSubmit={(e) => void submit(e)}>
      <header className="brand-app-form__intro">
        <h2 className="brand-app-form__title">Enterprise brand registration</h2>
        <p className="brand-app-form__lead">
          Apply for transformation territory (school, district, provincial, or national). You pay a{" "}
          <strong>mandatory platform access fee</strong> for verification, dashboards, and ESG intelligence.
          An <strong>optional transformation contribution pool</strong> funds on-the-ground infrastructure when
          you are ready — not required to start.
        </p>
      </header>

      <section className="reg-section">
        <h3>
          <Building2 size={20} aria-hidden />
          Company details
        </h3>
        <div className="reg-grid">
          <label className="reg-field reg-field--full">
            <span>Company / brand name</span>
            <input name="companyName" required minLength={2} autoComplete="organization" />
          </label>
          <label className="reg-field reg-field--full">
            <span>Legal entity name</span>
            <input name="legalName" autoComplete="organization" />
          </label>
          <label className="reg-field">
            <span>CIPC registration number</span>
            <input name="registrationNumber" required />
          </label>
          <label className="reg-field">
            <span>VAT number</span>
            <input name="vatNumber" />
          </label>
          <label className="reg-field">
            <span>Preferred code prefix</span>
            <input
              name="codePrefix"
              pattern="[A-Za-z0-9]{2,8}"
              title="2–8 letters or numbers"
              placeholder="e.g. COKE"
            />
          </label>
          <label className="reg-field">
            <span>Primary contact email</span>
            <input name="primaryContactEmail" type="email" required autoComplete="email" />
          </label>
        </div>
      </section>

      <section className="reg-section">
        <h3>
          <User size={20} aria-hidden />
          Contact person
        </h3>
        <div className="reg-grid">
          <label className="reg-field">
            <span>Full name</span>
            <input name="contactName" required autoComplete="name" />
          </label>
          <label className="reg-field">
            <span>Email</span>
            <input name="contactEmail" type="email" required autoComplete="email" />
          </label>
          <label className="reg-field">
            <span>Role</span>
            <input name="contactRole" placeholder="Marketing director" />
          </label>
          <label className="reg-field">
            <span>Phone</span>
            <input name="contactPhone" type="tel" autoComplete="tel" />
          </label>
        </div>
      </section>

      <section className="reg-section">
        <h3>
          <FileCheck size={20} aria-hidden />
          Campaign &amp; package
        </h3>
        <div className="reg-grid">
          <label className="reg-field reg-field--full">
            <span>Proposed campaign name</span>
            <input name="proposedCampaignName" />
          </label>
          <label className="reg-field reg-field--full">
            <span>Transformation package</span>
            <select
              name="territorialPackageId"
              value={selectedPackageId}
              onChange={(e) => setSelectedPackageId(e.target.value as TerritorialPackageId)}
            >
              {TERRITORIAL_PACKAGES.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {p.activationFee} + {p.monthlySubscription}
                </option>
              ))}
            </select>
          </label>
          <label className="reg-field reg-field--full">
            <span>Transformation contribution pool (ZAR, optional)</span>
            <input
              name="contributionPoolZar"
              type="number"
              min={0}
              step={1000}
              placeholder={selectedPackage?.recommendedContributionPool ?? "Optional"}
            />
            <small className="reg-field-hint">
              Recommended: {selectedPackage?.recommendedContributionPool ?? "—"}. Not mandatory at application.
            </small>
          </label>
        </div>
      </section>

      <section className="reg-section">
        <h3>
          <MapPin size={20} aria-hidden />
          Target provinces
        </h3>
        <p className="reg-hint">Select every province where you intend to run verified campaigns.</p>
        <div className="reg-province-grid" role="group" aria-label="Target provinces">
          {PROVINCES.map((p) => (
            <label key={p} className="reg-check-card">
              <input
                type="checkbox"
                checked={selectedProvinces.includes(p)}
                onChange={() => toggleProvince(p)}
              />
              <span>{p}</span>
            </label>
          ))}
        </div>
      </section>

      <section className="reg-section">
        <h3>Campaign details</h3>
        <div className="reg-grid">
          <label className="reg-field reg-field--full">
            <span>Campaign intention</span>
            <textarea name="campaignIntention" required minLength={10} rows={4} />
          </label>
          <label className="reg-field reg-field--full">
            <span>Products involved</span>
            <textarea name="productsInvolved" required rows={3} />
          </label>
        </div>
      </section>

      <section className="reg-section reg-section--muted">
        <h3>Contract prerequisites</h3>
        <ul className="brand-app-form__requirements">
          {CONTRACT_PACKAGE_REQUIREMENTS.map((req) => (
            <li key={req.label}>{req.label}</li>
          ))}
        </ul>
        <label className="reg-check-row">
          <input type="checkbox" name="popiaComplianceAccepted" required />
          <span>
            I accept Brand2School&apos;s POPIA-aligned data handling for participation verification,
            analytics, and ESG reporting.
          </span>
        </label>
      </section>

      {message ? (
        <p className={status === "error" ? "reg-error" : "reg-message--ok"} role="status">
          {message}
        </p>
      ) : null}

      <button type="submit" className="ds-btn ds-btn-primary ds-btn-lg reg-submit" disabled={status === "loading"}>
        <Send size={18} aria-hidden />
        {status === "loading" ? "Submitting…" : "Submit application"}
      </button>
    </form>
  );
}
