import {
  createPdfBuffer,
  drawBulletList,
  drawSection
} from "../../lib/pdf/pdfKitHelpers.js";
import {
  buildReportFilename,
  drawReportBanner,
  drawReportFooter,
  drawReportKeyValues,
  drawReportTableHeader,
  drawReportTableRow,
  drawReportTitleBlock,
  formatReportGeneratedAt,
  formatZarReport,
  LETTERHEAD,
  reportContentDisposition
} from "../../lib/pdf/reportLayout.js";
import { getSchoolPortal, type SchoolPortal } from "./getSchoolPortal.js";

export type SchoolReportModule =
  | "overview"
  | "roadmap"
  | "needs"
  | "targets"
  | "submissions"
  | "projects"
  | "messages"
  | "documents"
  | "profile";

const MODULES = new Set<SchoolReportModule>([
  "overview",
  "roadmap",
  "needs",
  "targets",
  "submissions",
  "projects",
  "messages",
  "documents",
  "profile"
]);

export function isSchoolReportModule(value: string): value is SchoolReportModule {
  return MODULES.has(value as SchoolReportModule);
}

export function schoolReportContentDisposition(module: SchoolReportModule): string {
  return reportContentDisposition("brand2school-school", module);
}

export async function buildSchoolPortalReportPdf(
  userId: string,
  module: SchoolReportModule
): Promise<Buffer | null> {
  const portal = await getSchoolPortal(userId);
  if (!portal) return null;

  switch (module) {
    case "overview":
      return buildOverviewPdf(portal);
    case "roadmap":
      return buildRoadmapPdf(portal);
    case "needs":
      return buildNeedsPdf(portal);
    case "targets":
      return buildTargetsPdf(portal);
    case "submissions":
      return buildSubmissionsPdf(portal);
    case "projects":
      return buildProjectsPdf(portal);
    case "messages":
      return buildMessagesPdf(portal);
    case "documents":
      return buildDocumentsPdf(portal);
    case "profile":
      return buildProfilePdf(portal);
    default:
      throw new Error("Unknown school report module.");
  }
}

function orgSubtitle(portal: SchoolPortal): string {
  return `${portal.school.name} · ${portal.school.district}, ${portal.school.province} · Code ${portal.school.schoolCode}`;
}

function buildOverviewPdf(portal: SchoolPortal): Promise<Buffer> {
  const generated = formatReportGeneratedAt(new Date().toISOString());
  return createPdfBuffer((doc) => {
    drawReportBanner(doc, "Organisation Portal — Overview Report");
    drawReportTitleBlock(doc, "Dashboard overview", `${orgSubtitle(portal)} · Generated ${generated}`);

    drawSection(doc, "Participation summary", "Verified community participation and impact metrics.");
    drawReportKeyValues(doc, [
      { label: "Verified submissions", value: String(portal.overview.verifiedSubmissions) },
      { label: "National score", value: `${portal.overview.nationalScore}%` },
      { label: "Estimated impact value", value: formatZarReport(portal.overview.estimatedImpactZar) },
      { label: "Funding balance", value: formatZarReport(portal.overview.fundingBalanceZar) },
      { label: "Active campaigns", value: String(portal.overview.activeCampaigns) },
      { label: "Projects in progress", value: String(portal.overview.projectsInProgress) },
      { label: "Active needs", value: String(portal.overview.activeNeeds) },
      { label: "Target reached", value: `${portal.overview.targetReachedPercent}%` },
      { label: "Gamification level", value: portal.gamification.label }
    ]);

    drawReportFooter(doc, `${LETTERHEAD.productLine} · ${portal.organization.label} portal report`);
  });
}

function buildRoadmapPdf(portal: SchoolPortal): Promise<Buffer> {
  const generated = formatReportGeneratedAt(new Date().toISOString());
  return createPdfBuffer((doc) => {
    drawReportBanner(doc, "Organisation Portal — Roadmap Report");
    drawReportTitleBlock(doc, "Development roadmap", `${orgSubtitle(portal)} · Generated ${generated}`);

    drawReportKeyValues(doc, [
      { label: "Current phase", value: String(portal.development.currentPhase) },
      { label: "Tier", value: portal.development.tierLabel },
      { label: "Mission", value: portal.development.missionStatement.slice(0, 120) }
    ]);

    drawSection(doc, "Phases", "Transformation journey across infrastructure milestones.");
    for (const phase of portal.development.phases) {
      drawBulletList(doc, [
        `Phase ${phase.phase}: ${phase.title} (${phase.status}) — ${phase.focus}`,
        ...phase.items.slice(0, 4).map((item) => `  · ${item}`)
      ]);
    }

    drawReportFooter(doc, `${LETTERHEAD.productLine} · Roadmap report`);
  });
}

function buildNeedsPdf(portal: SchoolPortal): Promise<Buffer> {
  const generated = formatReportGeneratedAt(new Date().toISOString());
  return createPdfBuffer((doc) => {
    drawReportBanner(doc, "Organisation Portal — Needs Report");
    drawReportTitleBlock(doc, "Infrastructure needs", `${orgSubtitle(portal)} · Generated ${generated}`);

    drawReportKeyValues(doc, [
      {
        label: "Claim-ready for milestones",
        value: portal.verification.claimReady ? "Yes" : "No — complete Docs first"
      },
      { label: "Needs tracked", value: String(portal.needs.length) }
    ]);

    drawReportTableHeader(doc, [
      { label: "Category", width: 120 },
      { label: "Status", width: 90 },
      { label: "Progress", width: 56 }
    ]);
    const widths = [120, 90, 56];
    for (const need of portal.needs.slice(0, 30)) {
      drawReportTableRow(doc, [need.title, need.subcategory, `${need.progressPercent}%`], widths);
    }

    drawReportFooter(doc, `${LETTERHEAD.productLine} · Needs report`);
  });
}

function buildTargetsPdf(portal: SchoolPortal): Promise<Buffer> {
  const generated = formatReportGeneratedAt(new Date().toISOString());
  return createPdfBuffer((doc) => {
    drawReportBanner(doc, "Organisation Portal — Targets Report");
    drawReportTitleBlock(doc, "Campaign targets", `${orgSubtitle(portal)} · Generated ${generated}`);

    drawReportTableHeader(doc, [
      { label: "Campaign", width: 100 },
      { label: "Brand", width: 80 },
      { label: "Progress", width: 56 },
      { label: "Remaining", width: 56 }
    ]);
    const widths = [100, 80, 56, 56];
    for (const target of portal.targets) {
      drawReportTableRow(
        doc,
        [
          target.name.slice(0, 22),
          target.brandName.slice(0, 16),
          `${target.percentToTarget}%`,
          String(target.remainingToTarget)
        ],
        widths
      );
    }

    drawReportFooter(doc, `${LETTERHEAD.productLine} · Targets report`);
  });
}

function buildSubmissionsPdf(portal: SchoolPortal): Promise<Buffer> {
  const generated = formatReportGeneratedAt(new Date().toISOString());
  return createPdfBuffer((doc) => {
    drawReportBanner(doc, "Organisation Portal — Submissions Report");
    drawReportTitleBlock(doc, "Community submissions", `${orgSubtitle(portal)} · Generated ${generated}`);

    drawSection(doc, "Submission trend", "Recent verified participation.");
    drawBulletList(
      doc,
      portal.submissionsTrend.map((row) => `${row.label}: ${row.count} submission(s)`)
    );

    drawSection(doc, "Supporters", "Brands and partners driving submissions.");
    drawReportTableHeader(doc, [
      { label: "Partner", width: 120 },
      { label: "Type", width: 72 },
      { label: "Submissions", width: 56 }
    ]);
    const widths = [120, 72, 56];
    for (const s of portal.supporters.slice(0, 20)) {
      drawReportTableRow(doc, [s.name.slice(0, 24), s.type, String(s.submissions)], widths);
    }

    drawReportFooter(doc, `${LETTERHEAD.productLine} · Submissions report`);
  });
}

function buildProjectsPdf(portal: SchoolPortal): Promise<Buffer> {
  const generated = formatReportGeneratedAt(new Date().toISOString());
  return createPdfBuffer((doc) => {
    drawReportBanner(doc, "Organisation Portal — Projects Report");
    drawReportTitleBlock(doc, "Infrastructure projects", `${orgSubtitle(portal)} · Generated ${generated}`);

    drawReportTableHeader(doc, [
      { label: "Project", width: 160 },
      { label: "Stage", width: 80 },
      { label: "Updated", width: 80 }
    ]);
    const widths = [160, 80, 80];
    for (const project of portal.projects) {
      drawReportTableRow(
        doc,
        [project.title.slice(0, 28), project.stage, new Date(project.updatedAt).toLocaleDateString("en-ZA")],
        widths
      );
    }

    drawReportFooter(doc, `${LETTERHEAD.productLine} · Projects report`);
  });
}

function buildMessagesPdf(portal: SchoolPortal): Promise<Buffer> {
  const generated = formatReportGeneratedAt(new Date().toISOString());
  return createPdfBuffer((doc) => {
    drawReportBanner(doc, "Organisation Portal — Messages Report");
    drawReportTitleBlock(doc, "Notifications & WhatsApp", `${orgSubtitle(portal)} · Generated ${generated}`);

    drawSection(doc, "WhatsApp linked", `+${portal.whatsapp.phone}`);
    drawBulletList(doc, portal.whatsapp.commands);

    drawSection(doc, "Recent notifications", "Portal alerts and governance updates.");
    for (const n of portal.notifications.slice(0, 15)) {
      drawBulletList(doc, [`${n.title} (${new Date(n.createdAt).toLocaleDateString("en-ZA")}): ${n.body.slice(0, 100)}`]);
    }

    drawReportFooter(doc, `${LETTERHEAD.productLine} · Messages report`);
  });
}

function buildDocumentsPdf(portal: SchoolPortal): Promise<Buffer> {
  const generated = formatReportGeneratedAt(new Date().toISOString());
  return createPdfBuffer((doc) => {
    drawReportBanner(doc, "Organisation Portal — Verification Report");
    drawReportTitleBlock(doc, "Verification documents", `${orgSubtitle(portal)} · Generated ${generated}`);

    drawReportKeyValues(doc, [
      { label: "Verification status", value: portal.verification.status },
      { label: "Centre type", value: portal.verification.centreTypeLabel ?? "—" },
      { label: "Claim-ready", value: portal.verification.claimReady ? "Yes" : "No" },
      { label: "Active deferrals", value: portal.verification.hasActiveDeferrals ? "Yes" : "No" }
    ]);

    drawReportTableHeader(doc, [
      { label: "Document", width: 180 },
      { label: "Status", width: 80 }
    ]);
    const widths = [180, 80];
    for (const docRow of portal.verification.documents) {
      const status = docRow.uploaded ? "Uploaded" : docRow.deferred ? "Deferred" : "Missing";
      drawReportTableRow(doc, [docRow.label.slice(0, 40), status], widths);
    }

    drawReportFooter(doc, `${LETTERHEAD.productLine} · Verification report`);
  });
}

function buildProfilePdf(portal: SchoolPortal): Promise<Buffer> {
  const generated = formatReportGeneratedAt(new Date().toISOString());
  return createPdfBuffer((doc) => {
    drawReportBanner(doc, "Organisation Portal — Profile Report");
    drawReportTitleBlock(doc, "Organisation profile", `${orgSubtitle(portal)} · Generated ${generated}`);

    drawReportKeyValues(doc, [
      { label: "Organisation type", value: portal.organization.label },
      { label: "Principal / contact", value: portal.school.principalName },
      { label: "Contact email", value: portal.school.contactEmail ?? "—" },
      { label: "WhatsApp", value: `+${portal.school.whatsappPhone}` },
      { label: "Entity status", value: portal.school.status },
      { label: "Learners", value: String(portal.school.learnerCount) },
      { label: "National rank", value: portal.gamification.nationalRank ? String(portal.gamification.nationalRank) : "—" },
      { label: "Badges", value: portal.gamification.badges.join(", ") || "—" }
    ]);

    drawReportFooter(doc, `${LETTERHEAD.productLine} · Profile report`);
  });
}

export { buildReportFilename as schoolReportFilename };
