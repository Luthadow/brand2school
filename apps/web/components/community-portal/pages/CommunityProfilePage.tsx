"use client";

import { useCallback, useEffect, useState } from "react";
import { csrfHeaders } from "../../../lib/clientFetch";
import { useCommunityPortal } from "../CommunityPortalContext";

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
] as const;

type DistrictOption = { name: string; schoolCount: number };

export function CommunityProfilePage(): JSX.Element {
  const { organization, organizationMeta, verification, whatsapp, refresh } = useCommunityPortal();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [districts, setDistricts] = useState<DistrictOption[]>([]);
  const [loadingDistricts, setLoadingDistricts] = useState(false);

  const [form, setForm] = useState({
    name: organization.name,
    province: organization.province,
    district: organization.district,
    principalName: organization.principalName,
    contactEmail: organization.contactEmail ?? ""
  });

  const loadDistricts = useCallback(async (prov: string, keepDistrict?: string) => {
    setLoadingDistricts(true);
    try {
      const res = await fetch(`/api/participation/school-options?province=${encodeURIComponent(prov)}`);
      const data = (await res.json().catch(() => ({}))) as {
        districts?: DistrictOption[] | string[];
      };
      const raw = data.districts ?? [];
      const options = raw.map((d) =>
        typeof d === "string" ? { name: d, schoolCount: 0 } : { name: d.name, schoolCount: d.schoolCount ?? 0 }
      );
      setDistricts(options);
      if (keepDistrict && !options.some((d) => d.name.toLowerCase() === keepDistrict.toLowerCase())) {
        setDistricts((current) => [{ name: keepDistrict, schoolCount: 0 }, ...current]);
      }
    } finally {
      setLoadingDistricts(false);
    }
  }, []);

  useEffect(() => {
    void loadDistricts(form.province, organization.district);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.province, loadDistricts]);

  async function saveProfile(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/school/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...csrfHeaders() },
        body: JSON.stringify({
          name: form.name.trim(),
          province: form.province,
          district: form.district,
          principalName: form.principalName,
          contactEmail: form.contactEmail.trim() || null
        })
      });
      const data = (await res.json()) as { message?: string };
      if (!res.ok) {
        setError(data.message ?? "Could not save profile.");
        return;
      }
      setMessage(data.message ?? "Profile saved.");
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="cp-page">
      <header className="cp-page-head">
        <p className="ds-eyebrow">Organisation profile</p>
        <h1>{form.name}</h1>
        <p className="cp-muted">
          {organizationMeta.label} · Update your organisation details if anything was misspelled during registration.
        </p>
      </header>

      <form className="card cp-profile-panel" onSubmit={(e) => void saveProfile(e)}>
        <h2>Contact & identity</h2>
        <div className="cp-profile-form-grid">
          <label>
            Organisation name
            <input
              required
              minLength={3}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </label>
          <label>
            Contact name
            <input
              required
              value={form.principalName}
              onChange={(e) => setForm({ ...form, principalName: e.target.value })}
            />
          </label>
          <label>
            Province
            <select
              required
              value={form.province}
              onChange={(e) => setForm({ ...form, province: e.target.value, district: "" })}
            >
              {PROVINCES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
          <label>
            District
            <select
              required
              value={form.district}
              disabled={loadingDistricts}
              onChange={(e) => setForm({ ...form, district: e.target.value })}
            >
              <option value="">{loadingDistricts ? "Loading districts…" : "Select district"}</option>
              {districts.map((d) => (
                <option key={d.name} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Email
            <input
              type="email"
              value={form.contactEmail}
              onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
            />
          </label>
          <label>
            Organisation code
            <input value={organization.schoolCode} readOnly disabled />
          </label>
          <label>
            WhatsApp
            <input value={organization.whatsappPhone} readOnly disabled />
          </label>
        </div>
        <div className="cp-profile-actions">
          <button type="submit" className="ds-btn ds-btn-primary" disabled={busy}>
            {busy ? "Saving…" : "Save profile"}
          </button>
          {message ? <p className="cp-form-msg cp-form-msg--ok">{message}</p> : null}
          {error ? <p className="cp-form-msg cp-form-msg--err">{error}</p> : null}
        </div>
      </form>

      <section className="card cp-profile-panel">
        <h2>Status</h2>
        <dl className="cp-profile-dl">
          <dt>Entity status</dt>
          <dd>{organization.status}</dd>
          <dt>Verification</dt>
          <dd>{verification.status.replace(/_/g, " ")}</dd>
        </dl>
      </section>

      <section className="card cp-profile-panel">
        <h2>Centre types</h2>
        <ul className="cp-profile-list">
          {organizationMeta.centreTypes.map((c) => (
            <li key={c.id}>{c.label}</li>
          ))}
        </ul>
      </section>

      <p className="cp-muted">
        WhatsApp participation line: {whatsapp.phone} · Commands: {whatsapp.commands.join(", ")}
      </p>
    </div>
  );
}
