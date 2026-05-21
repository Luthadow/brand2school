import { formatCount } from "../../lib/formatCount";

type ProvinceRow = {
  code: string;
  name: string;
  schools: number;
  submissions: number;
  intensity: number;
};

function heatClass(intensity: number): string {
  if (intensity >= 75) return "ba-heat--high";
  if (intensity >= 45) return "ba-heat--mid";
  if (intensity >= 20) return "ba-heat--low";
  return "ba-heat--min";
}

export function PublicProvinceMap({ provinces }: { provinces: ProvinceRow[] }): JSX.Element {
  if (provinces.length === 0) {
    return <p className="lp-live-empty">Province impact will appear as verified participation grows.</p>;
  }

  const sorted = [...provinces].sort((a, b) => b.submissions - a.submissions);

  return (
    <div className="ba-heatmap">
      <div className="ba-heatmap-grid">
        {sorted.map((p) => (
          <article
            key={p.code}
            className={`ba-heat-cell ${heatClass(p.intensity)}`}
            title={`${p.name}: ${formatCount(p.submissions)} verified`}
          >
            <span className="ba-heat-code">{p.code}</span>
            <strong className="ba-heat-count">{formatCount(p.submissions)}</strong>
            <span className="ba-heat-name">{p.name}</span>
            <div className="ba-heat-meta">
              <span>{p.schools} schools</span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
