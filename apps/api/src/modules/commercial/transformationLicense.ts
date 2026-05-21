/**
 * Annual transformation licenses — renewable territorial partnerships, not permanent ownership.
 */

import type { CampaignScopeType } from "../../generated/prisma/index.js";
import { packageByScopeType } from "./territorialPackages.js";

export const LICENSE_TERM_MONTHS_DEFAULT = 12;

export const SPONSORSHIP_TRACKS = [
  {
    id: "DIGITAL_TRANSFORMATION",
    label: "Digital Transformation Ecosystem",
    exampleBrand: "Telecom / MTN-style",
    phases: ["WiFi", "Devices", "Smart classrooms", "STEM", "Coding", "AI literacy"],
    maturityLevels: [3, 4, 5]
  },
  {
    id: "WATER_INFRASTRUCTURE",
    label: "Water & Sanitation Infrastructure",
    exampleBrand: "Beverage / Coca-Cola-style",
    phases: ["Water", "Sanitation", "Hygiene"],
    maturityLevels: [1]
  },
  {
    id: "ENERGY_SUSTAINABILITY",
    label: "Energy & Sustainability",
    exampleBrand: "Eskom / energy partners",
    phases: ["Electricity", "Solar", "Smart monitoring"],
    maturityLevels: [1, 5]
  },
  {
    id: "NUTRITION_ECOSYSTEM",
    label: "Nutrition Ecosystem",
    exampleBrand: "Retail / Shoprite-style",
    phases: ["Feeding schemes", "Nutrition programmes"],
    maturityLevels: [2, 4]
  },
  {
    id: "LEARNING_INFRASTRUCTURE",
    label: "Learning Infrastructure",
    exampleBrand: "Banks / financial services",
    phases: ["Libraries", "Classrooms", "Laboratories"],
    maturityLevels: [2, 4]
  },
  {
    id: "FULL_TERRITORY",
    label: "Full Territorial Transformation",
    exampleBrand: "Provincial / national enterprise",
    phases: ["All maturity levels"],
    maturityLevels: [1, 2, 3, 4, 5]
  }
] as const;

export type SponsorshipTrackId = (typeof SPONSORSHIP_TRACKS)[number]["id"];

export function buildPartnershipLabel(input: {
  brandName: string;
  provinceOrTerritory?: string;
  sponsorshipTrackId?: string;
  scopeType: CampaignScopeType;
}): string {
  const track = SPONSORSHIP_TRACKS.find((t) => t.id === input.sponsorshipTrackId);
  const territory =
    input.provinceOrTerritory ??
    (input.scopeType === "NATIONAL"
      ? "National"
      : input.scopeType === "PROVINCIAL"
        ? "Provincial"
        : input.scopeType === "DISTRICT"
          ? "District"
          : "School");
  const trackLabel = track?.label ?? packageByScopeType(input.scopeType).name;
  return `${input.brandName} ${territory} ${trackLabel} Partnership`;
}

export function computeLicenseEndsAt(startsAt: Date, termMonths = LICENSE_TERM_MONTHS_DEFAULT): Date {
  const ends = new Date(startsAt);
  ends.setMonth(ends.getMonth() + termMonths);
  return ends;
}

export function computeGracePeriodEndsAt(endsAt: Date, graceDays = 14): Date {
  return new Date(endsAt.getTime() + graceDays * 24 * 60 * 60 * 1000);
}

export function serializeTransformationLicenseModel() {
  return {
    principle: "Schools never leave the ecosystem — they progress through transformation maturity levels.",
    campaignModel: {
      type: "ANNUAL_TRANSFORMATION_LICENSE",
      termMonthsDefault: LICENSE_TERM_MONTHS_DEFAULT,
      renewable: true,
      notSold: "Permanent provincial ownership"
    },
    sponsorshipTracks: SPONSORSHIP_TRACKS,
    schoolMaturityLevels: [
      { level: 1, title: "Critical Infrastructure", focus: "Toilets, water, fencing, electricity" },
      { level: 2, title: "Learning Infrastructure", focus: "Desks, classrooms, libraries, nutrition" },
      { level: 3, title: "Digital Enablement", focus: "Internet, devices, smart classrooms" },
      { level: 4, title: "Innovation Readiness", focus: "STEM, coding, robotics, AI literacy" },
      { level: 5, title: "Sustainability & Excellence", focus: "Solar, monitoring, environmental systems" }
    ],
    maintenanceCycles: {
      defaultYears: 3,
      description:
        "Verified infrastructure enters maintenance / upgrade pipelines — schools re-enter eligibility for refresh programmes."
    },
    brandAnnualValue: [
      "Territorial presence & public visibility",
      "ESG reporting & transformation tracking",
      "Campaign governance & verification",
      "Infrastructure intelligence dashboards"
    ]
  };
}
