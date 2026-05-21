import { env } from "../../config/env.js";
import { CONTACT } from "../contacts.js";
import { buildBrandedEmail, escapeHtml, paragraphs, type EmailSection } from "../emailTemplate.js";

export type BrandLifecycleEmailBase = {
  to: string;
  contactName: string;
  brandName: string;
};

function brandPortalUrl(path = "/brand/dashboard"): string {
  return `${env.WEB_APP_URL.replace(/\/$/, "")}${path}`;
}

function lifecycleHtml(
  input: BrandLifecycleEmailBase & {
    preheader: string;
    title: string;
    subtitle: string;
    bodyParagraphs: string[];
    sections?: EmailSection[];
    primaryCta?: { label: string; href: string };
    footerNote?: string;
  }
): string {
  return buildBrandedEmail({
    preheader: input.preheader,
    title: input.title,
    subtitle: input.subtitle,
    primaryCta: input.primaryCta,
    bodyHtml: paragraphs(`Dear ${escapeHtml(input.contactName)},`, ...input.bodyParagraphs.map((p) => escapeHtml(p))),
    sections: input.sections,
    footerNote: input.footerNote ?? `Partnerships: ${CONTACT.brands} · Reply-To routes to our brand team.`
  });
}

function lifecycleText(input: BrandLifecycleEmailBase, lines: string[]): string {
  return [`Dear ${input.contactName},`, "", ...lines, "", `Partnerships: ${CONTACT.brands}`, "", "— Brand2School"].join("\n");
}

export type BrandVerificationApprovedInput = BrandLifecycleEmailBase;

export function buildBrandVerificationApprovedSubject(input: BrandVerificationApprovedInput): string {
  return `Brand2School — ${input.brandName} application verified`;
}

export function buildBrandVerificationApprovedHtml(input: BrandVerificationApprovedInput): string {
  return lifecycleHtml({
    ...input,
    preheader: "Your enterprise application passed initial verification",
    title: "Brand verification successful",
    subtitle: `<strong>${escapeHtml(input.brandName)}</strong> has passed initial governance review.`,
    bodyParagraphs: [
      "Your registration has been verified by the Brand2School partnerships team.",
      "Next steps: participation agreement generation, platform access fee (EFT), and campaign activation gates as outlined in your registration guide."
    ],
    sections: [
      {
        title: "What happens next",
        bodyHtml: paragraphs(
          "We will issue your Brand2School Participation Agreement for signature.",
          "Finance will receive platform access fee instructions before your campaign can go live.",
          "Optional transformation contribution pools remain separate and are not required at launch."
        ),
        cta: { label: "Contact partnerships", href: `mailto:${CONTACT.brands}`, variant: "outline" }
      }
    ]
  });
}

export function buildBrandVerificationApprovedText(input: BrandVerificationApprovedInput): string {
  return lifecycleText(input, [
    `Your brand application for ${input.brandName} has passed initial verification.`,
    "",
    "Next: participation agreement, platform access fee verification, then campaign launch approval."
  ]);
}

export type BrandAgreementRequiredInput = BrandLifecycleEmailBase & {
  agreementVersion: number;
  agreementPdfUrl?: string | null;
};

export function buildBrandAgreementRequiredSubject(input: BrandAgreementRequiredInput): string {
  return `Brand2School — ${input.brandName} participation agreement (v${input.agreementVersion})`;
}

export function buildBrandAgreementRequiredHtml(input: BrandAgreementRequiredInput): string {
  const commercialUrl = brandPortalUrl("/brand/dashboard/commercial");
  return lifecycleHtml({
    ...input,
    preheader: "Sign and return your Brand2School Participation Agreement",
    title: "Participation agreement — signature required",
    subtitle: `Version ${input.agreementVersion} is ready for your legal and procurement teams.`,
    bodyParagraphs: [
      "Your Brand2School Participation Agreement has been generated.",
      "Please download, sign, and upload the executed copy via your brand commercial dashboard, or return it to our partnerships team."
    ],
    primaryCta: input.agreementPdfUrl
      ? { label: "Download agreement PDF", href: input.agreementPdfUrl }
      : { label: "Open commercial dashboard", href: commercialUrl },
    sections: [
      {
        title: "Procurement note",
        bodyHtml: paragraphs(
          "This agreement governs platform access, ESG reporting, verification, and territorial participation — separate from any optional transformation contribution pool.",
          "Questions: reply to this email (routed to brands@brand2school.co.za)."
        ),
        cta: { label: "Commercial dashboard", href: commercialUrl, variant: "outline" }
      }
    ]
  });
}

export function buildBrandAgreementRequiredText(input: BrandAgreementRequiredInput): string {
  const lines = [
    `Participation agreement v${input.agreementVersion} for ${input.brandName} is ready.`,
    "",
    "Sign and upload via the brand commercial dashboard or return to partnerships."
  ];
  if (input.agreementPdfUrl) lines.push("", `PDF: ${input.agreementPdfUrl}`);
  lines.push("", `Dashboard: ${brandPortalUrl("/brand/dashboard/commercial")}`);
  return lifecycleText(input, lines);
}

export type BrandPaymentPendingInput = BrandLifecycleEmailBase & {
  campaignName: string;
  invoiceNumber: string;
  amountZar: string;
  eftReference: string;
};

export function buildBrandPaymentPendingSubject(input: BrandPaymentPendingInput): string {
  return `Brand2School — platform access fee invoice ${input.invoiceNumber}`;
}

export function buildBrandPaymentPendingHtml(input: BrandPaymentPendingInput): string {
  return lifecycleHtml({
    ...input,
    preheader: `Platform access fee: ${input.amountZar}`,
    title: "Platform access fee — payment required",
    subtitle: `Campaign: <strong>${escapeHtml(input.campaignName)}</strong>`,
    bodyParagraphs: [
      "Your mandatory Brand2School platform & ESG infrastructure fee invoice has been issued.",
      "Campaign activation remains gated until finance verifies your EFT."
    ],
    sections: [
      {
        title: "EFT instructions",
        bodyHtml: paragraphs(
          `<table style="width:100%;border-collapse:collapse;font-size:14px;">
            <tr><td style="padding:8px;border:1px solid #e5e7eb;"><strong>Invoice</strong></td><td style="padding:8px;border:1px solid #e5e7eb;">${escapeHtml(input.invoiceNumber)}</td></tr>
            <tr><td style="padding:8px;border:1px solid #e5e7eb;"><strong>Amount</strong></td><td style="padding:8px;border:1px solid #e5e7eb;">${escapeHtml(input.amountZar)}</td></tr>
            <tr><td style="padding:8px;border:1px solid #e5e7eb;"><strong>Reference</strong></td><td style="padding:8px;border:1px solid #e5e7eb;">${escapeHtml(input.eftReference)}</td></tr>
            <tr><td style="padding:8px;border:1px solid #e5e7eb;"><strong>Method</strong></td><td style="padding:8px;border:1px solid #e5e7eb;">EFT (bank details on request via ${escapeHtml(CONTACT.brands)})</td></tr>
          </table>`,
          "Optional transformation contribution pools are invoiced separately and are not required at launch."
        ),
        cta: { label: "Contact finance / partnerships", href: `mailto:${CONTACT.brands}`, variant: "outline" }
      }
    ]
  });
}

export function buildBrandPaymentPendingText(input: BrandPaymentPendingInput): string {
  return lifecycleText(input, [
    `Platform access fee invoice for campaign "${input.campaignName}".`,
    "",
    `Invoice: ${input.invoiceNumber}`,
    `Amount: ${input.amountZar}`,
    `EFT reference: ${input.eftReference}`,
    "",
    "Activation is gated until payment is verified."
  ]);
}

export type BrandPaymentVerifiedInput = BrandLifecycleEmailBase & {
  campaignName: string;
  invoiceNumber: string;
  amountZar: string;
};

export function buildBrandPaymentVerifiedSubject(input: BrandPaymentVerifiedInput): string {
  return `Brand2School — payment confirmed (${input.invoiceNumber})`;
}

export function buildBrandPaymentVerifiedHtml(input: BrandPaymentVerifiedInput): string {
  return lifecycleHtml({
    ...input,
    preheader: "Platform access fee verified",
    title: "Payment confirmation",
    subtitle: `<strong>${escapeHtml(input.amountZar)}</strong> verified for ${escapeHtml(input.campaignName)}.`,
    bodyParagraphs: [
      "Your platform & ESG infrastructure fee has been verified.",
      "Remaining activation gates (codes, rules, launch approval) will be completed by Brand2School operations before go-live."
    ],
    primaryCta: { label: "View commercial status", href: brandPortalUrl("/brand/dashboard/commercial") }
  });
}

export function buildBrandPaymentVerifiedText(input: BrandPaymentVerifiedInput): string {
  return lifecycleText(input, [
    `Payment verified for ${input.brandName} — ${input.campaignName}.`,
    `Invoice ${input.invoiceNumber}: ${input.amountZar}.`,
    "",
    `Commercial dashboard: ${brandPortalUrl("/brand/dashboard/commercial")}`
  ]);
}

export type BrandCampaignActivatedInput = BrandLifecycleEmailBase & {
  campaignName: string;
  partnershipLabel?: string | null;
};

export function buildBrandCampaignActivatedSubject(input: BrandCampaignActivatedInput): string {
  return `Brand2School — ${input.campaignName} is now live`;
}

export function buildBrandCampaignActivatedHtml(input: BrandCampaignActivatedInput): string {
  const subtitle = input.partnershipLabel
    ? `${escapeHtml(input.campaignName)} · ${escapeHtml(input.partnershipLabel)}`
    : escapeHtml(input.campaignName);
  return lifecycleHtml({
    ...input,
    preheader: "Your transformation campaign is active",
    title: "Campaign activated",
    subtitle,
    bodyParagraphs: [
      "Your Brand2School campaign is now live.",
      "Verified participation, ESG reporting, and infrastructure milestone tracking are active for your territory."
    ],
    primaryCta: { label: "Open brand dashboard", href: brandPortalUrl("/brand/dashboard") },
    sections: [
      {
        title: "Enterprise reporting",
        bodyHtml: paragraphs(
          "Export board-ready ESG PDFs from Analytics or configure scheduled impact delivery.",
          "Annual licence renewal notices are sent 60 days before term end."
        ),
        cta: { label: "Analytics & ESG", href: brandPortalUrl("/brand/dashboard/analytics"), variant: "outline" }
      }
    ]
  });
}

export function buildBrandCampaignActivatedText(input: BrandCampaignActivatedInput): string {
  return lifecycleText(input, [
    `Campaign "${input.campaignName}" for ${input.brandName} is now live on Brand2School.`,
    "",
    `Dashboard: ${brandPortalUrl("/brand/dashboard")}`
  ]);
}

export type BrandRenewalNoticeInput = BrandLifecycleEmailBase & {
  campaignName: string;
  endsAtIso: string;
  daysRemaining: number;
};

export function buildBrandRenewalNoticeSubject(input: BrandRenewalNoticeInput): string {
  return `Brand2School — annual licence renewal (${input.campaignName})`;
}

export function buildBrandRenewalNoticeHtml(input: BrandRenewalNoticeInput): string {
  const endDate = new Date(input.endsAtIso).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
  return lifecycleHtml({
    ...input,
    preheader: `Renew within ${input.daysRemaining} days`,
    title: "Annual transformation licence — renewal notice",
    subtitle: `<strong>${escapeHtml(input.campaignName)}</strong> ends ${escapeHtml(endDate)}.`,
    bodyParagraphs: [
      `Your annual Brand2School transformation licence enters renewal (${input.daysRemaining} days notice).`,
      "Schools in your territory remain in the ecosystem; renewal secures continued platform access, verification, and ESG reporting for the next term."
    ],
    primaryCta: { label: "Discuss renewal", href: `mailto:${CONTACT.brands}?subject=${encodeURIComponent(`Renewal: ${input.campaignName}`)}` },
    sections: [
      {
        title: "Governance",
        bodyHtml: paragraphs(
          "If renewal is not completed before licence expiry, campaigns move to lapsed status per commercial governance.",
          "Contact partnerships to issue renewal platform fee and updated participation terms."
        )
      }
    ]
  });
}

export function buildBrandRenewalNoticeText(input: BrandRenewalNoticeInput): string {
  const endDate = new Date(input.endsAtIso).toLocaleDateString("en-ZA");
  return lifecycleText(input, [
    `Annual licence for "${input.campaignName}" ends ${endDate} (${input.daysRemaining} days notice).`,
    "",
    "Contact partnerships to renew platform access and ESG infrastructure for the next term."
  ]);
}

export type BrandSubscriptionRenewalNoticeInput = BrandLifecycleEmailBase & {
  daysRemaining: number;
  endDateIso: string;
  recurringAmountZar: string;
};

export function buildBrandSubscriptionRenewalNoticeSubject(
  input: BrandSubscriptionRenewalNoticeInput
): string {
  return `Brand2School — subscription renewal due (${input.brandName})`;
}

export function buildBrandSubscriptionRenewalNoticeHtml(
  input: BrandSubscriptionRenewalNoticeInput
): string {
  const endDate = new Date(input.endDateIso).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
  return lifecycleHtml({
    ...input,
    preheader: `Enterprise ESG subscription renews in ${input.daysRemaining} days`,
    title: "Monthly subscription renewal",
    subtitle: `Your enterprise ESG infrastructure access ends on ${escapeHtml(endDate)}.`,
    bodyParagraphs: [
      `Your recurring subscription (${escapeHtml(input.recurringAmountZar)}) is due for renewal in ${input.daysRemaining} days.`,
      "This is enterprise platform access — not a donation. Finance will receive an EFT invoice or you may contact partnerships to renew."
    ],
    primaryCta: { label: "Commercial dashboard", href: brandPortalUrl("/brand/dashboard/commercial") }
  });
}

export function buildBrandSubscriptionRenewalNoticeText(
  input: BrandSubscriptionRenewalNoticeInput
): string {
  return lifecycleText(input, [
    `Subscription for ${input.brandName} renews in ${input.daysRemaining} days.`,
    `Amount: ${input.recurringAmountZar}.`,
    "",
    `Dashboard: ${brandPortalUrl("/brand/dashboard/commercial")}`
  ]);
}

export type BrandSubscriptionPastDueInput = BrandLifecycleEmailBase & {
  gracePeriodUntilIso: string;
};

export function buildBrandSubscriptionPastDueSubject(input: BrandSubscriptionPastDueInput): string {
  return `Brand2School — subscription payment overdue (${input.brandName})`;
}

export function buildBrandSubscriptionPastDueHtml(input: BrandSubscriptionPastDueInput): string {
  const graceDate = new Date(input.gracePeriodUntilIso).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
  return lifecycleHtml({
    ...input,
    preheader: "Subscription overdue — grace period active",
    title: "Subscription payment overdue",
    subtitle: `Limited access until <strong>${escapeHtml(graceDate)}</strong>.`,
    bodyParagraphs: [
      "Your enterprise ESG infrastructure subscription cycle has ended without a verified renewal payment.",
      "During the grace period, campaign participation is limited. Pay the renewal invoice before suspension to restore full access."
    ],
    primaryCta: { label: "View billing", href: brandPortalUrl("/brand/dashboard/commercial") }
  });
}

export function buildBrandSubscriptionPastDueText(input: BrandSubscriptionPastDueInput): string {
  const graceDate = new Date(input.gracePeriodUntilIso).toLocaleDateString("en-ZA");
  return lifecycleText(input, [
    `Subscription overdue for ${input.brandName}.`,
    `Grace period until ${graceDate}.`,
    "",
    "Renew before suspension to restore campaign participation."
  ]);
}

export type BrandSubscriptionSuspendedInput = BrandLifecycleEmailBase & {
  campaignsPaused: number;
};

export function buildBrandSubscriptionSuspendedSubject(input: BrandSubscriptionSuspendedInput): string {
  return `Brand2School — subscription suspended (${input.brandName})`;
}

export function buildBrandSubscriptionSuspendedHtml(input: BrandSubscriptionSuspendedInput): string {
  return lifecycleHtml({
    ...input,
    preheader: "Campaign participation paused",
    title: "Subscription suspended",
    subtitle: `${input.campaignsPaused} campaign(s) paused.`,
    bodyParagraphs: [
      "Your subscription grace period has ended without verified payment.",
      "Campaign participation is paused. Historical data and dashboards remain available. Reactivation restores full access upon payment verification."
    ],
    primaryCta: { label: "Contact partnerships", href: `mailto:${CONTACT.brands}` }
  });
}

export function buildBrandSubscriptionSuspendedText(input: BrandSubscriptionSuspendedInput): string {
  return lifecycleText(input, [
    `Subscription suspended for ${input.brandName}.`,
    `${input.campaignsPaused} campaign(s) paused.`,
    "",
    "Contact partnerships to reactivate after payment."
  ]);
}

export type BrandSubscriptionReactivatedInput = BrandLifecycleEmailBase & {
  recurringAmountZar: string;
};

export function buildBrandSubscriptionReactivatedSubject(input: BrandSubscriptionReactivatedInput): string {
  return `Brand2School — subscription reactivated (${input.brandName})`;
}

export function buildBrandSubscriptionReactivatedHtml(input: BrandSubscriptionReactivatedInput): string {
  return lifecycleHtml({
    ...input,
    preheader: "Full campaign access restored",
    title: "Subscription reactivated",
    subtitle: `Enterprise ESG infrastructure access restored (${escapeHtml(input.recurringAmountZar)}).`,
    bodyParagraphs: [
      "Your subscription payment has been verified.",
      "Campaign participation and public visibility can be restored per your commercial activation checklist."
    ],
    primaryCta: { label: "Commercial dashboard", href: brandPortalUrl("/brand/dashboard/commercial") }
  });
}

export function buildBrandSubscriptionReactivatedText(input: BrandSubscriptionReactivatedInput): string {
  return lifecycleText(input, [
    `Subscription reactivated for ${input.brandName}.`,
    "",
    `Dashboard: ${brandPortalUrl("/brand/dashboard/commercial")}`
  ]);
}
