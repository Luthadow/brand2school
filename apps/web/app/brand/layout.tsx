import type { ReactNode } from "react";

export default function BrandLayout({ children }: { children: ReactNode }): JSX.Element {
  return <div className="bp-root">{children}</div>;
}
