"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { BrandPortal } from "../../lib/brandPortal";

const BrandPortalContext = createContext<BrandPortal | null>(null);

export function BrandPortalProvider({
  portal,
  children
}: {
  portal: BrandPortal;
  children: ReactNode;
}): JSX.Element {
  return <BrandPortalContext.Provider value={portal}>{children}</BrandPortalContext.Provider>;
}

export function useBrandPortal(): BrandPortal {
  const ctx = useContext(BrandPortalContext);
  if (!ctx) throw new Error("useBrandPortal must be used within BrandPortalProvider");
  return ctx;
}


