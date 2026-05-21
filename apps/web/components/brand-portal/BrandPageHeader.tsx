import type { ReactNode } from "react";

export function BrandPageHeader({
  eyebrow,
  title,
  description,
  actions
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}): JSX.Element {
  return (
    <header className="bp-page-head">
      <div>
        {eyebrow ? <p className="ds-eyebrow">{eyebrow}</p> : null}
        <h1>{title}</h1>
        {description ? <p className="bp-page-desc">{description}</p> : null}
      </div>
      {actions ? <div className="bp-page-actions">{actions}</div> : null}
    </header>
  );
}


