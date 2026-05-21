"use client";

import { PROJECT_STAGES } from "../../../lib/schoolPortal";
import { useSchoolPortal } from "../SchoolPortalContext";

export function SchoolProjectsPage(): JSX.Element {
  const { projects } = useSchoolPortal();

  return (
    <div className="sp-page">
      <header className="sp-page-head">
        <p className="ds-eyebrow">Project management</p>
        <h1>Infrastructure projects</h1>
        <p className="sp-muted">Track approvals, construction, inspections, and completion.</p>
      </header>
      <ol className="sp-stages">
        {PROJECT_STAGES.map((s) => (
          <li key={s.key}>{s.label}</li>
        ))}
      </ol>
      {projects.map((p) => (
        <article key={p.id} className="sp-project-card">
          <h3>{p.title}</h3>
          <span className="sp-pill">{p.stage.replace("_", " ")}</span>
          <p className="sp-muted">Updated {new Date(p.updatedAt).toLocaleDateString("en-ZA")}</p>
        </article>
      ))}
    </div>
  );
}
