import "./globals.css";
import "@brand2school/branding/styles.css";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Inter, Montserrat } from "next/font/google";
import { BrandedHeader } from "@brand2school/branding";

const LOGO_SRC = "/brand2school.png";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["700", "800", "900"],
  variable: "--font-heading",
  display: "swap"
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap"
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover"
};

export const metadata: Metadata = {
  title: "Brand2School — Brands Have Power. Let's Use It For Our Schools.",
  description:
    "A school infrastructure impact network — help fund complete school ecosystems through brand participation, verified campaigns, and national transformation missions.",
  icons: {
    icon: LOGO_SRC,
    apple: LOGO_SRC
  }
};

export default function RootLayout({ children }: { children: ReactNode }): JSX.Element {
  return (
    <html lang="en" className={`${montserrat.variable} ${inter.variable}`}>
      <body>
        <BrandedHeader
          logoSrc={LOGO_SRC}
          homeHref="/"
          ctaHref="/for-brands#contact"
          ctaLabel="Become a Partner"
          navItems={[
            { href: "/", label: "Home" },
            { href: "/#how-it-works", label: "How It Works" },
            { href: "/partners", label: "Partners" },
            { href: "/for-brands", label: "For Brands" },
            { href: "/trust", label: "Trust" },
            { href: "/impact", label: "Impact" },
            { href: "/#for-schools", label: "For Schools" },
            { href: "/movement", label: "The Movement" },
            { href: "/submit", label: "Submit Code" },
            { href: "/schools/register", label: "Register School" },
            { href: "/school/login", label: "School Login" },
            { href: "/school/dashboard", label: "School Dashboard" },
            { href: "/brand/login", label: "Brand Login" },
            { href: "/#impact-areas", label: "Impact Areas" },
            { href: "/brand/dashboard", label: "Brand Dashboard" },
            { href: "/about", label: "About" },
            { href: "/#faq", label: "FAQ" },
            { href: "/#contact", label: "Contact" }
          ]}
        />
        {children}
      </body>
    </html>
  );
}
