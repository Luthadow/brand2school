import Image from "next/image";
import Link from "next/link";
import brandLogo from "../../../../brand2school.png";
import { formatCount } from "../../lib/formatCount";
import { fetchPosterMetrics } from "../../lib/posterMetrics";

const supporterGroups = [
  { icon: "🧒", title: "Early Childhood Centres" },
  { icon: "📘", title: "Primary Schools" },
  { icon: "🎓", title: "Secondary Schools" },
  { icon: "♿", title: "Special Needs Institutions" }
];

export default async function PosterModePage(): Promise<JSX.Element> {
  const { metrics, updatedAt, apiReachable } = await fetchPosterMetrics();

  return (
    <main className="container">
      <div className="poster-frame">
        <div className="poster-banner">BRANDS HAVE POWER. LETS USE IT FOR OUR CHILDREN.</div>
        <div className="poster-body">
          <section className="hero poster-hero" style={{ marginBottom: "1rem" }}>
            <div style={{ marginBottom: "0.8rem" }}>
              <Image
                src={brandLogo}
                alt="Brand2School poster logo"
                priority
                style={{ width: "100%", maxWidth: "460px", height: "auto", borderRadius: "12px", border: "2px solid rgba(255,255,255,0.25)" }}
              />
            </div>
            <h1>Brand2School Poster Mode</h1>
            <p>
              A pitch-ready view designed for partner meetings, campaign launches, and community presentations.
            </p>
            <div className="accent-strip">
              <span className="accent-pill blue">Every Purchase Can Change A Life</span>
              <span className="accent-pill green">Your Participation Builds Progress</span>
              <span className="accent-pill orange">Real Impact. Stronger Futures.</span>
            </div>
          </section>

          <section className="grid-2 poster-split" style={{ marginBottom: "1rem" }}>
            <article className="card panel-light">
              <h2 className="section-title">How It Works</h2>
              <div className="grid-2 poster-tiles">
                <div className="card mosaic-tile"><div className="icon-badge blue">🛒</div><strong>Buy</strong><p>Purchase partner products.</p></div>
                <div className="card mosaic-tile"><div className="icon-badge green">💬</div><strong>Submit</strong><p>Send code via WhatsApp.</p></div>
                <div className="card mosaic-tile"><div className="icon-badge orange">📈</div><strong>Contribute</strong><p>Grow school progress instantly.</p></div>
                <div className="card mosaic-tile"><div className="icon-badge purple">🎁</div><strong>Support</strong><p>Unlock verified support delivery.</p></div>
              </div>
            </article>
            <article className="card panel-dark">
              <h2 className="section-title">Who We Support</h2>
              <div className="grid-2 poster-tiles">
                {supporterGroups.map((group) => (
                  <div className="card mosaic-tile" key={group.title}>
                    <div style={{ fontSize: "1.8rem" }}>{group.icon}</div>
                    <strong>{group.title}</strong>
                  </div>
                ))}
              </div>
            </article>
          </section>

          <section className="illustration-block panel-light">
            <h2 className="section-title">Live platform metrics</h2>
            <p className="poster-metrics-note">
              {apiReachable
                ? `Updated ${new Date(updatedAt).toLocaleString("en-ZA", { dateStyle: "medium", timeStyle: "short" })} from verified platform data.`
                : "Platform API unreachable — showing zeros until the live database is connected."}
            </p>
            <div className="grid-3 poster-metrics">
              {metrics.map((m, i) => (
                <div className="card mosaic-tile" key={m.label}>
                  <div className={`impact-counter count-delay-${i + 1}`}>{formatCount(m.value)}</div>
                  <p>{m.label}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      <div style={{ marginTop: "1rem", display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
        <Link className="cta-link" href="/">
          Back to Main Site
        </Link>
        <Link className="cta-link" href="/dashboard">
          Open Dashboard
        </Link>
      </div>
    </main>
  );
}
