"use client";

import { useState } from "react";
import { GraduationCap, Lightbulb, Rocket, Users } from "lucide-react";
import { csrfHeaders } from "../../../lib/clientFetch";
import { ALUMNI_ROLES, CHALLENGE_TYPES, formatZar, PROJECT_TYPES } from "../../../lib/schoolPortal";
import { useSchoolPortal } from "../SchoolPortalContext";

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-ZA", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function SchoolEnterprisePage(): JSX.Element {
  const { enterpriseHub, refresh } = useSchoolPortal();
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [alumniForm, setAlumniForm] = useState({
    fullName: "",
    graduationYear: "",
    profession: "",
    company: "",
    email: "",
    phone: "",
    role: "ALUMNI",
    offering: ""
  });

  const [projectForm, setProjectForm] = useState({
    title: "",
    description: "",
    projectType: "MINI_COMPANY",
    studentLead: "",
    gradeLevel: "",
    category: "",
    seekingSponsor: false,
    challengeId: ""
  });

  const [challengeForm, setChallengeForm] = useState({
    title: "",
    description: "",
    challengeType: "pitch",
    startsAt: "",
    endsAt: "",
    prizeDescription: "",
    maxEntries: 20
  });

  async function addAlumni(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/school/alumni", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...csrfHeaders() },
        body: JSON.stringify({
          fullName: alumniForm.fullName,
          graduationYear: alumniForm.graduationYear ? Number(alumniForm.graduationYear) : null,
          profession: alumniForm.profession || null,
          company: alumniForm.company || null,
          email: alumniForm.email || null,
          phone: alumniForm.phone || null,
          role: alumniForm.role,
          offering: alumniForm.offering || null
        })
      });
      const data = (await res.json()) as { message?: string };
      setMessage(res.ok ? "Alumni member added." : data.message ?? "Could not save.");
      if (res.ok) {
        setAlumniForm({
          fullName: "",
          graduationYear: "",
          profession: "",
          company: "",
          email: "",
          phone: "",
          role: "ALUMNI",
          offering: ""
        });
        await refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  async function addProject(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/school/enterprise/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...csrfHeaders() },
        body: JSON.stringify({
          title: projectForm.title,
          description: projectForm.description || null,
          projectType: projectForm.projectType,
          studentLead: projectForm.studentLead,
          gradeLevel: projectForm.gradeLevel || null,
          category: projectForm.category || null,
          seekingSponsor: projectForm.seekingSponsor,
          challengeId: projectForm.challengeId || null,
          status: "ACTIVE"
        })
      });
      const data = (await res.json()) as { message?: string };
      setMessage(res.ok ? "Student venture registered." : data.message ?? "Could not save.");
      if (res.ok) {
        setProjectForm({
          title: "",
          description: "",
          projectType: "MINI_COMPANY",
          studentLead: "",
          gradeLevel: "",
          category: "",
          seekingSponsor: false,
          challengeId: ""
        });
        await refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  async function addChallenge(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/school/enterprise/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...csrfHeaders() },
        body: JSON.stringify({
          title: challengeForm.title,
          description: challengeForm.description || null,
          challengeType: challengeForm.challengeType,
          startsAt: new Date(challengeForm.startsAt).toISOString(),
          endsAt: challengeForm.endsAt ? new Date(challengeForm.endsAt).toISOString() : null,
          prizeDescription: challengeForm.prizeDescription || null,
          maxEntries: challengeForm.maxEntries,
          status: "OPEN"
        })
      });
      const data = (await res.json()) as { message?: string };
      setMessage(res.ok ? "Innovation challenge launched." : data.message ?? "Could not save.");
      if (res.ok) {
        setChallengeForm({
          title: "",
          description: "",
          challengeType: "pitch",
          startsAt: "",
          endsAt: "",
          prizeDescription: "",
          maxEntries: 20
        });
        await refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="sp-page sp-enterprise-page">
      <header className="sp-enterprise-hero">
        <div>
          <p className="ds-eyebrow">Brand2School Enterprise</p>
          <h1>Entrepreneurship & alumni</h1>
          <p className="sp-muted">
            Student ventures, innovation challenges, and your alumni network — the Green Youth Network opportunity
            built into every school success journey.
          </p>
        </div>
      </header>

      {message ? <p className="sp-enterprise-message">{message}</p> : null}

      <section className="sp-enterprise-kpi">
        <article>
          <GraduationCap size={18} />
          <strong>{enterpriseHub.summary.activeAlumni}</strong>
          <span>Alumni connected</span>
        </article>
        <article>
          <Users size={18} />
          <strong>{enterpriseHub.summary.mentorsAndSponsors}</strong>
          <span>Mentors & sponsors</span>
        </article>
        <article>
          <Rocket size={18} />
          <strong>{enterpriseHub.summary.activeVentures}</strong>
          <span>Active ventures</span>
        </article>
        <article>
          <Lightbulb size={18} />
          <strong>{enterpriseHub.summary.openChallenges}</strong>
          <span>Open challenges</span>
        </article>
      </section>

      <div className="sp-enterprise-grid">
        <section className="card sp-enterprise-panel">
          <h2>Add alumni member</h2>
          <form className="sp-enterprise-form" onSubmit={(e) => void addAlumni(e)}>
            <label>
              Full name
              <input
                required
                value={alumniForm.fullName}
                onChange={(e) => setAlumniForm((f) => ({ ...f, fullName: e.target.value }))}
              />
            </label>
            <label>
              Role
              <select
                value={alumniForm.role}
                onChange={(e) => setAlumniForm((f) => ({ ...f, role: e.target.value }))}
              >
                {Object.entries(ALUMNI_ROLES).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Graduation year
              <input
                type="number"
                min={1950}
                max={2100}
                value={alumniForm.graduationYear}
                onChange={(e) => setAlumniForm((f) => ({ ...f, graduationYear: e.target.value }))}
              />
            </label>
            <label>
              Profession
              <input
                value={alumniForm.profession}
                onChange={(e) => setAlumniForm((f) => ({ ...f, profession: e.target.value }))}
              />
            </label>
            <label>
              Company
              <input
                value={alumniForm.company}
                onChange={(e) => setAlumniForm((f) => ({ ...f, company: e.target.value }))}
              />
            </label>
            <label>
              Offering (mentorship, jobs, sponsorship)
              <input
                value={alumniForm.offering}
                onChange={(e) => setAlumniForm((f) => ({ ...f, offering: e.target.value }))}
              />
            </label>
            <label>
              Email
              <input
                type="email"
                value={alumniForm.email}
                onChange={(e) => setAlumniForm((f) => ({ ...f, email: e.target.value }))}
              />
            </label>
            <button type="submit" className="ds-btn ds-btn-primary" disabled={busy}>
              Add to network
            </button>
          </form>
        </section>

        <section className="card sp-enterprise-panel">
          <h2>Register student venture</h2>
          <form className="sp-enterprise-form" onSubmit={(e) => void addProject(e)}>
            <label>
              Venture title
              <input
                required
                value={projectForm.title}
                onChange={(e) => setProjectForm((f) => ({ ...f, title: e.target.value }))}
              />
            </label>
            <label>
              Type
              <select
                value={projectForm.projectType}
                onChange={(e) => setProjectForm((f) => ({ ...f, projectType: e.target.value }))}
              >
                {Object.entries(PROJECT_TYPES).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Student lead
              <input
                required
                value={projectForm.studentLead}
                onChange={(e) => setProjectForm((f) => ({ ...f, studentLead: e.target.value }))}
              />
            </label>
            <label>
              Grade / class
              <input
                value={projectForm.gradeLevel}
                onChange={(e) => setProjectForm((f) => ({ ...f, gradeLevel: e.target.value }))}
              />
            </label>
            <label>
              Category
              <input
                value={projectForm.category}
                onChange={(e) => setProjectForm((f) => ({ ...f, category: e.target.value }))}
                placeholder="e.g. food, tech, crafts"
              />
            </label>
            {enterpriseHub.challenges.length > 0 ? (
              <label>
                Link to challenge (optional)
                <select
                  value={projectForm.challengeId}
                  onChange={(e) => setProjectForm((f) => ({ ...f, challengeId: e.target.value }))}
                >
                  <option value="">None</option>
                  {enterpriseHub.challenges.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <label className="sp-enterprise-check">
              <input
                type="checkbox"
                checked={projectForm.seekingSponsor}
                onChange={(e) => setProjectForm((f) => ({ ...f, seekingSponsor: e.target.checked }))}
              />
              Seeking brand sponsorship
            </label>
            <label>
              Description
              <textarea
                rows={3}
                value={projectForm.description}
                onChange={(e) => setProjectForm((f) => ({ ...f, description: e.target.value }))}
              />
            </label>
            <button type="submit" className="ds-btn ds-btn-primary" disabled={busy}>
              Register venture
            </button>
          </form>
        </section>

        <section className="card sp-enterprise-panel sp-enterprise-panel--wide">
          <h2>Launch innovation challenge</h2>
          <form className="sp-enterprise-form sp-enterprise-form--inline" onSubmit={(e) => void addChallenge(e)}>
            <label>
              Title
              <input
                required
                value={challengeForm.title}
                onChange={(e) => setChallengeForm((f) => ({ ...f, title: e.target.value }))}
              />
            </label>
            <label>
              Type
              <select
                value={challengeForm.challengeType}
                onChange={(e) => setChallengeForm((f) => ({ ...f, challengeType: e.target.value }))}
              >
                {Object.entries(CHALLENGE_TYPES).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Starts
              <input
                type="datetime-local"
                required
                value={challengeForm.startsAt}
                onChange={(e) => setChallengeForm((f) => ({ ...f, startsAt: e.target.value }))}
              />
            </label>
            <label>
              Prize / reward
              <input
                value={challengeForm.prizeDescription}
                onChange={(e) => setChallengeForm((f) => ({ ...f, prizeDescription: e.target.value }))}
              />
            </label>
            <button type="submit" className="ds-btn ds-btn-secondary" disabled={busy}>
              Launch challenge
            </button>
          </form>
        </section>

        <section className="card sp-enterprise-panel sp-enterprise-panel--wide">
          <h2>Alumni network</h2>
          {enterpriseHub.alumni.length > 0 ? (
            <ul className="sp-enterprise-list">
              {enterpriseHub.alumni.map((a) => (
                <li key={a.id}>
                  <div>
                    <strong>{a.fullName}</strong>
                    <span>{a.roleLabel}</span>
                    {a.profession ? <span>{a.profession}{a.company ? ` · ${a.company}` : ""}</span> : null}
                    {a.offering ? <em>{a.offering}</em> : null}
                  </div>
                  {a.graduationYear ? <span className="sp-enterprise-meta">{a.graduationYear}</span> : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="sp-muted">No alumni yet — reconnect past learners, mentors, and sponsors.</p>
          )}
        </section>

        <section className="card sp-enterprise-panel sp-enterprise-panel--wide">
          <h2>Student ventures</h2>
          {enterpriseHub.projects.length > 0 ? (
            <ul className="sp-enterprise-ventures">
              {enterpriseHub.projects.map((p) => (
                <li key={p.id}>
                  <div className="sp-enterprise-venture-head">
                    <div>
                      <strong>{p.title}</strong>
                      <span>{p.projectTypeLabel} · Lead: {p.studentLead}</span>
                    </div>
                    <span className={`sp-pill sp-pill--${p.status.toLowerCase()}`}>{p.status}</span>
                  </div>
                  {p.description ? <p className="sp-muted">{p.description}</p> : null}
                  <p className="sp-enterprise-venture-meta">
                    {p.revenueZar > 0 ? `${formatZar(p.revenueZar)} revenue · ` : ""}
                    {p.challengeTitle ? `Challenge: ${p.challengeTitle} · ` : ""}
                    {p.seekingSponsor ? "Seeking sponsor" : "Self-funded"}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="sp-muted">No ventures yet — register mini companies, products, or pitch ideas.</p>
          )}
        </section>

        {enterpriseHub.challenges.length > 0 ? (
          <section className="card sp-enterprise-panel sp-enterprise-panel--wide">
            <h2>Innovation challenges</h2>
            <ul className="sp-enterprise-challenges">
              {enterpriseHub.challenges.map((c) => (
                <li key={c.id}>
                  <strong>{c.title}</strong>
                  <span>{c.challengeTypeLabel} · {formatDateTime(c.startsAt)}</span>
                  <span>
                    {c.entriesCount} entries{c.maxEntries > 0 ? ` / ${c.maxEntries} max` : ""}
                    {c.prizeDescription ? ` · ${c.prizeDescription}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {enterpriseHub.recommendations.length > 0 ? (
          <section className="card sp-enterprise-panel sp-enterprise-panel--wide">
            <h2>Grow enterprise & alumni</h2>
            <ul className="sp-enterprise-recs">
              {enterpriseHub.recommendations.map((rec) => (
                <li key={rec.id} className={`sp-success-rec sp-success-rec--${rec.priority}`}>
                  {rec.message}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </div>
  );
}
