import { prisma } from "../../lib/prisma.js";
import {
  listDistrictsForProvince,
  listParticipationProvinces,
  listSchoolsForProvinceDistrict
} from "../participation/listParticipationSchoolOptions.js";
import { processParticipationSubmission } from "../participation/services/processParticipationSubmission.js";
import { getSchoolCampaignProgress } from "../participation/services/campaignProgress.js";
import { findSchoolByCode, findSchoolByWhatsapp } from "../schools/registerSchool.js";
import { clearWhatsAppSession, getWhatsAppSession, saveWhatsAppSession } from "./conversationStore.js";
import { formatNumberedMenu, paginateOptions, resolveMenuPick } from "./formatMenu.js";
import type { WhatsAppSessionData } from "./conversationTypes.js";

export const WELCOME_MENU = [
  "Welcome to Brand2School",
  "",
  "1. Submit product code",
  "2. Check school progress",
  "3. View active campaigns",
  "4. Help my school (status)",
  "",
  "Reply with a number. Type MENU anytime."
].join("\n");

function normalizeInput(text: string): string {
  return text.trim();
}

async function activeCampaignOptions() {
  const campaigns = await prisma.campaign.findMany({
    where: { isActive: true, brand: { status: "ACTIVE" } },
    include: { brand: { select: { name: true } } },
    orderBy: { name: "asc" },
    take: 30
  });
  return campaigns.map((c) => ({
    key: c.slug,
    label: c.name,
    detail: c.brand.name
  }));
}

async function campaignsListMessage(): Promise<string> {
  const campaigns = await prisma.campaign.findMany({
    where: { isActive: true },
    include: { brand: { select: { name: true } } },
    orderBy: { name: "asc" },
    take: 10
  });
  if (campaigns.length === 0) {
    return "No active campaigns right now. Visit brand2school.co.za/submit or check back soon.";
  }
  const lines = campaigns.map((c, i) => {
    const goal = c.infrastructureGoal ? ` — ${c.infrastructureGoal}` : "";
    return `${i + 1}. ${c.name} (${c.slug})${goal}\n   ${c.brand.name}`;
  });
  return [
    "Active campaigns",
    "",
    ...lines,
    "",
    "To submit a code, reply 1 and follow the selection steps."
  ].join("\n");
}

async function schoolStatusMessage(school: {
  id: string;
  name: string;
  schoolCode: string;
  status: string;
  province: string;
  district: string;
}): Promise<string> {
  const campaigns = await prisma.campaign.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" }
  });
  const progressLines = await Promise.all(
    campaigns.map(async (campaign) => {
      const progress = await getSchoolCampaignProgress(school.id, campaign.id, campaign.targetSubmissions);
      const goal = campaign.infrastructureGoal ? ` (${campaign.infrastructureGoal})` : "";
      return `${campaign.name}${goal}: ${progress.percentToTarget}% — ${progress.validSubmissions}/${progress.targetSubmissions}`;
    })
  );
  return [
    `School: ${school.name}`,
    `Code: ${school.schoolCode}`,
    `Status: ${school.status}`,
    `Location: ${school.district}, ${school.province}`,
    "",
    "Campaign progress:",
    progressLines.length ? progressLines.join("\n") : "No active campaigns yet.",
    "",
    "Reply 1 to submit a product code for this school."
  ].join("\n");
}

async function progressForSchoolId(schoolId: string): Promise<string | null> {
  const school = await prisma.school.findUnique({ where: { id: schoolId } });
  if (!school) return null;
  return schoolStatusMessage(school);
}

async function startSubmitFlow(msisdn: string): Promise<string> {
  await saveWhatsAppSession(msisdn, "submit_province", { flow: "submit", listPage: 0 });
  const provinces = listParticipationProvinces();
  const paged = paginateOptions(provinces, 0, (p) => ({ key: p.name, label: p.name }));
  await saveWhatsAppSession(msisdn, "submit_province", {
    flow: "submit",
    listPage: 0,
    options: paged.options
  });
  return formatNumberedMenu({
    title: "Submit code — select province:",
    options: paged.options,
    page: 0,
    totalPages: paged.totalPages,
    hasNext: paged.hasNext,
    hasPrev: false
  });
}

async function startProgressFlow(msisdn: string): Promise<string> {
  const provinces = listParticipationProvinces();
  const paged = paginateOptions(provinces, 0, (p) => ({ key: p.name, label: p.name }));
  await saveWhatsAppSession(msisdn, "progress_province", {
    flow: "progress",
    listPage: 0,
    options: paged.options
  });
  return formatNumberedMenu({
    title: "Check progress — select province:",
    options: paged.options,
    page: 0,
    totalPages: paged.totalPages,
    hasNext: paged.hasNext,
    hasPrev: false
  });
}

async function handleProvinceStep(
  msisdn: string,
  text: string,
  step: "submit_province" | "progress_province",
  data: WhatsAppSessionData
): Promise<string> {
  const pick = resolveMenuPick(text, data.options);
  if (pick?.key === "__next__") {
    const provinces = listParticipationProvinces();
    const paged = paginateOptions(provinces, (data.listPage ?? 0) + 1, (p) => ({
      key: p.name,
      label: p.name
    }));
    await saveWhatsAppSession(msisdn, step, { ...data, listPage: paged.page, options: paged.options });
    return formatNumberedMenu({
      title: "Select province:",
      options: paged.options,
      page: paged.page,
      totalPages: paged.totalPages,
      hasNext: paged.hasNext,
      hasPrev: paged.hasPrev
    });
  }
  if (pick?.key === "__prev__") {
    const provinces = listParticipationProvinces();
    const paged = paginateOptions(provinces, Math.max(0, (data.listPage ?? 0) - 1), (p) => ({
      key: p.name,
      label: p.name
    }));
    await saveWhatsAppSession(msisdn, step, { ...data, listPage: paged.page, options: paged.options });
    return formatNumberedMenu({
      title: "Select province:",
      options: paged.options,
      page: paged.page,
      totalPages: paged.totalPages,
      hasNext: paged.hasNext,
      hasPrev: paged.hasPrev
    });
  }
  if (!pick) {
    return "Reply with the number next to your province (e.g. 3), or MENU to cancel.";
  }

  const districtOptions = await listDistrictsForProvince(pick.key);
  const districts = districtOptions.map((d) => d.name);
  if (districts.length === 0) {
    return [
      `No registered schools in ${pick.key} yet.`,
      "Principals can register at brand2school.co.za/schools/register",
      "",
      "Reply MENU to start over."
    ].join("\n");
  }

  const nextStep = step === "submit_province" ? "submit_district" : "progress_district";
  const paged = paginateOptions(districts, 0, (d) => ({ key: d, label: d }));
  await saveWhatsAppSession(msisdn, nextStep, {
    ...data,
    province: pick.key,
    listPage: 0,
    options: paged.options
  });
  return formatNumberedMenu({
    title: `Select district in ${pick.key}:`,
    options: paged.options,
    page: 0,
    totalPages: paged.totalPages,
    hasNext: paged.hasNext,
    hasPrev: false
  });
}

async function handleDistrictStep(
  msisdn: string,
  text: string,
  step: "submit_district" | "progress_district",
  data: WhatsAppSessionData
): Promise<string> {
  const pick = resolveMenuPick(text, data.options);
  if (pick?.key === "__next__" && data.province) {
    const districtOptions = await listDistrictsForProvince(data.province);
    const districts = districtOptions.map((d) => d.name);
    const paged = paginateOptions(districts, (data.listPage ?? 0) + 1, (d) => ({ key: d, label: d }));
    await saveWhatsAppSession(msisdn, step, { ...data, listPage: paged.page, options: paged.options });
    return formatNumberedMenu({
      title: "Select district:",
      options: paged.options,
      page: paged.page,
      totalPages: paged.totalPages,
      hasNext: paged.hasNext,
      hasPrev: paged.hasPrev
    });
  }
  if (pick?.key === "__prev__" && data.province) {
    const districtOptions = await listDistrictsForProvince(data.province);
    const districts = districtOptions.map((d) => d.name);
    const paged = paginateOptions(districts, Math.max(0, (data.listPage ?? 0) - 1), (d) => ({
      key: d,
      label: d
    }));
    await saveWhatsAppSession(msisdn, step, { ...data, listPage: paged.page, options: paged.options });
    return formatNumberedMenu({
      title: "Select district:",
      options: paged.options,
      page: paged.page,
      totalPages: paged.totalPages,
      hasNext: paged.hasNext,
      hasPrev: paged.hasPrev
    });
  }
  if (!pick || !data.province) {
    return "Reply with the number next to your district, or MENU to cancel.";
  }

  const schools = await listSchoolsForProvinceDistrict(data.province, pick.key);
  if (schools.length === 0) {
    return [
      `No active schools in ${pick.key}, ${data.province}.`,
      "Register at brand2school.co.za/schools/register",
      "",
      "Reply MENU to start over."
    ].join("\n");
  }

  const nextStep = step === "submit_district" ? "submit_school" : "progress_school";
  const paged = paginateOptions(schools, 0, (s) => ({
    key: s.id,
    label: s.name
  }));
  await saveWhatsAppSession(msisdn, nextStep, {
    ...data,
    district: pick.key,
    listPage: 0,
    options: paged.options
  });
  return formatNumberedMenu({
    title: `Select your school (${pick.key}):`,
    options: paged.options,
    page: 0,
    totalPages: paged.totalPages,
    hasNext: paged.hasNext,
    hasPrev: false,
    footer:
      schools.length > 10
        ? "More schools? Use brand2school.co.za/submit · Reply MENU to cancel"
        : undefined
  });
}

async function handleSubmitSchoolStep(msisdn: string, text: string, data: WhatsAppSessionData): Promise<string> {
  const pick = resolveMenuPick(text, data.options);
  if (pick?.key === "__next__" && data.province && data.district) {
    const schools = await listSchoolsForProvinceDistrict(data.province, data.district);
    const paged = paginateOptions(schools, (data.listPage ?? 0) + 1, (s) => ({
      key: s.id,
      label: s.name
    }));
    await saveWhatsAppSession(msisdn, "submit_school", { ...data, listPage: paged.page, options: paged.options });
    return formatNumberedMenu({
      title: "Select school:",
      options: paged.options,
      page: paged.page,
      totalPages: paged.totalPages,
      hasNext: paged.hasNext,
      hasPrev: paged.hasPrev
    });
  }
  if (pick?.key === "__prev__" && data.province && data.district) {
    const schools = await listSchoolsForProvinceDistrict(data.province, data.district);
    const paged = paginateOptions(schools, Math.max(0, (data.listPage ?? 0) - 1), (s) => ({
      key: s.id,
      label: s.name
    }));
    await saveWhatsAppSession(msisdn, "submit_school", { ...data, listPage: paged.page, options: paged.options });
    return formatNumberedMenu({
      title: "Select school:",
      options: paged.options,
      page: paged.page,
      totalPages: paged.totalPages,
      hasNext: paged.hasNext,
      hasPrev: paged.hasPrev
    });
  }
  if (!pick) {
    return "Reply with the number next to your school, or MENU to cancel.";
  }

  const school = await prisma.school.findUnique({ where: { id: pick.key }, select: { name: true } });
  const campaignOpts = await activeCampaignOptions();
  if (campaignOpts.length === 0) {
    await clearWhatsAppSession(msisdn);
    return "No active campaigns to submit to right now. Reply MENU or visit brand2school.co.za/campaigns";
  }

  const paged = paginateOptions(campaignOpts, 0, (c) => c);
  await saveWhatsAppSession(msisdn, "submit_campaign", {
    ...data,
    schoolId: pick.key,
    schoolName: school?.name,
    listPage: 0,
    options: paged.options
  });
  return formatNumberedMenu({
    title: `Select campaign for ${school?.name ?? "your school"}:`,
    options: paged.options,
    page: 0,
    totalPages: paged.totalPages,
    hasNext: paged.hasNext,
    hasPrev: false
  });
}

async function handleSubmitCampaignStep(msisdn: string, text: string, data: WhatsAppSessionData): Promise<string> {
  const pick = resolveMenuPick(text, data.options);
  if (pick?.key === "__next__") {
    const campaignOpts = await activeCampaignOptions();
    const paged = paginateOptions(campaignOpts, (data.listPage ?? 0) + 1, (c) => c);
    await saveWhatsAppSession(msisdn, "submit_campaign", { ...data, listPage: paged.page, options: paged.options });
    return formatNumberedMenu({
      title: "Select campaign:",
      options: paged.options,
      page: paged.page,
      totalPages: paged.totalPages,
      hasNext: paged.hasNext,
      hasPrev: paged.hasPrev
    });
  }
  if (pick?.key === "__prev__") {
    const campaignOpts = await activeCampaignOptions();
    const paged = paginateOptions(campaignOpts, Math.max(0, (data.listPage ?? 0) - 1), (c) => c);
    await saveWhatsAppSession(msisdn, "submit_campaign", { ...data, listPage: paged.page, options: paged.options });
    return formatNumberedMenu({
      title: "Select campaign:",
      options: paged.options,
      page: paged.page,
      totalPages: paged.totalPages,
      hasNext: paged.hasNext,
      hasPrev: paged.hasPrev
    });
  }
  if (!pick || !data.schoolId) {
    return "Reply with the number next to the campaign, or MENU to cancel.";
  }

  await saveWhatsAppSession(msisdn, "submit_code", {
    ...data,
    campaignSlug: pick.key,
    options: undefined
  });
  return [
    "Almost done!",
    "",
    `School: ${data.schoolName ?? "selected"}`,
    `Campaign: ${pick.label}`,
    "",
    "Reply with the product code from inside the pack (letters and numbers only).",
    "",
    "Reply MENU to cancel."
  ].join("\n");
}

async function handleSubmitCodeStep(msisdn: string, text: string, data: WhatsAppSessionData): Promise<{
  status: number;
  message: string;
}> {
  const code = text.trim().toUpperCase();
  if (!code || code.length < 2) {
    return { status: 400, message: "Send the product code from your pack, or MENU to cancel." };
  }
  if (!data.schoolId || !data.campaignSlug) {
    await clearWhatsAppSession(msisdn);
    return { status: 400, message: "Session expired. Reply 1 to submit a code again." };
  }

  const result = await processParticipationSubmission({
    schoolId: data.schoolId,
    campaignSlug: data.campaignSlug,
    productCode: code,
    whatsappMsisdn: msisdn,
    source: "whatsapp"
  });

  await clearWhatsAppSession(msisdn);

  const message =
    typeof result.payload === "object" && result.payload && "message" in result.payload
      ? String((result.payload as { message: string }).message)
      : "Submission processed.";

  return { status: result.status, message };
}

async function handleProgressSchoolStep(msisdn: string, text: string, data: WhatsAppSessionData): Promise<string> {
  const pick = resolveMenuPick(text, data.options);
  if (pick?.key === "__next__" && data.province && data.district) {
    const schools = await listSchoolsForProvinceDistrict(data.province, data.district);
    const paged = paginateOptions(schools, (data.listPage ?? 0) + 1, (s) => ({
      key: s.id,
      label: s.name
    }));
    await saveWhatsAppSession(msisdn, "progress_school", { ...data, listPage: paged.page, options: paged.options });
    return formatNumberedMenu({
      title: "Select school:",
      options: paged.options,
      page: paged.page,
      totalPages: paged.totalPages,
      hasNext: paged.hasNext,
      hasPrev: paged.hasPrev
    });
  }
  if (pick?.key === "__prev__" && data.province && data.district) {
    const schools = await listSchoolsForProvinceDistrict(data.province, data.district);
    const paged = paginateOptions(schools, Math.max(0, (data.listPage ?? 0) - 1), (s) => ({
      key: s.id,
      label: s.name
    }));
    await saveWhatsAppSession(msisdn, "progress_school", { ...data, listPage: paged.page, options: paged.options });
    return formatNumberedMenu({
      title: "Select school:",
      options: paged.options,
      page: paged.page,
      totalPages: paged.totalPages,
      hasNext: paged.hasNext,
      hasPrev: paged.hasPrev
    });
  }
  if (!pick?.key || pick.key === "__next__" || pick.key === "__prev__") {
    return "Reply with the number next to your school, or MENU to cancel.";
  }
  const msg = await progressForSchoolId(pick.key);
  await clearWhatsAppSession(msisdn);
  return msg ?? "School not found. Reply MENU to start over.";
}

export type WhatsAppHandlerResult = {
  status: number;
  message: string;
};

export async function handleWhatsAppConversation(
  msisdn: string,
  rawText: string
): Promise<WhatsAppHandlerResult> {
  const text = normalizeInput(rawText);
  const upper = text.toUpperCase();

  if (upper === "MENU" || upper === "HELP" || upper === "HI" || upper === "HELLO") {
    await clearWhatsAppSession(msisdn);
    return { status: 200, message: WELCOME_MENU };
  }
  if (upper === "CANCEL" || upper === "STOP" || upper === "QUIT") {
    await clearWhatsAppSession(msisdn);
    return { status: 200, message: "Cancelled. Reply MENU when you need Brand2School again." };
  }

  const session = await getWhatsAppSession(msisdn);

  if (!session) {
    if (upper === "1" || upper === "SUBMIT" || upper === "SUBMIT CODE") {
      return { status: 200, message: await startSubmitFlow(msisdn) };
    }
    if (upper === "2" || upper === "PROGRESS" || upper === "CHECK SCHOOL PROGRESS") {
      return { status: 200, message: await startProgressFlow(msisdn) };
    }
    if (upper === "3" || upper === "CAMPAIGNS") {
      return { status: 200, message: await campaignsListMessage() };
    }
    if (upper === "4" || upper === "STATUS" || upper === "HELP MY SCHOOL") {
      const school = await findSchoolByWhatsapp(msisdn);
      if (!school) {
        return {
          status: 404,
          message:
            "No school linked to this WhatsApp number. Principals register at brand2school.co.za/schools/register"
        };
      }
      return { status: 200, message: await schoolStatusMessage(school) };
    }
    const codeMatch = upper.match(/^STATUS\s+(\S+)/);
    if (codeMatch) {
      const school = await findSchoolByCode(codeMatch[1]);
      if (!school) {
        return { status: 404, message: "School code not found." };
      }
      return { status: 200, message: await schoolStatusMessage(school) };
    }
    return { status: 200, message: WELCOME_MENU };
  }

  const { step, data } = session;

  switch (step) {
    case "submit_province":
      return { status: 200, message: await handleProvinceStep(msisdn, text, "submit_province", data) };
    case "submit_district":
      return { status: 200, message: await handleDistrictStep(msisdn, text, "submit_district", data) };
    case "submit_school":
      return { status: 200, message: await handleSubmitSchoolStep(msisdn, text, data) };
    case "submit_campaign":
      return { status: 200, message: await handleSubmitCampaignStep(msisdn, text, data) };
    case "submit_code": {
      const result = await handleSubmitCodeStep(msisdn, text, data);
      return result;
    }
    case "progress_province":
      return { status: 200, message: await handleProvinceStep(msisdn, text, "progress_province", data) };
    case "progress_district":
      return { status: 200, message: await handleDistrictStep(msisdn, text, "progress_district", data) };
    case "progress_school":
      return { status: 200, message: await handleProgressSchoolStep(msisdn, text, data) };
    default:
      await clearWhatsAppSession(msisdn);
      return { status: 200, message: WELCOME_MENU };
  }
}
