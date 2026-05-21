"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { csrfHeaders } from "../../lib/clientFetch";
import { passwordPolicyHint, validatePasswordStrength } from "../../lib/passwordPolicy";

export function ResetPasswordForm(): JSX.Element {
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
      const res = await fetch(`/api/auth/reset-password/validate?token=${encodeURIComponent(token)}`, {
        cache: "no-store"
      });
      const data = (await res.json().catch(() => ({}))) as { valid?: boolean; expired?: boolean };
      if (data.valid) setTokenState("valid");
      else if (data.expired) setTokenState("expired");
      else setTokenState("invalid");
    })();
  }, [token]);

  const submit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!token || tokenState !== "valid") {
      setError("This reset link is invalid. Request a new one.");
      return;
    }

    const policyError = validatePasswordStrength(password);
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
    setMessage(null);

    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...csrfHeaders() },
      body: JSON.stringify({ token, password, confirmPassword })
    });
    const data = await res.json().catch(() => ({ message: "Reset failed." }));
    setLoading(false);

    if (!res.ok) {
      setError(data.message ?? "Reset failed.");
      return;
    }

    setMessage(data.message ?? "Password updated. A confirmation email has been sent.");
  };

  if (!token || tokenState === "invalid") {
    return (
      <p className="reg-error">
        This reset link is missing or invalid. Passwords cannot be retrieved — only reset.{" "}
        <Link href="/forgot-password">Request a new link</Link>.
      </p>
    );
  }

  if (tokenState === "expired") {
    return (
      <p className="reg-error">
        This reset link has expired. <Link href="/forgot-password">Request a new link</Link>.
      </p>
    );
  }

  if (tokenState === "checking") {
    return <p className="reg-hint">Verifying reset link…</p>;
  }

  return (
    <form onSubmit={submit} className="reg-form">
      <p className="reg-hint">{passwordPolicyHint}</p>
      <label className="reg-field reg-field--full">
        <span>New password</span>
        <input
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>
      <label className="reg-field reg-field--full">
        <span>Confirm password</span>
        <input
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
      </label>
      {error ? <p className="reg-error">{error}</p> : null}
      {message ? (
        <p className="reg-message--ok">
          {message}{" "}
          <Link href="/school/login">School login</Link>
          {" · "}
          <Link href="/brand/login">Brand login</Link>
        </p>
      ) : null}
      <button type="submit" className="ds-btn ds-btn-primary ds-btn-lg reg-submit" disabled={loading}>
        {loading ? "Updating…" : "Update password"}
      </button>
    </form>
  );
}
