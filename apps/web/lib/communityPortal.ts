export type CommunityPortal = {
  organization: {
    id: string;
    name: string;
    schoolCode: string;
    province: string;
    district: string;
    principalName: string;
    contactEmail: string | null;
    whatsappPhone: string;
    status: string;
    verificationStatus: string;
    organizationCategory: string;
  };
  organizationMeta: {
    id: string;
    label: string;
    portalEyebrow: string;
    documentsTitle: string;
    documentsIntro: string;
    registrationNumber: { key: string; label: string; placeholder: string } | null;
    documents: Array<{ key: string; label: string; required: boolean }>;
    centreTypes: Array<{ id: string; label: string }>;
  };
  verification: {
    status: string;
    canSubmit: boolean;
    canCompleteDocuments: boolean;
    claimReady: boolean;
    documents: Array<{ key: string; label: string; uploaded: boolean; deferred: boolean }>;
  };
  documentVault: {
    entries: Array<{
      key: string;
      label: string;
      status: "uploaded" | "deferred" | "missing";
      uploadedAt: string | null;
      expiresAt: string | null;
      daysUntilExpiry: number | null;
      reminderLevel: "none" | "info" | "warning" | "urgent";
    }>;
    expiringSoon: number;
    expired: number;
  };
  successCentre: {
    belongingScore: { percent: number; label: string };
    participationScore: { percent: number; label: string };
    recognitionScore: { percent: number; label: string };
    recommendations: Array<{
      id: string;
      priority: string;
      message: string;
      actionLabel?: string;
    }>;
    stats: {
      today: number;
      thisWeek: number;
      thisMonth: number;
      totalVerified: number;
      uniqueParticipants: number;
      monthGrowthPercent: number;
    };
  };
  participation: {
    engagementScore: number;
    stats: {
      totalAreas: number;
      learnerSubmissions: number;
      communitySubmissions: number;
      learnerSharePercent: number;
      submissionsPerLearner: number;
      districtAvgSubmissions: number;
      districtRank: number | null;
      uniqueParticipants: number;
      monthGrowthPercent: number;
      thisMonth: number;
      lastMonth: number;
    };
    supporters: Array<{
      name: string;
      type: string;
      submissions: number;
      sharePercent: number;
    }>;
    areaBreakdown: Array<{ area: string; count: number; type: string }>;
    weekdayActivity: Array<{ day: string; count: number }>;
    linkedOrganisations: Array<{
      id: string;
      name: string;
      organizationCategory: string;
      organizationLabel: string;
      schoolCode: string;
      profileUrl: string | null;
      verifiedSubmissions: number;
    }>;
  };
  recognition: {
    level: string;
    levelLabel: string;
    earnedBadges: number;
    totalBadges: number;
    badges: Array<{
      id: string;
      label: string;
      description: string;
      tier: string;
      earned: boolean;
      progressPercent: number;
    }>;
    featured: Array<{
      id: string;
      label: string;
      description: string;
      tier: string;
      earned: boolean;
      progressPercent: number;
    }>;
  };
  linkedSchools: Array<{
    id: string;
    name: string;
    schoolCode: string;
    province: string;
    district: string;
    verifiedSubmissions: number;
    profileUrl: string | null;
    priorityNeedTitle: string | null;
    nationalRank: number | null;
  }>;
  shareKit: {
    organisationCode: string;
    whatsappPhone: string;
    messageTemplates: string[];
  };
  whatsapp: {
    phone: string;
    commands: string[];
  };
};
