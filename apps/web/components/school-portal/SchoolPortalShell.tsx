"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Route } from "next";
import { useEffect, useState } from "react";
import {
  FileText,
  Home,
  LogOut,
  Menu,
  MessageCircle,
  Send,
  Map,
  Target,
  TrendingUp,
  Upload,
  User,
  Wrench,
  X
} from "lucide-react";
import { csrfHeaders } from "../../lib/clientFetch";
import type { SchoolPortal } from "../../lib/schoolPortal";

const NAV: Array<{
  href: Route;
  label: string;
  icon: typeof Home;
  short: string;
  report?: SchoolReportSlug;
}> = [
  { href: "/school/dashboard", label: "Home", icon: Home, short: "Home", report: "overview" },
  { href: "/school/dashboard/roadmap", label: "Roadmap", icon: Map, short: "Plan", report: "roadmap" },
  { href: "/school/dashboard/needs", label: "Needs", icon: Send, short: "Needs", report: "needs" },
  { href: "/school/dashboard/targets", label: "Targets", icon: Target, short: "Goals", report: "targets" },
  { href: "/school/dashboard/submissions", label: "Submissions", icon: TrendingUp, short: "Stats", report: "submissions" },
  { href: "/school/dashboard/projects", label: "Projects", icon: Wrench, short: "Build", report: "projects" },
  { href: "/school/dashboard/messages", label: "Messages", icon: MessageCircle, short: "Chat", report: "messages" },
  { href: "/school/dashboard/media", label: "Media", icon: Upload, short: "Media" },
  { href: "/school/dashboard/documents", label: "Docs", icon: FileText, short: "Docs", report: "documents" },
  { href: "/school/dashboard/profile", label: "Profile", icon: User, short: "You", report: "profile" }
];

type SchoolReportSlug =
  | "overview"
  | "roadmap"
  | "needs"
  | "targets"
  | "submissions"
  | "projects"
  | "messages"
  | "documents"
  | "profile";

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
  icon: typeof Home;
  active: boolean;
  unread?: number;
  report?: SchoolReportSlug;
  onNavigate?: () => void;
}): JSX.Element {
  return (
    <div className={`sp-nav-row${active ? " sp-nav-row--active" : ""}`}>
      <Link href={href} className={`sp-nav-link${active ? " sp-nav-link--active" : ""}`} onClick={onNavigate}>
        <Icon size={18} />
        {label}
        {unread ? <span className="sp-nav-badge">{unread}</span> : null}
      </Link>
      {report ? (
        <a
          href={`/api/school/reports/${report}/pdf`}
          className="sp-nav-pdf"
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

export function SchoolPortalShell({
  portal,
  children
}: {
  portal: SchoolPortal;
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
    await fetch("/api/auth/logout", { method: "POST", headers: csrfHeaders() });
    window.location.href = "/organisations/login";
  }

  return (
    <div className="sp">
      <header className="sp-mobile-bar">
        <strong>{portal.school.name}</strong>
        <button
          type="button"
          className="sp-menu-toggle"
          aria-expanded={menuOpen}
          aria-controls="sp-sidebar"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X size={18} /> : <Menu size={18} />}
          Menu
        </button>
      </header>

      <button
        type="button"
        className={`sp-sidebar-backdrop${menuOpen ? " sp-sidebar-backdrop--visible" : ""}`}
        aria-label="Close menu"
        onClick={() => setMenuOpen(false)}
      />

      <aside id="sp-sidebar" className={`sp-sidebar${menuOpen ? " sp-sidebar--open" : ""}`} aria-label="School navigation">
        <div className="sp-brand">
          <strong>{portal.school.name}</strong>
          <span>{portal.gamification.label}</span>
        </div>
        <nav className="sp-nav">
          {NAV.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/school/dashboard" && pathname.startsWith(item.href));
            return (
              <NavRow
                key={item.href}
                href={item.href}
                label={item.label}
                icon={item.icon}
                active={active}
                report={item.report}
                unread={item.href.includes("messages") ? unread : undefined}
                onNavigate={() => setMenuOpen(false)}
              />
            );
          })}
        </nav>
        <button type="button" className="sp-logout" onClick={() => void logout()}>
          <LogOut size={16} /> Sign out
        </button>
      </aside>

      <main className="sp-main">{children}</main>

      <nav className="sp-bottom-nav" aria-label="Mobile navigation">
        {BOTTOM_NAV.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/school/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`sp-bottom-link${active ? " sp-bottom-link--active" : ""}`}
            >
              <Icon size={20} />
              <span>{item.short}</span>
            </Link>
          );
        })}
        <button
          type="button"
          className={`sp-bottom-link${menuOpen ? " sp-bottom-link--active" : ""}`}
          onClick={() => setMenuOpen(true)}
          aria-label="Open full menu"
        >
          <Menu size={20} />
          <span>More</span>
          {unread > 0 ? <em className="sp-dot">{unread}</em> : null}
        </button>
      </nav>
    </div>
  );
}
