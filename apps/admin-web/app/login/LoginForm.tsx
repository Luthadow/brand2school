"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CONTACT, INTERNAL_CONTACT, mailto } from "../../lib/contact";

export function LoginForm(): JSX.Element {
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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const data = await response.json().catch(() => ({ message: "Login failed." }));
    setLoading(false);
    if (!response.ok) {
      setError(data.message ?? "Login failed.");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <form onSubmit={submit} className="card" style={{ maxWidth: "460px", margin: "4rem auto" }}>
      <h1>Admin Login</h1>
      <p>Use SUPER_ADMIN or ADMIN_STAFF credentials.</p>
      <div style={{ display: "grid", gap: "0.75rem" }}>
        <label>
          Email
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required style={{ width: "100%" }} />
        </label>
        <label>
          Password
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            required
            style={{ width: "100%" }}
          />
        </label>
        <p style={{ margin: 0, fontSize: "0.85rem" }}>
          <a href="/forgot-password">Forgot password?</a>
        </p>
        <button type="submit" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </button>
        {error ? <p style={{ color: "#d14343", margin: 0 }}>{error}</p> : null}
      </div>
      <p style={{ marginTop: "1rem", fontSize: "0.875rem", color: "#6b7280" }}>
        Admin access: <a href={mailto(INTERNAL_CONTACT.admin)}>{INTERNAL_CONTACT.admin}</a>
        {" · "}
        Technical support: <a href={mailto(CONTACT.support)}>{CONTACT.support}</a>
      </p>
    </form>
  );
}
