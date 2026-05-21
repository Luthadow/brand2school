"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type AdminSession = {
  user: {
    id: string;
    fullName: string;
    email: string;
    role: "SUPER_ADMIN" | "ADMIN_STAFF";
    status: string;
  };
};

export function useAdminSession(): { session: AdminSession | null; loading: boolean } {
  const router = useRouter();
  const [session, setSession] = useState<AdminSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async (): Promise<void> => {
      const res = await fetch("/api/auth/session", { cache: "no-store" });
      if (!res.ok) {
        router.push("/login");
        return;
      }
      setSession((await res.json()) as AdminSession);
      setLoading(false);
    };
    void run();
  }, [router]);

  return { session, loading };
}
