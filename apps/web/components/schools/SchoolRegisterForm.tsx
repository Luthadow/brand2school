"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, MessageCircle, School } from "lucide-react";
import { csrfHeaders } from "../../lib/clientFetch";
import { CONTACT, mailto } from "../../lib/contact";

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

export function SchoolRegisterForm(): JSX.Element {
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

  if (result) {
    return (
      <div className="reg-success">
        <div className="reg-success-icon">
          <CheckCircle2 size={40} />
        </div>
        <h2>School Registered</h2>
        <p>{result.message}</p>
        {result.emailSent === false ? (
          <p className="reg-email-warn">
            No confirmation email was sent. Save your school code below. If you expected email, check spam or{" "}
            <a href={mailto(CONTACT.schools)}>{CONTACT.schools}</a>.
          </p>
        ) : null}

        <div className="reg-success-card">
          <h3>{result.school.name}</h3>
          <p>
            <strong>School code:</strong> {result.school.schoolCode}
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
            <p>Families submit codes for your school — no learner accounts required.</p>
            <code>{result.whatsapp.menuCommand}</code>
            <code>{result.whatsapp.submitCommand}</code>
            <code>{result.whatsapp.progressCommand}</code>
          </div>
        </div>

        <div className="reg-hero-actions" style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center" }}>
          <Link href="/school/login" className="ds-btn ds-btn-primary">
            Open Principal Portal
          </Link>
          <Link href="/" className="ds-btn ds-btn-secondary">
            Back to Home
          </Link>
        </div>
        <p className="reg-hint" style={{ marginTop: "1rem", textAlign: "center" }}>
          A confirmation email with your login link has been sent.
        </p>
      </div>
    );
  }

  return (
    <form className="reg-form" onSubmit={onSubmit}>
      <section className="reg-section">
        <h2>
          <School size={22} />
          School Details
        </h2>
        <div className="reg-grid">
          <label className="reg-field reg-field--full">
            <span>School name</span>
            <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Your School Name" />
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
            <span>Principal / contact name</span>
            <input required value={principalName} onChange={(e) => setPrincipalName(e.target.value)} />
          </label>
          <label className="reg-field">
            <span>Principal email</span>
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
          This WhatsApp number links your school for status checks. Families submit product codes using your school name and district — no child data required.
        </p>
      </section>

      {error ? <p className="reg-error">{error}</p> : null}

      <button type="submit" className="ds-btn ds-btn-primary ds-btn-lg reg-submit" disabled={loading}>
        {loading ? "Registering…" : "Register School"}
      </button>
      <p className="reg-hint" style={{ textAlign: "center" }}>
        Questions about registration?{" "}
        <a href={mailto(CONTACT.schools)}>{CONTACT.schools}</a>
      </p>
    </form>
  );
}
