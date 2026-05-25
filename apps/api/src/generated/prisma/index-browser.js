
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 5.22.0
 * Query Engine version: 605197351a3c8bdd595af2d2a9bc3025bca48ea2
 */
Prisma.prismaVersion = {
  client: "5.22.0",
  engine: "605197351a3c8bdd595af2d2a9bc3025bca48ea2"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.NotFoundError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`NotFoundError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  fullName: 'fullName',
  email: 'email',
  passwordHash: 'passwordHash',
  role: 'role',
  status: 'status',
  schoolId: 'schoolId',
  brandId: 'brandId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PasswordResetTokenScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  tokenHash: 'tokenHash',
  expiresAt: 'expiresAt',
  usedAt: 'usedAt',
  createdAt: 'createdAt'
};

exports.Prisma.SchoolScalarFieldEnum = {
  id: 'id',
  name: 'name',
  province: 'province',
  district: 'district',
  principalName: 'principalName',
  contactEmail: 'contactEmail',
  whatsappPhone: 'whatsappPhone',
  schoolCode: 'schoolCode',
  status: 'status',
  developmentTier: 'developmentTier',
  currentPhase: 'currentPhase',
  developmentScores: 'developmentScores',
  phaseHistory: 'phaseHistory',
  infrastructureItems: 'infrastructureItems',
  fundingBalanceZar: 'fundingBalanceZar',
  annualCycleYear: 'annualCycleYear',
  annualCycleFocus: 'annualCycleFocus',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SchoolVerificationScalarFieldEnum = {
  id: 'id',
  schoolId: 'schoolId',
  emisNumber: 'emisNumber',
  status: 'status',
  principalIdPath: 'principalIdPath',
  schoolLetterPath: 'schoolLetterPath',
  emisEvidencePath: 'emisEvidencePath',
  submittedAt: 'submittedAt',
  reviewedAt: 'reviewedAt',
  reviewedByUserId: 'reviewedByUserId',
  reviewerNotes: 'reviewerNotes',
  rejectionReason: 'rejectionReason',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.LearnerScalarFieldEnum = {
  id: 'id',
  schoolId: 'schoolId',
  fullName: 'fullName',
  grade: 'grade',
  learnerCode: 'learnerCode',
  guardianPhone: 'guardianPhone',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.BrandScalarFieldEnum = {
  id: 'id',
  name: 'name',
  codePrefix: 'codePrefix',
  slug: 'slug',
  verificationPolicy: 'verificationPolicy',
  status: 'status',
  verificationCode: 'verificationCode',
  verificationStatus: 'verificationStatus',
  verifiedAt: 'verifiedAt',
  verifiedByUserId: 'verifiedByUserId',
  onboardingStatus: 'onboardingStatus',
  legalName: 'legalName',
  registrationNumber: 'registrationNumber',
  vatNumber: 'vatNumber',
  primaryContactEmail: 'primaryContactEmail',
  contactPersons: 'contactPersons',
  intendedProvinces: 'intendedProvinces',
  campaignIntention: 'campaignIntention',
  productsInvolved: 'productsInvolved',
  internalReviewNotes: 'internalReviewNotes',
  logoUrl: 'logoUrl',
  featuredOnHome: 'featuredOnHome',
  homeSortOrder: 'homeSortOrder',
  founderExempt: 'founderExempt',
  publicProfileEnabled: 'publicProfileEnabled',
  description: 'description',
  websiteUrl: 'websiteUrl',
  brandColor: 'brandColor',
  subscriptionStatus: 'subscriptionStatus',
  subscriptionPlan: 'subscriptionPlan',
  subscriptionStartDate: 'subscriptionStartDate',
  subscriptionEndDate: 'subscriptionEndDate',
  activationFeePaid: 'activationFeePaid',
  recurringAmountZar: 'recurringAmountZar',
  billingCycle: 'billingCycle',
  gracePeriodUntil: 'gracePeriodUntil',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CampaignScalarFieldEnum = {
  id: 'id',
  brandId: 'brandId',
  name: 'name',
  slug: 'slug',
  campaignCode: 'campaignCode',
  category: 'category',
  infrastructureGoal: 'infrastructureGoal',
  startsAt: 'startsAt',
  endsAt: 'endsAt',
  isActive: 'isActive',
  targetSubmissions: 'targetSubmissions',
  contributionPerCodeZar: 'contributionPerCodeZar',
  fundSplit: 'fundSplit',
  impactTarget: 'impactTarget',
  fundingRaisedZar: 'fundingRaisedZar',
  scopeType: 'scopeType',
  allowedProvinces: 'allowedProvinces',
  allowedDistricts: 'allowedDistricts',
  allowedSchoolIds: 'allowedSchoolIds',
  budgetAllocatedZar: 'budgetAllocatedZar',
  budgetConsumedZar: 'budgetConsumedZar',
  pauseOnBudgetExhausted: 'pauseOnBudgetExhausted',
  overflowCampaignId: 'overflowCampaignId',
  commercialStatus: 'commercialStatus',
  setupFeeZar: 'setupFeeZar',
  contributionPoolZar: 'contributionPoolZar',
  paymentVerifiedAt: 'paymentVerifiedAt',
  codesApprovedAt: 'codesApprovedAt',
  rulesConfiguredAt: 'rulesConfiguredAt',
  launchApprovedAt: 'launchApprovedAt',
  gracePeriodDays: 'gracePeriodDays',
  gracePeriodEndsAt: 'gracePeriodEndsAt',
  renewalStatus: 'renewalStatus',
  autoSuspendOnExpiry: 'autoSuspendOnExpiry',
  expiredAt: 'expiredAt',
  impactCommitment: 'impactCommitment',
  impactDelivered: 'impactDelivered',
  partnershipLabel: 'partnershipLabel',
  sponsorshipTrack: 'sponsorshipTrack',
  licenseTermMonths: 'licenseTermMonths',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.BrandAgreementScalarFieldEnum = {
  id: 'id',
  brandId: 'brandId',
  version: 'version',
  status: 'status',
  generatedPdfPath: 'generatedPdfPath',
  signedPdfPath: 'signedPdfPath',
  scopeSnapshot: 'scopeSnapshot',
  generatedAt: 'generatedAt',
  uploadedAt: 'uploadedAt',
  approvedAt: 'approvedAt',
  approvedByUserId: 'approvedByUserId',
  rejectionReason: 'rejectionReason',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CampaignInvoiceScalarFieldEnum = {
  id: 'id',
  campaignId: 'campaignId',
  invoiceNumber: 'invoiceNumber',
  invoiceType: 'invoiceType',
  amountZar: 'amountZar',
  status: 'status',
  eftReference: 'eftReference',
  issuedAt: 'issuedAt',
  paymentReportedAt: 'paymentReportedAt',
  verifiedAt: 'verifiedAt',
  verifiedByUserId: 'verifiedByUserId',
  notes: 'notes',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ProductScalarFieldEnum = {
  id: 'id',
  campaignId: 'campaignId',
  name: 'name',
  slug: 'slug',
  sku: 'sku',
  createdAt: 'createdAt'
};

exports.Prisma.CodeBatchScalarFieldEnum = {
  id: 'id',
  campaignId: 'campaignId',
  batchName: 'batchName',
  batchCode: 'batchCode',
  codeVersion: 'codeVersion',
  expiresAt: 'expiresAt',
  createdAt: 'createdAt'
};

exports.Prisma.CodeScalarFieldEnum = {
  id: 'id',
  batchId: 'batchId',
  brandId: 'brandId',
  campaignId: 'campaignId',
  productId: 'productId',
  value: 'value',
  token: 'token',
  checksum: 'checksum',
  codeVersion: 'codeVersion',
  status: 'status',
  usedAt: 'usedAt',
  usedSchoolId: 'usedSchoolId',
  usedDistrict: 'usedDistrict',
  redeemedProvince: 'redeemedProvince',
  redeemedBy: 'redeemedBy',
  usedBySubmissionId: 'usedBySubmissionId'
};

exports.Prisma.SubmissionAttemptScalarFieldEnum = {
  id: 'id',
  codeValue: 'codeValue',
  campaignSlug: 'campaignSlug',
  schoolId: 'schoolId',
  district: 'district',
  whatsappMsisdn: 'whatsappMsisdn',
  outcome: 'outcome',
  riskScore: 'riskScore',
  fraudSignals: 'fraudSignals',
  source: 'source',
  createdAt: 'createdAt'
};

exports.Prisma.SubmissionScalarFieldEnum = {
  id: 'id',
  schoolId: 'schoolId',
  learnerId: 'learnerId',
  campaignId: 'campaignId',
  codeValue: 'codeValue',
  area: 'area',
  district: 'district',
  source: 'source',
  whatsappMsisdn: 'whatsappMsisdn',
  state: 'state',
  riskScore: 'riskScore',
  rejectionReason: 'rejectionReason',
  createdAt: 'createdAt',
  reviewedAt: 'reviewedAt'
};

exports.Prisma.AuditLogScalarFieldEnum = {
  id: 'id',
  actorId: 'actorId',
  action: 'action',
  targetType: 'targetType',
  targetId: 'targetId',
  payload: 'payload',
  createdAt: 'createdAt'
};

exports.Prisma.RefreshSessionScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  tokenHash: 'tokenHash',
  expiresAt: 'expiresAt',
  revokedAt: 'revokedAt',
  userAgent: 'userAgent',
  ipAddress: 'ipAddress',
  lastUsedAt: 'lastUsedAt',
  createdAt: 'createdAt'
};

exports.Prisma.FraudFlagScalarFieldEnum = {
  id: 'id',
  submissionId: 'submissionId',
  reason: 'reason',
  severity: 'severity',
  riskScore: 'riskScore',
  policy: 'policy',
  status: 'status',
  resolutionNote: 'resolutionNote',
  createdAt: 'createdAt',
  resolvedAt: 'resolvedAt'
};

exports.Prisma.AdminQueuePresetScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  module: 'module',
  name: 'name',
  filters: 'filters',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AuditExportJobScalarFieldEnum = {
  id: 'id',
  requestedById: 'requestedById',
  status: 'status',
  filters: 'filters',
  rowCount: 'rowCount',
  csvContent: 'csvContent',
  errorMessage: 'errorMessage',
  retryCount: 'retryCount',
  maxRetries: 'maxRetries',
  nextRetryAt: 'nextRetryAt',
  lockToken: 'lockToken',
  lockedAt: 'lockedAt',
  createdAt: 'createdAt',
  startedAt: 'startedAt',
  completedAt: 'completedAt',
  expiresAt: 'expiresAt'
};

exports.Prisma.WhatsAppConversationScalarFieldEnum = {
  msisdn: 'msisdn',
  step: 'step',
  data: 'data',
  updatedAt: 'updatedAt',
  createdAt: 'createdAt'
};

exports.Prisma.WhatsAppMessageScalarFieldEnum = {
  id: 'id',
  toMsisdn: 'toMsisdn',
  body: 'body',
  templateName: 'templateName',
  providerMessageId: 'providerMessageId',
  deliveryStatus: 'deliveryStatus',
  status: 'status',
  attempts: 'attempts',
  maxAttempts: 'maxAttempts',
  lastError: 'lastError',
  nextRetryAt: 'nextRetryAt',
  sentAt: 'sentAt',
  deliveredAt: 'deliveredAt',
  readAt: 'readAt',
  failedAt: 'failedAt',
  deadLetterReason: 'deadLetterReason',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.WebhookDedupScalarFieldEnum = {
  id: 'id',
  source: 'source',
  createdAt: 'createdAt'
};

exports.Prisma.EsgReportScheduleScalarFieldEnum = {
  id: 'id',
  brandId: 'brandId',
  cadence: 'cadence',
  recipientEmail: 'recipientEmail',
  enabled: 'enabled',
  nextRunAt: 'nextRunAt',
  lastRunAt: 'lastRunAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.FundingContributionScalarFieldEnum = {
  id: 'id',
  submissionId: 'submissionId',
  schoolId: 'schoolId',
  campaignId: 'campaignId',
  brandId: 'brandId',
  grossAmountZar: 'grossAmountZar',
  allocations: 'allocations',
  createdAt: 'createdAt'
};

exports.Prisma.EsgReportDeliveryScalarFieldEnum = {
  id: 'id',
  scheduleId: 'scheduleId',
  status: 'status',
  periodLabel: 'periodLabel',
  errorMessage: 'errorMessage',
  sentAt: 'sentAt',
  createdAt: 'createdAt'
};

exports.Prisma.NotificationLogScalarFieldEnum = {
  id: 'id',
  channel: 'channel',
  template: 'template',
  recipient: 'recipient',
  subject: 'subject',
  status: 'status',
  entityType: 'entityType',
  entityId: 'entityId',
  errorMessage: 'errorMessage',
  metadata: 'metadata',
  sentAt: 'sentAt',
  createdAt: 'createdAt'
};

exports.Prisma.NotificationJobScalarFieldEnum = {
  id: 'id',
  channel: 'channel',
  template: 'template',
  recipient: 'recipient',
  payload: 'payload',
  status: 'status',
  priority: 'priority',
  attempts: 'attempts',
  maxAttempts: 'maxAttempts',
  scheduledAt: 'scheduledAt',
  lockedAt: 'lockedAt',
  processedAt: 'processedAt',
  lastError: 'lastError',
  entityType: 'entityType',
  entityId: 'entityId',
  createdAt: 'createdAt',
  logId: 'logId'
};

exports.Prisma.ProvinceNominationScalarFieldEnum = {
  id: 'id',
  provinceCode: 'provinceCode',
  provinceName: 'provinceName',
  schoolName: 'schoolName',
  district: 'district',
  contactName: 'contactName',
  contactEmail: 'contactEmail',
  contactPhone: 'contactPhone',
  campaignSlug: 'campaignSlug',
  message: 'message',
  source: 'source',
  status: 'status',
  createdAt: 'createdAt'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.NullableJsonNullValueInput = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull
};

exports.Prisma.JsonNullValueInput = {
  JsonNull: Prisma.JsonNull
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};

exports.Prisma.JsonNullValueFilter = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull,
  AnyNull: Prisma.AnyNull
};
exports.UserRole = exports.$Enums.UserRole = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN_STAFF: 'ADMIN_STAFF',
  SCHOOL_ADMIN: 'SCHOOL_ADMIN',
  BRAND_ADMIN: 'BRAND_ADMIN',
  JUDGE: 'JUDGE',
  LEARNER: 'LEARNER'
};

exports.EntityStatus = exports.$Enums.EntityStatus = {
  PENDING: 'PENDING',
  VERIFIED: 'VERIFIED',
  APPROVED: 'APPROVED',
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED'
};

exports.SchoolVerificationStatus = exports.$Enums.SchoolVerificationStatus = {
  NOT_SUBMITTED: 'NOT_SUBMITTED',
  SUBMITTED: 'SUBMITTED',
  UNDER_REVIEW: 'UNDER_REVIEW',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED'
};

exports.BrandVerificationStatus = exports.$Enums.BrandVerificationStatus = {
  PENDING: 'PENDING',
  VERIFIED: 'VERIFIED',
  FOUNDER_VERIFIED: 'FOUNDER_VERIFIED',
  SUSPENDED: 'SUSPENDED',
  REJECTED: 'REJECTED'
};

exports.BrandOnboardingStatus = exports.$Enums.BrandOnboardingStatus = {
  PENDING_REVIEW: 'PENDING_REVIEW',
  UNDER_APPROVAL: 'UNDER_APPROVAL',
  AGREEMENT_PENDING: 'AGREEMENT_PENDING',
  COMMERCIALLY_ACTIVE: 'COMMERCIALLY_ACTIVE',
  SUSPENDED: 'SUSPENDED'
};

exports.BrandSubscriptionStatus = exports.$Enums.BrandSubscriptionStatus = {
  ACTIVE: 'ACTIVE',
  PAST_DUE: 'PAST_DUE',
  SUSPENDED: 'SUSPENDED'
};

exports.BrandSubscriptionPlan = exports.$Enums.BrandSubscriptionPlan = {
  SCHOOL: 'SCHOOL',
  DISTRICT: 'DISTRICT',
  PROVINCIAL: 'PROVINCIAL',
  NATIONAL: 'NATIONAL'
};

exports.BillingCycle = exports.$Enums.BillingCycle = {
  MONTHLY: 'MONTHLY',
  QUARTERLY: 'QUARTERLY',
  ANNUAL: 'ANNUAL'
};

exports.CampaignScopeType = exports.$Enums.CampaignScopeType = {
  NATIONAL: 'NATIONAL',
  PROVINCIAL: 'PROVINCIAL',
  DISTRICT: 'DISTRICT',
  SCHOOL_CLUSTER: 'SCHOOL_CLUSTER'
};

exports.CampaignCommercialStatus = exports.$Enums.CampaignCommercialStatus = {
  DRAFT: 'DRAFT',
  AWAITING_AGREEMENT: 'AWAITING_AGREEMENT',
  AWAITING_PAYMENT: 'AWAITING_PAYMENT',
  AWAITING_CODES: 'AWAITING_CODES',
  AWAITING_LAUNCH: 'AWAITING_LAUNCH',
  READY_FOR_APPROVAL: 'READY_FOR_APPROVAL',
  LIVE: 'LIVE',
  PAUSED: 'PAUSED',
  SUSPENDED: 'SUSPENDED',
  EXPIRED: 'EXPIRED'
};

exports.CampaignRenewalStatus = exports.$Enums.CampaignRenewalStatus = {
  NONE: 'NONE',
  PENDING_RENEWAL: 'PENDING_RENEWAL',
  RENEWED: 'RENEWED',
  LAPSED: 'LAPSED'
};

exports.BrandAgreementStatus = exports.$Enums.BrandAgreementStatus = {
  DRAFT: 'DRAFT',
  GENERATED: 'GENERATED',
  AWAITING_SIGNATURE: 'AWAITING_SIGNATURE',
  UPLOADED: 'UPLOADED',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED'
};

exports.CampaignInvoiceType = exports.$Enums.CampaignInvoiceType = {
  SETUP_FEE: 'SETUP_FEE',
  CONTRIBUTION_POOL: 'CONTRIBUTION_POOL',
  SAAS_SUBSCRIPTION: 'SAAS_SUBSCRIPTION'
};

exports.CampaignInvoiceStatus = exports.$Enums.CampaignInvoiceStatus = {
  DRAFT: 'DRAFT',
  ISSUED: 'ISSUED',
  PAYMENT_REPORTED: 'PAYMENT_REPORTED',
  VERIFIED: 'VERIFIED',
  VOID: 'VOID'
};

exports.CodeStatus = exports.$Enums.CodeStatus = {
  UNUSED: 'UNUSED',
  PENDING: 'PENDING',
  USED: 'USED',
  DUPLICATE: 'DUPLICATE',
  INVALID: 'INVALID',
  FLAGGED: 'FLAGGED',
  EXPIRED: 'EXPIRED',
  INVALIDATED: 'INVALIDATED',
  BLOCKED: 'BLOCKED'
};

exports.SubmissionState = exports.$Enums.SubmissionState = {
  VALID: 'VALID',
  REJECTED: 'REJECTED',
  FLAGGED_FOR_REVIEW: 'FLAGGED_FOR_REVIEW'
};

exports.ExportJobStatus = exports.$Enums.ExportJobStatus = {
  QUEUED: 'QUEUED',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED'
};

exports.WhatsAppMessageStatus = exports.$Enums.WhatsAppMessageStatus = {
  QUEUED: 'QUEUED',
  SENDING: 'SENDING',
  SENT: 'SENT',
  FAILED: 'FAILED',
  DEAD_LETTER: 'DEAD_LETTER'
};

exports.EsgReportCadence = exports.$Enums.EsgReportCadence = {
  WEEKLY: 'WEEKLY',
  MONTHLY: 'MONTHLY',
  QUARTERLY: 'QUARTERLY'
};

exports.EsgReportDeliveryStatus = exports.$Enums.EsgReportDeliveryStatus = {
  SENT: 'SENT',
  FAILED: 'FAILED'
};

exports.NotificationChannel = exports.$Enums.NotificationChannel = {
  EMAIL: 'EMAIL'
};

exports.NotificationTemplate = exports.$Enums.NotificationTemplate = {
  SCHOOL_REGISTRATION: 'SCHOOL_REGISTRATION',
  SCHOOL_APPROVED: 'SCHOOL_APPROVED',
  BRAND_WELCOME: 'BRAND_WELCOME',
  PASSWORD_RESET: 'PASSWORD_RESET',
  CONTACT_INQUIRY_INFO: 'CONTACT_INQUIRY_INFO',
  CONTACT_ACK: 'CONTACT_ACK',
  ESG_REPORT: 'ESG_REPORT'
};

exports.NotificationDeliveryStatus = exports.$Enums.NotificationDeliveryStatus = {
  QUEUED: 'QUEUED',
  PROCESSING: 'PROCESSING',
  SENT: 'SENT',
  FAILED: 'FAILED'
};

exports.Prisma.ModelName = {
  User: 'User',
  PasswordResetToken: 'PasswordResetToken',
  School: 'School',
  SchoolVerification: 'SchoolVerification',
  Learner: 'Learner',
  Brand: 'Brand',
  Campaign: 'Campaign',
  BrandAgreement: 'BrandAgreement',
  CampaignInvoice: 'CampaignInvoice',
  Product: 'Product',
  CodeBatch: 'CodeBatch',
  Code: 'Code',
  SubmissionAttempt: 'SubmissionAttempt',
  Submission: 'Submission',
  AuditLog: 'AuditLog',
  RefreshSession: 'RefreshSession',
  FraudFlag: 'FraudFlag',
  AdminQueuePreset: 'AdminQueuePreset',
  AuditExportJob: 'AuditExportJob',
  WhatsAppConversation: 'WhatsAppConversation',
  WhatsAppMessage: 'WhatsAppMessage',
  WebhookDedup: 'WebhookDedup',
  EsgReportSchedule: 'EsgReportSchedule',
  FundingContribution: 'FundingContribution',
  EsgReportDelivery: 'EsgReportDelivery',
  NotificationLog: 'NotificationLog',
  NotificationJob: 'NotificationJob',
  ProvinceNomination: 'ProvinceNomination'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }
        
        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
