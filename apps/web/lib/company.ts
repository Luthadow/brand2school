/** Official enterprise details — keep in sync with apps/api/src/lib/company.ts */

export const COMPANY = {

  legalName: "NKANYEZI TECH SOLUTIONS (Pty) Ltd",

  enterpriseName: "NKANYEZI TECH SOLUTIONS",

  registrationNumber: "2025 / 606307 / 07",

  taxNumber: "9515726231",

  enterpriseType: "Private Company",

  status: "In Business",

  registrationDate: "30 July 2025",

  businessStartDate: "30 July 2025",

  financialYearEnd: "February",

  phone: "068 796 7963",

  phoneTel: "+27687967963",

  address: {

    line1: "5627 EXT 5 Madikwe Street",

    line2: "Boitekong",

    city: "Rustenburg",

    province: "North West",

    postalCode: "0308",

    country: "South Africa"

  },

  productLine: "Brand2School — a product of NKANYEZI TECH SOLUTIONS"

} as const;



export function formatCompanyAddressLines(): readonly string[] {

  const a = COMPANY.address;

  return [a.line1, a.line2, `${a.city}, ${a.province}, ${a.postalCode}`, a.country];

}

