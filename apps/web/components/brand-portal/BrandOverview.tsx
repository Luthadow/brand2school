"use client";

import Image from "next/image";
import { TrendingUp, Heart, MapPin, School, Target, CheckCircle2, Users } from "lucide-react";
import { formatCount } from "../../lib/formatCount";
import { useBrandPortal } from "./BrandPortalContext";
import { formatZar } from "../../lib/brandPortal";
import { ProvinceHeatmap } from "../analytics/ProvinceHeatmap";
import { IMPACT_STAGES } from "../../lib/brandPortal";

const CARD_IMAGES: Record<string, string> = {
  libraries: "/images/cards/libraries.png",
  technology: "/images/cards/technology.png",
  classrooms: "/images/cards/classrooms.png",
  "science-lab": "/images/cards/science-lab.png"
};

export function BrandOverview(): JSX.Element {
  const portal = useBrandPortal();
  const { overview, analytics, impactPipeline, schoolNeeds, media } = portal;

  const stats = [
    { label: "Codes submitted", value: overview.totalSubmissions, icon: Target },
    { label: "Schools supported", value: overview.schoolsSupported, icon: School },
    { label: "Provinces reached", value: overview.provincesReached, icon: MapPin },
    { label: "Infrastructure projects", value: overview.infrastructureProjectsFunded, icon: CheckCircle2 },
    { label: "Active campaigns", value: overview.activeCampaigns, icon: TrendingUp },
    { label: "Verified submissions", value: overview.verifiedSubmissions, icon: CheckCircle2 },
    { label: "Monthly growth", value: `${overview.monthlyGrowthPercent}%`, icon: TrendingUp },
    { label: "Lives impacted (est.)", value: overview.estimatedLivesImpacted, icon: Users }
  ];

  return (
    <div className="bp-page">
      <header className="bp-hero-banner">
        <div>
          <p className="ds-eyebrow">CSR · Campaign Analytics · Infrastructure Tracker</p>
          <h1>Your money is creating visible, measurable impact.</h1>
          <p>
            Transparent national participation — {overview.verificationRate}% verified ·{" "}
            {formatZar(overview.impactValueZar)} impact value · {overview.provincesReached} provinces
          </p>
        </div>
        <div className="bp-hero-metric">
          <Heart size={28} />
          <strong>{formatCount(overview.verifiedSubmissions)}</strong>
          <span>verified submissions</span>
        </div>
      </header>

      <section className="bp-stat-grid">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <article key={s.label} className="bp-stat-card">
              <Icon size={20} />
              <strong>{typeof s.value === "number" ? formatCount(s.value) : s.value}</strong>
              <span>{s.label}</span>
            </article>
          );
        })}
      </section>

      <section className="bp-two-col">
        <article className="bp-panel">
          <h2>Live participation map</h2>
          <p className="bp-muted">National density — schools, campaigns, and verified submissions</p>
          <ProvinceHeatmap provinces={analytics.provinces} />
        </article>
        <article className="bp-panel">
          <h2>Impact lifecycle</h2>
          <p className="bp-muted">Every code moves through verified stages to completed infrastructure</p>
          <ol className="bp-lifecycle">
            {IMPACT_STAGES.map((stage, i) => (
              <li key={stage.key} className={i <= 3 ? "bp-lifecycle--done" : ""}>
                <span className="bp-lifecycle-dot" />
                {stage.label}
              </li>
            ))}
          </ol>
          <ul className="bp-pipeline-mini">
            {impactPipeline.length === 0 ? (
              <li className="bp-empty-note">No verified submissions on your campaigns yet.</li>
            ) : (
              impactPipeline.slice(0, 4).map((item) => (
                <li key={item.id}>
                  <strong>{item.schoolName}</strong>
                  <span>
                    {item.campaignName} · {item.stage}
                  </span>
                </li>
              ))
            )}
          </ul>
        </article>
      </section>

      <section className="bp-section">
        <h2>Schools on your campaigns</h2>
        {schoolNeeds.length === 0 ? (
          <p className="bp-empty-note">Schools appear here after verified submissions on your campaigns.</p>
        ) : (
        <div className="bp-school-grid">
          {schoolNeeds.slice(0, 3).map((school) => (
            <article key={school.id} className="bp-school-card">
              <div className="bp-school-card-img">
                <Image
                  src={CARD_IMAGES[school.imageCategory] ?? CARD_IMAGES.libraries}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>
              <div>
                <h3>{school.name}</h3>
                <p>
                  {school.province} · {school.priorityNeed}
                </p>
                <div className="bp-progress">
                  <span style={{ width: `${school.progressPercent}%` }} />
                </div>
                <p className="bp-muted">
                  {school.progressPercent}% · {formatZar(school.estimatedCostZar)} est.
                </p>
              </div>
            </article>
          ))}
        </div>
        )}
      </section>

      {media.length > 0 ? (
      <section className="bp-section">
        <h2>Transformation stories</h2>
        <div className="bp-media-row">
          {media.slice(0, 2).map((story) => (
            <article key={story.id} className="bp-story-card">
              <div className="bp-school-card-img">
                <Image
                  src={CARD_IMAGES[story.imageCategory] ?? CARD_IMAGES.libraries}
                  alt=""
                  fill
                  sizes="50vw"
                />
              </div>
              <h3>{story.title}</h3>
              <p>{story.excerpt}</p>
              <span className="bp-muted">
                {story.schoolName} · {story.province}
              </span>
            </article>
          ))}
        </div>
      </section>
      ) : null}
    </div>
  );
}


