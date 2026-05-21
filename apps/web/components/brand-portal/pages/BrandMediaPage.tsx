"use client";

import Image from "next/image";
import { useBrandPortal } from "../BrandPortalContext";
import { BrandPageHeader } from "../BrandPageHeader";

const CARD_IMAGES: Record<string, string> = {
  libraries: "/images/cards/libraries.png",
  technology: "/images/cards/technology.png",
  "science-lab": "/images/cards/science-lab.png"
};

export function BrandMediaPage(): JSX.Element {
  const { media } = useBrandPortal();

  return (
    <div className="bp-page">
      <BrandPageHeader
        eyebrow="Media & Storytelling"
        title="Shareable impact content"
        description="Before/after transformations, learner testimonials, and milestone moments brands love to share."
      />
      <div className="bp-media-row bp-media-row--full">
        {media.map((story) => (
          <article key={story.id} className="bp-story-card">
            <div className="bp-school-card-img">
              <Image
                src={CARD_IMAGES[story.imageCategory] ?? CARD_IMAGES.libraries}
                alt=""
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
              />
            </div>
            <span className="bp-pill bp-pill--active">{story.type.replace("_", " ")}</span>
            <h3>{story.title}</h3>
            <p>{story.excerpt}</p>
            <p className="bp-muted">
              {story.schoolName} · {story.province}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
