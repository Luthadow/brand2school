import "./globals.css";
import "@brand2school/branding/styles.css";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { BrandedHeader } from "@brand2school/branding";

const LOGO_SRC = "/brand2school.png";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover"
};

export const metadata: Metadata = {
  title: "Brand2School Admin",
  description: "Brand2School dedicated admin frontend",
  icons: {
    icon: LOGO_SRC,
    apple: LOGO_SRC
  }
};

export default function RootLayout({ children }: { children: ReactNode }): JSX.Element {
  return (
    <html lang="en">
      <body>
        <BrandedHeader
          logoSrc={LOGO_SRC}
          homeHref="/dashboard"
          navItems={[
            { href: "/dashboard", label: "Dashboard" },
            { href: "/dashboard/approvals", label: "Approvals" },
            { href: "/dashboard/moderation", label: "Moderation" },
            { href: "/dashboard/audit", label: "Audit" }
          ]}
        />
        {children}
      </body>
    </html>
  );
}
