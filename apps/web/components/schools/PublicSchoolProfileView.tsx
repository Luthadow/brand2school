import Link from "next/link";
import type { Route } from "next";
import { formatCount } from "../../lib/formatCount";
import { formatZar } from "../../lib/schoolPortal";
import type { PublicCommunityStats, PublicSchoolProfile } from "../../lib/platformPublic";

type Props = {
  profile: PublicSchoolProfile;
  community?: PublicCommunityStats | null;
};

export function PublicSchoolProfileView({ profile, community }: Props): JSX.Element {
  const accent = profile.schoolColours[0] ?? "#003b8e";

  return (
    <div className="ps-public">
      <section className="lp-section" style={{ borderBottom: `4px solid ${accent}` }}>
        <div className="lp-container ps-profile-hero">
          <div className="ps-profile-main">
            {profile.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.logoUrl} alt={`${profile.name} logo`} className="ps-profile-logo" />
            ) : (
              <div className="ps-profile-logo-placeholder">{profile.name.slice(0, 2).toUpperCase()}</div>
            )}
            <p className="ds-eyebrow" style={{ marginTop: "1rem" }}>
              Verified school partner
              {profile.nationalRank ? ` · #${profile.nationalRank} nationally this month` : ""}
              {profile.quintile ? ` · Quintile ${profile.quintile}` : ""}
            </p>
            <h1 className="ds-section-title ds-section-title--left">{profile.name}</h1>
            <p className="lp-problem-text">
              {profile.district}, {profile.province}
              {profile.teacherCount ? ` · ${formatCount(profile.teacherCount)} teachers` : ""}
            </p>
            <div className="pp-profile-stats">
              <div>
                <strong>{formatCount(profile.participation.learnerCount)}</strong>
                <span>Learners</span>
              </div>
              <div>
                <strong>{formatCount(profile.participation.verifiedSubmissions)}</strong>
                <span>Verified participations</span>
              </div>
              <div>
                <strong>{formatCount(profile.participation.thisMonth)}</strong>
                <span>This month</span>
              </div>
              <div>
                <strong>{profile.openNeedsCount}</strong>
                <span>Open needs</span>
              </div>
            </div>
            {profile.websiteUrl ? (
              <a
                href={profile.websiteUrl}
                className="ds-btn ds-btn-secondary"
                target="_blank"
                rel="noopener noreferrer"
              >
                School website
              </a>
            ) : null}
          </div>
          <aside className="ps-profile-aside card">
            <h2>Trust indicators</h2>
            <ul className="ps-trust-list">
              <li>Verification approved</li>
              <li>{profile.profileCompletionPercent}% profile complete</li>
              <li>{profile.badgeCount} achievements earned</li>
            </ul>
            {profile.featuredBadges.length > 0 ? (
              <div className="ps-badges">
                {profile.featuredBadges.map((b) => (
                  <span key={b} className="sp-chip">
                    {b}
                  </span>
                ))}
              </div>
            ) : null}
          </aside>
        </div>
      </section>

      {profile.mission || profile.vision ? (
        <section className="lp-section lp-section-light">
          <div className="lp-container ps-two-col">
            {profile.mission ? (
              <article className="card">
                <h2>Mission</h2>
                <p>{profile.mission}</p>
              </article>
            ) : null}
            {profile.vision ? (
              <article className="card">
                <h2>Vision</h2>
                <p>{profile.vision}</p>
              </article>
            ) : null}
          </div>
        </section>
      ) : null}

      {community && community.totalParticipation > 0 ? (
        <section className="lp-section lp-section-light">
          <div className="lp-container">
            <p className="ds-eyebrow">Community Hub</p>
            <h2 className="ds-section-title ds-section-title--left">Community participation</h2>
            <div className="ps-community-public-stats">
              <div>
                <strong>{community.engagementScore}%</strong>
                <span>Engagement score</span>
              </div>
              <div>
                <strong>{community.totalParticipation}</strong>
                <span>Verified participations</span>
              </div>
              <div>
                <strong>{community.learnerSharePercent}%</strong>
                <span>Learner share</span>
              </div>
            </div>
            {community.topSupporters.length > 0 ? (
              <ul className="sp-community-landing-schools">
                {community.topSupporters.map((s) => (
                  <li key={s.name}>
                    <strong>{s.name}</strong>
                    <span>
                      {s.type} · {s.submissions} submissions
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </section>
      ) : null}

      {profile.openNeeds.length > 0 ? (
        <section className="lp-section">
          <div className="lp-container">
            <p className="ds-eyebrow">School marketplace</p>
            <h2 className="ds-section-title ds-section-title--left">Infrastructure needs</h2>
            <p className="lp-problem-text">
              Priority needs brands can sponsor — costs and progress are tracked on Brand2School.
            </p>
            <div className="ps-needs-grid">
              {profile.openNeeds.map((need) => (
                <article key={need.id} className="card ps-need-card">
                  <div className="ps-need-head">
                    <h3>{need.title}</h3>
                    <span className="sp-pill">{need.urgency}</span>
                  </div>
                  <p className="ps-muted">{need.category}</p>
                  <p>
                    <strong>{formatZar(need.estimatedCostZar)}</strong> · {need.learnerImpact} learners
                  </p>
                  <p className="ps-muted">{need.sponsorStatus}</p>
                  <div className="sp-progress">
                    <span style={{ width: `${need.progressPercent}%` }} />
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {profile.history || profile.achievements.length > 0 ? (
        <section className="lp-section lp-section-light">
          <div className="lp-container ps-two-col">
            {profile.history ? (
              <article className="card">
                <h2>Our story</h2>
                <p>{profile.history}</p>
              </article>
            ) : null}
            {profile.achievements.length > 0 ? (
              <article className="card">
                <h2>Achievements</h2>
                <ul>
                  {profile.achievements.map((a) => (
                    <li key={a}>{a}</li>
                  ))}
                </ul>
              </article>
            ) : null}
          </div>
        </section>
      ) : null}

      {profile.upcomingEvents && profile.upcomingEvents.length > 0 ? (
        <section className="lp-section">
          <div className="lp-container">
            <h2 className="ds-section-title ds-section-title--left">Upcoming events</h2>
            <ul className="ps-events-list">
              {profile.upcomingEvents.map((ev) => (
                <li key={ev.id} className="card">
                  <strong>{ev.title}</strong>
                  <span>{ev.eventTypeLabel}</span>
                  <em>
                    {new Date(ev.startsAt).toLocaleString("en-ZA", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                    {ev.location ? ` · ${ev.location}` : ""}
                  </em>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {profile.enterpriseHighlights && profile.enterpriseHighlights.length > 0 ? (
        <section className="lp-section lp-section-light">
          <div className="lp-container">
            <h2 className="ds-section-title ds-section-title--left">Student enterprise</h2>
            <ul className="ps-enterprise-list">
              {profile.enterpriseHighlights.map((v) => (
                <li key={v.id} className="card">
                  <strong>{v.title}</strong>
                  <span>{v.projectTypeLabel} · {v.studentLead}</span>
                  {v.seekingSponsor ? <em>Open for brand sponsorship</em> : null}
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {profile.alumniHighlights && profile.alumniHighlights.length > 0 ? (
        <section className="lp-section">
          <div className="lp-container">
            <h2 className="ds-section-title ds-section-title--left">Alumni & supporters</h2>
            <ul className="ps-alumni-list">
              {profile.alumniHighlights.map((a) => (
                <li key={a.id} className="card">
                  <strong>{a.fullName}</strong>
                  <span>{a.roleLabel}</span>
                  <em>
                    {[a.profession, a.company, a.graduationYear ? `Class of ${a.graduationYear}` : null]
                      .filter(Boolean)
                      .join(" · ")}
                  </em>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {profile.activeCampaigns.length > 0 ? (
        <section className="lp-section">
          <div className="lp-container">
            <h2 className="ds-section-title ds-section-title--left">Active brand campaigns</h2>
            <ul className="ps-campaign-list">
              {profile.activeCampaigns.map((c) => (
                <li key={c.name} className="card">
                  <strong>{c.name}</strong>
                  <span>{c.brandName}</span>
                  <em>{c.percentToTarget}% to target</em>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      <section className="lp-section lp-section-light">
        <div className="lp-container ps-cta">
          <h2>Support this school through verified participation</h2>
          <p className="lp-problem-text">
            Brands run campaigns on Brand2School — families submit product codes via WhatsApp and schools earn
            measurable infrastructure impact.
          </p>
          <div className="ps-cta-actions">
            <Link href="/for-brands" className="ds-btn ds-btn-primary">
              Partner as a brand
            </Link>
            <Link href={"/schools" as Route} className="ds-btn ds-btn-secondary">
              Browse all schools
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
