export type OrganizationCategoryId = "SCHOOL" | "NGO_NPO" | "COMMUNITY" | "FAITH";

export type VerificationDocumentDef = {
  key: string;
  label: string;
  storageKey: string;
  required: boolean;
};

export type CentreTypeDef = {
  id: string;
  label: string;
};

export type RegistrationNumberDef = {
  key: string;
  label: string;
  placeholder: string;
  minLength: number;
  maxLength: number;
  pattern: RegExp;
  validationMessage: string;
};

export type OrganizationCategoryDef = {
  id: OrganizationCategoryId;
  label: string;
  shortLabel: string;
  description: string;
  registerTitle: string;
  registerIntro: string;
  loginTitle: string;
  loginIntro: string;
  portalEyebrow: string;
  contactLabel: string;
  nameLabel: string;
  documentsTitle: string;
  documentsIntro: string;
  registrationNumber: RegistrationNumberDef | null;
  centreTypes: CentreTypeDef[];
  documents: VerificationDocumentDef[];
};

export const ORGANIZATION_CATEGORIES: Record<OrganizationCategoryId, OrganizationCategoryDef> = {
  SCHOOL: {
    id: "SCHOOL",
    label: "School",
    shortLabel: "School",
    description: "Primary, secondary, and combined schools registered with the DBE.",
    registerTitle: "Register Your School",
    registerIntro:
      "Join the national participation network. Link WhatsApp, track verified community submissions, and unlock infrastructure milestones.",
    loginTitle: "School Login",
    loginIntro: "Access campaign progress, rankings, and verified participation from your community.",
    portalEyebrow: "School Portal",
    contactLabel: "Principal / contact name",
    nameLabel: "School name",
    documentsTitle: "School verification (EMIS)",
    documentsIntro:
      "Select your centre type, upload what you have today, and tick any items you will submit later. Documents are only mandatory when claiming infrastructure milestones — you can participate while items are outstanding.",
    registrationNumber: {
      key: "emisNumber",
      label: "Official EMIS number",
      placeholder: "e.g. 123456789",
      minLength: 6,
      maxLength: 20,
      pattern: /^\d{6,20}$/,
      validationMessage: "EMIS number must be 6–20 digits."
    },
    centreTypes: [
      { id: "PRIMARY", label: "Primary school" },
      { id: "SECONDARY", label: "Secondary school" },
      { id: "COMBINED", label: "Combined school" },
      { id: "ECD", label: "ECD centre" },
      { id: "DAY_CARE", label: "Day care centre" },
      { id: "ORPHANAGE", label: "Orphanage / child & youth care centre" },
      { id: "SPECIAL", label: "Special school" },
      { id: "DISABILITY", label: "Disability school" },
      { id: "OTHER", label: "Other education centre" }
    ],
    documents: [
      {
        key: "principalId",
        label: "Principal ID (PDF or image)",
        storageKey: "principal-id",
        required: true
      },
      {
        key: "schoolLetter",
        label: "Official school letter on school letterhead (PDF or image)",
        storageKey: "school-letter",
        required: true
      },
      {
        key: "emisEvidence",
        label: "EMIS registry evidence (screenshot or official letter)",
        storageKey: "emis-evidence",
        required: true
      }
    ]
  },
  NGO_NPO: {
    id: "NGO_NPO",
    label: "NGO / NPO",
    shortLabel: "NGO",
    description: "Registered non-profit or public benefit organisations supporting schools and learners.",
    registerTitle: "Register Your Organisation",
    registerIntro:
      "Join Brand2School as a verified NGO or NPO partner. Coordinate community participation and track impact toward education outcomes.",
    loginTitle: "Organisation Login",
    loginIntro: "Access your organisation dashboard, verification status, and participation tracking.",
    portalEyebrow: "Organisation Portal",
    contactLabel: "Authorised representative name",
    nameLabel: "Organisation name",
    documentsTitle: "Organisation verification",
    documentsIntro:
      "Select your centre type and upload available documents. Tick any item you will submit before claiming infrastructure milestones.",
    registrationNumber: {
      key: "registrationNumber",
      label: "NPO / NPC registration number",
      placeholder: "e.g. 123-456 NPO",
      minLength: 4,
      maxLength: 40,
      pattern: /^[A-Za-z0-9\-/\s]{4,40}$/,
      validationMessage: "Enter a valid NPO or NPC registration number."
    },
    centreTypes: [
      { id: "EDUCATION_NGO", label: "Education NGO" },
      { id: "FEEDING_SCHEME", label: "Feeding / nutrition programme" },
      { id: "YOUTH_CENTRE", label: "Youth development centre" },
      { id: "SKILLS_CENTRE", label: "Skills or training centre" },
      { id: "OTHER", label: "Other NPO centre" }
    ],
    documents: [
      {
        key: "registrationCertificate",
        label: "NPO / NPC registration certificate (PDF or image)",
        storageKey: "registration-certificate",
        required: true
      },
      {
        key: "constitution",
        label: "Constitution or founding document (PDF)",
        storageKey: "constitution",
        required: true
      },
      {
        key: "representativeId",
        label: "Authorised representative ID (PDF or image)",
        storageKey: "representative-id",
        required: true
      },
      {
        key: "governanceLetter",
        label: "Board resolution or official letter authorising Brand2School participation",
        storageKey: "governance-letter",
        required: true
      }
    ]
  },
  COMMUNITY: {
    id: "COMMUNITY",
    label: "Community organisation",
    shortLabel: "Community",
    description: "Community groups, SGBs, youth forums, and civic structures supporting local schools.",
    registerTitle: "Register Your Community Organisation",
    registerIntro:
      "Register your community structure to coordinate verified participation and track local education impact.",
    loginTitle: "Organisation Login",
    loginIntro: "Sign in to manage your community organisation profile and verification documents.",
    portalEyebrow: "Organisation Portal",
    contactLabel: "Chairperson / contact name",
    nameLabel: "Organisation name",
    documentsTitle: "Community organisation verification",
    documentsIntro:
      "Select your centre type and upload what you have. Defer remaining documents until before you claim milestones.",
    registrationNumber: {
      key: "registrationNumber",
      label: "Reference or registration number (if applicable)",
      placeholder: "Optional reference number",
      minLength: 0,
      maxLength: 40,
      pattern: /^[A-Za-z0-9\-/\s]{0,40}$/,
      validationMessage: "Reference number is too long."
    },
    centreTypes: [
      { id: "SGB", label: "School governing body (SGB)" },
      { id: "YOUTH_FORUM", label: "Youth forum / committee" },
      { id: "COMMUNITY_TRUST", label: "Community trust" },
      { id: "CIVIC", label: "Civic / ward structure" },
      { id: "OTHER", label: "Other community centre" }
    ],
    documents: [
      {
        key: "communityResolution",
        label: "Community or SGB resolution supporting participation (PDF or image)",
        storageKey: "community-resolution",
        required: true
      },
      {
        key: "chairpersonId",
        label: "Chairperson or lead contact ID (PDF or image)",
        storageKey: "chairperson-id",
        required: true
      },
      {
        key: "supportLetter",
        label: "Letter of support from the school or ward councillor (PDF or image)",
        storageKey: "support-letter",
        required: true
      }
    ]
  },
  FAITH: {
    id: "FAITH",
    label: "Faith-based organisation",
    shortLabel: "Faith",
    description: "Faith-based organisations running education support programmes in communities.",
    registerTitle: "Register Your Faith-Based Organisation",
    registerIntro:
      "Register your faith-based organisation to participate in verified Brand2School campaigns and track community impact.",
    loginTitle: "Organisation Login",
    loginIntro: "Sign in to your organisation dashboard and manage verification documents.",
    portalEyebrow: "Organisation Portal",
    contactLabel: "Leader / contact name",
    nameLabel: "Organisation name",
    documentsTitle: "Faith organisation verification",
    documentsIntro:
      "Select your centre type and upload available documents. Items can be deferred until before infrastructure claims.",
    registrationNumber: {
      key: "registrationNumber",
      label: "Organisation reference number (if registered)",
      placeholder: "Optional reference",
      minLength: 0,
      maxLength: 40,
      pattern: /^[A-Za-z0-9\-/\s]{0,40}$/,
      validationMessage: "Reference number is too long."
    },
    centreTypes: [
      { id: "CHURCH_PROGRAMME", label: "Church education programme" },
      { id: "MADRASA", label: "Madrasa / Islamic centre" },
      { id: "FAITH_NPO", label: "Registered faith-based NPO" },
      { id: "OUTREACH", label: "Community outreach centre" },
      { id: "OTHER", label: "Other faith centre" }
    ],
    documents: [
      {
        key: "governingLetter",
        label: "Letter from governing body or denomination (PDF or image)",
        storageKey: "governing-letter",
        required: true
      },
      {
        key: "leaderId",
        label: "Leader or authorised representative ID (PDF or image)",
        storageKey: "leader-id",
        required: true
      },
      {
        key: "programmeOverview",
        label: "Programme overview linked to school support (PDF or image)",
        storageKey: "programme-overview",
        required: true
      }
    ]
  }
};

export const ORGANIZATION_CATEGORY_LIST = Object.values(ORGANIZATION_CATEGORIES);

export function isOrganizationCategoryId(value: string): value is OrganizationCategoryId {
  return value in ORGANIZATION_CATEGORIES;
}

export function getOrganizationCategory(id: string | null | undefined): OrganizationCategoryDef {
  if (id && isOrganizationCategoryId(id)) return ORGANIZATION_CATEGORIES[id];
  return ORGANIZATION_CATEGORIES.SCHOOL;
}

export function organizationCategoryFromParam(value: string | null | undefined): OrganizationCategoryId {
  const normalized = (value ?? "").trim().toLowerCase().replace(/-/g, "_");
  if (normalized && isOrganizationCategoryId(normalized.toUpperCase())) {
    return normalized.toUpperCase() as OrganizationCategoryId;
  }
  if (value === "school") return "SCHOOL";
  if (value === "ngo" || value === "npo") return "NGO_NPO";
  if (value === "community") return "COMMUNITY";
  if (value === "faith") return "FAITH";
  return "SCHOOL";
}

export function isCentreTypeValid(organizationCategory: string, centreType: string): boolean {
  const category = getOrganizationCategory(organizationCategory);
  return category.centreTypes.some((centre) => centre.id === centreType);
}

export function getCentreTypeLabel(organizationCategory: string, centreType: string | null | undefined): string | null {
  if (!centreType) return null;
  const category = getOrganizationCategory(organizationCategory);
  return category.centreTypes.find((centre) => centre.id === centreType)?.label ?? null;
}

export function parseCategorySearchParam(value: string | null | undefined): OrganizationCategoryId {
  return organizationCategoryFromParam(value?.replace(/-/g, "_"));
}

export function categoryToSearchParam(id: OrganizationCategoryId): string {
  return id.toLowerCase().replace(/_/g, "-");
}
