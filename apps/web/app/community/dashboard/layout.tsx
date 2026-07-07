import type { ReactNode } from "react";
import { CommunityPortalProvider } from "../../../components/community-portal/CommunityPortalContext";
import { CommunityPortalShell } from "../../../components/community-portal/CommunityPortalShell";
import { requireCommunityPortal } from "../../../lib/loadCommunityPortal";

export default async function CommunityDashboardLayout({
  children
}: {
  children: ReactNode;
}): Promise<JSX.Element> {
  const portal = await requireCommunityPortal();

  return (
    <CommunityPortalProvider portal={portal}>
      <CommunityPortalShell portal={portal}>{children}</CommunityPortalShell>
    </CommunityPortalProvider>
  );
}
