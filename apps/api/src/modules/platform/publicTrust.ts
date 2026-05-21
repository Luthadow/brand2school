import { prisma } from "../../lib/prisma.js";

export type PlatformTrustPayload = {
  verifiedSchools: number;
  activeBrandPartners: number;
  validSubmissions: number;
  openFraudFlags: number;
  partnerVerification: {
    requiresActiveStatus: boolean;
    requiresAdminFeaturedOrPublicProfile: boolean;
    requiresLogoForHomepage: boolean;
    requiresWrittenBrandApproval: boolean;
  };
  protections: string[];
};

export async function getPlatformTrust(): Promise<PlatformTrustPayload> {
  const [verifiedSchools, activeBrandPartners, validSubmissions, openFraudFlags] = await Promise.all([
    prisma.school.count({ where: { status: { in: ["ACTIVE", "APPROVED", "VERIFIED"] } } }),
    prisma.brand.count({
      where: {
        status: "ACTIVE",
        OR: [{ publicProfileEnabled: true }, { featuredOnHome: true }]
      }
    }),
    prisma.submission.count({ where: { state: "VALID" } }),
    prisma.fraudFlag.count({ where: { status: "OPEN" } })
  ]);

  return {
    verifiedSchools,
    activeBrandPartners,
    validSubmissions,
    openFraudFlags,
    partnerVerification: {
      requiresActiveStatus: true,
      requiresAdminFeaturedOrPublicProfile: true,
      requiresLogoForHomepage: true,
      requiresWrittenBrandApproval: true
    },
    protections: [
      "School verification before participation",
      "Code validation against purchase records",
      "Duplicate and fraud detection on submissions",
      "Audit logs for admin actions",
      "POPIA-aligned data handling",
      "Partner logos only with ACTIVE status and admin approval"
    ]
  };
}
