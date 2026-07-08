export type SchoolPortal = {
  school: {
    id: string;
    name: string;
    emisNumber: string;
    schoolCode: string;
    province: string;
    district: string;
    principalName: string;
    contactEmail: string | null;
    whatsappPhone: string;
    status: string;
    learnerCount: number;
    verificationStatus: string;
    organizationCategory: string;
  };
  organization: {
    id: string;
    label: string;
    portalEyebrow: string;
    documentsTitle: string;
    documentsIntro: string;
    registrationNumber: {
      key: string;
      label: string;
      placeholder: string;
      minLength: number;
      maxLength: number;
      validationMessage: string;
    } | null;
    documents: Array<{ key: string; label: string; required: boolean }>;
    centreTypes: Array<{ id: string; label: string }>;
  };
  verification: {
    status: string;
    emisNumber: string | null;
    registrationNumber: string | null;
    submittedAt: string | null;
    rejectionReason: string | null;
    canSubmit: boolean;
    canCompleteDocuments: boolean;
    claimReady: boolean;
    centreType: string | null;
    centreTypeLabel: string | null;
    registrationDeferred: boolean;
    hasActiveDeferrals: boolean;
    documents: Array<{
      key: string;
      label: string;
      required: boolean;
      url: string | null;
      uploaded: boolean;
      deferred: boolean;
    }>;
  };
  overview: {
    verifiedSubmissions: number;
    estimatedImpactZar: number;
    nationalScore: number;
    fundingBalanceZar: number;
    activeCampaigns: number;
    projectsInProgress: number;
    projectsCompleted: number;
    activeNeeds: number;
    targetReachedPercent: number;
    monthlyRank: number | null;
  };
  targets: Array<{
    id: string;
    name: string;
    brandName: string;
    category: string | null;
    infrastructureGoal: string | null;
    targetSubmissions: number;
    validSubmissions: number;
    percentToTarget: number;
    remainingToTarget: number;
    estimatedCompletionMonths: number;
  }>;
  needs: Array<{
    id: string;
    title: string;
    category: string;
    subcategory: string;
    urgency: string;
    description: string;
    learnerImpact: number;
    estimatedCostZar: number;
    progressPercent: number;
    status: string;
    submittedAt: string;
  }>;
  supporters: Array<{ name: string; type: string; submissions: number }>;
  projects: Array<{ id: string; title: string; stage: string; updatedAt: string }>;
  submissionsTrend: Array<{ label: string; count: number }>;
  notifications: Array<{
    id: string;
    title: string;
    body: string;
    type: string;
    createdAt: string;
    read: boolean;
  }>;
  gamification: {
    level: "bronze" | "silver" | "gold" | "platinum";
    label: string;
    badges: string[];
    nationalRank: number | null;
  };
  badges: {
    earnedCount: number;
    totalCount: number;
    level: "bronze" | "silver" | "gold" | "platinum";
    levelLabel: string;
    featured: Array<{
      id: string;
      label: string;
      description: string;
      tier: "bronze" | "silver" | "gold" | "platinum";
      category: string;
      earned: boolean;
      earnedAt: string | null;
      progressPercent: number;
    }>;
    badges: Array<{
      id: string;
      label: string;
      description: string;
      tier: "bronze" | "silver" | "gold" | "platinum";
      category: string;
      earned: boolean;
      earnedAt: string | null;
      progressPercent: number;
    }>;
  };
  leaderboards: {
    defaultPeriod: "today" | "week" | "month" | "all";
    periods: Array<"today" | "week" | "month" | "all">;
    scopes: Array<"national" | "province" | "district">;
    boards: Record<
      string,
      {
        period: "today" | "week" | "month" | "all";
        scope: "national" | "province" | "district";
        scopeLabel: string;
        updatedAt: string;
        yourRank: number | null;
        yourSubmissions: number;
        schoolsRanked: number;
        entries: Array<{
          rank: number;
          schoolId: string;
          schoolName: string;
          province: string;
          district: string;
          submissions: number;
          isCurrentSchool: boolean;
        }>;
      }
    >;
  };
  whatsapp: { phone: string; commands: string[] };
  development: {
    missionStatement: string;
    currentPhase: number;
    tier: number;
    tierLabel: string;
    tierDescription: string;
    phases: Array<{
      phase: number;
      title: string;
      focus: string;
      items: string[];
      status: "completed" | "active" | "locked";
      completedAt: string | null;
      progressPercent: number;
    }>;
    areaScores: Array<{ area: string; percent: number; status: string }>;
    annualCycle: { year: number; focus: string };
    nextAnnualCycle: { year: number; focus: string } | null;
    activeGoals: string[];
    phaseTransition: { completed: string; opened: string } | null;
    overallProgressPercent: number;
    nationalScore: number;
    phaseCompletionThreshold: number;
    infrastructure: {
      nationalScore: number;
      phaseCompletionThreshold: number;
      phases: Array<{
        phase: number;
        title: string;
        progressPercent: number;
        verifiedProgressPercent: number;
        isComplete: boolean;
        items: Array<{
          category: string;
          needed: number | string;
          current: number | string;
          completionPercent: number;
          verificationStatus: string;
          priority: string;
          estimatedCostZar: number;
        }>;
      }>;
    };
  };
  funding: {
    balanceZar: number;
    lifetimeGrossZar: number;
    contributionPerCodeZar: number;
    fundSplit: Record<string, number>;
    message: string;
    recent: Array<{
      id: string;
      grossZar: number;
      campaignName: string;
      createdAt: string;
    }>;
  };
  brandPartners: Array<{ brand: string; categories: string[] }>;
  annualCycles: Array<{ year: number; focus: string; phase: number }>;
  successCentre: {
    verificationScore: {
      percent: number;
      items: Array<{ key: string; label: string; status: "complete" | "pending" | "missing" }>;
    };
    successScore: {
      percent: number;
      dimensions: Array<{ key: string; label: string; score: number }>;
    };
    recommendations: Array<{
      id: string;
      priority: "high" | "medium" | "low";
      message: string;
      actionLabel?: string;
    }>;
    participation: {
      today: number;
      thisWeek: number;
      thisMonth: number;
      bestCampaign: string | null;
      nationalRank: number | null;
      provinceRank: number | null;
      districtRank: number | null;
    };
    impactTimeline: Array<{
      id: string;
      title: string;
      date: string;
      type: string;
    }>;
  };
  publicProfile: {
    logoUrl: string | null;
    websiteUrl: string | null;
    publicPhone: string | null;
    quintile: number | null;
    teacherCount: number | null;
    gpsLat: number | null;
    gpsLng: number | null;
    mission: string;
    vision: string;
    history: string;
    schoolColours: string[];
    socialMedia: {
      facebook?: string;
      instagram?: string;
      twitter?: string;
      linkedin?: string;
    };
    achievements: string[];
    impactStories: Array<{ title: string; excerpt: string; year?: number }>;
    completionPercent: number;
    completionItems: Array<{ key: string; label: string; complete: boolean }>;
  };
  submittedNeeds: Array<{
    id: string;
    title: string;
    category: string;
    subcategory: string;
    urgency: string;
    description: string;
    learnerImpact: number;
    estimatedCostZar: number;
    progressPercent: number;
    sponsorStatus: string;
    photoCount: number;
    quoteCount: number;
    status: string;
    submittedAt: string;
  }>;
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
  publicPage: {
    visible: boolean;
    url: string | null;
    message: string;
  };
  communityHub: {
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
    shareKit: {
      schoolCode: string;
      whatsappPhone: string;
      messageTemplates: string[];
    };
    recommendations: Array<{ id: string; message: string; priority: string }>;
  };
  peopleHub: {
    summary: {
      activeVolunteers: number;
      totalHoursLogged: number;
      upcomingEvents: number;
      openVolunteerSlots: number;
    };
    volunteers: Array<{
      id: string;
      fullName: string;
      role: string;
      phone: string | null;
      email: string | null;
      skills: string | null;
      hoursLogged: number;
      status: string;
      notes: string | null;
      eventsAssigned: number;
      createdAt: string;
    }>;
    events: Array<{
      id: string;
      title: string;
      description: string | null;
      eventType: string;
      eventTypeLabel: string;
      location: string | null;
      startsAt: string;
      endsAt: string | null;
      volunteerSlots: number;
      volunteersAssigned: number;
      status: string;
      volunteers: Array<{ id: string; fullName: string; role: string }>;
      createdAt: string;
    }>;
    recommendations: Array<{ id: string; message: string; priority: string }>;
  };
  enterpriseHub: {
    summary: {
      activeAlumni: number;
      mentorsAndSponsors: number;
      employers: number;
      activeVentures: number;
      openChallenges: number;
      venturesSeekingSponsor: number;
    };
    alumni: Array<{
      id: string;
      fullName: string;
      graduationYear: number | null;
      profession: string | null;
      company: string | null;
      email: string | null;
      phone: string | null;
      linkedInUrl: string | null;
      role: string;
      roleLabel: string;
      offering: string | null;
      status: string;
      createdAt: string;
    }>;
    projects: Array<{
      id: string;
      title: string;
      description: string | null;
      projectType: string;
      projectTypeLabel: string;
      studentLead: string;
      gradeLevel: string | null;
      category: string | null;
      status: string;
      revenueZar: number;
      seekingSponsor: boolean;
      challengeId: string | null;
      challengeTitle: string | null;
      createdAt: string;
    }>;
    challenges: Array<{
      id: string;
      title: string;
      description: string | null;
      challengeType: string;
      challengeTypeLabel: string;
      startsAt: string;
      endsAt: string | null;
      prizeDescription: string | null;
      status: string;
      maxEntries: number;
      entriesCount: number;
      createdAt: string;
    }>;
    recommendations: Array<{ id: string; message: string; priority: string }>;
  };
  crmHub: {
    summary: {
      contacts: number;
      activitiesThisMonth: number;
      openTasks: number;
      overdueTasks: number;
      renewalsDue: number;
      supportOpen: number;
    };
    contacts: Array<{
      id: string;
      fullName: string;
      organization: string | null;
      email: string | null;
      phone: string | null;
      contactType: string;
      contactTypeLabel: string;
      notes: string | null;
      activityCount: number;
      openTaskCount: number;
      createdAt: string;
    }>;
    activities: Array<{
      id: string;
      activityType: string;
      activityTypeLabel: string;
      title: string;
      summary: string | null;
      occurredAt: string;
      contactId: string | null;
      contactName: string | null;
      contactTypeLabel: string | null;
      createdAt: string;
    }>;
    tasks: Array<{
      id: string;
      title: string;
      description: string | null;
      dueAt: string | null;
      status: string;
      priority: string;
      isOverdue: boolean;
      contactId: string | null;
      contactName: string | null;
      createdAt: string;
    }>;
    recommendations: Array<{ id: string; message: string; priority: string }>;
  };
};

export const CRM_CONTACT_TYPES: Record<string, string> = {
  BRAND: "Brand partner",
  PARENT: "Parent / guardian",
  SGB: "SGB member",
  DONOR: "Donor",
  SUPPORT: "Support contact",
  PARTNER: "Community partner",
  OTHER: "Other"
};

export const CRM_ACTIVITY_TYPES: Record<string, string> = {
  MEETING: "Meeting",
  CALL: "Phone call",
  EMAIL: "Email",
  SUPPORT: "Support request",
  NOTE: "Note",
  DOCUMENT: "Document",
  CAMPAIGN: "Campaign",
  RENEWAL: "Renewal"
};

export const CHALLENGE_TYPES: Record<string, string> = {
  pitch: "Pitch competition",
  innovation: "Innovation challenge",
  business_competition: "Business competition",
  startup_club: "Startup club showcase",
  expo: "Entrepreneurship expo"
};

export const PROJECT_TYPES: Record<string, string> = {
  PRODUCT: "Student product",
  PITCH: "Business pitch",
  STARTUP_CLUB: "Startup club",
  MINI_COMPANY: "Mini company",
  CHALLENGE_ENTRY: "Challenge entry"
};

export const ALUMNI_ROLES: Record<string, string> = {
  ALUMNI: "Past learner",
  BUSINESS_OWNER: "Business owner",
  PROFESSIONAL: "Professional",
  SPONSOR: "Sponsor",
  MENTOR: "Mentor",
  DONOR: "Donor",
  EMPLOYER: "Employer"
};

export const EVENT_TYPES: Record<string, string> = {
  campaign_drive: "Campaign code drive",
  sports: "Sports day",
  fundraiser: "Fundraiser",
  community_meet: "Community meeting",
  volunteer_day: "Volunteer day",
  other: "Other event"
};

export const NEED_CATEGORIES: Record<string, string[]> = {
  Infrastructure: ["Classrooms", "Roofing", "Fencing", "Lighting", "Water Tanks", "Toilets"],
  Education: ["Science Labs", "Libraries", "Textbooks", "Whiteboards"],
  Nutrition: ["Feeding Schemes", "Kitchens", "Food Gardens"],
  Technology: ["Computer Labs", "WiFi", "Coding Labs"],
  Sports: ["Sports Fields", "Equipment", "Changing Rooms"],
  Safety: ["Security", "Sanitation", "First Aid"]
};

export const PROJECT_STAGES = [
  { key: "target_achieved", label: "Target achieved" },
  { key: "verification", label: "Verification" },
  { key: "funding", label: "Funding" },
  { key: "contractor", label: "Contractor appointed" },
  { key: "construction", label: "Construction" },
  { key: "inspection", label: "Inspection" },
  { key: "completed", label: "Completed" }
] as const;

export function formatZar(amount: number): string {
  if (amount >= 1_000_000) return `R${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `R${Math.round(amount / 1_000)}k`;
  return `R${amount.toLocaleString("en-ZA")}`;
}
