import { prisma } from "../../lib/prisma.js";
import { resolveBrandContact, type BrandContactSource } from "../../lib/emails/brandContact.js";
import { buildGovernanceMilestoneEmail } from "../../lib/emails/governanceMilestoneEmails.js";
import { sendGovernanceMilestoneEmail } from "../../lib/mail.js";
import { schoolMatchesCampaignGeo, type SchoolGeoContext } from "../campaigns/campaignEligibility.js";
import type { InfrastructureItemRecord } from "./infrastructureProgress.js";
import {
  detectInfrastructureMilestoneEvents,
  detectMaintenanceGovernanceEvents,
  buildNeedsRowsFromStored,
  type InfrastructureMilestoneEvent
} from "./infrastructureMilestoneEvents.js";
import { buildSchoolNeedsEngine } from "./schoolNeedsEngine.js";
import type { SchoolDevelopmentProfile } from "./schoolDevelopment.js";

const MILESTONE_AUDIT_ACTION = "INFRASTRUCTURE_MILESTONE_NOTIFIED";

function parseHistory(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  return raw as Record<string, string>;
}

function parseItems(raw: unknown): InfrastructureItemRecord[] {
  if (!Array.isArray(raw)) return [];
  return raw as InfrastructureItemRecord[];
}

async function wasMilestoneNotified(schoolId: string, milestoneKey: string): Promise<boolean> {
  const logs = await prisma.auditLog.findMany({
    where: {
      action: MILESTONE_AUDIT_ACTION,
      targetType: "School",
      targetId: schoolId
    },
    select: { payload: true },
    orderBy: { createdAt: "desc" },
    take: 200
  });
  return logs.some((l) => {
    const payload = l.payload as { milestoneKey?: string } | null;
    return payload?.milestoneKey === milestoneKey;
  });
}

async function recordMilestoneNotified(
  schoolId: string,
  milestoneKey: string,
  event: InfrastructureMilestoneEvent
): Promise<void> {
  await prisma.auditLog.create({
    data: {
      action: MILESTONE_AUDIT_ACTION,
      targetType: "School",
      targetId: schoolId,
      payload: { milestoneKey, eventType: event.type }
    }
  });
}

async function findSponsorBrands(school: SchoolGeoContext): Promise<BrandContactSource[]> {
  const now = new Date();
  const campaigns = await prisma.campaign.findMany({
    where: {
      isActive: true,
      commercialStatus: "LIVE",
      startsAt: { lte: now },
      endsAt: { gte: now },
      brand: { status: { in: ["ACTIVE", "APPROVED"] } }
    },
    include: {
      brand: {
        select: {
          id: true,
          name: true,
          primaryContactEmail: true,
          contactPersons: true,
          onboardingStatus: true
        }
      }
    }
  });

  const brandMap = new Map<string, BrandContactSource>();
  for (const campaign of campaigns) {
    if (!schoolMatchesCampaignGeo(school, campaign)) continue;
    if (campaign.brand.onboardingStatus === "SUSPENDED") continue;
    brandMap.set(campaign.brand.id, campaign.brand);
  }
  return [...brandMap.values()];
}

async function notifyBrandContacts(input: {
  brand: BrandContactSource;
  schoolName: string;
  schoolProvince: string;
  schoolDistrict: string;
  event: InfrastructureMilestoneEvent;
}): Promise<void> {
  const contact = resolveBrandContact(input.brand);
  if (!contact) return;

  const { subject, text, html } = buildGovernanceMilestoneEmail({
    to: contact.email,
    contactName: contact.name,
    brandName: input.brand.name,
    schoolName: input.schoolName,
    schoolProvince: input.schoolProvince,
    schoolDistrict: input.schoolDistrict,
    event: input.event
  });

  await sendGovernanceMilestoneEmail({ to: contact.email, subject, text, html });
}

async function notifySchoolContact(input: {
  email: string;
  principalName: string;
  schoolName: string;
  schoolProvince: string;
  schoolDistrict: string;
  event: InfrastructureMilestoneEvent;
}): Promise<void> {
  const { subject, text, html } = buildGovernanceMilestoneEmail({
    to: input.email,
    contactName: input.principalName,
    brandName: "School leadership",
    schoolName: input.schoolName,
    schoolProvince: input.schoolProvince,
    schoolDistrict: input.schoolDistrict,
    event: input.event
  });
  await sendGovernanceMilestoneEmail({ to: input.email, subject, text, html });
}

export async function processInfrastructureGovernanceAlerts(input: {
  school: {
    id: string;
    name: string;
    province: string;
    district: string;
    principalName: string;
    contactEmail: string | null;
  };
  validSubmissions: number;
  before: {
    currentPhase: number;
    phaseHistory: unknown;
    infrastructureItems: unknown;
  };
  after: {
    currentPhase: number;
    phaseHistory: Record<string, string>;
    infrastructureItems: InfrastructureItemRecord[];
  };
  afterDevelopment: SchoolDevelopmentProfile;
}): Promise<{ notified: number }> {
  const beforeHistory = parseHistory(input.before.phaseHistory);
  const beforeItems = parseItems(input.before.infrastructureItems);

  const coreEvents = detectInfrastructureMilestoneEvents({
    beforePhaseHistory: beforeHistory,
    afterPhaseHistory: input.after.phaseHistory,
    beforePhase: input.before.currentPhase,
    afterPhase: input.after.currentPhase,
    beforeItems,
    afterItems: input.after.infrastructureItems,
    afterDevelopment: input.afterDevelopment,
    skipCategoryVerified: beforeItems.length === 0
  });

  const beforeNeeds = buildNeedsRowsFromStored({
    schoolId: input.school.id,
    schoolName: input.school.name,
    validSubmissions: input.validSubmissions,
    currentPhase: input.before.currentPhase,
    phaseHistory: beforeHistory,
    infrastructureItems: beforeItems
  });
  const afterNeeds = buildSchoolNeedsEngine(input.afterDevelopment);
  const maintenanceEvents = detectMaintenanceGovernanceEvents(beforeNeeds, afterNeeds);

  const events = [...coreEvents, ...maintenanceEvents];
  if (events.length === 0) return { notified: 0 };

  const schoolGeo: SchoolGeoContext = {
    id: input.school.id,
    province: input.school.province,
    district: input.school.district,
    name: input.school.name
  };

  const sponsors = await findSponsorBrands(schoolGeo);
  let notified = 0;

  for (const event of events) {
    if (await wasMilestoneNotified(input.school.id, event.milestoneKey)) continue;

    try {
      for (const brand of sponsors) {
        await notifyBrandContacts({
          brand,
          schoolName: input.school.name,
          schoolProvince: input.school.province,
          schoolDistrict: input.school.district,
          event
        });
        notified += 1;
      }

      if (input.school.contactEmail) {
        await notifySchoolContact({
          email: input.school.contactEmail,
          principalName: input.school.principalName,
          schoolName: input.school.name,
          schoolProvince: input.school.province,
          schoolDistrict: input.school.district,
          event
        });
        notified += 1;
      }

      await recordMilestoneNotified(input.school.id, event.milestoneKey, event);
    } catch (err) {
      console.error("[governance] milestone notification failed:", err);
    }
  }

  return { notified };
}
