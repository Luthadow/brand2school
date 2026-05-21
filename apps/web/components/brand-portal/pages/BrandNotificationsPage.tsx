"use client";

import { useBrandPortal } from "../BrandPortalContext";
import { BrandPageHeader } from "../BrandPageHeader";

export function BrandNotificationsPage(): JSX.Element {
  const { notifications } = useBrandPortal();

  return (
    <div className="bp-page">
      <BrandPageHeader
        eyebrow="Notifications"
        title="Impact updates"
        description="Milestones, campaign thresholds, and project completions — stay emotionally connected to transformation."
      />
      <ul className="bp-notify-list">
        {notifications.map((n) => (
          <li key={n.id} className={n.read ? "" : "bp-notify--unread"}>
            <div>
              <strong>{n.title}</strong>
              <p>{n.body}</p>
              <time>{new Date(n.createdAt).toLocaleString("en-ZA")}</time>
            </div>
            <span className="bp-pill">{n.type}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
