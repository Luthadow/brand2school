import type { ReactNode } from "react";

export default function SchoolRootLayout({ children }: { children: ReactNode }): JSX.Element {
  return <div className="sp-root">{children}</div>;
}
