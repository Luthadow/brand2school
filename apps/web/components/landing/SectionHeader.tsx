type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "center" | "left";
  light?: boolean;
};

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  align = "center",
  light = false
}: SectionHeaderProps): JSX.Element {
  return (
    <header className={`ds-section-header ds-section-header--${align}${light ? " ds-section-header--light" : ""}`}>
      {eyebrow ? <p className="ds-eyebrow">{eyebrow}</p> : null}
      <h2 className="ds-section-title">{title}</h2>
      {subtitle ? <p className="ds-section-sub">{subtitle}</p> : null}
    </header>
  );
}
