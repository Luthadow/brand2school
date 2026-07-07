import { listSchoolCrmActivities, serializeCrmActivity } from "./schoolCrmActivities.js";
import { listSchoolCrmContacts, serializeCrmContact } from "./schoolCrmContacts.js";
import { listSchoolCrmTasks, serializeCrmTask } from "./schoolCrmTasks.js";

export type SchoolCrmHub = {
  summary: {
    contacts: number;
    activitiesThisMonth: number;
    openTasks: number;
    overdueTasks: number;
    renewalsDue: number;
    supportOpen: number;
  };
  contacts: ReturnType<typeof serializeCrmContact>[];
  activities: ReturnType<typeof serializeCrmActivity>[];
  tasks: ReturnType<typeof serializeCrmTask>[];
  recommendations: Array<{ id: string; message: string; priority: "high" | "medium" | "low" }>;
};

export async function buildSchoolCrmHub(schoolId: string): Promise<SchoolCrmHub> {
  const [contactRows, activityRows, taskRows] = await Promise.all([
    listSchoolCrmContacts(schoolId),
    listSchoolCrmActivities(schoolId, 30),
    listSchoolCrmTasks(schoolId)
  ]);

  const contacts = contactRows.map(serializeCrmContact);
  const activities = activityRows.map(serializeCrmActivity);
  const tasks = taskRows.map(serializeCrmTask);

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const activitiesThisMonth = activities.filter(
    (a) => new Date(a.occurredAt).getTime() >= startOfMonth.getTime()
  ).length;

  const openTasks = tasks.filter((t) => t.status === "OPEN");
  const overdueTasks = openTasks.filter((t) => t.isOverdue);
  const renewalsDue = openTasks.filter(
    (t) =>
      t.title.toLowerCase().includes("renewal") || t.description?.toLowerCase().includes("renewal")
  ).length;
  const supportOpen = openTasks.filter(
    (t) =>
      t.title.toLowerCase().includes("support") || t.description?.toLowerCase().includes("support")
  ).length;

  const recommendations: SchoolCrmHub["recommendations"] = [];
  if (contacts.length === 0) {
    recommendations.push({
      id: "add-contacts",
      priority: "high",
      message: "Add brand partners, SGB members, and support contacts to your school CRM."
    });
  }
  if (activities.length === 0) {
    recommendations.push({
      id: "log-activity",
      priority: "high",
      message: "Log your first meeting or call — every interaction builds your relationship history."
    });
  }
  if (overdueTasks.length > 0) {
    recommendations.push({
      id: "overdue-tasks",
      priority: "high",
      message: `${overdueTasks.length} overdue task(s) — follow up on renewals, support, and campaign actions.`
    });
  }
  if (openTasks.length === 0 && contacts.length > 0) {
    recommendations.push({
      id: "schedule-followup",
      priority: "medium",
      message: "Schedule follow-up tasks after meetings — document renewals and campaign check-ins."
    });
  }
  if (renewalsDue === 0 && contacts.some((c) => c.contactType === "BRAND" || c.contactType === "DONOR")) {
    recommendations.push({
      id: "track-renewals",
      priority: "low",
      message: "Track document and partnership renewals so nothing expires without a reminder."
    });
  }

  return {
    summary: {
      contacts: contacts.length,
      activitiesThisMonth,
      openTasks: openTasks.length,
      overdueTasks: overdueTasks.length,
      renewalsDue,
      supportOpen
    },
    contacts,
    activities,
    tasks,
    recommendations: recommendations.slice(0, 4)
  };
}
