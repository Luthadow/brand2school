"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Award, LogOut, MessageCircle, School, TrendingUp } from "lucide-react";
import { csrfHeaders } from "../../lib/clientFetch";

type SchoolDashboardData = {
  school: {
    name: string;
    schoolCode: string;
    status: string;
    province: string;
    district: string;
    principalName: string;
    contactEmail: string | null;
    whatsappPhone: string;
  };
  metrics: { validSubmissions: number; flaggedSubmissions: number; activeCampaigns: number };
  campaignProgress?: Array<{
    id: string;
    name: string;
    slug: string;
    brandName: string;
    category: string | null;
    infrastructureGoal: string | null;
    validSubmissions: number;
    targetSubmissions: number;
    percentToTarget: number;
    remainingToTarget: number;
  }>;
  ranking: { rank: number; submissions: number } | null;
  topSchoolsThisMonth: Array<{
    rank: number;
    schoolName: string;
    province: string;
    district: string;
    submissions: number;
  }>;
};

export function SchoolDashboard(): JSX.Element {
  const [data, setData] = useState<SchoolDashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const session = await fetch("/api/auth/session");
      if (!session.ok) {
        window.location.href = "/school/login";
        return;
      }
      const schoolRes = await fetch("/api/school/me");
      if (!schoolRes.ok) {
        setError("Could not load your school dashboard.");
        setLoading(false);
        return;
      }
      setData((await schoolRes.json()) as SchoolDashboardData);
      setLoading(false);
    })();
  }, []);

  const logout = async (): Promise<void> => {
    await fetch("/api/auth/logout", { method: "POST", headers: csrfHeaders() });
    window.location.href = "/school/login";
  };

  if (loading) return <p className="reg-hint">Loading your school portal…</p>;
  if (error || !data) return <p className="reg-error">{error ?? "Unable to load dashboard."}</p>;

  const { school, metrics, campaignProgress = [], ranking, topSchoolsThisMonth } = data;

  return (
    <div className="school-dash">
      <div className="school-dash-header">
        <div>
          <p className="ds-eyebrow">Principal Portal</p>
          <h1>{school.name}</h1>
          <p className="reg-hint">
            {school.district}, {school.province} · Code <strong>{school.schoolCode}</strong>
          </p>
        </div>
        <button type="button" className="ds-btn ds-btn-secondary" onClick={() => void logout()}>
          <LogOut size={16} />
          Sign out
        </button>
      </div>

      {school.status === "PENDING" ? (
        <section className="reg-section school-onboarding">
          <h2>Onboarding checklist</h2>
          <ul className="school-onboarding-list">
            <li>Application submitted — our team is reviewing your school details</li>
            <li>Share your school code <strong>{school.schoolCode}</strong> with your community when activated</li>
            <li>WhatsApp line linked: +{school.whatsappPhone}</li>
            <li>Once approved, families reply 1 on WhatsApp and select province → district → school → campaign → code</li>
          </ul>
        </section>
      ) : null}

      <div className="school-dash-metrics">
        <article className="school-dash-metric">
          <School size={22} />
          <strong>{metrics.validSubmissions}</strong>
          <span>Verified participations</span>
        </article>
        <article className="school-dash-metric">
          <TrendingUp size={22} />
          <strong>{metrics.activeCampaigns}</strong>
          <span>Active campaigns</span>
        </article>
        <article className="school-dash-metric">
          <MessageCircle size={22} />
          <strong>{metrics.flaggedSubmissions}</strong>
          <span>Under review</span>
        </article>
        {ranking ? (
          <article className="school-dash-metric">
            <Award size={22} />
            <strong>#{ranking.rank}</strong>
            <span>This month</span>
          </article>
        ) : null}
      </div>

      {campaignProgress.length > 0 ? (
        <section className="reg-section">
          <h2>Active campaigns</h2>
          <p className="reg-hint">
            School progress toward infrastructure milestones — updated when communities submit verified codes on WhatsApp.
          </p>
          <div className="school-campaign-list">
            {campaignProgress.map((campaign) => (
              <article key={campaign.id} className="school-campaign-card">
                <div className="school-campaign-card-head">
                  <div>
                    <h3>{campaign.name}</h3>
                    <span className="reg-hint">
                      {campaign.brandName}
                      {campaign.category ? ` · ${campaign.category}` : ""}
                    </span>
                    {campaign.infrastructureGoal ? (
                      <p className="school-campaign-goal">Help unlock: {campaign.infrastructureGoal}</p>
                    ) : null}
                  </div>
                  <strong>{campaign.percentToTarget}%</strong>
                </div>
                <div className="school-campaign-bar-wrap">
                  <div className="school-campaign-bar" style={{ width: `${campaign.percentToTarget}%` }} />
                </div>
                <p className="reg-hint">
                  {campaign.validSubmissions} / {campaign.targetSubmissions} verified submissions ·{" "}
                  {campaign.remainingToTarget} to target
                </p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {topSchoolsThisMonth.length > 0 ? (
        <section className="reg-section">
          <h2>Top schools this month</h2>
          <div className="school-dash-table-wrap">
            <table className="school-dash-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>School</th>
                  <th>Submissions</th>
                </tr>
              </thead>
              <tbody>
                {topSchoolsThisMonth.map((row) => (
                  <tr key={row.rank} className={row.schoolName === school.name ? "school-dash-row--self" : ""}>
                    <td>#{row.rank}</td>
                    <td>
                      {row.schoolName}
                      {row.schoolName === school.name ? " (you)" : ""}
                    </td>
                    <td>{row.submissions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <section className="reg-section">
        <h2>WhatsApp for your community</h2>
        <p className="reg-hint">Principal line: +{school.whatsappPhone}</p>
        <div className="reg-whatsapp-box">
          <MessageCircle size={22} />
          <div>
            <code>MENU</code>
            <code>1 — Submit code (select from lists)</code>
            <code>2 — Check progress</code>
          </div>
        </div>
      </section>

      <Link href="/" className="reg-back">
        ← Back to website
      </Link>
    </div>
  );
}