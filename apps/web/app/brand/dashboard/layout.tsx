import type { ReactNode } from "react";
import { BrandPortalProvider } from "../../../components/brand-portal/BrandPortalContext";
import { BrandPortalShell } from "../../../components/brand-portal/BrandPortalShell";
import { requireBrandPortal } from "../../../lib/loadBrandPortal";

export default async function BrandDashboardLayout({
  children
}: {
  children: ReactNode;
}): Promise<JSX.Element> {
  const portal = await requireBrandPortal();

  return (
    <BrandPortalProvider portal={portal}>
      <BrandPortalShell portal={portal}>{children}</BrandPortalShell>
    </BrandPortalProvider>
  );
}
