"use client";

import Link from "next/link";
import type { Route } from "next";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useAdminSession } from "./useAdminSession";
import { csrfFetch } from "./admin-client-utils";
import brandLogo from "../../../../brand2school.png";

const overviewLink = { href: "/dashboard" as Route, label: "Overview", icon: "◉" };

const superAdminLinks: Array<{ href: Route; label: string; icon: string }> = [
  { href: "/dashboard/analytics", label: "Analytics", icon: "▣" },
  { href: "/dashboard/approvals", label: "Approvals", icon: "✓" },
  { href: "/dashboard/commercial", label: "Commercial", icon: "◎" },
  { href: "/dashboard/brands", label: "Brands", icon: "◇" },
  { href: "/dashboard/campaigns", label: "Campaigns", icon: "◆" },
  { href: "/dashboard/moderation", label: "Moderation", icon: "!" },
  { href: "/dashboard/audit", label: "Audit", icon: "≡" },
  { href: "/dashboard/notifications", label: "Notifications", icon: "✉" }
];

const adminStaffLinks: Array<{ href: Route; label: string; icon: string }> = [
  { href: "/dashboard/moderation", label: "Moderation", icon: "!" },
  { href: "/dashboard/audit", label: "Audit", icon: "≡" }
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminShell({ children }: { children: React.ReactNode }): JSX.Element {
  const pathname = usePathname();
  const router = useRouter();
  const { session, loading } = useAdminSession();

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
          <Link
            href={overviewLink.href}
            className={`admin-sidebar__link${isActive(pathname, overviewLink.href) ? " admin-sidebar__link--active" : ""}`}
          >
            <span className="admin-sidebar__icon" aria-hidden>
              {overviewLink.icon}
            </span>
            {overviewLink.label}
          </Link>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`admin-sidebar__link${isActive(pathname, link.href) ? " admin-sidebar__link--active" : ""}`}
            >
              <span className="admin-sidebar__icon" aria-hidden>
                {link.icon}
              </span>
              {link.label}
            </Link>
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
