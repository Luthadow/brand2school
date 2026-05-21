"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import type { SchoolPortal } from "../../lib/schoolPortal";

type SchoolPortalContextValue = SchoolPortal & {
  refresh: () => Promise<void>;
};

const SchoolPortalContext = createContext<SchoolPortalContextValue | null>(null);

export function SchoolPortalProvider({
  portal: initial,
  children
}: {
  portal: SchoolPortal;
  children: ReactNode;
}): JSX.Element {
  const [portal, setPortal] = useState(initial);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/school/portal", { cache: "no-store" });
    if (!res.ok) return;
    setPortal((await res.json()) as SchoolPortal);
  }, []);

  return (
    <SchoolPortalContext.Provider value={{ ...portal, refresh }}>{children}</SchoolPortalContext.Provider>
  );
}

export function useSchoolPortal(): SchoolPortalContextValue {
  const ctx = useContext(SchoolPortalContext);
  if (!ctx) throw new Error("useSchoolPortal must be used within SchoolPortalProvider");
  return ctx;
}
