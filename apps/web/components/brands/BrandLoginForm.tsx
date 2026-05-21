"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CONTACT, PUBLIC_PHONE, mailto } from "../../lib/contact";
import { brandCsrfHeaders } from "../../lib/brandClientFetch";

export function BrandLoginForm(): JSX.Element {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const response = await fetch("/api/brand/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...brandCsrfHeaders() },
      body: JSON.stringify({ email, password })
    });
    const data = await response.json().catch(() => ({ message: "Login failed." }));
    setLoading(false);

    if (!response.ok) {
      setError(data.message ?? "Login failed.");
      return;
    }

    router.push("/brand/dashboard");
    router.refresh();
  };

  return (
    <form onSubmit={submit} className="reg-form school-login-form">
      <label className="reg-field reg-field--full">
        <span>Brand partner email</span>
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
        {loading ? "Signing in…" : "Access Impact Dashboard"}
      </button>
      <p className="reg-hint" style={{ textAlign: "center" }}>
        New partner?{" "}
        <a href={mailto(CONTACT.brands, "Launch a brand campaign")}>Email {CONTACT.brands}</a>
        {" · "}
        <a href={PUBLIC_PHONE.telHref}>Call {PUBLIC_PHONE.display}</a>
        {" · "}
        <a href={PUBLIC_PHONE.whatsappHref} target="_blank" rel="noopener noreferrer">
          WhatsApp
        </a>
      </p>
    </form>
  );
}
