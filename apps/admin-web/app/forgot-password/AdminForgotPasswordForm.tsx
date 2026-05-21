"use client";

import { useState } from "react";
import Link from "next/link";
import { CONTACT, mailto } from "../../lib/contact";

export function AdminForgotPasswordForm(): JSX.Element {
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
      headers: { "Content-Type": "application/json" },
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
    <form onSubmit={submit} className="card" style={{ marginTop: "1rem" }}>
      <label style={{ display: "grid", gap: "0.35rem" }}>
        Account email
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      {error ? <p style={{ color: "#b91c1c" }}>{error}</p> : null}
      {message ? <p style={{ color: "#047857" }}>{message}</p> : null}
      <button type="submit" disabled={loading} style={{ marginTop: "0.75rem" }}>
        {loading ? "Sending…" : "Send reset link"}
      </button>
      <p style={{ marginTop: "0.75rem", fontSize: "0.85rem", color: "#6b7280" }}>
        <a href={mailto(CONTACT.support)}>Support</a>
      </p>
    </form>
  );
}
