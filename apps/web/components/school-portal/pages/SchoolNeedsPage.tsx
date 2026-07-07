"use client";

import Link from "next/link";
import { useState } from "react";
import { NEED_CATEGORIES } from "../../../lib/schoolPortal";
import { csrfHeaders } from "../../../lib/clientFetch";
import { formatZar } from "../../../lib/schoolPortal";
import { useSchoolPortal } from "../SchoolPortalContext";

const SPONSOR_LABEL: Record<string, string> = {
  SUBMITTED: "Awaiting review",
  UNDER_REVIEW: "Under review",
  APPROVED: "Visible to brands",
  FUNDED: "Funded",
  DECLINED: "Declined"
};

export function SchoolNeedsPage(): JSX.Element {
  const { needs, submittedNeeds, verification, refresh } = useSchoolPortal();
  const claimBlocked = verification.claimReady === false;
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    category: "Infrastructure",
    subcategory: "Classrooms",
    urgency: "High" as const,
    description: "",
    learnerImpact: 100,
    estimatedCostZar: 100000
  });

  const totalSubmittedCost = submittedNeeds.reduce((s, n) => s + n.estimatedCostZar, 0);
  const fundedCount = submittedNeeds.filter((n) => n.status === "FUNDED").length;

  async function submitNeed(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch("/api/school/needs", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...csrfHeaders() },
        body: JSON.stringify(form)
      });
      const data = (await res.json()) as { message?: string };
      setMessage(res.ok ? data.message ?? "Submitted!" : data.message ?? "Could not submit.");
      if (res.ok) {
        setForm({
          title: "",
          category: "Infrastructure",
          subcategory: "Classrooms",
          urgency: "High",
          description: "",
          learnerImpact: 100,
          estimatedCostZar: 100000
        });
        await refresh();
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="sp-page sp-needs-mgmt">
      <header className="sp-page-head">
        <p className="ds-eyebrow">Needs management</p>
        <h1>School infrastructure needs</h1>
        <p className="sp-muted">
          Track engine-assessed infrastructure, submit priority needs for brand sponsors, and show progress on what
          your community is funding.
        </p>
      </header>

      <div className="sp-needs-kpi-strip">
        <div className="sp-needs-kpi">
          <strong>{needs.length}</strong>
          <span>Engine categories</span>
        </div>
        <div className="sp-needs-kpi">
          <strong>{submittedNeeds.length}</strong>
          <span>Submitted needs</span>
        </div>
        <div className="sp-needs-kpi">
          <strong>{formatZar(totalSubmittedCost)}</strong>
          <span>Total ask (submitted)</span>
        </div>
        <div className="sp-needs-kpi">
          <strong>{fundedCount}</strong>
          <span>Funded</span>
        </div>
      </div>

      {submittedNeeds.length > 0 ? (
        <section className="sp-section">
          <h2>Priority needs for brands</h2>
          <p className="sp-muted">
            Approved needs appear in the brand marketplace. Add photos and quotes in a future update — counts show
            when media is attached.
          </p>
          <div className="sp-needs-cards">
            {submittedNeeds.map((need) => (
              <article key={need.id} className="sp-need-card sp-need-card--submitted">
                <div className="sp-need-head">
                  <h3>{need.title}</h3>
                  <span className={`sp-pill sp-pill--${need.urgency.toLowerCase()}`}>{need.urgency}</span>
                </div>
                <p>{need.description}</p>
                <div className="sp-need-meta">
                  <span>{need.category} · {need.subcategory}</span>
                  <span>{need.learnerImpact} learners</span>
                  <span>{formatZar(need.estimatedCostZar)}</span>
                </div>
                <div className="sp-need-sponsor">
                  <span className="sp-need-sponsor-label">Sponsor status</span>
                  <strong>{need.sponsorStatus}</strong>
                  <span className="sp-need-status-pill">{SPONSOR_LABEL[need.status] ?? need.status}</span>
                </div>
                <div className="sp-need-progress-row">
                  <span>Progress</span>
                  <strong>{need.progressPercent}%</strong>
                </div>
                <div className="sp-progress">
                  <span style={{ width: `${need.progressPercent}%` }} />
                </div>
                <div className="sp-need-media-hint">
                  <span>{need.photoCount} photos</span>
                  <span>{need.quoteCount} quotes</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {needs.length > 0 ? (
        <section className="sp-section">
          <h2>Infrastructure intelligence</h2>
          <p className="sp-muted">Live status across transformation categories (verified progress + maintenance).</p>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Progress</th>
                  <th>Est. cost</th>
                </tr>
              </thead>
              <tbody>
                {needs.map((need) => (
                  <tr key={need.id}>
                    <td>{need.title}</td>
                    <td>{need.subcategory}</td>
                    <td>{need.progressPercent}%</td>
                    <td>{formatZar(need.estimatedCostZar)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {!claimBlocked ? null : (
        <div className="card sp-needs-blocked">
          <p>
            Complete all verification documents before submitting infrastructure needs for milestone claims.{" "}
            <Link href="/school/dashboard/documents">Open Docs</Link>
            {verification.hasActiveDeferrals ? " to upload deferred items." : "."}
          </p>
        </div>
      )}

      <section className="sp-section sp-needs-submit">
        <h2>Submit a new need</h2>
        <form className="sp-form" onSubmit={(e) => void submitNeed(e)}>
          <label>
            Title
            <input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Science lab refurbishment"
            />
          </label>
          <label>
            Category
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {Object.keys(NEED_CATEGORIES).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label>
            Type
            <select
              value={form.subcategory}
              onChange={(e) => setForm({ ...form, subcategory: e.target.value })}
            >
              {(NEED_CATEGORIES[form.category] ?? []).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label>
            Urgency
            <select
              value={form.urgency}
              onChange={(e) =>
                setForm({ ...form, urgency: e.target.value as typeof form.urgency })
              }
            >
              {(["Critical", "High", "Medium", "Long-Term"] as const).map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </label>
          <label>
            Description
            <textarea
              required
              rows={4}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </label>
          <label>
            Learners impacted
            <input
              type="number"
              min={1}
              value={form.learnerImpact}
              onChange={(e) => setForm({ ...form, learnerImpact: Number(e.target.value) })}
            />
          </label>
          <label>
            Estimated cost (ZAR)
            <input
              type="number"
              min={1000}
              step={1000}
              value={form.estimatedCostZar}
              onChange={(e) => setForm({ ...form, estimatedCostZar: Number(e.target.value) })}
            />
          </label>
          <button type="submit" className="ds-btn ds-btn-primary" disabled={submitting || claimBlocked}>
            {submitting ? "Submitting…" : "Submit need for review"}
          </button>
          {message ? <p className="sp-form-msg">{message}</p> : null}
        </form>
      </section>
    </div>
  );
}
