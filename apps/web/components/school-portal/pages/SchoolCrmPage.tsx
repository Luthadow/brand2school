"use client";

import { useState } from "react";
import { Briefcase, Calendar, CheckSquare, Phone, Users } from "lucide-react";
import { csrfHeaders } from "../../../lib/clientFetch";
import { CRM_ACTIVITY_TYPES, CRM_CONTACT_TYPES } from "../../../lib/schoolPortal";
import { useSchoolPortal } from "../SchoolPortalContext";

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function SchoolCrmPage(): JSX.Element {
  const { crmHub, refresh } = useSchoolPortal();
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [contactForm, setContactForm] = useState({
    fullName: "",
    organization: "",
    email: "",
    phone: "",
    contactType: "BRAND",
    notes: ""
  });

  const [activityForm, setActivityForm] = useState({
    activityType: "MEETING",
    title: "",
    summary: "",
    occurredAt: "",
    contactId: ""
  });

  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    dueAt: "",
    priority: "MEDIUM",
    contactId: ""
  });

  async function addContact(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/school/crm/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...csrfHeaders() },
        body: JSON.stringify({
          ...contactForm,
          organization: contactForm.organization || null,
          email: contactForm.email || null,
          phone: contactForm.phone || null,
          notes: contactForm.notes || null
        })
      });
      const data = (await res.json()) as { message?: string };
      setMessage(res.ok ? "Contact saved." : data.message ?? "Could not save.");
      if (res.ok) {
        setContactForm({
          fullName: "",
          organization: "",
          email: "",
          phone: "",
          contactType: "BRAND",
          notes: ""
        });
        await refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  async function logActivity(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/school/crm/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...csrfHeaders() },
        body: JSON.stringify({
          activityType: activityForm.activityType,
          title: activityForm.title,
          summary: activityForm.summary || null,
          occurredAt: new Date(activityForm.occurredAt).toISOString(),
          contactId: activityForm.contactId || null
        })
      });
      const data = (await res.json()) as { message?: string };
      setMessage(res.ok ? "Activity logged." : data.message ?? "Could not save.");
      if (res.ok) {
        setActivityForm({
          activityType: "MEETING",
          title: "",
          summary: "",
          occurredAt: "",
          contactId: ""
        });
        await refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  async function addTask(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/school/crm/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...csrfHeaders() },
        body: JSON.stringify({
          title: taskForm.title,
          description: taskForm.description || null,
          dueAt: taskForm.dueAt ? new Date(taskForm.dueAt).toISOString() : null,
          priority: taskForm.priority,
          contactId: taskForm.contactId || null
        })
      });
      const data = (await res.json()) as { message?: string };
      setMessage(res.ok ? "Task created." : data.message ?? "Could not save.");
      if (res.ok) {
        setTaskForm({ title: "", description: "", dueAt: "", priority: "MEDIUM", contactId: "" });
        await refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  async function completeTask(taskId: string): Promise<void> {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/school/crm/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...csrfHeaders() },
        body: JSON.stringify({ status: "DONE" })
      });
      const data = (await res.json()) as { message?: string };
      setMessage(res.ok ? "Task completed." : data.message ?? "Could not update.");
      if (res.ok) await refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="sp-page sp-crm-page">
      <header className="sp-crm-hero">
        <div>
          <p className="ds-eyebrow">School CRM</p>
          <h1>Relationships & follow-ups</h1>
          <p className="sp-muted">
            Track meetings, calls, support, campaigns, document renewals, and tasks — every school interaction in
            one place.
          </p>
        </div>
      </header>

      {message ? <p className="sp-crm-message">{message}</p> : null}

      <section className="sp-crm-kpi">
        <article>
          <Users size={18} />
          <strong>{crmHub.summary.contacts}</strong>
          <span>Contacts</span>
        </article>
        <article>
          <Phone size={18} />
          <strong>{crmHub.summary.activitiesThisMonth}</strong>
          <span>This month</span>
        </article>
        <article>
          <CheckSquare size={18} />
          <strong>{crmHub.summary.openTasks}</strong>
          <span>Open tasks</span>
        </article>
        <article>
          <Calendar size={18} />
          <strong>{crmHub.summary.overdueTasks}</strong>
          <span>Overdue</span>
        </article>
      </section>

      <div className="sp-crm-grid">
        <section className="card sp-crm-panel">
          <h2>
            <Briefcase size={16} /> Add contact
          </h2>
          <form className="sp-crm-form" onSubmit={(e) => void addContact(e)}>
            <label>
              Full name
              <input
                required
                value={contactForm.fullName}
                onChange={(e) => setContactForm((f) => ({ ...f, fullName: e.target.value }))}
              />
            </label>
            <label>
              Type
              <select
                value={contactForm.contactType}
                onChange={(e) => setContactForm((f) => ({ ...f, contactType: e.target.value }))}
              >
                {Object.entries(CRM_CONTACT_TYPES).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Organisation
              <input
                value={contactForm.organization}
                onChange={(e) => setContactForm((f) => ({ ...f, organization: e.target.value }))}
              />
            </label>
            <label>
              Email
              <input
                type="email"
                value={contactForm.email}
                onChange={(e) => setContactForm((f) => ({ ...f, email: e.target.value }))}
              />
            </label>
            <label>
              Phone
              <input
                value={contactForm.phone}
                onChange={(e) => setContactForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </label>
            <button type="submit" className="ds-btn ds-btn-primary" disabled={busy}>
              Save contact
            </button>
          </form>
        </section>

        <section className="card sp-crm-panel">
          <h2>Log activity</h2>
          <form className="sp-crm-form" onSubmit={(e) => void logActivity(e)}>
            <label>
              Type
              <select
                value={activityForm.activityType}
                onChange={(e) => setActivityForm((f) => ({ ...f, activityType: e.target.value }))}
              >
                {Object.entries(CRM_ACTIVITY_TYPES).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Title
              <input
                required
                value={activityForm.title}
                onChange={(e) => setActivityForm((f) => ({ ...f, title: e.target.value }))}
              />
            </label>
            <label>
              When
              <input
                type="datetime-local"
                required
                value={activityForm.occurredAt}
                onChange={(e) => setActivityForm((f) => ({ ...f, occurredAt: e.target.value }))}
              />
            </label>
            {crmHub.contacts.length > 0 ? (
              <label>
                Contact (optional)
                <select
                  value={activityForm.contactId}
                  onChange={(e) => setActivityForm((f) => ({ ...f, contactId: e.target.value }))}
                >
                  <option value="">None</option>
                  {crmHub.contacts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.fullName} — {c.contactTypeLabel}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <label>
              Notes
              <textarea
                rows={3}
                value={activityForm.summary}
                onChange={(e) => setActivityForm((f) => ({ ...f, summary: e.target.value }))}
              />
            </label>
            <button type="submit" className="ds-btn ds-btn-primary" disabled={busy}>
              Log activity
            </button>
          </form>
        </section>

        <section className="card sp-crm-panel sp-crm-panel--wide">
          <h2>Create task</h2>
          <form className="sp-crm-form sp-crm-form--inline" onSubmit={(e) => void addTask(e)}>
            <label>
              Task
              <input
                required
                value={taskForm.title}
                onChange={(e) => setTaskForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Follow up brand renewal"
              />
            </label>
            <label>
              Due
              <input
                type="datetime-local"
                value={taskForm.dueAt}
                onChange={(e) => setTaskForm((f) => ({ ...f, dueAt: e.target.value }))}
              />
            </label>
            <label>
              Priority
              <select
                value={taskForm.priority}
                onChange={(e) => setTaskForm((f) => ({ ...f, priority: e.target.value }))}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </label>
            <button type="submit" className="ds-btn ds-btn-secondary" disabled={busy}>
              Add task
            </button>
          </form>
        </section>

        <section className="card sp-crm-panel sp-crm-panel--wide">
          <h2>Contacts</h2>
          {crmHub.contacts.length > 0 ? (
            <ul className="sp-crm-contacts">
              {crmHub.contacts.map((c) => (
                <li key={c.id}>
                  <div>
                    <strong>{c.fullName}</strong>
                    <span>{c.contactTypeLabel}{c.organization ? ` · ${c.organization}` : ""}</span>
                    {c.email ? <span>{c.email}</span> : null}
                  </div>
                  <div className="sp-crm-contact-meta">
                    <span>{c.activityCount} activities</span>
                    <span>{c.openTaskCount} open tasks</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="sp-muted">No contacts yet — add brand partners, SGB members, and support contacts.</p>
          )}
        </section>

        <section className="card sp-crm-panel">
          <h2>Open tasks</h2>
          {crmHub.tasks.filter((t) => t.status === "OPEN").length > 0 ? (
            <ul className="sp-crm-tasks">
              {crmHub.tasks
                .filter((t) => t.status === "OPEN")
                .map((t) => (
                  <li key={t.id} className={t.isOverdue ? "sp-crm-task--overdue" : ""}>
                    <div>
                      <strong>{t.title}</strong>
                      {t.contactName ? <span>{t.contactName}</span> : null}
                      {t.dueAt ? <span>Due {formatDateTime(t.dueAt)}</span> : null}
                    </div>
                    <div className="sp-crm-task-actions">
                      <span className={`sp-pill sp-pill--${t.priority.toLowerCase()}`}>{t.priority}</span>
                      <button
                        type="button"
                        className="ds-btn ds-btn-ghost ds-btn-sm"
                        disabled={busy}
                        onClick={() => void completeTask(t.id)}
                      >
                        Done
                      </button>
                    </div>
                  </li>
                ))}
            </ul>
          ) : (
            <p className="sp-muted">No open tasks — create follow-ups after meetings and renewals.</p>
          )}
        </section>

        <section className="card sp-crm-panel">
          <h2>Recent activity</h2>
          {crmHub.activities.length > 0 ? (
            <ul className="sp-crm-activity">
              {crmHub.activities.map((a) => (
                <li key={a.id}>
                  <strong>{a.title}</strong>
                  <span>
                    {a.activityTypeLabel}
                    {a.contactName ? ` · ${a.contactName}` : ""}
                  </span>
                  <em>{formatDateTime(a.occurredAt)}</em>
                  {a.summary ? <p className="sp-muted">{a.summary}</p> : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="sp-muted">No activity logged yet.</p>
          )}
        </section>

        {crmHub.recommendations.length > 0 ? (
          <section className="card sp-crm-panel sp-crm-panel--wide">
            <h2>CRM recommendations</h2>
            <ul className="sp-crm-recs">
              {crmHub.recommendations.map((rec) => (
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
