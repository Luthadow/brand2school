"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { csrfHeaders } from "../../lib/clientFetch";
import { CONTACT, mailto } from "../../lib/contact";

export function SchoolLoginForm(): JSX.Element {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...csrfHeaders() },
      body: JSON.stringify({ email, password })
    });
    const data = await response.json().catch(() => ({ message: "Login failed." }));
    setLoading(false);

    if (!response.ok) {
      setError(data.message ?? "Login failed.");
      return;
    }

    router.push("/school/dashboard");
    router.refresh();
  };

  return (
    <form onSubmit={submit} className="reg-form school-login-form">
      <label className="reg-field reg-field--full">
        <span>Email</span>
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <label className="reg-field reg-field--full">
        <span>Password</span>
        <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
      </label>
      <p className="reg-hint" style={{ marginTop: "-0.5rem" }}>
        <Link href="/forgot-password">Forgot password?</Link>
      </p>
      {error ? <p className="reg-error">{error}</p> : null}
      <button type="submit" className="ds-btn ds-btn-primary ds-btn-lg reg-submit" disabled={loading}>
        {loading ? "Signing in…" : "Sign In"}
      </button>
      <p className="reg-hint" style={{ textAlign: "center" }}>
        No account? <Link href="/schools/register">Register your school</Link>
      </p>
      <p className="reg-hint" style={{ textAlign: "center" }}>
        School support: <a href={mailto(CONTACT.schools)}>{CONTACT.schools}</a>
        {" · "}
        Technical: <a href={mailto(CONTACT.support)}>{CONTACT.support}</a>
      </p>
    </form>
  );
}
