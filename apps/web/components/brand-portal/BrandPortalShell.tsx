"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Route } from "next";
import { useEffect, useState } from "react";
import {
  BarChart3,
  Bell,
  Building2,
  CircleDollarSign,
  FileText,
  FileSignature,
  Film,
  LayoutDashboard,
  LogOut,
  Map,
  Megaphone,
  Menu,
  School,
  Settings,
  Shield,
  Sparkles,
  X
} from "lucide-react";
import { brandCsrfHeaders } from "../../lib/brandClientFetch";
import type { BrandPortal } from "../../lib/brandPortal";
import { formatZar } from "../../lib/brandPortal";

const NAV: Array<{
  href: Route;
  label: string;
  icon: typeof LayoutDashboard;
  short: string;
  report?: BrandReportSlug;
}> = [
  { href: "/brand/dashboard", label: "Overview", icon: LayoutDashboard, short: "Home", report: "overview" },
  { href: "/brand/dashboard/campaigns", label: "Campaigns", icon: Megaphone, short: "Campaigns", report: "campaigns" },
  { href: "/brand/dashboard/schools", label: "School Needs", icon: School, short: "Schools", report: "schools" },
  { href: "/brand/dashboard/submissions", label: "Submissions", icon: Shield, short: "Codes", report: "submissions" },
  { href: "/brand/dashboard/analytics", label: "Analytics", icon: BarChart3, short: "Analytics", report: "analytics" },
  { href: "/brand/dashboard/map", label: "Impact Map", icon: Map, short: "Map", report: "map" },
  { href: "/brand/dashboard/reports", label: "Reports & ESG", icon: FileText, short: "Reports", report: "reports" },
  { href: "/brand/dashboard/commercial", label: "Agreement", icon: FileSignature, short: "Deal", report: "commercial" },
  { href: "/brand/dashboard/financials", label: "Financials", icon: CircleDollarSign, short: "Funds", report: "financials" },
  { href: "/brand/dashboard/media", label: "Media & Stories", icon: Film, short: "Media", report: "media" },
  { href: "/brand/dashboard/notifications", label: "Notifications", icon: Bell, short: "Alerts" },
  { href: "/brand/dashboard/settings", label: "Settings", icon: Settings, short: "Settings" }
];

type BrandReportSlug =
  | "overview"
  | "campaigns"
  | "schools"
  | "submissions"
  | "analytics"
  | "map"
  | "reports"
  | "commercial"
  | "financials"
  | "media";

const BOTTOM_NAV = NAV.slice(0, 4);

function NavRow({
  href,
  label,
  icon: Icon,
  active,
  unread,
  report,
  onNavigate
}: {
  href: Route;
  label: string;
  icon: typeof LayoutDashboard;
  active: boolean;
  unread?: number;
  report?: BrandReportSlug;
  onNavigate?: () => void;
}): JSX.Element {
  return (
    <div className={`bp-nav-row${active ? " bp-nav-row--active" : ""}`}>
      <Link href={href} className={`bp-nav-link${active ? " bp-nav-link--active" : ""}`} onClick={onNavigate}>
        <Icon size={18} />
        {label}
        {unread ? <span className="bp-badge">{unread}</span> : null}
      </Link>
      {report ? (
        <a
          href={`/api/analytics/brand/reports/${report}/pdf`}
          className="bp-nav-pdf"
          title={`Download ${label} PDF report`}
          aria-label={`Download ${label} PDF report`}
          onClick={(e) => e.stopPropagation()}
        >
          PDF
        </a>
      ) : null}
    </div>
  );
}

export function BrandPortalShell({
  portal,
  children
}: {
  portal: BrandPortal;
  children: React.ReactNode;
}): JSX.Element {
  const pathname = usePathname();
  const unread = portal.notifications.filter((n) => !n.read).length;
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  async function logout(): Promise<void> {
    await fetch("/api/brand/auth/logout", { method: "POST", headers: brandCsrfHeaders() });
    window.location.href = "/brand/login";
  }

  return (
    <div className="bp">
      <header className="bp-mobile-bar">
        <strong>{portal.brand.name}</strong>
        <button
          type="button"
          className="bp-menu-toggle"
          aria-expanded={menuOpen}
          aria-controls="bp-sidebar"
          onClick={() => setMenuOpen((o) => !o)}
        >
          {menuOpen ? <X size={18} /> : <Menu size={18} />}
          Menu
        </button>
      </header>

      <button
        type="button"
        className={`bp-sidebar-backdrop${menuOpen ? " bp-sidebar-backdrop--visible" : ""}`}
        aria-label="Close menu"
        onClick={() => setMenuOpen(false)}
      />

      <aside id="bp-sidebar" className={`bp-sidebar${menuOpen ? " bp-sidebar--open" : ""}`}>
        <div className="bp-brand">
          <Sparkles size={20} />
          <div>
            <strong>{portal.brand.name}</strong>
            <span>Brand Partner Portal</span>
          </div>
        </div>
        <nav className="bp-nav">
          {NAV.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/brand/dashboard" && pathname.startsWith(item.href));
            return (
              <NavRow
                key={item.href}
                href={item.href}
                label={item.label}
                icon={item.icon}
                active={active}
                report={item.report}
                unread={item.href.includes("notifications") ? unread : undefined}
                onNavigate={() => setMenuOpen(false)}
              />
            );
          })}
        </nav>
        <div className="bp-sidebar-foot">
          <p>
            <Building2 size={14} /> {formatZar(portal.overview.impactValueZar)} impact value
          </p>
          <button type="button" className="bp-logout" onClick={() => void logout()}>
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </aside>

      <main className="bp-main">{children}</main>

      <nav className="bp-bottom-nav" aria-label="Brand portal mobile navigation">
        {BOTTOM_NAV.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/brand/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`bp-bottom-link${active ? " bp-bottom-link--active" : ""}`}
            >
              <Icon size={20} />
              <span>{item.short}</span>
            </Link>
          );
        })}
        <button
          type="button"
          className={`bp-bottom-link${menuOpen ? " bp-bottom-link--active" : ""}`}
          onClick={() => setMenuOpen(true)}
          aria-label="Open full menu"
        >
          <Menu size={20} />
          <span>More</span>
        </button>
      </nav>
    </div>
  );
}
