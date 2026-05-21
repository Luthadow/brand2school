"use client";

import Image from "next/image";
import { useBrandPortal } from "../BrandPortalContext";
import { BrandPageHeader } from "../BrandPageHeader";
import { NEED_CATEGORIES, formatZar } from "../../../lib/brandPortal";
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
  const { schoolNeeds } = useBrandPortal();

  return (
    <div className="bp-page">
      <BrandPageHeader
        eyebrow="School Needs Database"
        title="Real school needs"
        description="Browse verified schools, priority infrastructure, and estimated project costs — sponsorship made tangible."
      />
      <div className="bp-filter-chips">
        {NEED_CATEGORIES.map((cat) => (
          <span key={cat} className="bp-chip">
            {cat}
          </span>
        ))}
      </div>
      <div className="bp-school-grid bp-school-grid--full">
        {schoolNeeds.map((school) => (
          <article key={school.id} className="bp-school-card bp-school-card--detail">
            <div className="bp-school-card-img">
              <Image
                src={CARD_IMAGES[school.imageCategory] ?? CARD_IMAGES.libraries}
                alt=""
                fill
                sizes="(max-width: 768px) 100vw, 25vw"
              />
            </div>
            <div>
              <h3>{school.name}</h3>
              <p>
                {school.district}, {school.province} · {formatCount(school.learnerCount)} learners
              </p>
              <p>
                <strong>Priority:</strong> {school.priorityNeed} · <strong>Est.</strong>{" "}
                {formatZar(school.estimatedCostZar)}
              </p>
              <div className="bp-progress">
                <span style={{ width: `${school.progressPercent}%` }} />
              </div>
              <p className="bp-muted">
                {school.progressPercent}% funded · {school.verificationStatus}
              </p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}



