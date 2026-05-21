"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Route } from "next";
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
  School,
  Settings,
  Shield,
  Sparkles
} from "lucide-react";
import { brandCsrfHeaders } from "../../lib/brandClientFetch";
import type { BrandPortal } from "../../lib/brandPortal";
import { formatZar } from "../../lib/brandPortal";

const NAV: Array<{ href: Route; label: string; icon: typeof LayoutDashboard }> = [
  { href: "/brand/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/brand/dashboard/campaigns", label: "Campaigns", icon: Megaphone },
  { href: "/brand/dashboard/schools", label: "School Needs", icon: School },
  { href: "/brand/dashboard/submissions", label: "Submissions", icon: Shield },
  { href: "/brand/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/brand/dashboard/map", label: "Impact Map", icon: Map },
  { href: "/brand/dashboard/reports", label: "Reports & ESG", icon: FileText },
  { href: "/brand/dashboard/commercial", label: "Agreement", icon: FileSignature },
  { href: "/brand/dashboard/financials", label: "Financials", icon: CircleDollarSign },
  { href: "/brand/dashboard/media", label: "Media & Stories", icon: Film },
  { href: "/brand/dashboard/notifications", label: "Notifications", icon: Bell },
  { href: "/brand/dashboard/settings", label: "Settings", icon: Settings }
];

export function BrandPortalShell({
  portal,
  children
}: {
  portal: BrandPortal;
  children: React.ReactNode;
}): JSX.Element {
  const pathname = usePathname();
  const unread = portal.notifications.filter((n) => !n.read).length;

  async function logout(): Promise<void> {
    await fetch("/api/brand/auth/logout", { method: "POST", headers: brandCsrfHeaders() });
    window.location.href = "/brand/login";
  }

  return (
    <div className="bp">
      <aside className="bp-sidebar">
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
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`bp-nav-link${active ? " bp-nav-link--active" : ""}`}
              >
                <Icon size={18} />
                {item.label}
                {item.href.includes("notifications") && unread > 0 ? (
                  <span className="bp-badge">{unread}</span>
                ) : null}
              </Link>
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
    </div>
  );
}



