import Link from "next/link";
import type { Route } from "next";

export default function AdminDashboardPage(): JSX.Element {
  return (
    <>
      <h1>Brand2School Admin Console</h1>
      <p>Operational modules and the executive intelligence layer for ESG credibility reporting.</p>
      <section className="card">
        <h2>Quick links</h2>
        <ul>
          <li>
            <Link href={"/dashboard/analytics" as Route}>Executive Analytics</Link> — submissions, provinces, fraud, brand rankings
          </li>
          <li>
            <Link href={"/dashboard/campaigns" as Route}>Campaign eligibility</Link> — provincial packages, budgets, province nominations
          </li>
          <li>SUPER_ADMIN: Approvals, Moderation, Audit, Brands, Notifications</li>
          <li>ADMIN_STAFF: Moderation, Audit</li>
        </ul>
      </section>
    </>
  );
}
