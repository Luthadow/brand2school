import type { ReactNode } from "react";

export default function CommunityRootLayout({ children }: { children: ReactNode }): JSX.Element {
  return <div className="cp-root">{children}</div>;
}
