import {
  BookOpen,
  Building2,
  Dumbbell,
  HeartPulse,
  Monitor,
  UtensilsCrossed,
  type LucideIcon
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import { FadeIn } from "./FadeIn";
import { SectionHeader } from "./SectionHeader";

export type ImpactCategory = {
  id: string;
  title: string;
  color: "blue" | "sky" | "green" | "orange" | "navy" | "teal";
  example: string;
  items: string[];
  sponsorFit: string;
  campaign: string;
};

export type BuildMission = {
  title: string;
  subtitle: string;
  color: "blue" | "green" | "sky" | "orange" | "navy" | "teal";
  icon: LucideIcon;
  /** Hero photo for the card top; falls back to icon when omitted */
  imageSrc?: string;
};

const categoryIcons: Record<string, LucideIcon> = {
  learning: BookOpen,
  digital: Monitor,
  sports: Dumbbell,
  nutrition: UtensilsCrossed,
  infrastructure: Building2,
  wellness: HeartPulse
};

export function ImpactAreasSection({
  categories,
  buildMissions,
  sponsorCtas
}: {
  categories: ImpactCategory[];
  buildMissions: BuildMission[];
  sponsorCtas: Array<{ title: string; href: string }>;
}): JSX.Element {
  return (
    <>
      <section id="impact-areas" className="lp-section lp-impact-areas">
        <div className="lp-container">
          <FadeIn>
            <SectionHeader
              eyebrow="Impact Areas"
              title="Building Better Schools"
              subtitle="Through community participation and brand partnerships, Brand2School helps unlock support across critical school development areas — modular transformation, not vague charity."
            />
          </FadeIn>
          <div className="lp-impact-grid">
            {categories.map((cat, i) => {
              const Icon = categoryIcons[cat.id] ?? BookOpen;
              return (
                <FadeIn key={cat.id} delay={i * 0.05}>
                  <article className={`lp-impact-card lp-impact-card--${cat.color}`}>
                    <div className="lp-impact-card-head">
                      <div className="lp-impact-icon">
                        <Icon size={26} />
                      </div>
                      <div>
                        <h3>{cat.title}</h3>
                        <p className="lp-impact-example">{cat.example}</p>
                      </div>
                    </div>
                    <ul className="lp-impact-items">
                      {cat.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                    <p className="lp-impact-sponsors">
                      <strong>Sponsor fit:</strong> {cat.sponsorFit}
                    </p>
                    <p className="lp-impact-campaign">{cat.campaign}</p>
                  </article>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </section>

      <section className="lp-section lp-section-light lp-build-together">
        <div className="lp-container">
          <FadeIn>
            <SectionHeader
              eyebrow="National Transformation Missions"
              title="What We Can Build Together"
              subtitle="People invest in visible outcomes — netball courts, connected classrooms, feeding schemes. Not &ldquo;general school support.&rdquo;"
            />
          </FadeIn>
          <div className="lp-build-grid">
            {buildMissions.map((mission, i) => {
              const Icon = mission.icon;
              const photo = Boolean(mission.imageSrc);
              return (
                <FadeIn key={mission.title} delay={i * 0.06}>
                  <article className={`lp-build-card lp-build-card--${mission.color}`}>
                    <div className={`lp-build-visual${photo ? " lp-build-visual--photo" : ""}`}>
                      {mission.imageSrc ? (
                        <Image
                          src={mission.imageSrc}
                          alt={`${mission.title} — example learning space`}
                          fill
                          sizes="(max-width: 700px) 100vw, (max-width: 1000px) 50vw, 33vw"
                          className="lp-build-visual-img"
                          priority={i < 3}
                        />
                      ) : (
                        <Icon size={48} strokeWidth={1.5} />
                      )}
                    </div>
                    <h3>{mission.title}</h3>
                    <p>{mission.subtitle}</p>
                  </article>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </section>

      <section className="lp-section lp-sponsor-category">
        <div className="lp-container">
          <FadeIn>
            <SectionHeader
              eyebrow="Sponsor Alignment"
              title="Sponsor A Category"
              subtitle="Brands join causes that match their identity — targeted impact infrastructure, not random donations."
              light
            />
          </FadeIn>
          <div className="lp-sponsor-grid">
            {sponsorCtas.map((cta, i) => (
              <FadeIn key={cta.title} delay={i * 0.07}>
                <Link href={cta.href as Route} className="lp-sponsor-card">
                  <span className="lp-sponsor-card-label">Founding partner opportunity</span>
                  <h3>{cta.title}</h3>
                  <span className="lp-sponsor-card-link">Start a national mission →</span>
                </Link>
              </FadeIn>
            ))}
          </div>
          <FadeIn delay={0.15} className="lp-platform-layers">
            <h3>The infrastructure stack</h3>
            <div className="lp-layer-row">
              {[
                { layer: "Engagement", meaning: "Communities participate" },
                { layer: "Funding", meaning: "Brands contribute" },
                { layer: "Verification", meaning: "Transparency" },
                { layer: "Impact", meaning: "Schools improve" },
                { layer: "Data", meaning: "Measure transformation" }
              ].map((row) => (
                <div key={row.layer} className="lp-layer-chip">
                  <strong>{row.layer}</strong>
                  <span>{row.meaning}</span>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
