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

const NAV: Array<{ href: Route; label: string; icon: typeof Home; short: string }> = [
  { href: "/school/dashboard", label: "Home", icon: Home, short: "Home" },
  { href: "/school/dashboard/roadmap", label: "Roadmap", icon: Map, short: "Plan" },
  { href: "/school/dashboard/needs", label: "Needs", icon: Send, short: "Needs" },
  { href: "/school/dashboard/targets", label: "Targets", icon: Target, short: "Goals" },
  { href: "/school/dashboard/submissions", label: "Submissions", icon: TrendingUp, short: "Stats" },
  { href: "/school/dashboard/projects", label: "Projects", icon: Wrench, short: "Build" },
  { href: "/school/dashboard/messages", label: "Messages", icon: MessageCircle, short: "Chat" },
  { href: "/school/dashboard/media", label: "Media", icon: Upload, short: "Media" },
  { href: "/school/dashboard/documents", label: "Docs", icon: FileText, short: "Docs" },
  { href: "/school/dashboard/profile", label: "Profile", icon: User, short: "You" }
];

const BOTTOM_NAV = NAV.slice(0, 4);

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
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`sp-nav-link${active ? " sp-nav-link--active" : ""}`}
                onClick={() => setMenuOpen(false)}
              >
                <Icon size={18} />
                {item.label}
                {item.href.includes("messages") && unread > 0 ? (
                  <span className="sp-nav-badge">{unread}</span>
                ) : null}
              </Link>
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
