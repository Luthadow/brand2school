import { listSchoolAlumni, serializeAlumni } from "./schoolAlumni.js";
import {
  listSchoolEnterpriseProjects,
  listSchoolInnovationChallenges,
  serializeChallenge,
  serializeProject
} from "./schoolEnterprise.js";

export type SchoolEnterpriseHub = {
  summary: {
    activeAlumni: number;
    mentorsAndSponsors: number;
    employers: number;
    activeVentures: number;
    openChallenges: number;
    venturesSeekingSponsor: number;
  };
  alumni: ReturnType<typeof serializeAlumni>[];
  projects: ReturnType<typeof serializeProject>[];
  challenges: ReturnType<typeof serializeChallenge>[];
  recommendations: Array<{ id: string; message: string; priority: "high" | "medium" | "low" }>;
};

export async function buildSchoolEnterpriseHub(schoolId: string): Promise<SchoolEnterpriseHub> {
  const [alumniRows, projectRows, challengeRows] = await Promise.all([
    listSchoolAlumni(schoolId),
    listSchoolEnterpriseProjects(schoolId),
    listSchoolInnovationChallenges(schoolId)
  ]);

  const alumni = alumniRows.map(serializeAlumni);
  const projects = projectRows.map(serializeProject);
  const challenges = challengeRows.map(serializeChallenge);
  const now = Date.now();

  const openChallenges = challenges.filter(
    (c) => c.status === "OPEN" && new Date(c.startsAt).getTime() <= now
  );
  const mentorsAndSponsors = alumni.filter((a) =>
    ["MENTOR", "SPONSOR", "DONOR"].includes(a.role)
  ).length;
  const employers = alumni.filter((a) => a.role === "EMPLOYER" || a.role === "BUSINESS_OWNER").length;
  const activeVentures = projects.filter((p) =>
    ["ACTIVE", "COMPETING", "AWARDED"].includes(p.status)
  ).length;
  const venturesSeekingSponsor = projects.filter((p) => p.seekingSponsor && p.status !== "ARCHIVED").length;

  const recommendations: SchoolEnterpriseHub["recommendations"] = [];
  if (alumni.length < 5) {
    recommendations.push({
      id: "grow-alumni",
      priority: "high",
      message: "Build your alumni network — past learners, mentors, and sponsors unlock long-term school support."
    });
  }
  if (projects.length === 0) {
    recommendations.push({
      id: "launch-venture",
      priority: "high",
      message: "Register a student venture or mini company — entrepreneurship drives Green Youth Network-style impact."
    });
  }
  if (openChallenges.length === 0) {
    recommendations.push({
      id: "open-challenge",
      priority: "medium",
      message: "Launch an innovation challenge or pitch competition to energise learner enterprise."
    });
  }
  if (venturesSeekingSponsor > 0) {
    recommendations.push({
      id: "match-sponsors",
      priority: "medium",
      message: `${venturesSeekingSponsor} venture(s) seeking brand sponsorship — share your public profile with partners.`
    });
  }
  if (employers === 0 && alumni.length >= 3) {
    recommendations.push({
      id: "invite-employers",
      priority: "low",
      message: "Invite alumni employers to list mentorship or job opportunities for current learners."
    });
  }

  return {
    summary: {
      activeAlumni: alumni.filter((a) => a.status === "ACTIVE").length,
      mentorsAndSponsors,
      employers,
      activeVentures,
      openChallenges: openChallenges.length,
      venturesSeekingSponsor
    },
    alumni,
    projects,
    challenges,
    recommendations: recommendations.slice(0, 4)
  };
}
