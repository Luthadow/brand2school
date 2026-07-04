export function generateLearnerCode(fullName: string, grade: string): string {
  const clean = fullName.replace(/[^a-zA-Z ]/g, "").trim();
  const parts = clean.split(/\s+/);
  const first = (parts[0] || "LRN").slice(0, 3).toUpperCase();
  const second = (parts[1] || grade || "G").slice(0, 3).toUpperCase();
  const suffix = Math.floor(100 + Math.random() * 900);
  return `${first}-${second}-${suffix}`;
}

export function generateSchoolCode(
  name: string,
  province: string,
  organizationCategory: string = "SCHOOL"
): string {
  const categoryPrefix: Record<string, string> = {
    SCHOOL: "SCH",
    NGO_NPO: "NGO",
    COMMUNITY: "COM",
    FAITH: "FTH"
  };
  const typePrefix = categoryPrefix[organizationCategory] ?? "ORG";
  const parts = name.replace(/[^a-zA-Z ]/g, "").trim().split(/\s+/);
  const prefix = (parts[0] || typePrefix).slice(0, 3).toUpperCase();
  const region = province.replace(/[^a-zA-Z]/g, "").slice(0, 2).toUpperCase() || "ZA";
  const suffix = Math.floor(100 + Math.random() * 900);
  return `${typePrefix}-${region}-${prefix}-${suffix}`;
}
