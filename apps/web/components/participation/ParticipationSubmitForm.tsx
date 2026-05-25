"use client";

import Link from "next/link";
import type { Route } from "next";
import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Globe2, MessageCircle } from "lucide-react";
import { PUBLIC_PHONE, whatsappUrl } from "../../lib/contact";
import { formatCount } from "../../lib/formatCount";

export type CampaignOption = {
  slug: string;
  name: string;
  brandName: string;
};

type ProvinceOption = { code: string; name: string };
type SchoolOption = { id: string; name: string; district: string; province: string };

type EligibilityAlternative = {
  slug: string;
  name: string;
  brandName: string;
};

type SubmitSuccess = {
  message: string;
  schoolName: string;
  campaignName: string;
  productCode: string;
  state: string;
  progress: {
    validSubmissions: number;
    targetSubmissions: number;
    percentToTarget: number;
    remainingToTarget: number;
  };
  funding?: { grossZar: number; schoolInfrastructureZar: number; message: string };
};

type EligibilityPayload = {
  schoolProvince: string;
  campaignScope: string;
  allowedProvinces: string[];
  alternatives: EligibilityAlternative[];
  overflowCampaign: EligibilityAlternative | null;
  nominateProvince: boolean;
};

export function ParticipationSubmitForm({
  campaigns = [],
  defaultCampaignSlug = "",
  compact = false
}: {
  campaigns?: CampaignOption[];
  defaultCampaignSlug?: string;
  compact?: boolean;
}): JSX.Element {
  const [provinces, setProvinces] = useState<ProvinceOption[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [schools, setSchools] = useState<SchoolOption[]>([]);
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [schoolId, setSchoolId] = useState("");
  const [campaignSlug, setCampaignSlug] = useState(defaultCampaignSlug);
  const [productCode, setProductCode] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [loadingProvinces, setLoadingProvinces] = useState(true);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingSchools, setLoadingSchools] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [eligibilityNote, setEligibilityNote] = useState<string | null>(null);
  const [eligibility, setEligibility] = useState<EligibilityPayload | null>(null);
  const [success, setSuccess] = useState<SubmitSuccess | null>(null);

  const selectedSchool = schools.find((s) => s.id === schoolId);

  useEffect(() => {
    setCampaignSlug(defaultCampaignSlug);
  }, [defaultCampaignSlug]);

  useEffect(() => {
    void fetch("/api/participation/school-options")
      .then((res) => (res.ok ? res.json() : { provinces: [] }))
      .then((data: { provinces?: ProvinceOption[] }) => setProvinces(data.provinces ?? []))
      .catch(() => setProvinces([]))
      .finally(() => setLoadingProvinces(false));
  }, []);

  const loadDistricts = useCallback(async (prov: string) => {
    setLoadingDistricts(true);
    setDistricts([]);
    setSchools([]);
    setDistrict("");
    setSchoolId("");
    try {
      const res = await fetch(`/api/participation/school-options?province=${encodeURIComponent(prov)}`);
      const data = (await res.json().catch(() => ({}))) as { districts?: string[] };
      setDistricts(data.districts ?? []);
    } finally {
      setLoadingDistricts(false);
    }
  }, []);

  const loadSchools = useCallback(async (prov: string, dist: string) => {
    setLoadingSchools(true);
    setSchools([]);
    setSchoolId("");
    try {
      const qs = new URLSearchParams({ province: prov, district: dist });
      const res = await fetch(`/api/participation/school-options?${qs.toString()}`);
      const data = (await res.json().catch(() => ({}))) as { schools?: SchoolOption[] };
      setSchools(data.schools ?? []);
    } finally {
      setLoadingSchools(false);
    }
  }, []);

  function onProvinceChange(value: string): void {
    setProvince(value);
    setEligibility(null);
    setEligibilityNote(null);
    setError(null);
    if (value) void loadDistricts(value);
    else {
      setDistricts([]);
      setSchools([]);
      setDistrict("");
      setSchoolId("");
    }
  }

  function onDistrictChange(value: string): void {
    setDistrict(value);
    setEligibility(null);
    setEligibilityNote(null);
    setError(null);
    if (province && value) void loadSchools(province, value);
    else {
      setSchools([]);
      setSchoolId("");
    }
  }

  function schoolPayload(): { schoolId: string } | null {
    if (!schoolId) return null;
    return { schoolId };
  }

  async function checkEligibility(): Promise<void> {
    const school = schoolPayload();
    if (!school || !campaignSlug.trim()) {
      setEligibilityNote("Select your province, district, school, and campaign first.");
      return;
    }
    setChecking(true);
    setEligibilityNote(null);
    setEligibility(null);
    setError(null);
    try {
      const res = await fetch("/api/participation/eligibility-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...school,
          campaignSlug: campaignSlug.trim().toLowerCase()
        })
      });
      const data = (await res.json().catch(() => ({}))) as {
        message?: string;
        eligible?: boolean;
        eligibility?: EligibilityPayload;
      };
      if (!res.ok) {
        setEligibilityNote(data.message ?? "Could not check eligibility.");
        setEligibility(data.eligibility ?? null);
        return;
      }
      setEligibilityNote(data.message ?? (data.eligible ? "School is eligible for this campaign." : "Not eligible."));
      setEligibility(data.eligible ? null : (data.eligibility ?? null));
    } finally {
      setChecking(false);
    }
  }

  async function submit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    const school = schoolPayload();
    if (!school) {
      setError("Please select your school from the list.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    setEligibility(null);
    setEligibilityNote(null);

    try {
      const res = await fetch("/api/participation/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...school,
          campaignSlug: campaignSlug.trim().toLowerCase(),
          productCode: productCode.trim(),
          contactPhone: contactPhone.trim() || undefined
        })
      });
      const data = (await res.json().catch(() => ({}))) as SubmitSuccess & {
        message?: string;
        eligibility?: EligibilityPayload;
      };

      if (!res.ok) {
        setError(data.message ?? "Submission could not be verified.");
        setEligibility(data.eligibility ?? null);
        return;
      }

      setSuccess({
        message: data.message,
        schoolName: data.schoolName,
        campaignName: data.campaignName,
        productCode: data.productCode,
        state: data.state,
        progress: data.progress,
        funding: data.funding
      });
      setProductCode("");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="b2s-submit-result" role="status">
        <CheckCircle2 size={32} className="b2s-submit-result-icon" aria-hidden />
        <h3>Code verified</h3>
        <p>{success.message}</p>
        <ul className="b2s-submit-result-stats">
          <li>
            <strong>{success.schoolName}</strong>
            <span>School credited</span>
          </li>
          <li>
            <strong>{success.campaignName}</strong>
            <span>Campaign</span>
          </li>
          <li>
            <strong>
              {formatCount(success.progress.validSubmissions)} / {formatCount(success.progress.targetSubmissions)}
            </strong>
            <span>
              {success.progress.percentToTarget}% toward target
              {success.progress.remainingToTarget > 0
                ? ` · ${formatCount(success.progress.remainingToTarget)} to go`
                : ""}
            </span>
          </li>
        </ul>
        {success.funding ? <p className="b2s-submit-result-funding">{success.funding.message}</p> : null}
        <button
          type="button"
          className="ds-btn ds-btn-secondary"
          onClick={() => {
            setSuccess(null);
            setError(null);
          }}
        >
          Submit another code
        </button>
      </div>
    );
  }

  const waPrefill = "1";

  return (
    <form className={`reg-form b2s-submit-form${compact ? " b2s-submit-form--compact" : ""}`} onSubmit={(e) => void submit(e)}>
      <p className="b2s-submit-lead">
        Select your school and campaign from the lists below, then enter the code from your product pack. Same
        verification as WhatsApp — no personal account required.
      </p>

      <div className="reg-grid">
        <label className="reg-field">
          <span>Province</span>
          <select
            value={province}
            onChange={(e) => onProvinceChange(e.target.value)}
            required
            disabled={loadingProvinces}
          >
            <option value="">{loadingProvinces ? "Loading…" : "Select province"}</option>
            {provinces.map((p) => (
              <option key={p.code} value={p.name}>
                {p.name}
              </option>
            ))}
          </select>
        </label>

        <label className="reg-field">
          <span>District / municipality</span>
          <select
            value={district}
            onChange={(e) => onDistrictChange(e.target.value)}
            required
            disabled={!province || loadingDistricts}
          >
            <option value="">
              {!province ? "Select province first" : loadingDistricts ? "Loading…" : "Select district"}
            </option>
            {districts.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>

        <label className="reg-field reg-field--full">
          <span>School</span>
          <select
            value={schoolId}
            onChange={(e) => {
              setSchoolId(e.target.value);
              setEligibility(null);
              setEligibilityNote(null);
              setError(null);
            }}
            required
            disabled={!district || loadingSchools}
          >
            <option value="">
              {!district ? "Select district first" : loadingSchools ? "Loading…" : "Select your school"}
            </option>
            {schools.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          {district && !loadingSchools && schools.length === 0 ? (
            <span className="reg-field-hint">
              No active schools in this district yet.{" "}
              <Link href={"/schools/register" as Route}>Register your school</Link> first.
            </span>
          ) : null}
        </label>

        <label className="reg-field reg-field--full">
          <span>Campaign</span>
          {campaigns.length > 0 ? (
            <select value={campaignSlug} onChange={(e) => setCampaignSlug(e.target.value)} required>
              <option value="">Select active campaign</option>
              {campaigns.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name} — {c.brandName}
                </option>
              ))}
            </select>
          ) : (
            <input
              value={campaignSlug}
              onChange={(e) => setCampaignSlug(e.target.value)}
              placeholder="Campaign slug (from product pack)"
              required
            />
          )}
        </label>

        <label className="reg-field reg-field--full">
          <span>Product code</span>
          <input
            value={productCode}
            onChange={(e) => setProductCode(e.target.value.toUpperCase())}
            placeholder="Code printed inside the pack"
            required
            autoCapitalize="characters"
            spellCheck={false}
          />
          <span className="reg-field-hint">Each code can only be used once.</span>
        </label>

        <label className="reg-field">
          <span>Mobile (optional)</span>
          <input
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            placeholder="For support if we need to verify"
            inputMode="tel"
          />
        </label>
      </div>

      {eligibilityNote ? (
        <p className={`b2s-submit-note${eligibility ? " b2s-submit-note--warn" : " b2s-submit-note--ok"}`}>{eligibilityNote}</p>
      ) : null}

      {eligibility ? (
        <div className="b2s-submit-eligibility card">
          <p>
            <strong>Your province:</strong> {eligibility.schoolProvince}
          </p>
          <p>
            <strong>Campaign scope:</strong> {eligibility.campaignScope}
          </p>
          {eligibility.alternatives.length > 0 ? (
            <>
              <p>Eligible campaigns for your school:</p>
              <ul>
                {eligibility.alternatives.map((alt) => (
                  <li key={alt.slug}>
                    <button type="button" className="b2s-submit-alt-link" onClick={() => setCampaignSlug(alt.slug)}>
                      {alt.name} ({alt.brandName})
                    </button>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
          {eligibility.overflowCampaign ? (
            <p>
              National overflow:{" "}
              <button
                type="button"
                className="b2s-submit-alt-link"
                onClick={() => setCampaignSlug(eligibility.overflowCampaign!.slug)}
              >
                {eligibility.overflowCampaign.name}
              </button>
            </p>
          ) : null}
          {eligibility.nominateProvince ? (
            <p>
              <Link href={"/campaigns" as Route}>Nominate your province</Link> for future campaigns.
            </p>
          ) : null}
        </div>
      ) : null}

      {error ? <p className="reg-error">{error}</p> : null}

      <div className="b2s-submit-actions">
        <button
          type="button"
          className="ds-btn ds-btn-secondary"
          disabled={checking || !schoolId}
          onClick={() => void checkEligibility()}
        >
          {checking ? "Checking…" : "Check eligibility"}
        </button>
        <button type="submit" className="ds-btn ds-btn-primary reg-submit" disabled={loading || !schoolId}>
          {loading ? "Verifying…" : "Submit code"}
        </button>
      </div>

      <div className="b2s-submit-alt">
        <p className="b2s-submit-alt-label">
          <Globe2 size={16} aria-hidden /> On the website · <MessageCircle size={16} aria-hidden /> or WhatsApp
        </p>
        <a href={whatsappUrl(waPrefill)} className="ds-btn ds-btn-secondary" target="_blank" rel="noopener noreferrer">
          Submit via WhatsApp instead
        </a>
        <p className="b2s-submit-alt-hint">
          WhatsApp: {PUBLIC_PHONE.display} · School not listed?{" "}
          <Link href={"/schools/register" as Route}>Register your school</Link>
        </p>
      </div>
    </form>
  );
}
