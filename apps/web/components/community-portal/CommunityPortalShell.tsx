"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Route } from "next";
import { useEffect, useState } from "react";
import {
  Award,
  FileText,
  Home,
  LogOut,
  Menu,
  School,
  Share2,
  TrendingUp,
  User,
  Users,
  X
} from "lucide-react";
import { csrfHeaders } from "../../lib/clientFetch";
import type { CommunityPortal } from "../../lib/communityPortal";

const NAV: Array<{
  href: Route;
  label: string;
  icon: typeof Home;
  short: string;
}> = [
  { href: "/community/dashboard" as Route, label: "Success Centre", icon: Home, short: "Home" },
  { href: "/community/dashboard/participation" as Route, label: "Participation", icon: TrendingUp, short: "Stats" },
  { href: "/community/dashboard/recognition" as Route, label: "Champions", icon: Award, short: "Badges" },
  { href: "/community/dashboard/schools" as Route, label: "Linked schools", icon: School, short: "Schools" },
  { href: "/community/dashboard/share" as Route, label: "Share kit", icon: Share2, short: "Share" },
  { href: "/community/dashboard/documents" as Route, label: "Documents", icon: FileText, short: "Docs" },
  { href: "/community/dashboard/profile" as Route, label: "Profile", icon: User, short: "You" }
];

const BOTTOM_NAV = NAV.slice(0, 4);

function NavRow({
  href,
  label,
  icon: Icon,
  active,
  onNavigate
}: {
  href: Route;
  label: string;
  icon: typeof Home;
  active: boolean;
  onNavigate?: () => void;
}): JSX.Element {
  return (
    <div className={`cp-nav-row${active ? " cp-nav-row--active" : ""}`}>
      <Link href={href} className={`cp-nav-link${active ? " cp-nav-link--active" : ""}`} onClick={onNavigate}>
        <Icon size={18} />
        {label}
      </Link>
    </div>
  );
}

export function CommunityPortalShell({
  portal,
  children
}: {
  portal: CommunityPortal;
  children: React.ReactNode;
}): JSX.Element {
  const pathname = usePathname();
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
    await fetch("/api/auth/logout", { method: "POST", headers: csrfHeaders() });
    window.location.href = "/organisations/login?category=community";
  }

  return (
    <div className="cp">
      <header className="cp-mobile-bar">
        <strong>{portal.organization.name}</strong>
        <button
          type="button"
          className="cp-menu-toggle"
          aria-expanded={menuOpen}
          aria-controls="cp-sidebar"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X size={18} /> : <Menu size={18} />}
          Menu
        </button>
      </header>

      <button
        type="button"
        className={`cp-sidebar-backdrop${menuOpen ? " cp-sidebar-backdrop--visible" : ""}`}
        aria-label="Close menu"
        onClick={() => setMenuOpen(false)}
      />

      <aside id="cp-sidebar" className={`cp-sidebar${menuOpen ? " cp-sidebar--open" : ""}`} aria-label="Community navigation">
        <div className="cp-brand">
          <strong>{portal.organization.name}</strong>
          <span>{portal.recognition.levelLabel}</span>
          <em>{portal.organizationMeta.label}</em>
        </div>
        <nav className="cp-nav">
          {NAV.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== ("/community/dashboard" as Route) && pathname.startsWith(item.href));
            return (
              <NavRow
                key={item.href}
                href={item.href}
                label={item.label}
                icon={item.icon}
                active={active}
                onNavigate={() => setMenuOpen(false)}
              />
            );
          })}
        </nav>
        <div className="cp-sidebar-foot">
          <span className="cp-chip">
            <Users size={14} /> {portal.successCentre.stats.uniqueParticipants} participants
          </span>
          <button type="button" className="cp-logout" onClick={() => void logout()}>
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </aside>

      <main className="cp-main">{children}</main>

      <nav className="cp-bottom-nav" aria-label="Mobile navigation">
        {BOTTOM_NAV.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== ("/community/dashboard" as Route) && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`cp-bottom-link${active ? " cp-bottom-link--active" : ""}`}
            >
              <Icon size={20} />
              <span>{item.short}</span>
            </Link>
          );
        })}
        <button
          type="button"
          className={`cp-bottom-link${menuOpen ? " cp-bottom-link--active" : ""}`}
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
