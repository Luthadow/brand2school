"use client";

import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import { useCallback, useEffect, useState } from "react";

export type HeaderNavItem = {
  href: string;
  label: string;
};

type BrandedHeaderProps = {
  logoSrc: string;
  logoAlt?: string;
  homeHref: string;
  navItems: HeaderNavItem[];
  ctaHref?: string;
  ctaLabel?: string;
};

function NavAnchor({
  href,
  className,
  children,
  onNavigate
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
  onNavigate?: () => void;
}): JSX.Element {
  if (href.startsWith("#") || href.includes("#")) {
    return (
      <a href={href} className={className} onClick={onNavigate}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href as Route} className={className} onClick={onNavigate}>
      {children}
    </Link>
  );
}

export function BrandedHeader({
  logoSrc,
  logoAlt = "Brand2School logo",
  homeHref,
  navItems,
  ctaHref,
  ctaLabel = "Become a Partner"
}: BrandedHeaderProps): JSX.Element {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  return (
    <header className={`b2s-top-strip${open ? " b2s-top-strip--open" : ""}`}>
      <div className="b2s-header-container">
        <div className="b2s-top-strip-inner">
          <NavAnchor href={homeHref} className="b2s-brand-lockup" onNavigate={close}>
            <Image src={logoSrc} alt={logoAlt} width={1536} height={1024} priority className="b2s-brand-logo" />
          </NavAnchor>

          <div className="b2s-header-actions">
            {ctaHref ? (
              <NavAnchor href={ctaHref} className="b2s-nav-cta b2s-nav-cta--bar" onNavigate={close}>
                {ctaLabel}
              </NavAnchor>
            ) : null}
            <button
              type="button"
              className="b2s-nav-toggle"
              aria-label={open ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={open}
              aria-controls="b2s-nav-drawer"
              onClick={() => setOpen((value) => !value)}
            >
              <span className={`b2s-nav-toggle-icon${open ? " b2s-nav-toggle-icon--open" : ""}`} aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
              <span className="b2s-nav-toggle-label">{open ? "Close" : "Menu"}</span>
            </button>
          </div>
        </div>

        <div
          id="b2s-nav-drawer"
          className={`b2s-nav-drawer${open ? " b2s-nav-drawer--open" : ""}`}
          aria-hidden={!open}
        >
          <nav className="b2s-nav-drawer-inner" aria-label="Main navigation">
            <p className="b2s-nav-drawer-title">Navigate</p>
            <ul className="b2s-nav-drawer-list">
              {navItems.map((item) => (
                <li key={item.href}>
                  <NavAnchor href={item.href} className="b2s-nav-drawer-link" onNavigate={close}>
                    {item.label}
                  </NavAnchor>
                </li>
              ))}
            </ul>
            {ctaHref ? (
              <NavAnchor href={ctaHref} className="b2s-nav-cta b2s-nav-cta--drawer" onNavigate={close}>
                {ctaLabel}
              </NavAnchor>
            ) : null}
          </nav>
        </div>
      </div>

      <button
        type="button"
        className={`b2s-nav-backdrop${open ? " b2s-nav-backdrop--visible" : ""}`}
        aria-label="Close navigation menu"
        tabIndex={open ? 0 : -1}
        onClick={close}
      />
    </header>
  );
}
