import { normalizeProvinceCode, provinceNameFromCode } from "../modules/analytics/provinces.js";

/**
 * Official district and metropolitan municipalities (52) grouped by province code.
 * Used for participation / WhatsApp selects before every school is registered in DB.
 */
export const SA_DISTRICTS_BY_PROVINCE: Record<string, readonly string[]> = {
  EC: [
    "Alfred Nzo",
    "Amathole",
    "Buffalo City (Metro)",
    "Chris Hani",
    "Joe Gqabi",
    "Nelson Mandela Bay (Metro)",
    "OR Tambo",
    "Sarah Baartman"
  ],
  FS: [
    "Fezile Dabi",
    "Lejweleputswa",
    "Mangaung (Metro)",
    "Thabo Mofutsanyana",
    "Xhariep"
  ],
  GP: [
    "City of Johannesburg (Metro)",
    "City of Tshwane (Metro)",
    "Ekurhuleni (Metro)",
    "Sedibeng",
    "West Rand"
  ],
  KZN: [
    "Amajuba",
    "eThekwini (Metro)",
    "Harry Gwala",
    "iLembe",
    "King Cetshwayo",
    "Ugu",
    "uMgungundlovu",
    "uMkhanyakude",
    "uMzinyathi",
    "uThukela",
    "Zululand"
  ],
  LP: ["Capricorn", "Mopani", "Sekhukhune", "Vhembe", "Waterberg"],
  MP: ["Ehlanzeni", "Gert Sibande", "Nkangala"],
  NW: [
    "Bojanala Platinum",
    "Dr Kenneth Kaunda",
    "Dr Ruth Segomotsi Mompati",
    "Ngaka Modiri Molema"
  ],
  NC: [
    "Frances Baard",
    "John Taolo Gaetsewe",
    "Namakwa",
    "Pixley ka Seme",
    "ZF Mgcawu"
  ],
  WC: [
    "Cape Winelands",
    "Central Karoo",
    "City of Cape Town (Metro)",
    "Garden Route",
    "Overberg",
    "West Coast"
  ]
};

/** Common free-text district labels schools use that map to official municipality names. */
const DISTRICT_ALIASES: Record<string, string[]> = {
  "Bojanala Platinum": ["Rustenburg", "Boitekong", "Mogwase", "Bojanala"],
  "Dr Kenneth Kaunda": ["Klerksdorp", "Orkney", "Stilfontein", "Ventersdorp"],
  "Dr Ruth Segomotsi Mompati": ["Vryburg", "Mafikeng", "Mahikeng", "Lichtenburg", "Zeerust"],
  "Ngaka Modiri Molema": ["Mahikeng", "Mafikeng", "Mmabatho"],
  "City of Johannesburg (Metro)": ["Johannesburg", "Sandton", "Soweto", "Randburg"],
  "City of Tshwane (Metro)": ["Pretoria", "Tshwane", "Centurion", "Soshanguve"],
  "Ekurhuleni (Metro)": ["Ekurhuleni", "Benoni", "Boksburg", "Germiston", "Kempton Park"],
  "eThekwini (Metro)": ["Durban", "eThekwini", "Pinetown", "Umlazi"],
  "City of Cape Town (Metro)": ["Cape Town", "Khayelitsha", "Mitchells Plain"]
};

/** Labels used for equality matching against School.district (no broad contains). */
export function districtMatchVariants(district: string): string[] {
  const trimmed = district.trim();
  const withoutMetro = trimmed.replace(/\s*\(Metro\)\s*$/i, "").trim();
  const variants = new Set<string>([trimmed, withoutMetro]);
  if (withoutMetro !== trimmed) {
    variants.add(`${withoutMetro} (Metro)`);
  }
  for (const alias of DISTRICT_ALIASES[trimmed] ?? DISTRICT_ALIASES[withoutMetro] ?? []) {
    variants.add(alias);
  }
  return [...variants].filter(Boolean);
}

export function listCanonicalDistrictsForProvince(province: string): string[] {
  const code = normalizeProvinceCode(province);
  const districts = SA_DISTRICTS_BY_PROVINCE[code];
  if (districts?.length) return [...districts];

  const needle = province.trim().toLowerCase();
  const matchKey = Object.keys(SA_DISTRICTS_BY_PROVINCE).find(
    (k) => provinceNameFromCode(k).toLowerCase() === needle
  );
  return matchKey ? [...SA_DISTRICTS_BY_PROVINCE[matchKey]] : [];
}
