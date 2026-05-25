import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import { formatCount } from "../../lib/formatCount";
import type { PlatformRankings } from "../../lib/platformPublic";

export function PartnerRankingsPanel({ rankings }: { rankings: PlatformRankings }): JSX.Element {
  return (
    <div className="pp-rankings-grid">
      <section className="card pp-rank-card">
        <h2>Top schools this month</h2>
        {rankings.schools.length === 0 ? (
          <p className="lp-live-empty">School leaderboard updates as verified submissions arrive.</p>
        ) : (
          <ol className="lp-leaderboard-list">
            {rankings.schools.map((row) => (
              <li key={row.schoolId} className="lp-leaderboard-row">
                <span className="lp-leaderboard-rank">#{row.rank}</span>
                <div className="lp-leaderboard-info">
                  <strong>{row.schoolName}</strong>
                  <span>
                    {row.province} · {row.district}
                  </span>
                </div>
                <span className="lp-leaderboard-score">{formatCount(row.submissions)}</span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="card pp-rank-card">
        <h2>Partner impact rankings</h2>
        {rankings.brandPartners.length === 0 ? (
          <p className="lp-live-empty">Verified brand partners will rank here by participation.</p>
        ) : (
          <ol className="lp-leaderboard-list">
            {rankings.brandPartners.map((row) => (
              <li key={row.brandSlug} className="lp-leaderboard-row">
                <span className="lp-leaderboard-rank">#{row.rank}</span>
                <div className="lp-leaderboard-info">
                  <Link href={`/brand/${row.brandSlug}` as Route} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    {row.logoUrl ? (
                      <Image src={row.logoUrl} alt="" width={72} height={32} className="lp-trust-logo-img" />
                    ) : null}
                    <strong>{row.brandName}</strong>
                  </Link>
                  <span>
                    {formatCount(row.validSubmissions)} verified · {row.schoolsReached} schools
                  </span>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
