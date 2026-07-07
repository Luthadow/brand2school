import { listSchoolEvents, serializeEvent } from "./schoolEvents.js";
import { listSchoolVolunteers, serializeVolunteer } from "./schoolVolunteers.js";

export type SchoolPeopleHub = {
  summary: {
    activeVolunteers: number;
    totalHoursLogged: number;
    upcomingEvents: number;
    openVolunteerSlots: number;
  };
  volunteers: ReturnType<typeof serializeVolunteer>[];
  events: ReturnType<typeof serializeEvent>[];
  recommendations: Array<{ id: string; message: string; priority: "high" | "medium" | "low" }>;
};

export async function buildSchoolPeopleHub(schoolId: string): Promise<SchoolPeopleHub> {
  const [volunteerRows, eventRows] = await Promise.all([
    listSchoolVolunteers(schoolId),
    listSchoolEvents(schoolId)
  ]);

  const volunteers = volunteerRows.map(serializeVolunteer);
  const events = eventRows.map(serializeEvent);
  const now = Date.now();

  const upcomingEvents = events.filter(
    (e) => e.status === "SCHEDULED" && new Date(e.startsAt).getTime() >= now
  );
  const openVolunteerSlots = upcomingEvents.reduce(
    (sum, e) => sum + Math.max(0, e.volunteerSlots - e.volunteersAssigned),
    0
  );

  const recommendations: SchoolPeopleHub["recommendations"] = [];
  if (volunteers.length === 0) {
    recommendations.push({
      id: "add-volunteers",
      priority: "high",
      message: "Register parent volunteers and SGB members to coordinate campaign drives."
    });
  }
  if (upcomingEvents.length === 0) {
    recommendations.push({
      id: "schedule-event",
      priority: "high",
      message: "Schedule a campaign code drive — events boost verified participation."
    });
  }
  if (openVolunteerSlots > 0) {
    recommendations.push({
      id: "fill-slots",
      priority: "medium",
      message: `${openVolunteerSlots} volunteer slot(s) open across upcoming events.`
    });
  }
  if (volunteers.length > 0 && upcomingEvents.length > 0) {
    const unassigned = upcomingEvents.filter((e) => e.volunteersAssigned === 0);
    if (unassigned.length > 0) {
      recommendations.push({
        id: "assign-volunteers",
        priority: "medium",
        message: `Assign volunteers to ${unassigned.length} upcoming event(s).`
      });
    }
  }

  return {
    summary: {
      activeVolunteers: volunteers.filter((v) => v.status === "ACTIVE").length,
      totalHoursLogged: volunteers.reduce((sum, v) => sum + v.hoursLogged, 0),
      upcomingEvents: upcomingEvents.length,
      openVolunteerSlots
    },
    volunteers,
    events,
    recommendations: recommendations.slice(0, 4)
  };
}
