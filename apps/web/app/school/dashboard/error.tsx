"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function SchoolDashboardError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): JSX.Element {
  useEffect(() => {
    console.error("[school-portal]", error);
  }, [error]);

  async function signOut(): Promise<void> {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
    window.location.href = "/organisations/login?category=school";
  }

  return (
    <main className="reg-page">
      <div className="reg-container card" style={{ maxWidth: "32rem", margin: "2rem auto" }}>
        <h1 style={{ marginTop: 0 }}>We couldn&apos;t load your portal</h1>
        <p className="sp-muted">
          Your sign-in may still be valid, but the dashboard could not load right now. This is usually temporary —
          try again in a moment.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginTop: "1.25rem" }}>
          <button type="button" className="ds-btn ds-btn-primary" onClick={() => reset()}>
            Try again
          </button>
          <button type="button" className="ds-btn ds-btn-secondary" onClick={() => void signOut()}>
            Sign out
          </button>
          <Link href="/organisations/login?category=school" className="ds-btn ds-btn-secondary">
            Back to login
          </Link>
        </div>
        <p className="sp-muted" style={{ marginTop: "1rem", fontSize: "0.85rem" }}>
          Need help? Email{" "}
          <a href="mailto:schools@brand2school.co.za">schools@brand2school.co.za</a>
          {error.digest ? ` · Ref: ${error.digest}` : null}
        </p>
      </div>
    </main>
  );
}
