import { prisma } from "../../lib/prisma.js";
import { getOrganizationCategory } from "../../lib/organizationCategories.js";
import { isCommunityOrganization } from "../../lib/communityOrganizations.js";
import { getSchoolForUser } from "../schools/registerSchool.js";
import { getOrCreateSchoolVerification } from "../schools/schoolVerification/verificationGate.js";
import {
  documentsReadyForClaim,
  hasActiveDeferrals,
  parseDocumentDeferrals,
  REGISTRATION_DEFERRAL_KEY
} from "../schools/schoolVerification/documentDeferrals.js";
import { serializeSchoolVerification } from "../schools/schoolVerification/serializeSchoolVerification.js";
import { buildDocumentVault } from "../schools/schoolDocumentVault.js";
import { buildSchoolCommunityHub, type SchoolCommunityHub } from "../schools/schoolCommunityHub.js";
import { buildCommunitySuccessCentre } from "./communitySuccessCentre.js";
import { buildCommunityRecognition } from "./communityRecognition.js";
import { listCommunityLinkedSchools } from "./communityLinkedSchools.js";

export type CommunityPortal = {
  organization: {
    id: string;
    name: string;
    schoolCode: string;
    province: string;
    district: string;
    principalName: string;
    contactEmail: string | null;
    whatsappPhone: string;
    status: string;
    verificationStatus: string;
    organizationCategory: string;
  };
  organizationMeta: {
    id: string;
    label: string;
    portalEyebrow: string;
    documentsTitle: string;
    documentsIntro: string;
    registrationNumber: {
      key: string;
      label: string;
      placeholder: string;
      minLength: number;
      maxLength: number;
      validationMessage: string;
    } | null;
    documents: Array<{ key: string; label: string; required: boolean }>;
    centreTypes: Array<{ id: string; label: string }>;
  };
  verification: {
    status: string;
    emisNumber: string | null;
    registrationNumber: string | null;
    registrationDeferred: boolean;
    canSubmit: boolean;
    canCompleteDocuments: boolean;
    claimReady: boolean;
    documents: Array<{
      key: string;
      label: string;
      uploaded: boolean;
      deferred: boolean;
    }>;
  };
  documentVault: {
    entries: Array<{
      key: string;
      label: string;
      status: "uploaded" | "deferred" | "missing";
      uploadedAt: string | null;
      expiresAt: string | null;
      daysUntilExpiry: number | null;
      reminderLevel: "none" | "info" | "warning" | "urgent";
    }>;
    expiringSoon: number;
    expired: number;
  };
  successCentre: ReturnType<typeof buildCommunitySuccessCentre>;
  participation: {
    engagementScore: number;
    stats: SchoolCommunityHub["stats"];
    supporters: SchoolCommunityHub["supporters"];
    areaBreakdown: SchoolCommunityHub["areaBreakdown"];
    weekdayActivity: SchoolCommunityHub["weekdayActivity"];
    linkedOrganisations: SchoolCommunityHub["linkedOrganisations"];
  };
  recognition: ReturnType<typeof buildCommunityRecognition>;
  linkedSchools: Awaited<ReturnType<typeof listCommunityLinkedSchools>>;
  shareKit: {
    organisationCode: string;
    whatsappPhone: string;
    messageTemplates: string[];
  };
  whatsapp: {
    phone: string;
    commands: string[];
  };
};

export async function getCommunityPortal(userId: string): Promise<CommunityPortal | null> {
  const school = await getSchoolForUser(userId);
  if (!school) return null;
  if (!isCommunityOrganization(school.organizationCategory)) return null;

  const learnerCount = await prisma.learner.count({ where: { schoolId: school.id } });
  const verificationRow = await getOrCreateSchoolVerification(school.id);
  const deferrals = parseDocumentDeferrals(verificationRow.documentDeferrals);
  const deferralSnapshot = {
    organizationCategory: school.organizationCategory,
    emisNumber: verificationRow.emisNumber,
    registrationNumber: verificationRow.registrationNumber,
    principalIdPath: verificationRow.principalIdPath,
    schoolLetterPath: verificationRow.schoolLetterPath,
    emisEvidencePath: verificationRow.emisEvidencePath,
    documentPaths: (verificationRow.documentPaths as Record<string, string> | null) ?? null,
    registrationDeferred: deferrals[REGISTRATION_DEFERRAL_KEY]?.willSubmitBeforeClaim === true
  };
  const activeDeferrals = hasActiveDeferrals(deferralSnapshot, deferrals);
  const claimReady = documentsReadyForClaim(deferralSnapshot);
  const canSubmitVerification =
    verificationRow.status === "NOT_SUBMITTED" ||
    verificationRow.status === "REJECTED" ||
    activeDeferrals ||
    !claimReady;
  const canCompleteDocuments =
    activeDeferrals || (verificationRow.status !== "NOT_SUBMITTED" && !claimReady);

  const serializedVerification = serializeSchoolVerification(verificationRow, school.organizationCategory);
  const category = getOrganizationCategory(school.organizationCategory);

  const hub = await buildSchoolCommunityHub({
    schoolId: school.id,
    schoolName: school.name,
    schoolCode: school.schoolCode,
    whatsappPhone: school.whatsappPhone,
    province: school.province,
    district: school.district,
    learnerCount,
    organizationCategory: school.organizationCategory
  });

  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const startOfWeek = new Date(startOfDay);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  const validSubmissions = await prisma.submission.count({
    where: { schoolId: school.id, state: "VALID" }
  });

  const [today, thisWeek, thisMonth, lastMonth] = await Promise.all([
    prisma.submission.count({
      where: { schoolId: school.id, state: "VALID", createdAt: { gte: startOfDay } }
    }),
    prisma.submission.count({
      where: { schoolId: school.id, state: "VALID", createdAt: { gte: startOfWeek } }
    }),
    prisma.submission.count({
      where: { schoolId: school.id, state: "VALID", createdAt: { gte: startOfMonth } }
    }),
    prisma.submission.count({
      where: {
        schoolId: school.id,
        state: "VALID",
        createdAt: { gte: startOfLastMonth, lte: endOfLastMonth }
      }
    })
  ]);

  const recognition = buildCommunityRecognition({
    validSubmissions,
    uniqueParticipants: hub.stats.uniqueParticipants,
    verificationApproved: verificationRow.status === "APPROVED",
    engagementScore: hub.engagementScore,
    districtRank: hub.stats.districtRank
  });

  const linkedSchools = await listCommunityLinkedSchools({
    province: school.province,
    district: school.district,
    excludeSchoolId: school.id
  });

  const successCentre = buildCommunitySuccessCentre({
    validSubmissions,
    uniqueParticipants: hub.stats.uniqueParticipants,
    engagementScore: hub.engagementScore,
    verificationApproved: verificationRow.status === "APPROVED",
    thisMonth,
    lastMonth,
    today,
    thisWeek,
    earnedBadges: recognition.earnedBadges,
    totalBadges: recognition.totalBadges,
    linkedSchoolsCount: linkedSchools.length
  });

  const documentVault = buildDocumentVault(
    serializedVerification.documents.map((d) => ({
      key: d.key,
      label: d.label,
      uploaded: d.uploaded,
      deferred: d.deferred
    })),
    verificationRow.submittedAt?.toISOString() ?? null
  );

  return {
    organization: {
      id: school.id,
      name: school.name,
      schoolCode: school.schoolCode,
      province: school.province,
      district: school.district,
      principalName: school.principalName,
      contactEmail: school.contactEmail,
      whatsappPhone: school.whatsappPhone,
      status: school.status,
      verificationStatus: verificationRow.status,
      organizationCategory: category.id
    },
    organizationMeta: {
      id: category.id,
      label: category.label,
      portalEyebrow: category.portalEyebrow,
      documentsTitle: category.documentsTitle,
      documentsIntro: category.documentsIntro,
      registrationNumber: category.registrationNumber
        ? {
            key: category.registrationNumber.key,
            label: category.registrationNumber.label,
            placeholder: category.registrationNumber.placeholder,
            minLength: category.registrationNumber.minLength,
            maxLength: category.registrationNumber.maxLength,
            validationMessage: category.registrationNumber.validationMessage
          }
        : null,
      documents: category.documents.map((doc) => ({
        key: doc.key,
        label: doc.label,
        required: doc.required
      })),
      centreTypes: category.centreTypes.map((centre) => ({
        id: centre.id,
        label: centre.label
      }))
    },
    verification: {
      status: verificationRow.status,
      emisNumber: verificationRow.emisNumber,
      registrationNumber: verificationRow.registrationNumber,
      registrationDeferred: serializedVerification.registrationDeferred,
      canSubmit: canSubmitVerification,
      canCompleteDocuments,
      claimReady: serializedVerification.claimReady,
      documents: serializedVerification.documents.map((d) => ({
        key: d.key,
        label: d.label,
        uploaded: d.uploaded,
        deferred: d.deferred
      }))
    },
    documentVault,
    successCentre,
    participation: {
      engagementScore: hub.engagementScore,
      stats: hub.stats,
      supporters: hub.supporters,
      areaBreakdown: hub.areaBreakdown,
      weekdayActivity: hub.weekdayActivity,
      linkedOrganisations: hub.linkedOrganisations
    },
    recognition,
    linkedSchools,
    shareKit: {
      organisationCode: school.schoolCode,
      whatsappPhone: school.whatsappPhone,
      messageTemplates: hub.shareKit.messageTemplates
    },
    whatsapp: {
      phone: school.whatsappPhone,
      commands: ["MENU", "1 — Submit code", "2 — Check progress", "HELP"]
    }
  };
}
