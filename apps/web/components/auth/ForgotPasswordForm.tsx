"use client";

import { useState } from "react";
import Link from "next/link";
import { csrfHeaders } from "../../lib/clientFetch";
import { CONTACT, mailto } from "../../lib/contact";

export function ForgotPasswordForm(): JSX.Element {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...csrfHeaders() },
      body: JSON.stringify({ email })
    });
    const data = await res.json().catch(() => ({ message: "Request failed." }));
    setLoading(false);

    if (!res.ok) {
      setError(data.message ?? "Request failed.");
      return;
    }

    setMessage(data.message ?? "Check your email for reset instructions.");
  };

  return (
    <form onSubmit={submit} className="reg-form">
      <label className="reg-field reg-field--full">
        <span>Account email</span>
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      {error ? <p className="reg-error">{error}</p> : null}
      {message ? <p className="reg-message--ok">{message}</p> : null}
      <button type="submit" className="ds-btn ds-btn-primary ds-btn-lg reg-submit" disabled={loading}>
        {loading ? "Sending…" : "Send reset link"}
      </button>
      <p className="reg-hint" style={{ textAlign: "center" }}>
        <Link href="/school/login">School login</Link>
        {" · "}
        <Link href="/brand/login">Brand login</Link>
        {" · "}
        <a href={mailto(CONTACT.support)}>Support</a>
      </p>
      <p className="reg-hint" style={{ textAlign: "center", fontSize: "0.8rem" }}>
        We never email your existing password.
      </p>
    </form>
  );
}
