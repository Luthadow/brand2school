"use client";

import Link from "next/link";
import type { Route } from "next";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAdminSession } from "./useAdminSession";
import { csrfFetch } from "./admin-client-utils";
import brandLogo from "../../../../brand2school.png";

type NavLink = {
  href: Route;
  label: string;
  icon: string;
  report?: "overview" | "analytics" | "commercial" | "brands" | "verified";
};

const overviewLink: NavLink = { href: "/dashboard", label: "Overview", icon: "◉", report: "overview" };

const superAdminLinks: NavLink[] = [
  { href: "/dashboard/analytics", label: "Analytics", icon: "▣", report: "analytics" },
  { href: "/dashboard/approvals", label: "Approvals", icon: "✓" },
  { href: "/dashboard/verified", label: "Verified", icon: "✔", report: "verified" },
  { href: "/dashboard/commercial", label: "Commercial", icon: "◎", report: "commercial" },
  { href: "/dashboard/brands", label: "Brands", icon: "◇", report: "brands" },
  { href: "/dashboard/campaigns", label: "Campaigns", icon: "◆" },
  { href: "/dashboard/moderation", label: "Moderation", icon: "!" },
  { href: "/dashboard/audit", label: "Audit", icon: "≡" },
  { href: "/dashboard/notifications", label: "Notifications", icon: "✉" }
];

const adminStaffLinks: NavLink[] = [
  { href: "/dashboard/moderation", label: "Moderation", icon: "!" },
  { href: "/dashboard/audit", label: "Audit", icon: "≡" }
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavRow({
  href,
  label,
  icon,
  active,
  report,
  badge
}: {
  href: Route;
  label: string;
  icon: string;
  active: boolean;
  report?: "overview" | "analytics" | "commercial" | "brands" | "verified";
  badge?: number;
}): JSX.Element {
  return (
    <div className={`admin-sidebar__row${active ? " admin-sidebar__row--active" : ""}`}>
      <Link href={href} className={`admin-sidebar__link${active ? " admin-sidebar__link--active" : ""}`}>
        <span className="admin-sidebar__icon" aria-hidden>
          {icon}
        </span>
        {label}
        {badge && badge > 0 ? (
          <span className="admin-sidebar__badge" aria-label={`${badge} pending`}>
            {badge > 99 ? "99+" : badge}
          </span>
        ) : null}
      </Link>
      {report ? (
        <a
          href={`/api/admin/reports/${report}/pdf`}
          className="admin-sidebar__pdf"
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

export function AdminShell({ children }: { children: React.ReactNode }): JSX.Element {
  const pathname = usePathname();
  const router = useRouter();
  const { session, loading } = useAdminSession();
  const [verificationPending, setVerificationPending] = useState(0);

  useEffect(() => {
    if (!session || session.user.role !== "SUPER_ADMIN") return;
    void (async () => {
      try {
        const res = await fetch("/api/admin/platform-snapshot", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { verificationPacketsPendingReview?: number };
        setVerificationPending(data.verificationPacketsPendingReview ?? 0);
      } catch {
        /* ignore */
      }
    })();
  }, [session, pathname]);

  const logout = async (): Promise<void> => {
    await csrfFetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  if (loading || !session) {
    return (
      <div className="admin-shell admin-shell--loading">
        <div className="admin-loading">
          <div className="admin-loading__spinner" aria-hidden />
          <p>Loading session…</p>
        </div>
      </div>
    );
  }

  const navLinks = session.user.role === "SUPER_ADMIN" ? superAdminLinks : adminStaffLinks;

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link href="/dashboard" className="admin-sidebar__brand">
          <Image src={brandLogo} alt="Brand2School" width={120} height={80} priority className="admin-sidebar__logo" />
          <span>Admin</span>
        </Link>

        <nav className="admin-sidebar__nav" aria-label="Admin navigation">
          <NavRow
            href={overviewLink.href}
            label={overviewLink.label}
            icon={overviewLink.icon}
            active={isActive(pathname, overviewLink.href)}
            report={overviewLink.report}
          />
          {navLinks.map((link) => (
            <NavRow
              key={link.href}
              href={link.href}
              label={link.label}
              icon={link.icon}
              active={isActive(pathname, link.href)}
              report={link.report}
              badge={link.href === "/dashboard/approvals" ? verificationPending : undefined}
            />
          ))}
        </nav>

        <div className="admin-sidebar__foot">
          <p className="admin-sidebar__user">{session.user.fullName}</p>
          <p className="admin-sidebar__role">{session.user.role.replace(/_/g, " ")}</p>
          <button type="button" className="admin-sidebar__logout" onClick={() => void logout()}>
            Sign out
          </button>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <p className="admin-topbar__title">Brand2School governance</p>
          <button type="button" className="admin-topbar__logout" onClick={() => void logout()}>
            Logout
          </button>
        </header>
        <div className="admin-content">{children}</div>
      </div>
    </div>
  );
}
