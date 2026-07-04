"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { Building2, CheckCircle2, MessageCircle, School } from "lucide-react";
import { csrfHeaders } from "../../lib/clientFetch";
import { CONTACT, mailto } from "../../lib/contact";
import { categoryToSearchParam, getOrganizationCategory, type OrganizationCategoryId } from "../../lib/organizationCategories";

type RegisterResult = {
  message: string;
  emailSent?: boolean;
  school: { name: string; schoolCode: string; status: string; province: string; district: string };
  whatsapp: {
    menuCommand: string;
    submitCommand: string;
    progressCommand: string;
    linkedPhone: string;
  };
  portal?: { loginUrl: string };
};

const provinces = [
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

type DistrictOption = { name: string; schoolCount: number };

export function OrganisationRegisterForm({ categoryId }: { categoryId: OrganizationCategoryId }): JSX.Element {
  const category = getOrganizationCategory(categoryId);
  const [name, setName] = useState("");
  const [province, setProvince] = useState("Gauteng");
  const [district, setDistrict] = useState("");
  const [districts, setDistricts] = useState<DistrictOption[]>([]);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [principalName, setPrincipalName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [whatsappPhone, setWhatsappPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RegisterResult | null>(null);

  const loadDistricts = useCallback(async (prov: string) => {
    setLoadingDistricts(true);
    setDistrict("");
    try {
      const res = await fetch(`/api/participation/school-options?province=${encodeURIComponent(prov)}`);
      const data = (await res.json().catch(() => ({}))) as {
        districts?: DistrictOption[] | string[];
      };
      const raw = data.districts ?? [];
      setDistricts(
        raw.map((d) =>
          typeof d === "string" ? { name: d, schoolCount: 0 } : { name: d.name, schoolCount: d.schoolCount ?? 0 }
        )
      );
    } finally {
      setLoadingDistricts(false);
    }
  }, []);

  useEffect(() => {
    void loadDistricts(province);
  }, [province, loadDistricts]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/schools/register", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...csrfHeaders() },
      body: JSON.stringify({
        organizationCategory: categoryId,
        name,
        province,
        district,
        principalName,
        contactEmail,
        password,
        confirmPassword,
        whatsappPhone
      })
    });

    const data = await res.json().catch(() => ({ message: "Registration failed." }));
    setLoading(false);

    if (!res.ok) {
      setError(data.message ?? "Registration failed.");
      return;
    }

    setResult(data as RegisterResult);
  };

  const Icon = categoryId === "SCHOOL" ? School : Building2;

  if (result) {
    return (
      <div className="reg-success">
        <div className="reg-success-icon">
          <CheckCircle2 size={40} />
        </div>
        <h2>{category.label} registered</h2>
        <p>{result.message}</p>
        {result.emailSent === false ? (
          <p className="reg-email-warn">
            No welcome email was sent. Save your reference code below. Check spam or contact{" "}
            <a href={mailto(CONTACT.schools)}>{CONTACT.schools}</a>.
          </p>
        ) : null}

        <div className="reg-success-card">
          <h3>{result.school.name}</h3>
          <p>
            <strong>Reference code:</strong> {result.school.schoolCode}
          </p>
          <p>
            <strong>WhatsApp linked:</strong> +{result.whatsapp.linkedPhone}
          </p>
          <p>
            <strong>Status:</strong> {result.school.status}
          </p>
        </div>

        <div className="reg-whatsapp-box">
          <MessageCircle size={22} />
          <div>
            <h4>WhatsApp is now linked</h4>
            <p>Communities can submit verified codes for your organisation.</p>
            <code>{result.whatsapp.menuCommand}</code>
            <code>{result.whatsapp.submitCommand}</code>
            <code>{result.whatsapp.progressCommand}</code>
          </div>
        </div>

        <div className="reg-hero-actions" style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center" }}>
          <Link
            href={
              (result.portal?.loginUrl ??
                `/organisations/login?category=${categoryToSearchParam(categoryId)}`) as Route
            }
            className="ds-btn ds-btn-primary"
          >
            Open dashboard
          </Link>
          <Link href="/" className="ds-btn ds-btn-secondary">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form className="reg-form" onSubmit={onSubmit}>
      <section className="reg-section">
        <h2>
          <Icon size={22} />
          {category.nameLabel}
        </h2>
        <div className="reg-grid">
          <label className="reg-field reg-field--full">
            <span>{category.nameLabel}</span>
            <input required value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="reg-field">
            <span>Province</span>
            <select
              required
              value={province}
              onChange={(e) => {
                setProvince(e.target.value);
                void loadDistricts(e.target.value);
              }}
            >
              {provinces.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
          <label className="reg-field">
            <span>District / municipality</span>
            <select
              required
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              disabled={loadingDistricts}
            >
              <option value="">{loadingDistricts ? "Loading…" : "Select district"}</option>
              {districts.map((d) => (
                <option key={d.name} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>
          </label>
          <label className="reg-field">
            <span>{category.contactLabel}</span>
            <input required value={principalName} onChange={(e) => setPrincipalName(e.target.value)} />
          </label>
          <label className="reg-field">
            <span>Contact email</span>
            <input type="email" required value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
          </label>
          <label className="reg-field">
            <span>Portal password</span>
            <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          <label className="reg-field">
            <span>Confirm password</span>
            <input
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </label>
          <label className="reg-field">
            <span>WhatsApp number</span>
            <input
              required
              value={whatsappPhone}
              onChange={(e) => setWhatsappPhone(e.target.value)}
              placeholder="e.g. 082 123 4567"
            />
          </label>
        </div>
        <p className="reg-hint">
          This WhatsApp number links your organisation for community participation and progress updates.
        </p>
      </section>

      {error ? <p className="reg-error">{error}</p> : null}

      <button type="submit" className="ds-btn ds-btn-primary ds-btn-lg reg-submit" disabled={loading}>
        {loading ? "Registering…" : `Register ${category.label}`}
      </button>
      <p className="reg-hint" style={{ textAlign: "center" }}>
        Already registered?{" "}
        <Link href={`/organisations/login?category=${categoryToSearchParam(categoryId)}` as Route}>Sign in</Link>
      </p>
    </form>
  );
}
