import JSZip from "jszip";
import { packageById, type TerritorialPackageId } from "../territorialPackages.js";
import {
  buildCommercialPackagesPdf,
  buildCompanyProfilePdf,
  buildEnterpriseFaqPdf,
  buildEsgGovernancePdf,
  buildParticipationAgreementTemplatePdf,
  buildPopiaSummaryPdf,
  procurementPackReadme
} from "./procurementPackPdfs.js";

export type ProcurementPackOptions = {
  highlightedPackageId?: TerritorialPackageId;
};

export async function buildProcurementPackZip(options: ProcurementPackOptions = {}): Promise<Buffer> {
  const highlighted = options.highlightedPackageId
    ? packageById(options.highlightedPackageId)
    : undefined;

  const [company, packages, agreement, esg, popia, faq] = await Promise.all([
    buildCompanyProfilePdf(),
    buildCommercialPackagesPdf(options.highlightedPackageId),
    buildParticipationAgreementTemplatePdf(options.highlightedPackageId),
    buildEsgGovernancePdf(),
    buildPopiaSummaryPdf(),
    buildEnterpriseFaqPdf()
  ]);

  const zip = new JSZip();
  zip.file("README-Partnership-Pack.txt", procurementPackReadme(highlighted));
  zip.file("01-Company-Profile.pdf", company);
  zip.file("02-Commercial-Packages-and-Pricing.pdf", packages);
  zip.file("03-Participation-Agreement-Template.pdf", agreement);
  zip.file("04-ESG-Governance-Framework.pdf", esg);
  zip.file("05-POPIA-Data-Protection-Summary.pdf", popia);
  zip.file("06-Enterprise-FAQ.pdf", faq);

  return zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 6 }
  });
}

export function procurementPackFilename(highlightedPackageId?: TerritorialPackageId): string {
  const date = new Date().toISOString().slice(0, 10);
  const suffix = highlightedPackageId ? `-${highlightedPackageId.toLowerCase()}` : "";
  return `Brand2School-Partnership-Pack${suffix}-${date}.zip`;
}
