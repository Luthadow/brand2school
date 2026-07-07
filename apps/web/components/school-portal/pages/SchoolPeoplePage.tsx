"use client";

import { useState } from "react";
import { Calendar, UserCheck, Users, Clock } from "lucide-react";
import { csrfHeaders } from "../../../lib/clientFetch";
import { EVENT_TYPES } from "../../../lib/schoolPortal";
import { useSchoolPortal } from "../SchoolPortalContext";

const VOLUNTEER_ROLES = ["Parent", "SGB member", "Teacher", "Alumni", "Community leader", "Other"];

function formatEventDate(iso: string): string {
  return new Date(iso).toLocaleString("en-ZA", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function SchoolPeoplePage(): JSX.Element {
  const { peopleHub, refresh } = useSchoolPortal();
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [assigningEventId, setAssigningEventId] = useState<string | null>(null);
  const [assignVolunteerId, setAssignVolunteerId] = useState("");

  const [volunteerForm, setVolunteerForm] = useState({
    fullName: "",
    role: "Parent",
    phone: "",
    email: "",
    skills: "",
    hoursLogged: 0
  });

  const [eventForm, setEventForm] = useState({
    title: "",
    description: "",
    eventType: "campaign_drive",
    location: "",
    startsAt: "",
    endsAt: "",
    volunteerSlots: 5
  });

  const activeVolunteers = peopleHub.volunteers.filter((v) => v.status === "ACTIVE");
  const now = Date.now();
  const upcoming = peopleHub.events.filter(
    (e) => e.status === "SCHEDULED" && new Date(e.startsAt).getTime() >= now
  );

  async function addVolunteer(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/school/volunteers", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...csrfHeaders() },
        body: JSON.stringify({
          ...volunteerForm,
          phone: volunteerForm.phone || null,
          email: volunteerForm.email || null,
          skills: volunteerForm.skills || null
        })
      });
      const data = (await res.json()) as { message?: string };
      setMessage(res.ok ? "Volunteer registered." : data.message ?? "Could not save volunteer.");
      if (res.ok) {
        setVolunteerForm({ fullName: "", role: "Parent", phone: "", email: "", skills: "", hoursLogged: 0 });
        await refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  async function addEvent(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/school/events", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...csrfHeaders() },
        body: JSON.stringify({
          title: eventForm.title,
          description: eventForm.description || null,
          eventType: eventForm.eventType,
          location: eventForm.location || null,
          startsAt: new Date(eventForm.startsAt).toISOString(),
          endsAt: eventForm.endsAt ? new Date(eventForm.endsAt).toISOString() : null,
          volunteerSlots: eventForm.volunteerSlots,
          status: "SCHEDULED"
        })
      });
      const data = (await res.json()) as { message?: string };
      setMessage(res.ok ? "Event scheduled." : data.message ?? "Could not save event.");
      if (res.ok) {
        setEventForm({
          title: "",
          description: "",
          eventType: "campaign_drive",
          location: "",
          startsAt: "",
          endsAt: "",
          volunteerSlots: 5
        });
        await refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  async function assignVolunteer(eventId: string): Promise<void> {
    if (!assignVolunteerId) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/school/events/${eventId}/volunteers`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...csrfHeaders() },
        body: JSON.stringify({ volunteerId: assignVolunteerId })
      });
      const data = (await res.json()) as { message?: string };
      setMessage(res.ok ? "Volunteer assigned." : data.message ?? "Could not assign.");
      if (res.ok) {
        setAssigningEventId(null);
        setAssignVolunteerId("");
        await refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="sp-page sp-people-page">
      <header className="sp-people-hero">
        <div>
          <p className="ds-eyebrow">People & events</p>
          <h1>Volunteers & school events</h1>
          <p className="sp-muted">
            Coordinate parents, SGB members, and community helpers — schedule campaign drives and track who is
            mobilising verified participation.
          </p>
        </div>
      </header>

      {message ? <p className="sp-people-message">{message}</p> : null}

      <section className="sp-people-kpi">
        <article>
          <UserCheck size={18} />
          <strong>{peopleHub.summary.activeVolunteers}</strong>
          <span>Active volunteers</span>
        </article>
        <article>
          <Clock size={18} />
          <strong>{peopleHub.summary.totalHoursLogged}</strong>
          <span>Hours logged</span>
        </article>
        <article>
          <Calendar size={18} />
          <strong>{peopleHub.summary.upcomingEvents}</strong>
          <span>Upcoming events</span>
        </article>
        <article>
          <Users size={18} />
          <strong>{peopleHub.summary.openVolunteerSlots}</strong>
          <span>Open slots</span>
        </article>
      </section>

      <div className="sp-people-grid">
        <section className="card sp-people-panel">
          <h2>Register a volunteer</h2>
          <form className="sp-people-form" onSubmit={(e) => void addVolunteer(e)}>
            <label>
              Full name
              <input
                required
                value={volunteerForm.fullName}
                onChange={(e) => setVolunteerForm((f) => ({ ...f, fullName: e.target.value }))}
              />
            </label>
            <label>
              Role
              <select
                value={volunteerForm.role}
                onChange={(e) => setVolunteerForm((f) => ({ ...f, role: e.target.value }))}
              >
                {VOLUNTEER_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Phone
              <input
                value={volunteerForm.phone}
                onChange={(e) => setVolunteerForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </label>
            <label>
              Email
              <input
                type="email"
                value={volunteerForm.email}
                onChange={(e) => setVolunteerForm((f) => ({ ...f, email: e.target.value }))}
              />
            </label>
            <label>
              Skills / notes
              <input
                value={volunteerForm.skills}
                onChange={(e) => setVolunteerForm((f) => ({ ...f, skills: e.target.value }))}
                placeholder="e.g. WhatsApp outreach, sports coordination"
              />
            </label>
            <button type="submit" className="ds-btn ds-btn-primary" disabled={busy}>
              Add volunteer
            </button>
          </form>
        </section>

        <section className="card sp-people-panel">
          <h2>Schedule an event</h2>
          <form className="sp-people-form" onSubmit={(e) => void addEvent(e)}>
            <label>
              Title
              <input
                required
                value={eventForm.title}
                onChange={(e) => setEventForm((f) => ({ ...f, title: e.target.value }))}
              />
            </label>
            <label>
              Event type
              <select
                value={eventForm.eventType}
                onChange={(e) => setEventForm((f) => ({ ...f, eventType: e.target.value }))}
              >
                {Object.entries(EVENT_TYPES).map(([key, label]) => (
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
                value={eventForm.startsAt}
                onChange={(e) => setEventForm((f) => ({ ...f, startsAt: e.target.value }))}
              />
            </label>
            <label>
              Ends (optional)
              <input
                type="datetime-local"
                value={eventForm.endsAt}
                onChange={(e) => setEventForm((f) => ({ ...f, endsAt: e.target.value }))}
              />
            </label>
            <label>
              Location
              <input
                value={eventForm.location}
                onChange={(e) => setEventForm((f) => ({ ...f, location: e.target.value }))}
              />
            </label>
            <label>
              Volunteer slots
              <input
                type="number"
                min={0}
                value={eventForm.volunteerSlots}
                onChange={(e) => setEventForm((f) => ({ ...f, volunteerSlots: Number(e.target.value) }))}
              />
            </label>
            <label>
              Description
              <textarea
                rows={3}
                value={eventForm.description}
                onChange={(e) => setEventForm((f) => ({ ...f, description: e.target.value }))}
              />
            </label>
            <button type="submit" className="ds-btn ds-btn-primary" disabled={busy}>
              Schedule event
            </button>
          </form>
        </section>

        <section className="card sp-people-panel sp-people-panel--wide">
          <h2>Volunteer roster</h2>
          {peopleHub.volunteers.length > 0 ? (
            <ul className="sp-people-roster">
              {peopleHub.volunteers.map((v) => (
                <li key={v.id}>
                  <div>
                    <strong>{v.fullName}</strong>
                    <span>{v.role}</span>
                    {v.phone ? <span>{v.phone}</span> : null}
                  </div>
                  <div className="sp-people-roster-meta">
                    <span>{v.hoursLogged}h logged</span>
                    <span>{v.eventsAssigned} event(s)</span>
                    <span className={`sp-pill sp-pill--${v.status.toLowerCase()}`}>{v.status}</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="sp-muted">No volunteers yet — register parents and SGB members to coordinate drives.</p>
          )}
        </section>

        <section className="card sp-people-panel sp-people-panel--wide">
          <h2>Upcoming & recent events</h2>
          {peopleHub.events.length > 0 ? (
            <ul className="sp-people-events">
              {peopleHub.events.map((ev) => {
                const slotsOpen = Math.max(0, ev.volunteerSlots - ev.volunteersAssigned);
                const isUpcoming = ev.status === "SCHEDULED" && new Date(ev.startsAt).getTime() >= now;
                return (
                  <li key={ev.id} className={isUpcoming ? "sp-people-event--upcoming" : ""}>
                    <div className="sp-people-event-head">
                      <div>
                        <strong>{ev.title}</strong>
                        <span>{ev.eventTypeLabel}</span>
                      </div>
                      <span className={`sp-pill sp-pill--${ev.status.toLowerCase()}`}>{ev.status}</span>
                    </div>
                    <p className="sp-muted">{formatEventDate(ev.startsAt)}{ev.location ? ` · ${ev.location}` : ""}</p>
                    <p className="sp-people-event-slots">
                      {ev.volunteersAssigned}/{ev.volunteerSlots} volunteers
                      {slotsOpen > 0 ? ` · ${slotsOpen} open` : ""}
                    </p>
                    {ev.volunteers.length > 0 ? (
                      <ul className="sp-people-event-vols">
                        {ev.volunteers.map((v) => (
                          <li key={v.id}>
                            {v.fullName} <span>({v.role})</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    {isUpcoming && activeVolunteers.length > 0 && slotsOpen > 0 ? (
                      assigningEventId === ev.id ? (
                        <div className="sp-people-assign">
                          <select
                            value={assignVolunteerId}
                            onChange={(e) => setAssignVolunteerId(e.target.value)}
                          >
                            <option value="">Select volunteer</option>
                            {activeVolunteers.map((v) => (
                              <option key={v.id} value={v.id}>
                                {v.fullName} — {v.role}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            className="ds-btn ds-btn-secondary ds-btn-sm"
                            disabled={busy || !assignVolunteerId}
                            onClick={() => void assignVolunteer(ev.id)}
                          >
                            Assign
                          </button>
                          <button
                            type="button"
                            className="ds-btn ds-btn-ghost ds-btn-sm"
                            onClick={() => setAssigningEventId(null)}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="ds-btn ds-btn-secondary ds-btn-sm"
                          onClick={() => setAssigningEventId(ev.id)}
                        >
                          Assign volunteer
                        </button>
                      )
                    ) : null}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="sp-muted">No events scheduled — plan a campaign code drive to mobilise your community.</p>
          )}
        </section>

        {peopleHub.recommendations.length > 0 ? (
          <section className="card sp-people-panel sp-people-panel--wide">
            <h2>Recommendations</h2>
            <ul className="sp-people-recs">
              {peopleHub.recommendations.map((rec) => (
                <li key={rec.id} className={`sp-success-rec sp-success-rec--${rec.priority}`}>
                  {rec.message}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>

      {upcoming.length > 0 ? (
        <p className="sp-muted sp-people-foot">
          {upcoming.length} upcoming event(s) visible on your public school profile when published.
        </p>
      ) : null}
    </div>
  );
}
