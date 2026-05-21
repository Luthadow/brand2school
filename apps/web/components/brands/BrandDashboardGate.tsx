"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

export function BrandDashboardGate({ children }: { children: ReactNode }): JSX.Element {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/brand/auth/session");
      if (!res.ok) {
        router.replace("/brand/login");
        return;
      }
      setReady(true);
    })();
  }, [router]);

  if (!ready) {
    return <p className="reg-hint" style={{ padding: "2rem", textAlign: "center" }}>Verifying brand partner access…</p>;
  }

  return <>{children}</>;
}
