import type { ReactNode } from "react";
import { SchoolPortalProvider } from "../../../components/school-portal/SchoolPortalContext";
import { SchoolPortalShell } from "../../../components/school-portal/SchoolPortalShell";
import { requireSchoolPortal } from "../../../lib/loadSchoolPortal";

export default async function SchoolDashboardLayout({
  children
}: {
  children: ReactNode;
}): Promise<JSX.Element> {
  const portal = await requireSchoolPortal();

  return (
    <SchoolPortalProvider portal={portal}>
      <SchoolPortalShell portal={portal}>{children}</SchoolPortalShell>
    </SchoolPortalProvider>
  );
}
