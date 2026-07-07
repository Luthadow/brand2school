"use client";

import { useCommunityPortal } from "../CommunityPortalContext";

export function CommunityRecognitionPage(): JSX.Element {
  const { recognition } = useCommunityPortal();

  return (
    <div className="cp-page">
      <header className="cp-page-head">
        <p className="ds-eyebrow">Recognition</p>
        <h1>Champions & badges</h1>
        <p className="cp-muted">
          Belonging and impact badges — celebrate participation milestones and community leadership.
        </p>
      </header>

      <section className="card cp-recognition-hero">
        <span className={`cp-level cp-level--${recognition.level}`}>{recognition.levelLabel}</span>
        <p>
          <strong>{recognition.earnedBadges}</strong> of {recognition.totalBadges} badges earned
        </p>
      </section>

      {recognition.featured.length > 0 ? (
        <section className="cp-section">
          <h2>Featured achievements</h2>
          <div className="cp-badge-grid">
            {recognition.featured.map((b) => (
              <article key={b.id} className="cp-badge cp-badge--earned">
                <span className={`cp-badge-tier cp-badge-tier--${b.tier}`}>{b.tier}</span>
                <strong>{b.label}</strong>
                <p>{b.description}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="cp-section">
        <h2>All badges</h2>
        <div className="cp-badge-all-grid">
          {recognition.badges.map((b) => (
            <article
              key={b.id}
              className={`cp-badge-all-item${b.earned ? " cp-badge-all-item--earned" : ""}`}
            >
              <span className={`cp-badge-tier cp-badge-tier--${b.tier}`}>{b.tier}</span>
              <strong>{b.label}</strong>
              <p>{b.description}</p>
              {!b.earned ? (
                <span className="cp-badge-progress">{b.progressPercent}%</span>
              ) : (
                <span className="cp-badge-earned-mark">Earned</span>
              )}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
