"use client";

import { useState } from "react";
import { MessageCircle, Share2 } from "lucide-react";
import { useCommunityPortal } from "../CommunityPortalContext";

export function CommunitySharePage(): JSX.Element {
  const { organization, shareKit, whatsapp } = useCommunityPortal();
  const [copied, setCopied] = useState<string | null>(null);

  async function copyText(text: string, key: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="cp-page">
      <header className="cp-page-head">
        <p className="ds-eyebrow">Share kit</p>
        <h1>Mobilise your community</h1>
        <p className="cp-muted">
          Copy-ready WhatsApp messages for {organization.name} — drive verified participation toward local schools.
        </p>
      </header>

      <section className="card cp-share-panel">
        <h2>
          <Share2 size={16} /> Organisation details
        </h2>
        <p>
          <strong>Code:</strong> {shareKit.organisationCode}
          <button
            type="button"
            className="cp-share-copy"
            onClick={() => void copyText(shareKit.organisationCode, "code")}
          >
            {copied === "code" ? "Copied" : "Copy"}
          </button>
        </p>
        <p>
          <strong>WhatsApp:</strong> {shareKit.whatsappPhone}
        </p>
        <a
          href={`https://wa.me/${shareKit.whatsappPhone.replace(/\D/g, "")}`}
          className="ds-btn ds-btn-primary ds-btn-sm"
          target="_blank"
          rel="noopener noreferrer"
        >
          <MessageCircle size={16} /> Open WhatsApp
        </a>
      </section>

      <section className="card cp-share-panel">
        <h2>Message templates</h2>
        <ul className="cp-share-templates">
          {shareKit.messageTemplates.map((msg, i) => (
            <li key={i}>
              <p>{msg}</p>
              <button
                type="button"
                className="cp-share-copy"
                onClick={() => void copyText(msg, `msg-${i}`)}
              >
                {copied === `msg-${i}` ? "Copied" : "Copy"}
              </button>
            </li>
          ))}
        </ul>
      </section>

      <p className="cp-muted cp-share-foot">
        WhatsApp commands: {whatsapp.commands.join(" · ")}
      </p>
    </div>
  );
}
