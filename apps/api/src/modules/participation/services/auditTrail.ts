import { prisma } from "../../../lib/prisma.js";
import type { Prisma } from "../../../generated/prisma/index.js";

export type AuditEvent = {
  action: string;
  targetType: string;
  targetId: string;
  payload?: Record<string, unknown>;
  actorId?: string;
};

export async function logParticipationAudit(event: AuditEvent): Promise<void> {
  await prisma.auditLog.create({
    data: {
      action: event.action,
      targetType: event.targetType,
      targetId: event.targetId,
      actorId: event.actorId,
      payload: (event.payload ?? {}) as Prisma.InputJsonValue
    }
  });
}

export async function recordSubmissionAttempt(input: {
  codeValue: string;
  campaignSlug?: string;
  schoolId?: string;
  district?: string;
  whatsappMsisdn?: string;
  outcome: string;
  riskScore?: number;
  fraudSignals?: string[];
  source?: string;
}): Promise<void> {
  await prisma.submissionAttempt.create({
    data: {
      codeValue: input.codeValue.toUpperCase(),
      campaignSlug: input.campaignSlug,
      schoolId: input.schoolId,
      district: input.district,
      whatsappMsisdn: input.whatsappMsisdn,
      outcome: input.outcome,
      riskScore: input.riskScore ?? 0,
      fraudSignals: input.fraudSignals ?? [],
      source: input.source ?? "whatsapp"
    }
  });

  await logParticipationAudit({
    action: `ATTEMPT_${input.outcome}`,
    targetType: "SubmissionAttempt",
    targetId: input.codeValue.toUpperCase(),
    payload: {
      campaignSlug: input.campaignSlug,
      schoolId: input.schoolId,
      district: input.district,
      riskScore: input.riskScore ?? 0,
      fraudSignals: input.fraudSignals ?? []
    }
  });
}
