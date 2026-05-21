import { env } from "../../config/env.js";
import { CONTACT } from "../contacts.js";
import { buildBrandedEmail, escapeHtml, paragraphs, type EmailSection } from "../emailTemplate.js";
import type { InfrastructureMilestoneEvent } from "../../modules/schools/infrastructureMilestoneEvents.js";

export type GovernanceMilestoneEmailBase = {
  to: string;
  contactName: string;
  brandName: string;
  schoolName: string;
  schoolProvince: string;
  schoolDistrict: string;
};

function analyticsUrl(): string {
  return `${env.WEB_APP_URL.replace(/\/$/, "")}/brand/dashboard/analytics`;
}

function schoolsUrl(): string {
  return `${env.WEB_APP_URL.replace(/\/$/, "")}/brand/dashboard/schools`;
}

function buildGovernanceHtml(
  input: GovernanceMilestoneEmailBase & {
    preheader: string;
    title: string;
    subtitle: string;
    bodyParagraphs: string[];
    sections?: EmailSection[];
  }
): string {
  return buildBrandedEmail({
    preheader: input.preheader,
    title: input.title,
    subtitle: input.subtitle,
    primaryCta: { label: "View transformation analytics", href: analyticsUrl() },
    bodyHtml: paragraphs(
      `Dear ${escapeHtml(input.contactName)},`,
      ...input.bodyParagraphs.map((p) => escapeHtml(p))
    ),
    sections: input.sections,
    footerNote: `Governance alerts · ${CONTACT.brands}`
  });
}

function buildGovernanceText(input: GovernanceMilestoneEmailBase, lines: string[]): string {
  return [
    `Dear ${input.contactName},`,
    "",
    ...lines,
    "",
    `Analytics: ${analyticsUrl()}`,
    `Partnerships: ${CONTACT.brands}`,
    "",
    "— Brand2School"
  ].join("\n");
}

export function governanceMilestoneSubject(
  event: InfrastructureMilestoneEvent,
  schoolName: string
): string {
  switch (event.type) {
    case "PHASE_COMPLETED":
      return `Brand2School — ${schoolName}: ${event.phaseTitle} phase verified`;
    case "MAINTENANCE_REQUIRED":
      return `Brand2School governance — ${schoolName}: ${event.category} maintenance cycle`;
    case "CATEGORY_VERIFIED":
      return `Brand2School — ${schoolName}: ${event.category} infrastructure verified`;
  }
}

export function buildGovernanceMilestoneEmail(input: GovernanceMilestoneEmailBase & {
  event: InfrastructureMilestoneEvent;
}): { subject: string; text: string; html: string } {
  const loc = `${input.schoolName} · ${input.schoolDistrict}, ${input.schoolProvince}`;
  const { event } = input;
  const subject = governanceMilestoneSubject(event, input.schoolName);

  if (event.type === "PHASE_COMPLETED") {
    const nextLine = event.nextPhase
      ? `Phase ${event.nextPhase} (${event.nextPhaseTitle}) is now active — the school remains in the national ecosystem.`
      : "The school remains in the national transformation ecosystem — no exit from the network.";
    const text = buildGovernanceText(input, [
      `Verified infrastructure milestone for ${loc}.`,
      "",
      `Phase ${event.phase} — ${event.phaseTitle} reached ${event.verifiedProgressPercent}% verified completion (threshold met).`,
      nextLine,
      "",
      "This is audit-ready ESG evidence for your territorial transformation partnership."
    ]);
    const html = buildGovernanceHtml({
      ...input,
      preheader: `${event.phaseTitle} verified at ${event.verifiedProgressPercent}%`,
      title: "Infrastructure phase milestone",
      subtitle: escapeHtml(loc),
      bodyParagraphs: [
        `Phase ${event.phase} — ${event.phaseTitle} has met the verified completion threshold (${event.verifiedProgressPercent}%).`,
        nextLine,
        "Schools never leave Brand2School — they progress through maturity phases with permanent phase history."
      ],
      sections: [
        {
          title: "ESG & governance",
          bodyHtml: paragraphs(
            "Milestone recorded in infrastructure intelligence and available in your brand dashboard.",
            "Use this for board reporting, CSI/ESG packs, and procurement evidence."
          ),
          cta: { label: "School network", href: schoolsUrl(), variant: "outline" }
        }
      ]
    });
    return { subject, text, html };
  }

  if (event.type === "MAINTENANCE_REQUIRED") {
    const due = new Date(event.maintenanceDueAt).toLocaleDateString("en-ZA", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
    const text = buildGovernanceText(input, [
      `Governance alert for ${loc}.`,
      "",
      `${event.category} (Phase ${event.phase}) has entered the maintenance / refresh cycle (due from ${due}).`,
      "The school stays active — eligible for upgrade sponsorship and continuity programmes."
    ]);
    const html = buildGovernanceHtml({
      ...input,
      preheader: `${event.category} — maintenance cycle`,
      title: "Governance alert — maintenance cycle",
      subtitle: escapeHtml(loc),
      bodyParagraphs: [
        `${event.category} (Phase ${event.phase}) requires scheduled maintenance or refresh (due from ${due}).`,
        "This is normal ecosystem governance — verified infrastructure enters maintenance pipelines rather than leaving the network."
      ],
      sections: [
        {
          title: "Partnership action",
          bodyHtml: paragraphs(
            "Contact partnerships to align renewal funding, phase sponsorship, or continuity support.",
            `Reference: ${escapeHtml(event.category)} · Phase ${event.phase}`
          ),
          cta: { label: "Contact partnerships", href: `mailto:${CONTACT.brands}`, variant: "outline" }
        }
      ]
    });
    return { subject, text, html };
  }

  const text = buildGovernanceText(input, [
    `Category verified for ${loc}.`,
    "",
    `${event.category} (Phase ${event.phase}) is now verified complete.`,
    "Progress counts toward phase completion and ESG reporting."
  ]);
  const html = buildGovernanceHtml({
    ...input,
    preheader: `${event.category} verified`,
    title: "Infrastructure category verified",
    subtitle: escapeHtml(loc),
    bodyParagraphs: [
      `${event.category} (Phase ${event.phase}) has reached verified completion.`,
      "Tracked in the school needs engine and your territorial impact dashboards."
    ]
  });
  return { subject, text, html };
}
