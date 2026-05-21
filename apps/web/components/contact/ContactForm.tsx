"use client";

import { useState } from "react";
import { csrfHeaders } from "../../lib/clientFetch";

const TOPICS = [
  "General enquiry",
  "School onboarding",
  "Brand partnership",
  "Technical support",
  "Other"
] as const;

export function ContactForm(): JSX.Element {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [organisation, setOrganisation] = useState("");
  const [phone, setPhone] = useState("");
  const [topic, setTopic] = useState<(typeof TOPICS)[number]>("General enquiry");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...csrfHeaders() },
      body: JSON.stringify({
        fullName,
        email,
        organisation: organisation || undefined,
        phone: phone || undefined,
        topic,
        message
      })
    });
    const data = await res.json().catch(() => ({ message: "Could not send your message." }));
    setLoading(false);

    if (!res.ok) {
      setError(data.message ?? "Could not send your message.");
      return;
    }

    setSuccess(data.message ?? "Thank you. We will respond soon.");
    setFullName("");
    setEmail("");
    setOrganisation("");
    setPhone("");
    setMessage("");
    setTopic("General enquiry");
  };

  return (
    <form onSubmit={submit} className="reg-form contact-form">
      <div className="reg-form-grid">
        <label className="reg-field">
          <span>Full name</span>
          <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </label>
        <label className="reg-field">
          <span>Email</span>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="reg-field">
          <span>Organisation (optional)</span>
          <input type="text" value={organisation} onChange={(e) => setOrganisation(e.target.value)} />
        </label>
        <label className="reg-field">
          <span>Phone (optional)</span>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </label>
        <label className="reg-field reg-field--full">
          <span>Topic</span>
          <select value={topic} onChange={(e) => setTopic(e.target.value as (typeof TOPICS)[number])}>
            {TOPICS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label className="reg-field reg-field--full">
          <span>Message</span>
          <textarea
            required
            minLength={10}
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </label>
      </div>
      {error ? <p className="reg-error">{error}</p> : null}
      {success ? <p className="reg-message--ok">{success}</p> : null}
      <button type="submit" className="ds-btn ds-btn-primary ds-btn-lg reg-submit" disabled={loading}>
        {loading ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
