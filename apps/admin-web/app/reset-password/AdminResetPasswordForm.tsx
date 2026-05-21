"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function validatePassword(password: string): string | null {
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Z]/.test(password)) return "Include at least one uppercase letter.";
  if (!/[a-z]/.test(password)) return "Include at least one lowercase letter.";
  if (!/[0-9]/.test(password)) return "Include at least one number.";
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password)) {
    return "Include at least one special character.";
  }
  return null;
}

export function AdminResetPasswordForm(): JSX.Element {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [tokenState, setTokenState] = useState<"checking" | "valid" | "invalid" | "expired">(
    token ? "checking" : "invalid"
  );

  useEffect(() => {
    if (!token) return;
    void (async () => {
      const res = await fetch(`/api/auth/reset-password/validate?token=${encodeURIComponent(token)}`);
      const data = (await res.json().catch(() => ({}))) as { valid?: boolean; expired?: boolean };
      if (data.valid) setTokenState("valid");
      else if (data.expired) setTokenState("expired");
      else setTokenState("invalid");
    })();
  }, [token]);

  const submit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const policyError = validatePassword(password);
    if (policyError) {
      setError(policyError);
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError(null);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password, confirmPassword })
    });
    const data = await res.json().catch(() => ({ message: "Reset failed." }));
    setLoading(false);

    if (!res.ok) {
      setError(data.message ?? "Reset failed.");
      return;
    }
    setMessage(data.message ?? "Password updated.");
  };

  if (!token || tokenState === "invalid") {
    return (
      <p style={{ color: "#b91c1c" }}>
        Invalid reset link. <Link href="/forgot-password">Request a new one</Link>.
      </p>
    );
  }
  if (tokenState === "expired") {
    return (
      <p style={{ color: "#b91c1c" }}>
        Link expired. <Link href="/forgot-password">Request a new one</Link>.
      </p>
    );
  }
  if (tokenState === "checking") return <p>Verifying link…</p>;

  return (
    <form onSubmit={submit} className="card" style={{ marginTop: "1rem" }}>
      <p style={{ fontSize: "0.85rem", color: "#6b7280" }}>
        Min 8 characters · upper &amp; lower case · number · special character
      </p>
      <label style={{ display: "grid", gap: "0.35rem", marginTop: "0.75rem" }}>
        New password
        <input type="password" required autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </label>
      <label style={{ display: "grid", gap: "0.35rem", marginTop: "0.5rem" }}>
        Confirm password
        <input
          type="password"
          required
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
      </label>
      {error ? <p style={{ color: "#b91c1c" }}>{error}</p> : null}
      {message ? (
        <p style={{ color: "#047857" }}>
          {message} <Link href="/login">Sign in</Link>
        </p>
      ) : null}
      <button type="submit" disabled={loading} style={{ marginTop: "0.75rem" }}>
        {loading ? "Updating…" : "Update password"}
      </button>
    </form>
  );
}
