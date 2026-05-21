import { env } from "../config/env.js";
import { CONTACT } from "./contacts.js";

/** Brand2School palette (matches apps/web globals.css) */
export const B2S_EMAIL = {
  blue: "#003b8e",
  navy: "#002a66",
  green: "#6cc24a",
  orange: "#f7931e",
  sky: "#4da3ff",
  canvas: "#f5f7fa",
  white: "#ffffff",
  text: "#1f2937",
  muted: "#6b7280",
  border: "#e2e8f0",
  divider: "#f7931e"
} as const;

export type EmailCta = {
  label: string;
  href: string;
  variant?: "primary" | "outline";
};

export type EmailSection = {
  title: string;
  bodyHtml: string;
  cta?: EmailCta;
};

export type BrandedEmailInput = {
  preheader?: string;
  title: string;
  subtitle?: string;
  bodyHtml: string;
  primaryCta?: EmailCta;
  sections?: EmailSection[];
  footerNote?: string;
  showHero?: boolean;
};

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function logoUrl(): string {
  const base = env.WEB_APP_URL.replace(/\/$/, "");
  return `${base}/brand2school.png`;
}

function renderCta(cta: EmailCta, align: "center" | "left" = "center"): string {
  const isPrimary = cta.variant !== "outline";
  const bg = isPrimary ? B2S_EMAIL.orange : B2S_EMAIL.white;
  const color = isPrimary ? B2S_EMAIL.white : B2S_EMAIL.orange;
  const margin = align === "center" ? "8px auto 0" : "0";

  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="${align}" style="margin:${margin};">
      <tr>
        <td align="center" style="border-radius:6px;background:${bg};border:2px solid ${B2S_EMAIL.orange};">
          <a href="${escapeHtml(cta.href)}" target="_blank" style="display:inline-block;padding:14px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;color:${color};text-decoration:none;">
            ${escapeHtml(cta.label)}
          </a>
        </td>
      </tr>
    </table>`;
}

function renderSection(section: EmailSection): string {
  const ctaBlock = section.cta
    ? renderCta({ ...section.cta, variant: section.cta.variant ?? "outline" }, "left")
    : "";

  return `
    <tr>
      <td style="padding:28px 40px 0;font-family:Arial,Helvetica,sans-serif;">
        <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;color:${B2S_EMAIL.text};line-height:1.3;">
          ${escapeHtml(section.title)}
        </h2>
        <table role="presentation" width="48" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 14px;">
          <tr><td style="height:3px;background:${B2S_EMAIL.divider};font-size:0;line-height:0;">&nbsp;</td></tr>
        </table>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td valign="top" style="font-size:15px;line-height:1.6;color:${B2S_EMAIL.muted};padding-right:${section.cta ? "16px" : "0"};">
              ${section.bodyHtml}
            </td>
            ${section.cta ? `<td valign="top" width="150" align="right">${ctaBlock}</td>` : ""}
          </tr>
        </table>
      </td>
    </tr>`;
}

export function buildBrandedEmail(input: BrandedEmailInput): string {
  const preheader = escapeHtml(input.preheader ?? input.title);
  const showHero = input.showHero !== false;
  const sectionsHtml = (input.sections ?? []).map((s) => renderSection(s)).join("");
  const primaryCtaHtml = input.primaryCta ? renderCta({ ...input.primaryCta, variant: "primary" }) : "";
  const footerNote =
    input.footerNote ??
    `Schools: ${CONTACT.schools} · Brands: ${CONTACT.brands} · General: ${CONTACT.general} · Support: ${CONTACT.support}`;

  const subtitleBlock = input.subtitle
    ? `<p style="margin:12px 0 0;font-size:16px;line-height:1.55;color:${B2S_EMAIL.muted};text-align:center;">${input.subtitle}</p>`
    : "";

  const heroBlock = showHero
    ? `
    <tr>
      <td style="padding:0;background:linear-gradient(180deg,${B2S_EMAIL.blue} 0%,${B2S_EMAIL.navy} 100%);">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td align="center" style="padding:36px 24px 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" width="128" height="128" style="width:128px;height:128px;border-radius:64px;background:radial-gradient(circle at 35% 30%,${B2S_EMAIL.sky} 0%,${B2S_EMAIL.orange} 50%,${B2S_EMAIL.navy} 100%);">
                    &nbsp;
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <title>${escapeHtml(input.title)}</title>
</head>
<body style="margin:0;padding:0;background-color:${B2S_EMAIL.canvas};">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${preheader}&nbsp;&zwnj;&nbsp;&zwnj;</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${B2S_EMAIL.canvas};">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:${B2S_EMAIL.white};border-radius:8px;overflow:hidden;">
          <tr>
            <td style="height:4px;background:linear-gradient(90deg,${B2S_EMAIL.orange},${B2S_EMAIL.green},${B2S_EMAIL.blue});font-size:0;line-height:0;">&nbsp;</td>
          </tr>
          <tr>
            <td style="padding:24px 40px 16px;border-bottom:1px solid ${B2S_EMAIL.border};">
              <a href="${escapeHtml(env.WEB_APP_URL)}" target="_blank">
                <img src="${escapeHtml(logoUrl())}" width="200" alt="Brand2School" style="display:block;border:0;max-width:200px;height:auto;" />
              </a>
            </td>
          </tr>
          ${heroBlock}
          <tr>
            <td style="padding:32px 40px 8px;font-family:Arial,Helvetica,sans-serif;">
              <h1 style="margin:0;font-size:26px;font-weight:700;line-height:1.25;color:${B2S_EMAIL.text};text-align:center;">
                ${input.title}
              </h1>
              ${subtitleBlock}
              ${primaryCtaHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:8px 40px 32px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.65;color:${B2S_EMAIL.text};">
              ${input.bodyHtml}
            </td>
          </tr>
          ${sectionsHtml}
          <tr>
            <td style="padding:32px 40px;background-color:${B2S_EMAIL.canvas};border-top:1px solid ${B2S_EMAIL.border};font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.55;color:${B2S_EMAIL.muted};">
              <p style="margin:0 0 12px;">
                <a href="${escapeHtml(env.WEB_APP_URL)}" style="color:${B2S_EMAIL.blue};font-weight:600;text-decoration:none;">brand2school.co.za</a>
              </p>
              <p style="margin:0 0 8px;">${escapeHtml(footerNote)}</p>
              <p style="margin:16px 0 0;font-size:12px;color:#9ca3af;">
                &copy; ${new Date().getFullYear()} Brand2School. Sent from ${escapeHtml(env.MAIL_FROM)}.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function paragraphs(...lines: string[]): string {
  return lines
    .filter((line) => line.length > 0)
    .map((line) => `<p style="margin:0 0 14px;">${line}</p>`)
    .join("");
}
