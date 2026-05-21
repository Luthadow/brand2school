"use client";

import { useState } from "react";
import { NEED_CATEGORIES } from "../../../lib/schoolPortal";
import { csrfHeaders } from "../../../lib/clientFetch";
import { formatZar } from "../../../lib/schoolPortal";
import { useSchoolPortal } from "../SchoolPortalContext";

export function SchoolNeedsPage(): JSX.Element {
  const { needs } = useSchoolPortal();
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
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="sp-page">
      <header className="sp-page-head">
        <p className="ds-eyebrow">Needs submission</p>
        <h1>Submit infrastructure needs</h1>
        <p className="sp-muted">
          Your school never leaves the ecosystem — infrastructure is tracked by category with maintenance and
          upgrade cycles. Submit additional needs below.
        </p>
      </header>

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
                </tr>
              </thead>
              <tbody>
                {needs.map((need) => (
                  <tr key={need.id}>
                    <td>{need.title}</td>
                    <td>{need.subcategory}</td>
                    <td>{need.progressPercent}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

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
        <button type="submit" className="ds-btn ds-btn-primary" disabled={submitting}>
          {submitting ? "Submitting…" : "Submit need for review"}
        </button>
        {message ? <p className="sp-form-msg">{message}</p> : null}
      </form>

      <section className="sp-section">
        <h2>Your submitted needs</h2>
        {needs.map((need) => (
          <article key={need.id} className="sp-need-card">
            <div className="sp-need-head">
              <h3>{need.title}</h3>
              <span className={`sp-pill sp-pill--${need.urgency.toLowerCase()}`}>{need.urgency}</span>
            </div>
            <p>{need.description}</p>
            <p className="sp-muted">
              {need.category} · {need.subcategory} · {need.learnerImpact} learners ·{" "}
              {formatZar(need.estimatedCostZar)}
            </p>
            <div className="sp-progress">
              <span style={{ width: `${need.progressPercent}%` }} />
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
