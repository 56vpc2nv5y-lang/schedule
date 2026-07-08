import { cache } from "react";
import { getPrisma } from "@/lib/prisma";
import { isDatabaseConfigured } from "@/lib/db-status";
import {
  contacts as seedContacts,
  files as seedFiles,
  getProjectFiles as getSeedProjectFiles,
  getProjectTasks as getSeedProjectTasks,
  getProjectTimeline as getSeedProjectTimeline,
  projects as seedProjects,
  receptions as seedReceptions,
  stages as seedStages,
  tasks as seedTasks,
  timelineEvents as seedTimelineEvents,
} from "@/lib/default-data";

type ProjectWithRelations = Awaited<ReturnType<typeof getDbProjectsRaw>>[number];

function toDateText(value: Date | null | undefined) {
  return value ? value.toISOString().slice(0, 10) : "";
}

function toDateTimeText(value: Date | null | undefined) {
  return value ? value.toISOString().slice(0, 16).replace("T", " ") : "";
}

function computeProgress(stages: ProjectWithRelations["stages"]) {
  if (!stages.length) return 0;
  const done = stages.filter((stage) => stage.status === "COMPLETED").length;
  return Math.round((done / stages.length) * 100);
}

async function getDbContactsRaw() {
  return getPrisma().contact.findMany({
    include: {
      regionTag: true,
      roles: { include: { role: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

async function getDbProjectsRaw() {
  return getPrisma().project.findMany({
    include: {
      regionTag: true,
      projectTypeTag: true,
      contacts: { include: { contact: true } },
      stages: { orderBy: { sortOrder: "asc" } },
      tasks: true,
    },
    orderBy: { updatedAt: "desc" },
  });
}

export const getContactsForView = cache(async () => {
  if (!isDatabaseConfigured()) {
    return seedContacts;
  }

  const contacts = await getDbContactsRaw();

  return contacts.map((contact) => ({
    id: contact.id,
    name: contact.name,
    organization: contact.organization,
    title: contact.title ?? "",
    region: contact.regionTag?.name ?? "",
    email: contact.email ?? "",
    wechat: contact.wechat ?? "",
    roles: contact.roles.map((roleMap) => roleMap.role.name),
  }));
});

export const getProjectsForView = cache(async () => {
  if (!isDatabaseConfigured()) {
    return seedProjects;
  }

  const projects = await getDbProjectsRaw();

  return projects.map((project) => ({
    id: project.id,
    nameZh: project.nameZh,
    nameEn: project.nameEn ?? "",
    clientName: project.clientName,
    region: project.regionTag?.name ?? "",
    type: project.projectTypeTag?.name ?? "",
    status: project.status,
    plannedStart: toDateText(project.plannedStart),
    plannedEnd: toDateText(project.plannedEnd),
    ownerId:
      project.contacts.find((link) => link.side === "OUR_TEAM" && link.isPrimary)
        ?.contactId ?? "",
    clientContactIds: project.contacts
      .filter((link) => link.side === "CLIENT")
      .map((link) => link.contactId),
    supplierContactIds: project.contacts
      .filter((link) => link.side === "SUPPLIER")
      .map((link) => link.contactId),
    progress: computeProgress(project.stages),
  }));
});

export const getStagesForView = cache(async () => {
  if (!isDatabaseConfigured()) {
    return seedStages;
  }

  const stages = await getPrisma().projectStage.findMany({
    include: { contacts: true },
    orderBy: [{ projectId: "asc" }, { sortOrder: "asc" }],
  });

  return stages.map((stage) => ({
    id: stage.id,
    projectId: stage.projectId,
    name: stage.name,
    sortOrder: stage.sortOrder,
    plannedStart: toDateText(stage.plannedStart),
    plannedEnd: toDateText(stage.plannedEnd),
    status: stage.status,
    contactIds: stage.contacts.map((contact) => contact.contactId),
  }));
});

export const getTasksForView = cache(async () => {
  if (!isDatabaseConfigured()) {
    return seedTasks;
  }

  const tasks = await getPrisma().task.findMany({
    include: { typeTag: true, contacts: true },
    orderBy: [{ dueDate: "asc" }, { updatedAt: "desc" }],
  });

  return tasks.map((task) => ({
    id: task.id,
    projectId: task.projectId,
    stageId: task.stageId ?? undefined,
    title: task.title,
    type: task.typeTag?.name ?? "商务沟通",
    status: task.status,
    priority: task.priority,
    dueDate: toDateText(task.dueDate),
    assigneeId: task.assigneeId ?? "",
    contactIds: task.contacts.map((contact) => contact.contactId),
  }));
});

export const getFilesForView = cache(async () => {
  if (!isDatabaseConfigured()) {
    return seedFiles;
  }

  const files = await getPrisma().projectFile.findMany({
    include: { fileType: true },
    orderBy: { updatedAt: "desc" },
  });

  return files.map((file) => ({
    id: file.id,
    projectId: file.projectId,
    stageId: file.stageId ?? undefined,
    name: file.name,
    type: file.fileType?.name ?? "文件",
    version: file.version ?? "",
    status: file.status,
    updatedAt: toDateText(file.updatedAt),
  }));
});

export const getTimelineForView = cache(async () => {
  if (!isDatabaseConfigured()) {
    return seedTimelineEvents;
  }

  const events = await getPrisma().timelineEvent.findMany({
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  return events.map((event) => ({
    id: event.id,
    projectId: event.projectId,
    action: event.action,
    message: event.message,
    createdAt: toDateTimeText(event.createdAt),
  }));
});

export const getReceptionsForView = cache(async () => {
  if (!isDatabaseConfigured()) {
    return seedReceptions;
  }

  const receptions = await getPrisma().reception.findMany({
    include: { visitors: true },
    orderBy: { startAt: "asc" },
  });

  return receptions.map((reception) => ({
    id: reception.id,
    projectId: reception.projectId ?? undefined,
    type: reception.type,
    title: reception.title,
    location: reception.location ?? "",
    startAt: toDateTimeText(reception.startAt),
    endAt: toDateTimeText(reception.endAt),
    status: reception.status,
    visitorIds: reception.visitors.map((visitor) => visitor.contactId),
  }));
});

export async function getContactForView(id: string) {
  const contacts = await getContactsForView();
  return contacts.find((contact) => contact.id === id);
}

export async function getProjectForView(id: string) {
  const projects = await getProjectsForView();
  return projects.find((project) => project.id === id);
}

export async function getProjectStagesForView(projectId: string) {
  const stages = await getStagesForView();
  return stages.filter((stage) => stage.projectId === projectId);
}

export async function getProjectTasksForView(projectId: string) {
  const tasks = await getTasksForView();
  return tasks.filter((task) => task.projectId === projectId);
}

export async function getProjectFilesForView(projectId: string) {
  if (!isDatabaseConfigured()) {
    return getSeedProjectFiles(projectId);
  }

  const files = await getFilesForView();
  return files.filter((file) => file.projectId === projectId);
}

export async function getProjectTimelineForView(projectId: string) {
  if (!isDatabaseConfigured()) {
    return getSeedProjectTimeline(projectId);
  }

  const timeline = await getTimelineForView();
  return timeline.filter((event) => event.projectId === projectId);
}

export async function getSeedProjectTasksForFallback(projectId: string) {
  return getSeedProjectTasks(projectId);
}
