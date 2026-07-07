"use client";

import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import { useMemo, useState } from "react";
import { useBrandPortal } from "../BrandPortalContext";
import { BrandPageHeader } from "../BrandPageHeader";
import { formatZar } from "../../../lib/brandPortal";
import { formatCount } from "../../../lib/formatCount";

const CARD_IMAGES: Record<string, string> = {
  libraries: "/images/cards/libraries.png",
  technology: "/images/cards/technology.png",
  classrooms: "/images/cards/classrooms.png",
  "science-lab": "/images/cards/science-lab.png",
  "feeding-scheme": "/images/cards/feeding-scheme.png",
  sports: "/images/cards/sports.png"
};

export function BrandSchoolsPage(): JSX.Element {
  const { marketplace } = useBrandPortal();
  const [q, setQ] = useState("");
  const [partnerOnly, setPartnerOnly] = useState(false);

  const schools = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return marketplace.schools.filter((school) => {
      if (partnerOnly && !school.partnerSchool) return false;
      if (!needle) return true;
      return (
        school.name.toLowerCase().includes(needle) ||
        school.district.toLowerCase().includes(needle) ||
        school.province.toLowerCase().includes(needle) ||
        school.priorityNeed.toLowerCase().includes(needle)
      );
    });
  }, [marketplace.schools, q, partnerOnly]);

  return (
    <div className="bp-page">
      <BrandPageHeader
        eyebrow="School marketplace"
        title="Discover schools &amp; sponsor needs"
        description="Browse verified public school profiles, priority infrastructure needs, and schools already participating in your campaigns."
      />

      <div className="bp-marketplace-kpi">
        <div>
          <strong>{marketplace.summary.totalSchools}</strong>
          <span>Public schools</span>
        </div>
        <div>
          <strong>{marketplace.summary.withOpenNeeds}</strong>
          <span>With open needs</span>
        </div>
        <div>
          <strong>{marketplace.summary.partnerSchools}</strong>
          <span>Your campaign schools</span>
        </div>
      </div>

      <div className="bp-marketplace-filters">
        <input
          type="search"
          placeholder="Search school, district, or need…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Search marketplace"
        />
        <label className="bp-marketplace-check">
          <input type="checkbox" checked={partnerOnly} onChange={(e) => setPartnerOnly(e.target.checked)} />
          My campaign schools only
        </label>
        <Link href={"/schools" as Route} className="ds-btn ds-btn-secondary ds-btn-sm">
          Public directory
        </Link>
      </div>

      {schools.length === 0 ? (
        <p className="bp-empty-note">
          No schools match your filters. Public profiles appear when schools complete verification and build their
          professional profile.
        </p>
      ) : (
        <div className="bp-school-grid bp-school-grid--full">
          {schools.map((school) => (
            <article key={school.schoolCode ?? school.id} className="bp-school-card bp-school-card--detail">
              <div className="bp-school-card-img">
                <Image
                  src={CARD_IMAGES[school.imageCategory] ?? CARD_IMAGES.libraries}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 100vw, 25vw"
                />
              </div>
              <div>
                <div className="bp-school-card-head">
                  <h3>{school.name}</h3>
                  {school.partnerSchool ? <span className="bp-partner-pill">Your school</span> : null}
                </div>
                <p>
                  {school.district}, {school.province}
                  {school.quintile ? ` · Q${school.quintile}` : ""} · {formatCount(school.learnerCount)} learners
                </p>
                <p>
                  <strong>Priority:</strong> {school.priorityNeed} · <strong>Est.</strong>{" "}
                  {formatZar(school.estimatedCostZar)}
                </p>
                {school.featuredBadges && school.featuredBadges.length > 0 ? (
                  <p className="bp-muted">{school.featuredBadges.slice(0, 2).join(" · ")}</p>
                ) : null}
                <div className="bp-progress">
                  <span style={{ width: `${school.progressPercent}%` }} />
                </div>
                <p className="bp-muted">
                  {school.progressPercent}% progress · {formatCount(school.verifiedSubmissions ?? 0)} verified
                  {school.nationalRank ? ` · #${school.nationalRank} national` : ""}
                </p>
                {school.needs && school.needs.length > 1 ? (
                  <ul className="bp-marketplace-needs">
                    {school.needs.slice(1, 3).map((need) => (
                      <li key={need.id}>
                        {need.title} — {formatZar(need.estimatedCostZar)}
                      </li>
                    ))}
                  </ul>
                ) : null}
                {school.profileUrl ? (
                  <Link href={school.profileUrl as Route} className="bp-marketplace-link">
                    View public profile →
                  </Link>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
