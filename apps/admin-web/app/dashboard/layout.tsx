import type { ReactNode } from "react";
import { AdminShell } from "./AdminShell";

export default function DashboardLayout({ children }: { children: ReactNode }): JSX.Element {
  return (
    <div className="admin-app">
      <AdminShell>{children}</AdminShell>
    </div>
  );
}
