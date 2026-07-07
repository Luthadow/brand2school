"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import type { CommunityPortal } from "../../lib/communityPortal";

type CommunityPortalContextValue = CommunityPortal & {
  refresh: () => Promise<void>;
};

const CommunityPortalContext = createContext<CommunityPortalContextValue | null>(null);

export function CommunityPortalProvider({
  portal: initial,
  children
}: {
  portal: CommunityPortal;
  children: ReactNode;
}): JSX.Element {
  const [portal, setPortal] = useState(initial);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/community/portal", { cache: "no-store" });
    if (!res.ok) return;
    setPortal((await res.json()) as CommunityPortal);
  }, []);

  return (
    <CommunityPortalContext.Provider value={{ ...portal, refresh }}>
      {children}
    </CommunityPortalContext.Provider>
  );
}

export function useCommunityPortal(): CommunityPortalContextValue {
  const ctx = useContext(CommunityPortalContext);
  if (!ctx) throw new Error("useCommunityPortal must be used within CommunityPortalProvider");
  return ctx;
}
