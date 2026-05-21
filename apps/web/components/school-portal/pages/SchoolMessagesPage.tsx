"use client";

import { useSchoolPortal } from "../SchoolPortalContext";

export function SchoolMessagesPage(): JSX.Element {
  const { notifications, whatsapp } = useSchoolPortal();

  return (
    <div className="sp-page">
      <header className="sp-page-head">
        <p className="ds-eyebrow">Communication center</p>
        <h1>Messages and alerts</h1>
      </header>
      <ul className="sp-notify-list">
        {notifications.map((n) => (
          <li key={n.id} className={n.read ? "" : "sp-notify--new"}>
            <strong>{n.title}</strong>
            <p>{n.body}</p>
            <time>{new Date(n.createdAt).toLocaleString("en-ZA")}</time>
          </li>
        ))}
      </ul>
      <section className="sp-section sp-whatsapp-card">
        <h2>WhatsApp</h2>
        <p className="sp-muted">+{whatsapp.phone}</p>
        {whatsapp.commands.map((c) => (
          <code key={c} className="sp-code">
            {c}
          </code>
        ))}
      </section>
    </div>
  );
}
