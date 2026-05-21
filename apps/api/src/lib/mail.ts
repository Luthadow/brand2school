import nodemailer from "nodemailer";
import { env } from "../config/env.js";
import { CONTACT } from "./contacts.js";
import {
  buildBrandRegistrationGuideHtml,
  buildBrandRegistrationGuideText,
  type BrandRegistrationGuideInput
} from "./emails/brandRegistrationGuide.js";
import {
  buildBrandAgreementRequiredHtml,
  buildBrandAgreementRequiredSubject,
  buildBrandAgreementRequiredText,
  buildBrandCampaignActivatedHtml,
  buildBrandCampaignActivatedSubject,
  buildBrandCampaignActivatedText,
  buildBrandPaymentPendingHtml,
  buildBrandPaymentPendingSubject,
  buildBrandPaymentPendingText,
  buildBrandPaymentVerifiedHtml,
  buildBrandPaymentVerifiedSubject,
  buildBrandPaymentVerifiedText,
  buildBrandRenewalNoticeHtml,
  buildBrandRenewalNoticeSubject,
  buildBrandRenewalNoticeText,
  buildBrandSubscriptionPastDueHtml,
  buildBrandSubscriptionPastDueSubject,
  buildBrandSubscriptionPastDueText,
  buildBrandSubscriptionReactivatedHtml,
  buildBrandSubscriptionReactivatedSubject,
  buildBrandSubscriptionReactivatedText,
  buildBrandSubscriptionRenewalNoticeHtml,
  buildBrandSubscriptionRenewalNoticeSubject,
  buildBrandSubscriptionRenewalNoticeText,
  buildBrandSubscriptionSuspendedHtml,
  buildBrandSubscriptionSuspendedSubject,
  buildBrandSubscriptionSuspendedText,
  buildBrandVerificationApprovedHtml,
  buildBrandVerificationApprovedSubject,
  buildBrandVerificationApprovedText,
  type BrandAgreementRequiredInput,
  type BrandCampaignActivatedInput,
  type BrandPaymentPendingInput,
  type BrandPaymentVerifiedInput,
  type BrandRenewalNoticeInput,
  type BrandSubscriptionPastDueInput,
  type BrandSubscriptionReactivatedInput,
  type BrandSubscriptionRenewalNoticeInput,
  type BrandSubscriptionSuspendedInput,
  type BrandVerificationApprovedInput
} from "./emails/brandLifecycleEmails.js";
import { buildBrandedEmail, escapeHtml, paragraphs } from "./emailTemplate.js";

async function sendBrandLifecycleMail(input: {
  to: string;
  subject: string;
  text: string;
  html: string;
}): Promise<{ subject: string }> {
  await sendBrandedMail({ to: input.to, subject: input.subject, text: input.text, html: input.html, replyTo: CONTACT.brands });
  return { subject: input.subject };
}

type SchoolConfirmationInput = {
  to: string;
  principalName: string;
  schoolName: string;
  schoolCode: string;
  whatsappPhone: string;
  loginUrl: string;
};

function transporter() {
  if (!env.SMTP_HOST) return null;
  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: env.SMTP_USER && env.SMTP_PASS ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined
  });
}

async function sendBrandedMail(input: {
  to: string;
  subject: string;
  text: string;
  html: string;
  attachments?: nodemailer.SendMailOptions["attachments"];
  replyTo?: string;
}): Promise<void> {
  const tx = transporter();
  if (!tx) {
    console.info("[mail:dev]", input.subject);
    console.info(`To: ${input.to}`);
    if (input.replyTo) console.info(`Reply-To: ${input.replyTo}`);
    if (input.attachments?.length) {
      console.info(`Attachments: ${input.attachments.map((a) => a.filename).join(", ")}`);
    }
    console.info(input.text);
    return;
  }

  await tx.sendMail({
    from: `"Brand2School" <${env.MAIL_FROM}>`,
    to: input.to,
    replyTo: input.replyTo,
    subject: input.subject,
    text: input.text,
    html: input.html,
    attachments: input.attachments
  });
}

export async function sendSchoolRegistrationEmail(input: SchoolConfirmationInput): Promise<{ subject: string }> {
  const schoolName = escapeHtml(input.schoolName);
  const subject = `Welcome to Brand2School — ${input.schoolName} is registered`;

  const text = [
    `Dear ${input.principalName},`,
    "",
    `Your school ${input.schoolName} is registered on Brand2School.`,
    "Our team will review your application and activate participation shortly.",
    "",
    `School code: ${input.schoolCode}`,
    `WhatsApp linked: +${input.whatsappPhone}`,
    "",
    "WhatsApp commands for your community:",
    "MENU",
    "SUBMIT | School Name | District | campaign-slug | PRODUCT_CODE",
    "PROGRESS | School Name | District",
    "STATUS",
    "",
    `Principal portal: ${input.loginUrl}`,
    "",
    `School support: ${CONTACT.schools}`,
    "",
    "— Brand2School"
  ].join("\n");

  const html = buildBrandedEmail({
    preheader: `${input.schoolName} is registered on Brand2School`,
    title: `Welcome to Brand2School`,
    subtitle: `<strong>${schoolName}</strong> is registered. Our team will activate your participation shortly.`,
    primaryCta: { label: "Open Principal Portal", href: input.loginUrl },
    bodyHtml: paragraphs(
      `Dear ${escapeHtml(input.principalName)},`,
      `Your WhatsApp number is linked for community code submissions.`,
      `<strong>School code:</strong> ${escapeHtml(input.schoolCode)}<br/><strong>WhatsApp:</strong> +${escapeHtml(input.whatsappPhone)}`
    ),
    sections: [
      {
        title: "WhatsApp commands",
        bodyHtml: paragraphs(
          "Share these with families — no learner accounts required:",
          `<code style="background:#f5f7fa;padding:4px 8px;border-radius:4px;font-size:13px;">MENU</code>`,
          `<code style="background:#f5f7fa;padding:4px 8px;border-radius:4px;font-size:13px;">SUBMIT | School | District | campaign-slug | CODE</code>`,
          `<code style="background:#f5f7fa;padding:4px 8px;border-radius:4px;font-size:13px;">PROGRESS | School | District</code>`
        ),
        cta: { label: "School support", href: `mailto:${CONTACT.schools}`, variant: "outline" }
      },
      {
        title: "Getting started",
        bodyHtml: paragraphs(
          "Once approved, track verified submissions and infrastructure progress in your principal dashboard."
        ),
        cta: { label: "View platform", href: env.WEB_APP_URL, variant: "outline" }
      }
    ],
    footerNote: `Questions? Email ${CONTACT.schools}`
  });

  await sendBrandedMail({ to: input.to, subject, text, html });
  return { subject };
}

type EsgReportEmailInput = {
  to: string;
  brandName: string;
  cadence: string;
  periodLabel: string;
  filename: string;
  pdf: Buffer;
};

export async function sendEsgReportEmail(input: EsgReportEmailInput): Promise<{ subject: string }> {
  const subject = `${input.cadence} ESG Impact Report — ${input.brandName}`;

  const text = [
    `Dear ${input.brandName} partner,`,
    "",
    `Your ${input.cadence.toLowerCase()} Brand2School impact report is attached.`,
    `Reporting period: ${input.periodLabel}`,
    "",
    "This report is generated automatically from verified school participation data.",
    "",
    `Brand support: ${CONTACT.brands}`,
    "",
    "— Brand2School Impact Intelligence"
  ].join("\n");

  const html = buildBrandedEmail({
    preheader: `${input.cadence} impact report for ${input.periodLabel}`,
    title: `${escapeHtml(input.cadence)} ESG Impact Report`,
    subtitle: `For <strong>${escapeHtml(input.brandName)}</strong> · ${escapeHtml(input.periodLabel)}`,
    bodyHtml: paragraphs(
      "Your automated impact report is attached to this email.",
      "It is generated from verified participation, fraud controls, and province analytics on Brand2School."
    ),
    sections: [
      {
        title: "Report contents",
        bodyHtml: paragraphs(
          `File: <strong>${escapeHtml(input.filename)}</strong>`,
          "Use this PDF for board reporting, CSI compliance, and stakeholder updates."
        )
      },
      {
        title: "Need help?",
        bodyHtml: paragraphs("Our brand partnerships team can help you interpret campaign performance."),
        cta: { label: "Contact brands", href: `mailto:${CONTACT.brands}`, variant: "outline" }
      }
    ],
    footerNote: `Brand enquiries: ${CONTACT.brands}`,
    showHero: true
  });

  await sendBrandedMail({
    to: input.to,
    subject,
    text,
    html,
    attachments: [{ filename: input.filename, content: input.pdf, contentType: "application/pdf" }]
  });
  return { subject };
}

type SchoolApprovedEmailInput = {
  to: string;
  principalName: string;
  schoolName: string;
  schoolCode: string;
  whatsappPhone: string;
  loginUrl: string;
};

export async function sendSchoolApprovedEmail(input: SchoolApprovedEmailInput): Promise<{ subject: string }> {
  const schoolName = escapeHtml(input.schoolName);
  const subject = `Your school is active on Brand2School — ${input.schoolName}`;

  const text = [
    `Dear ${input.principalName},`,
    "",
    `Great news — ${input.schoolName} has been verified and activated on Brand2School.`,
    "",
    "Your school can now receive verified WhatsApp participation submissions.",
    "",
    `School code: ${input.schoolCode}`,
    `WhatsApp: +${input.whatsappPhone}`,
    "",
    `Principal portal: ${input.loginUrl}`,
    "",
    `School support: ${CONTACT.schools}`,
    "",
    "— Brand2School"
  ].join("\n");

  const html = buildBrandedEmail({
    preheader: `${input.schoolName} is now active`,
    title: "School profile activated",
    subtitle: `<strong>${schoolName}</strong> is live on the platform.`,
    primaryCta: { label: "Open Principal Portal", href: input.loginUrl },
    bodyHtml: paragraphs(
      `Dear ${escapeHtml(input.principalName)},`,
      "Your verification is complete. Families can submit product codes via WhatsApp and you can track progress in your dashboard.",
      `<strong>School code:</strong> ${escapeHtml(input.schoolCode)}<br/><strong>WhatsApp:</strong> +${escapeHtml(input.whatsappPhone)}`
    ),
    sections: [
      {
        title: "WhatsApp commands",
        bodyHtml: paragraphs(
          `<code style="background:#f5f7fa;padding:4px 8px;border-radius:4px;font-size:13px;">SUBMIT | School | District | campaign-slug | CODE</code>`,
          `<code style="background:#f5f7fa;padding:4px 8px;border-radius:4px;font-size:13px;">PROGRESS | School | District</code>`
        )
      }
    ],
    footerNote: `Questions? ${CONTACT.schools}`
  });

  await sendBrandedMail({ to: input.to, subject, text, html });
  return { subject };
}

export type { BrandRegistrationGuideInput };

type BrandWelcomeEmailInput = {
  to: string;
  contactName: string;
  brandName: string;
  loginUrl: string;
};

/** Sent from noreply@ on brand application — before campaign activation. */
export async function sendBrandRegistrationGuideEmail(
  input: BrandRegistrationGuideInput
): Promise<{ subject: string }> {
  const subject = `Welcome to Brand2School — ${input.brandName} registration & participation guide`;
  const text = buildBrandRegistrationGuideText(input);
  const html = buildBrandRegistrationGuideHtml(input);

  await sendBrandedMail({
    to: input.to,
    subject,
    text,
    html,
    replyTo: CONTACT.brands
  });
  return { subject };
}

export async function sendBrandVerificationApprovedEmail(
  input: BrandVerificationApprovedInput
): Promise<{ subject: string }> {
  const subject = buildBrandVerificationApprovedSubject(input);
  return sendBrandLifecycleMail({
    to: input.to,
    subject,
    text: buildBrandVerificationApprovedText(input),
    html: buildBrandVerificationApprovedHtml(input)
  });
}

export async function sendBrandAgreementRequiredEmail(
  input: BrandAgreementRequiredInput
): Promise<{ subject: string }> {
  const subject = buildBrandAgreementRequiredSubject(input);
  return sendBrandLifecycleMail({
    to: input.to,
    subject,
    text: buildBrandAgreementRequiredText(input),
    html: buildBrandAgreementRequiredHtml(input)
  });
}

export async function sendBrandPaymentPendingEmail(input: BrandPaymentPendingInput): Promise<{ subject: string }> {
  const subject = buildBrandPaymentPendingSubject(input);
  return sendBrandLifecycleMail({
    to: input.to,
    subject,
    text: buildBrandPaymentPendingText(input),
    html: buildBrandPaymentPendingHtml(input)
  });
}

export async function sendBrandPaymentVerifiedEmail(input: BrandPaymentVerifiedInput): Promise<{ subject: string }> {
  const subject = buildBrandPaymentVerifiedSubject(input);
  return sendBrandLifecycleMail({
    to: input.to,
    subject,
    text: buildBrandPaymentVerifiedText(input),
    html: buildBrandPaymentVerifiedHtml(input)
  });
}

export async function sendBrandCampaignActivatedEmail(
  input: BrandCampaignActivatedInput
): Promise<{ subject: string }> {
  const subject = buildBrandCampaignActivatedSubject(input);
  return sendBrandLifecycleMail({
    to: input.to,
    subject,
    text: buildBrandCampaignActivatedText(input),
    html: buildBrandCampaignActivatedHtml(input)
  });
}

export async function sendBrandRenewalNoticeEmail(input: BrandRenewalNoticeInput): Promise<{ subject: string }> {
  const subject = buildBrandRenewalNoticeSubject(input);
  return sendBrandLifecycleMail({
    to: input.to,
    subject,
    text: buildBrandRenewalNoticeText(input),
    html: buildBrandRenewalNoticeHtml(input)
  });
}

export async function sendBrandSubscriptionRenewalNoticeEmail(
  input: BrandSubscriptionRenewalNoticeInput
): Promise<{ subject: string }> {
  const subject = buildBrandSubscriptionRenewalNoticeSubject(input);
  return sendBrandLifecycleMail({
    to: input.to,
    subject,
    text: buildBrandSubscriptionRenewalNoticeText(input),
    html: buildBrandSubscriptionRenewalNoticeHtml(input)
  });
}

export async function sendBrandSubscriptionPastDueEmail(
  input: BrandSubscriptionPastDueInput
): Promise<{ subject: string }> {
  const subject = buildBrandSubscriptionPastDueSubject(input);
  return sendBrandLifecycleMail({
    to: input.to,
    subject,
    text: buildBrandSubscriptionPastDueText(input),
    html: buildBrandSubscriptionPastDueHtml(input)
  });
}

export async function sendBrandSubscriptionSuspendedEmail(
  input: BrandSubscriptionSuspendedInput
): Promise<{ subject: string }> {
  const subject = buildBrandSubscriptionSuspendedSubject(input);
  return sendBrandLifecycleMail({
    to: input.to,
    subject,
    text: buildBrandSubscriptionSuspendedText(input),
    html: buildBrandSubscriptionSuspendedHtml(input)
  });
}

export async function sendBrandSubscriptionReactivatedEmail(
  input: BrandSubscriptionReactivatedInput
): Promise<{ subject: string }> {
  const subject = buildBrandSubscriptionReactivatedSubject(input);
  return sendBrandLifecycleMail({
    to: input.to,
    subject,
    text: buildBrandSubscriptionReactivatedText(input),
    html: buildBrandSubscriptionReactivatedHtml(input)
  });
}

/** Infrastructure phase / maintenance governance alerts — brands & school contacts. */
export async function sendGovernanceMilestoneEmail(input: {
  to: string;
  subject: string;
  text: string;
  html: string;
}): Promise<{ subject: string }> {
  await sendBrandedMail({
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html,
    replyTo: CONTACT.brands
  });
  return { subject: input.subject };
}

export async function sendBrandWelcomeEmail(input: BrandWelcomeEmailInput): Promise<{ subject: string }> {
  const brandName = escapeHtml(input.brandName);
  const subject = `Welcome to Brand2School — ${input.brandName} partnership active`;

  const text = [
    `Dear ${input.contactName},`,
    "",
    `Your brand partnership for ${input.brandName} is now active on Brand2School.`,
    "",
    "You can access campaign analytics, ESG reporting, and verified participation data.",
    "",
    `Brand portal: ${input.loginUrl}`,
    "",
    `Partnerships: ${CONTACT.brands}`,
    "",
    "— Brand2School"
  ].join("\n");

  const html = buildBrandedEmail({
    preheader: `${input.brandName} is active on Brand2School`,
    title: "Brand partnership welcome",
    subtitle: `<strong>${brandName}</strong> is ready for campaigns and impact reporting.`,
    primaryCta: { label: "Open Brand Dashboard", href: input.loginUrl },
    bodyHtml: paragraphs(
      `Dear ${escapeHtml(input.contactName)},`,
      "Launch campaigns, import product codes, and export board-ready ESG impact reports from your dashboard."
    ),
    sections: [
      {
        title: "Next steps",
        bodyHtml: paragraphs(
          "Coordinate campaign setup with our partnerships team if you need onboarding support.",
          "Export ESG PDFs anytime from Analytics or schedule automated delivery."
        ),
        cta: { label: "Contact partnerships", href: `mailto:${CONTACT.brands}`, variant: "outline" }
      }
    ],
    footerNote: `Brand support: ${CONTACT.brands}`
  });

  await sendBrandedMail({ to: input.to, subject, text, html });
  return { subject };
}

type PasswordResetEmailInput = {
  to: string;
  fullName: string;
  resetUrl: string;
  expiresMinutes: number;
};

export async function sendPasswordResetEmail(input: PasswordResetEmailInput): Promise<{ subject: string }> {
  const subject = "Reset Your Password — Brand2School";

  const text = [
    `Dear ${input.fullName},`,
    "",
    "We received a request to reset your Brand2School password.",
    "For your security, we never email your existing password — passwords can only be reset, not retrieved.",
    "",
    `Reset link (expires in ${input.expiresMinutes} minutes):`,
    input.resetUrl,
    "",
    "If you did not request this, ignore this email and contact support immediately.",
    "",
    `Support: ${CONTACT.support}`,
    "",
    "— Brand2School"
  ].join("\n");

  const html = buildBrandedEmail({
    preheader: "Secure password reset — link expires soon",
    title: "Reset your password",
    subtitle: `This link expires in ${input.expiresMinutes} minutes.`,
    primaryCta: { label: "Reset password", href: input.resetUrl },
    bodyHtml: paragraphs(
      `Dear ${escapeHtml(input.fullName)},`,
      "Click below to choose a new password. We never store or email plain-text passwords, and we cannot send your current password.",
      "If you did not request this reset, ignore this email and contact support."
    ),
    footerNote: `Security · ${CONTACT.support}`
  });

  await sendBrandedMail({
    to: input.to,
    subject,
    text,
    html,
    replyTo: CONTACT.support
  });
  return { subject };
}

type PasswordChangedEmailInput = {
  to: string;
  fullName: string;
};

export async function sendPasswordChangedEmail(input: PasswordChangedEmailInput): Promise<{ subject: string }> {
  const subject = "Your Password Was Changed — Brand2School";

  const text = [
    `Dear ${input.fullName},`,
    "",
    "Your Brand2School password was successfully changed.",
    "",
    "If you did not make this change, contact support immediately:",
    CONTACT.support,
    "",
    "— Brand2School Security"
  ].join("\n");

  const html = buildBrandedEmail({
    preheader: "Your password was updated",
    title: "Password changed",
    subtitle: "Your account password was updated successfully.",
    bodyHtml: paragraphs(
      `Dear ${escapeHtml(input.fullName)},`,
      "This confirms your password was changed. We never include passwords in email.",
      "If you did not authorize this change, contact support immediately."
    ),
    footerNote: `Security · ${CONTACT.support}`
  });

  await sendBrandedMail({
    to: input.to,
    subject,
    text,
    html,
    replyTo: CONTACT.support
  });
  return { subject };
}

type ContactInquiryEmailInput = {
  fullName: string;
  email: string;
  organisation?: string;
  phone?: string;
  topic: string;
  message: string;
};

export async function sendContactInquiryToInfo(input: ContactInquiryEmailInput): Promise<{ subject: string }> {
  const subject = `[Brand2School] ${input.topic} — ${input.fullName}`;
  const orgLine = input.organisation ? `Organisation: ${input.organisation}\n` : "";
  const phoneLine = input.phone ? `Phone: ${input.phone}\n` : "";

  const text = [
    "New enquiry via brand2school.co.za",
    "",
    `Name: ${input.fullName}`,
    `Email: ${input.email}`,
    orgLine,
    phoneLine,
    `Topic: ${input.topic}`,
    "",
    "Message:",
    input.message
  ]
    .filter(Boolean)
    .join("\n");

  const html = buildBrandedEmail({
    preheader: `Contact: ${input.topic}`,
    title: "New website enquiry",
    subtitle: `From <strong>${escapeHtml(input.fullName)}</strong> · ${escapeHtml(input.email)}`,
    bodyHtml: paragraphs(
      input.organisation ? `<strong>Organisation:</strong> ${escapeHtml(input.organisation)}` : "",
      input.phone ? `<strong>Phone:</strong> ${escapeHtml(input.phone)}` : "",
      `<strong>Topic:</strong> ${escapeHtml(input.topic)}`,
      `<strong>Message:</strong><br/>${escapeHtml(input.message).replace(/\n/g, "<br/>")}`
    ),
    showHero: false
  });

  await sendBrandedMail({
    to: CONTACT.general,
    replyTo: input.email,
    subject,
    text,
    html
  });
  return { subject };
}

export async function sendContactAcknowledgement(input: ContactInquiryEmailInput): Promise<{ subject: string }> {
  const subject = "We received your enquiry — Brand2School";

  const text = [
    `Dear ${input.fullName},`,
    "",
    "Thank you for contacting Brand2School.",
    "",
    "We have received your message and a member of our team will respond as soon as possible.",
    "",
    `Topic: ${input.topic}`,
    "",
    `General enquiries: ${CONTACT.general}`,
    "",
    "— Brand2School Team"
  ].join("\n");

  const html = buildBrandedEmail({
    preheader: "Your enquiry was received",
    title: "Thank you for contacting us",
    bodyHtml: paragraphs(
      `Dear ${escapeHtml(input.fullName)},`,
      "We have received your enquiry and will respond shortly.",
      `Your topic: <strong>${escapeHtml(input.topic)}</strong>`
    ),
    sections: [
      {
        title: "Urgent matters",
        bodyHtml: paragraphs("Include your organisation, phone number, and a clear summary so we can assist faster.")
      }
    ],
    footerNote: `${CONTACT.general} · ${CONTACT.support}`
  });

  await sendBrandedMail({ to: input.email, subject, text, html });
  return { subject };
}

export async function sendSchoolVerificationOpsEmail(input: {
  to: string;
  subject: string;
  text: string;
  html: string;
}): Promise<{ subject: string }> {
  await sendBrandedMail({
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html,
    replyTo: CONTACT.schools
  });
  return { subject: input.subject };
}

export async function sendSchoolVerificationApprovedEmail(input: {
  to: string;
  subject: string;
  text: string;
  html: string;
}): Promise<{ subject: string }> {
  await sendBrandedMail({
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html,
    replyTo: CONTACT.schools
  });
  return { subject: input.subject };
}

export async function sendSchoolVerificationRejectedEmail(input: {
  to: string;
  subject: string;
  text: string;
  html: string;
}): Promise<{ subject: string }> {
  await sendBrandedMail({
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html,
    replyTo: CONTACT.schools
  });
  return { subject: input.subject };
}
