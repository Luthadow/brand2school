"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { csrfHeaders } from "../../../lib/clientFetch";
import { formatCount } from "../../../lib/formatCount";
import { useSchoolPortal } from "../SchoolPortalContext";

const QUINTILES = [1, 2, 3, 4, 5] as const;

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

export function SchoolProfilePage(): JSX.Element {
  const { school, overview, gamification, publicProfile, publicPage, refresh } = useSchoolPortal();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [districts, setDistricts] = useState<DistrictOption[]>([]);
  const [loadingDistricts, setLoadingDistricts] = useState(false);

  const [form, setForm] = useState({
    name: school.name,
    province: school.province,
    district: school.district,
    principalName: school.principalName,
    contactEmail: school.contactEmail ?? "",
    websiteUrl: publicProfile.websiteUrl ?? "",
    publicPhone: publicProfile.publicPhone ?? "",
    quintile: publicProfile.quintile ?? "",
    teacherCount: publicProfile.teacherCount ?? "",
    gpsLat: publicProfile.gpsLat ?? "",
    gpsLng: publicProfile.gpsLng ?? "",
    mission: publicProfile.mission,
    vision: publicProfile.vision,
    history: publicProfile.history,
    colourPrimary: publicProfile.schoolColours[0] ?? "#1e3a5f",
    colourSecondary: publicProfile.schoolColours[1] ?? "#f59e0b",
    facebook: publicProfile.socialMedia.facebook ?? "",
    instagram: publicProfile.socialMedia.instagram ?? "",
    twitter: publicProfile.socialMedia.twitter ?? "",
    linkedin: publicProfile.socialMedia.linkedin ?? "",
    achievements: publicProfile.achievements.join("\n")
  });

  const incompleteItems = useMemo(
    () => publicProfile.completionItems.filter((i) => !i.complete),
    [publicProfile.completionItems]
  );

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
    void loadDistricts(form.province, school.district);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.province, loadDistricts]);

  async function saveProfile(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const payload = {
        name: form.name.trim(),
        province: form.province,
        district: form.district,
        principalName: form.principalName,
        contactEmail: form.contactEmail.trim() || null,
        websiteUrl: form.websiteUrl.trim() || null,
        publicPhone: form.publicPhone.trim() || null,
        quintile: form.quintile === "" ? null : Number(form.quintile),
        teacherCount: form.teacherCount === "" ? null : Number(form.teacherCount),
        gpsLat: form.gpsLat === "" ? null : Number(form.gpsLat),
        gpsLng: form.gpsLng === "" ? null : Number(form.gpsLng),
        mission: form.mission,
        vision: form.vision,
        history: form.history,
        schoolColours: [form.colourPrimary, form.colourSecondary].filter(Boolean),
        socialMedia: {
          facebook: form.facebook.trim() || undefined,
          instagram: form.instagram.trim() || undefined,
          twitter: form.twitter.trim() || undefined,
          linkedin: form.linkedin.trim() || undefined
        },
        achievements: form.achievements
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean)
      };

      const res = await fetch("/api/school/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...csrfHeaders() },
        body: JSON.stringify(payload)
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

  async function uploadLogo(file: File): Promise<void> {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.set("logo", file);
      const res = await fetch("/api/school/profile/logo", {
        method: "POST",
        headers: csrfHeaders(),
        body: formData
      });
      const data = (await res.json()) as { message?: string };
      if (!res.ok) {
        setError(data.message ?? "Could not upload logo.");
        return;
      }
      setMessage(data.message ?? "Logo uploaded.");
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="sp-page sp-profile-page">
      <header className="sp-profile-hero">
        <div className="sp-profile-hero-text">
          <p className="ds-eyebrow">Professional profile</p>
          <h1>{school.name}</h1>
          <p className="sp-muted">
            Build your public school identity — brands discover what you need through a complete, trusted profile.
          </p>
          {publicPage.visible && publicPage.url ? (
            <p className="sp-profile-public-link">
              <Link href={publicPage.url as Route} target="_blank" rel="noopener noreferrer">
                View public profile →
              </Link>
            </p>
          ) : (
            <p className="sp-profile-public-hint">{publicPage.message}</p>
          )}
        </div>
        <div className="sp-profile-completion">
          <div
            className="sp-profile-ring"
            style={{ "--pct": publicProfile.completionPercent } as React.CSSProperties}
          >
            <strong>{publicProfile.completionPercent}%</strong>
            <span>Profile complete</span>
          </div>
        </div>
      </header>

      <div className="sp-profile-layout">
        <aside className="sp-profile-aside">
          <div className="sp-profile-logo-card">
            {publicProfile.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={publicProfile.logoUrl} alt={`${school.name} logo`} className="sp-profile-logo-img" />
            ) : (
              <div className="sp-profile-logo-placeholder">{school.name.slice(0, 2).toUpperCase()}</div>
            )}
            <label className="ds-btn ds-btn-secondary sp-profile-logo-btn">
              {publicProfile.logoUrl ? "Replace logo" : "Upload logo"}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                hidden
                disabled={busy}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void uploadLogo(f);
                }}
              />
            </label>
          </div>

          <section className="sp-profile-checklist">
            <h2>Completion checklist</h2>
            <ul>
              {publicProfile.completionItems.map((item) => (
                <li key={item.key} className={item.complete ? "sp-profile-check" : "sp-profile-missing"}>
                  {item.label}
                </li>
              ))}
            </ul>
            {incompleteItems.length > 0 ? (
              <p className="sp-muted">{incompleteItems.length} items left to unlock full visibility.</p>
            ) : (
              <p className="sp-muted">Your profile is ready for brand discovery.</p>
            )}
          </section>

          <section className="sp-profile-stats">
            <h2>Impact snapshot</h2>
            <dl>
              <dt>Learners</dt>
              <dd>{formatCount(school.learnerCount)}</dd>
              <dt>Verified submissions</dt>
              <dd>{formatCount(overview.verifiedSubmissions)}</dd>
              <dt>Badges</dt>
              <dd>
                {gamification.badges.length > 0 ? (
                  <div className="sp-badges">
                    {gamification.badges.map((b) => (
                      <span key={b} className="sp-chip">
                        {b}
                      </span>
                    ))}
                  </div>
                ) : (
                  "—"
                )}
              </dd>
            </dl>
          </section>
        </aside>

        <form className="sp-profile-form" onSubmit={(e) => void saveProfile(e)}>
          <section className="sp-profile-section">
            <h2>Identity &amp; contact</h2>
            <p className="sp-muted">Correct spelling mistakes in your school name or location — your school code stays the same.</p>
            <div className="sp-profile-grid">
              <label>
                School / organisation name
                <input
                  required
                  minLength={3}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </label>
              <label>
                Principal / contact name
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
                Contact email
                <input
                  type="email"
                  value={form.contactEmail}
                  onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                />
              </label>
              <label>
                Public phone
                <input
                  value={form.publicPhone}
                  onChange={(e) => setForm({ ...form, publicPhone: e.target.value })}
                  placeholder="+27 …"
                />
              </label>
              <label>
                Website
                <input
                  type="url"
                  value={form.websiteUrl}
                  onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })}
                  placeholder="https://"
                />
              </label>
              <label>
                EMIS / registration
                <input value={school.emisNumber} readOnly disabled className="registration-reference-input" />
                <span className="registration-reference-hint">
                  Enter or update your EMIS number on the{" "}
                  <Link href="/school/dashboard/documents">Docs</Link> page when submitting verification.
                </span>
              </label>
              <label>
                School code
                <input value={school.schoolCode} readOnly disabled />
              </label>
            </div>
          </section>

          <section className="sp-profile-section">
            <h2>Location &amp; school data</h2>
            <div className="sp-profile-grid">
              <label>
                GPS latitude
                <input
                  type="number"
                  step="any"
                  value={form.gpsLat}
                  onChange={(e) => setForm({ ...form, gpsLat: e.target.value })}
                  placeholder="-26.20"
                />
              </label>
              <label>
                GPS longitude
                <input
                  type="number"
                  step="any"
                  value={form.gpsLng}
                  onChange={(e) => setForm({ ...form, gpsLng: e.target.value })}
                  placeholder="28.04"
                />
              </label>
              <label>
                Quintile
                <select
                  value={form.quintile}
                  onChange={(e) => setForm({ ...form, quintile: e.target.value })}
                >
                  <option value="">Select quintile</option>
                  {QUINTILES.map((q) => (
                    <option key={q} value={q}>
                      Quintile {q}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Teachers
                <input
                  type="number"
                  min={1}
                  value={form.teacherCount}
                  onChange={(e) => setForm({ ...form, teacherCount: e.target.value })}
                />
              </label>
            </div>
          </section>

          <section className="sp-profile-section">
            <h2>Brand colours</h2>
            <div className="sp-profile-colours">
              <label>
                Primary
                <input
                  type="color"
                  value={form.colourPrimary}
                  onChange={(e) => setForm({ ...form, colourPrimary: e.target.value })}
                />
              </label>
              <label>
                Secondary
                <input
                  type="color"
                  value={form.colourSecondary}
                  onChange={(e) => setForm({ ...form, colourSecondary: e.target.value })}
                />
              </label>
            </div>
          </section>

          <section className="sp-profile-section">
            <h2>Mission, vision &amp; history</h2>
            <label>
              Mission
              <textarea
                rows={3}
                value={form.mission}
                onChange={(e) => setForm({ ...form, mission: e.target.value })}
                placeholder="What drives your school every day?"
              />
            </label>
            <label>
              Vision
              <textarea
                rows={3}
                value={form.vision}
                onChange={(e) => setForm({ ...form, vision: e.target.value })}
                placeholder="Where is your school heading?"
              />
            </label>
            <label>
              History
              <textarea
                rows={4}
                value={form.history}
                onChange={(e) => setForm({ ...form, history: e.target.value })}
                placeholder="Founding story, milestones, community roots…"
              />
            </label>
          </section>

          <section className="sp-profile-section">
            <h2>Social media</h2>
            <div className="sp-profile-grid">
              <label>
                Facebook
                <input
                  type="url"
                  value={form.facebook}
                  onChange={(e) => setForm({ ...form, facebook: e.target.value })}
                />
              </label>
              <label>
                Instagram
                <input
                  type="url"
                  value={form.instagram}
                  onChange={(e) => setForm({ ...form, instagram: e.target.value })}
                />
              </label>
              <label>
                X / Twitter
                <input
                  type="url"
                  value={form.twitter}
                  onChange={(e) => setForm({ ...form, twitter: e.target.value })}
                />
              </label>
              <label>
                LinkedIn
                <input
                  type="url"
                  value={form.linkedin}
                  onChange={(e) => setForm({ ...form, linkedin: e.target.value })}
                />
              </label>
            </div>
          </section>

          <section className="sp-profile-section">
            <h2>Achievements</h2>
            <label>
              One achievement per line
              <textarea
                rows={4}
                value={form.achievements}
                onChange={(e) => setForm({ ...form, achievements: e.target.value })}
                placeholder="District science fair winners 2024&#10;100% matric pass rate"
              />
            </label>
          </section>

          {publicProfile.impactStories.length > 0 ? (
            <section className="sp-profile-section">
              <h2>Impact stories</h2>
              <ul className="sp-profile-stories">
                {publicProfile.impactStories.map((story) => (
                  <li key={story.title}>
                    <strong>{story.title}</strong>
                    {story.year ? <span>{story.year}</span> : null}
                    <p>{story.excerpt}</p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <div className="sp-profile-actions">
            <button type="submit" className="ds-btn ds-btn-primary" disabled={busy}>
              {busy ? "Saving…" : "Save profile"}
            </button>
            {message ? <p className="sp-form-msg sp-form-msg--ok">{message}</p> : null}
            {error ? <p className="sp-form-msg sp-form-msg--err">{error}</p> : null}
          </div>
        </form>
      </div>
    </div>
  );
}
