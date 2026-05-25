export type WhatsAppFlow = "submit" | "progress";

export type WhatsAppStep =
  | "menu"
  | "submit_province"
  | "submit_district"
  | "submit_school"
  | "submit_campaign"
  | "submit_code"
  | "progress_province"
  | "progress_district"
  | "progress_school";

export type WhatsAppMenuOption = {
  key: string;
  label: string;
  detail?: string;
};

export type WhatsAppSessionData = {
  flow?: WhatsAppFlow;
  province?: string;
  district?: string;
  schoolId?: string;
  schoolName?: string;
  campaignSlug?: string;
  listPage?: number;
  options?: WhatsAppMenuOption[];
};

export const WA_LIST_PAGE_SIZE = 10;
export const WA_SESSION_TTL_MS = 45 * 60 * 1000;
