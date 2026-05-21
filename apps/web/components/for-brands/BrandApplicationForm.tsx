"use client";

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
  };

  return (
    <form className="lp-form-card" onSubmit={(e) => void submit(e)}>
      <h3 className="ds-section-title ds-section-title--left">Enterprise brand registration</h3>
      <p className="lp-problem-text">
        Apply for transformation territory (school, district, provincial, or national). You pay a{" "}
        <strong>mandatory platform access fee</strong> for verification, dashboards, and ESG intelligence.
        An <strong>optional transformation contribution pool</strong> funds on-the-ground infrastructure when
        you are ready — not required to start.
      </p>

      <div className="lp-form-grid">
        <label>
          Company / brand name
          <input name="companyName" required minLength={2} />
        </label>
        <label>
          Legal entity name
          <input name="legalName" />
        </label>
        <label>
          CIPC registration number
          <input name="registrationNumber" required />
        </label>
        <label>
          VAT number
          <input name="vatNumber" />
        </label>
        <label>
          Preferred code prefix (e.g. COKE)
          <input name="codePrefix" pattern="[A-Za-z0-9]{2,8}" title="2–8 letters/numbers" />
        </label>
        <label>
          Primary contact email
          <input name="primaryContactEmail" type="email" required />
        </label>
        <label>
          Contact person name
          <input name="contactName" required />
        </label>
        <label>
          Contact email
          <input name="contactEmail" type="email" required />
        </label>
        <label>
          Role
          <input name="contactRole" placeholder="Marketing director" />
        </label>
        <label>
          Phone
          <input name="contactPhone" />
        </label>
        <label>
          Proposed campaign name
          <input name="proposedCampaignName" />
        </label>
        <label>
          Transformation package
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
        <label>
          Transformation contribution pool (ZAR, optional)
          <input
            name="contributionPoolZar"
            type="number"
            min={0}
            step={1000}
            placeholder={selectedPackage?.recommendedContributionPool ?? "Optional"}
          />
          <small style={{ display: "block", color: "#64748b", marginTop: "0.25rem" }}>
            Recommended: {selectedPackage?.recommendedContributionPool ?? "—"}. Not mandatory at application.
          </small>
        </label>
      </div>

      <fieldset style={{ marginTop: "1rem", border: "1px solid #e5e7eb", padding: "0.75rem", borderRadius: 8 }}>
        <legend>Target provinces</legend>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          {PROVINCES.map((p) => (
            <label key={p} style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
              <input
                type="checkbox"
                checked={selectedProvinces.includes(p)}
                onChange={() => toggleProvince(p)}
              />
              {p}
            </label>
          ))}
        </div>
      </fieldset>

      <label style={{ display: "block", marginTop: "1rem" }}>
        Campaign intention
        <textarea name="campaignIntention" required minLength={10} rows={3} />
      </label>
      <label style={{ display: "block", marginTop: "0.75rem" }}>
        Products involved
        <textarea name="productsInvolved" required rows={2} />
      </label>

      <fieldset style={{ marginTop: "1rem", border: "1px solid #e5e7eb", padding: "0.75rem", borderRadius: 8 }}>
        <legend>Contract prerequisites</legend>
        <ul style={{ margin: "0 0 0.75rem", paddingLeft: "1.1rem", fontSize: "0.9rem" }}>
          {CONTRACT_PACKAGE_REQUIREMENTS.map((req) => (
            <li key={req.label}>{req.label}</li>
          ))}
        </ul>
        <label style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
          <input type="checkbox" name="popiaComplianceAccepted" required />
          <span>
            I accept Brand2School&apos;s POPIA-aligned data handling for participation verification,
            analytics, and ESG reporting.
          </span>
        </label>
      </fieldset>

      <button type="submit" className="ds-btn ds-btn-primary" style={{ marginTop: "1rem" }} disabled={status === "loading"}>
        {status === "loading" ? "Submitting…" : "Submit application"}
      </button>

      {message ? (
        <p style={{ marginTop: "0.75rem", color: status === "error" ? "#b91c1c" : "#166534" }}>{message}</p>
      ) : null}
    </form>
  );
}
