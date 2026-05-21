"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Route } from "next";
import {
  FileText,
  Home,
  LogOut,
  MessageCircle,
  Send,
  Map,
  Target,
  TrendingUp,
  Upload,
  User,
  Wrench
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

export function SchoolPortalShell({
  portal,
  children
}: {
  portal: SchoolPortal;
  children: React.ReactNode;
}): JSX.Element {
  const pathname = usePathname();
  const unread = portal.notifications.filter((n) => !n.read).length;

  async function logout(): Promise<void> {
    await fetch("/api/auth/logout", { method: "POST", headers: csrfHeaders() });
    window.location.href = "/school/login";
  }

  return (
    <div className="sp">
      <aside className="sp-sidebar" aria-label="School navigation">
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
              >
                <Icon size={18} />
                {item.label}
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
        {NAV.slice(0, 5).map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`sp-bottom-link${active ? " sp-bottom-link--active" : ""}`}
            >
              <Icon size={20} />
              <span>{item.short}</span>
              {item.href.includes("messages") && unread > 0 ? (
                <em className="sp-dot">{unread}</em>
              ) : null}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
