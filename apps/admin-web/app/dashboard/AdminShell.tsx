"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { useAdminSession } from "./useAdminSession";
import { csrfFetch } from "./admin-client-utils";
import brandLogo from "../../../../brand2school.png";

const baseLinks: Array<{ href: Route; label: string }> = [{ href: "/dashboard", label: "Overview" }];
const superAdminLinks = [
  { href: "/dashboard/analytics", label: "Analytics" },
  { href: "/dashboard/approvals", label: "Approvals" },
  { href: "/dashboard/moderation", label: "Moderation" },
  { href: "/dashboard/audit", label: "Audit" },
  { href: "/dashboard/notifications", label: "Notifications" },
  { href: "/dashboard/brands", label: "Brands" },
  { href: "/dashboard/campaigns", label: "Campaigns" },
  { href: "/dashboard/commercial", label: "Commercial" }
] as Array<{ href: Route; label: string }>;
const adminStaffLinks: Array<{ href: Route; label: string }> = [
  { href: "/dashboard/moderation", label: "Moderation" },
  { href: "/dashboard/audit", label: "Audit" }
];

export function AdminShell({ children }: { children: React.ReactNode }): JSX.Element {
  const pathname = usePathname();
  const router = useRouter();
  const { session, loading } = useAdminSession();

  const logout = async (): Promise<void> => {
    await csrfFetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  if (loading || !session) {
    return <main className="container">Loading session...</main>;
  }

  const roleLinks = session.user.role === "SUPER_ADMIN" ? superAdminLinks : adminStaffLinks;

  return (
    <main className="container">
      <div
        className="card admin-shell-head"
        style={{ marginBottom: "1rem", display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: "1rem" }}
      >
        <div style={{ minWidth: 0, flex: "1 1 16rem" }}>
          <Image
            src={brandLogo}
            alt="Brand2School admin dashboard logo"
            priority
            style={{ width: "100%", maxWidth: "280px", height: "auto", borderRadius: "10px", marginBottom: "0.6rem", border: "1px solid #d5e4ff" }}
          />
          <strong>{session.user.fullName}</strong> ({session.user.role})
          <div style={{ marginTop: "0.5rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {[...baseLinks, ...roleLinks].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  padding: "0.35rem 0.6rem",
                  borderRadius: "8px",
                  border: "1px solid #c6d9ff",
                  background: pathname === link.href ? "#dfe9ff" : "#fff"
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <button onClick={() => void logout()}>Logout</button>
      </div>
      {children}
    </main>
  );
}
