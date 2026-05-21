export const SA_PROVINCES = [
  { code: "EC", name: "Eastern Cape" },
  { code: "FS", name: "Free State" },
  { code: "GP", name: "Gauteng" },
  { code: "KZN", name: "KwaZulu-Natal" },
  { code: "LP", name: "Limpopo" },
  { code: "MP", name: "Mpumalanga" },
  { code: "NC", name: "Northern Cape" },
  { code: "NW", name: "North West" },
  { code: "WC", name: "Western Cape" }
] as const;

const ALIASES: Record<string, string> = {
  "eastern cape": "EC",
  ec: "EC",
  "free state": "FS",
  fs: "FS",
  gauteng: "GP",
  gp: "GP",
  "kwazulu-natal": "KZN",
  "kwa zulu natal": "KZN",
  kzn: "KZN",
  limpopo: "LP",
  lp: "LP",
  mpumalanga: "MP",
  mp: "MP",
  "northern cape": "NC",
  nc: "NC",
  "north west": "NW",
  nw: "NW",
  "western cape": "WC",
  wc: "WC"
};

export function normalizeProvinceCode(raw: string): string {
  const key = raw.trim().toLowerCase();
  return ALIASES[key] ?? raw.trim().toUpperCase().slice(0, 3);
}

export function provinceNameFromCode(code: string): string {
  return SA_PROVINCES.find((p) => p.code === code)?.name ?? code;
}
