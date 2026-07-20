import { cache } from "react";
import { getPrisma } from "@/lib/prisma";
import { isDatabaseConfigured } from "@/lib/db-status";
import {
  toDateKey,
  toDateTimeText as formatDateTimeText,
} from "@/lib/date-time";
import {
  contacts as seedContacts,
  feedbackQuestions as seedFeedbackQuestions,
  files as seedFiles,
  growthLogs as seedGrowthLogs,
  knowledgeNotes as seedKnowledgeNotes,
  moneyRecords as seedMoneyRecords,
  scheduleBlocks as seedScheduleBlocks,
  getProjectFiles as getSeedProjectFiles,
  getProjectTasks as getSeedProjectTasks,
  getProjectTimeline as getSeedProjectTimeline,
  meetingReviews as seedMeetingReviews,
  projects as seedProjects,
  receptions as seedReceptions,
  receptionChecklistItems as seedReceptionChecklist,
  resources as seedResources,
  stages as seedStages,
  tasks as seedTasks,
  timelineEvents as seedTimelineEvents,
} from "@/lib/default-data";

function toDateText(value: Date | null | undefined) {
  return toDateKey(value);
}

function toDateTimeText(value: Date | null | undefined) {
  return formatDateTimeText(value);
}

function summarizeStages(
  stages: { name: string; status: string; sortOrder: number }[],
) {
  const completedStageCount = stages.filter(
    (stage) => stage.status === "COMPLETED",
  ).length;
  const currentStage =
    stages.find((stage) => stage.status === "IN_PROGRESS") ??
    stages.find((stage) => stage.status === "DELAYED") ??
    stages.find((stage) => stage.status === "NOT_STARTED");
  const totalStageCount = stages.length;

  return {
    completedStageCount,
    totalStageCount,
    currentStageName: currentStage?.name ?? "",
    // Keep this field for older call sites, but expose the count-based meaning in UI.
    progress: totalStageCount
      ? Math.round((completedStageCount / totalStageCount) * 100)
      : 0,
  };
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
    select: {
      id: true,
      nameZh: true,
      nameEn: true,
      clientName: true,
      status: true,
      plannedStart: true,
      plannedEnd: true,
      regionTag: { select: { name: true } },
      projectTypeTag: { select: { name: true } },
      contacts: {
        select: { contactId: true, side: true, isPrimary: true },
      },
      stages: {
        select: { name: true, status: true, sortOrder: true },
        orderBy: { sortOrder: "asc" },
      },
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
    return seedProjects.map((project) => ({
      ...project,
      ...summarizeStages(
        seedStages.filter((stage) => stage.projectId === project.id),
      ),
    }));
  }

  const projects = await getDbProjectsRaw();

  return projects.map((project) => {
    const stageSummary = summarizeStages(project.stages);
    return {
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
        project.contacts.find(
          (link) => link.side === "OUR_TEAM" && link.isPrimary,
        )?.contactId ?? "",
      clientContactIds: project.contacts
        .filter((link) => link.side === "CLIENT")
        .map((link) => link.contactId),
      supplierContactIds: project.contacts
        .filter((link) => link.side === "SUPPLIER")
        .map((link) => link.contactId),
      ...stageSummary,
    };
  });
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
    include: { typeTag: true },
    orderBy: [{ dueDate: "asc" }, { updatedAt: "desc" }],
  });

  return tasks.map((task) => ({
    id: task.id,
    projectId: task.projectId ?? "",
    stageId: task.stageId ?? undefined,
    title: task.title,
    description: task.description ?? "",
    type: task.typeTag?.name ?? "商务沟通",
    status: task.status,
    priority: task.priority,
    dueDate: toDateText(task.dueDate),
    assigneeId: task.assigneeId ?? "",
  }));
});

export const getTaskPageData = cache(async () => {
  if (!isDatabaseConfigured()) {
    return {
      projects: seedProjects.map(({ id, nameZh, nameEn }) => ({
        id,
        nameZh,
        nameEn,
      })),
      tasks: seedTasks.map((task) => ({
        ...task,
        description: "",
      })),
      contacts: seedContacts.map(({ id, name, organization }) => ({
        id,
        name,
        organization,
      })),
    };
  }

  const [projects, tasks, contacts] = await Promise.all([
    getPrisma().project.findMany({
      select: { id: true, nameZh: true, nameEn: true },
      orderBy: { updatedAt: "desc" },
    }),
    getPrisma().task.findMany({
      select: {
        id: true,
        projectId: true,
        stageId: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        dueDate: true,
        assigneeId: true,
        typeTag: { select: { name: true } },
      },
      orderBy: [{ dueDate: "asc" }, { updatedAt: "desc" }],
    }),
    getPrisma().contact.findMany({
      select: { id: true, name: true, organization: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return {
    projects: projects.map((project) => ({
      id: project.id,
      nameZh: project.nameZh,
      nameEn: project.nameEn ?? "",
    })),
    tasks: tasks.map((task) => ({
      id: task.id,
      projectId: task.projectId ?? "",
      stageId: task.stageId ?? undefined,
      title: task.title,
      description: task.description ?? "",
      type: task.typeTag?.name ?? "商务沟通",
      status: task.status,
      priority: task.priority,
      dueDate: toDateText(task.dueDate),
      assigneeId: task.assigneeId ?? "",
    })),
    contacts,
  };
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
    url: file.url ?? "",
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
    return seedReceptions.map((reception) => {
      const items = seedReceptionChecklist.filter(
        (item) => item.receptionId === reception.id,
      );
      return {
        ...reception,
        checklistTotal: items.length,
        checklistDone: items.filter((item) => item.done).length,
      };
    });
  }

  const receptions = await getPrisma().reception.findMany({
    include: {
      visitors: true,
      checklistItems: { select: { done: true } },
    },
    orderBy: { startAt: "asc" },
  });

  return receptions.map((reception) => ({
    id: reception.id,
    projectId: reception.projectId ?? undefined,
    type: reception.type,
    title: reception.title,
    location: reception.location ?? "",
    purpose: reception.purpose ?? "",
    startAt: toDateTimeText(reception.startAt),
    endAt: toDateTimeText(reception.endAt),
    status: reception.status,
    visitorIds: reception.visitors.map((visitor) => visitor.contactId),
    checklistTotal: reception.checklistItems.length,
    checklistDone: reception.checklistItems.filter((item) => item.done).length,
  }));
});

/** 单场接待详情 + 分阶段清单（演示模式读种子数据，只读） */
export async function getReceptionDetailForView(id: string) {
  if (!isDatabaseConfigured()) {
    const reception = seedReceptions.find((item) => item.id === id);
    if (!reception) return null;
    const items = seedReceptionChecklist
      .filter((item) => item.receptionId === id)
      .map((item) => ({ ...item }));
    return {
      id: reception.id,
      projectId: reception.projectId || "",
      type: reception.type,
      title: reception.title,
      location: reception.location ?? "",
      purpose: reception.purpose ?? "",
      startAt: reception.startAt ?? "",
      endAt: reception.endAt ?? "",
      status: reception.status,
      visitorIds: [...reception.visitorIds],
      items,
    };
  }

  const reception = await getPrisma().reception.findUnique({
    where: { id },
    include: {
      visitors: true,
      checklistItems: { orderBy: [{ phase: "asc" }, { sortOrder: "asc" }] },
    },
  });
  if (!reception) return null;

  return {
    id: reception.id,
    projectId: reception.projectId ?? "",
    type: reception.type,
    title: reception.title,
    location: reception.location ?? "",
    purpose: reception.purpose ?? "",
    startAt: toDateTimeText(reception.startAt),
    endAt: toDateTimeText(reception.endAt),
    status: reception.status,
    visitorIds: reception.visitors.map((visitor) => visitor.contactId),
    items: reception.checklistItems.map((item) => ({
      id: item.id,
      receptionId: item.receptionId,
      phase: item.phase,
      title: item.title,
      done: item.done,
      ownerId: item.ownerId ?? "",
      dueDate: item.dueDate ?? "",
      note: item.note ?? "",
      isMine: item.isMine,
      sortOrder: item.sortOrder,
    })),
  };
}

export const getKnowledgeNotesForView = cache(async () => {
  if (!isDatabaseConfigured()) {
    return seedKnowledgeNotes.map((note) => ({
      id: note.id,
      topic: note.topic,
      title: note.title,
      content: note.content,
      url: note.url,
      projectId: note.projectId,
      updatedAt: "",
    }));
  }

  const notes = await getPrisma().knowledgeNote.findMany({
    orderBy: [{ topic: "asc" }, { updatedAt: "desc" }],
  });
  return notes.map((note) => ({
    id: note.id,
    topic: note.topic,
    title: note.title,
    content: note.content,
    url: note.url ?? "",
    projectId: note.projectId ?? "",
    updatedAt: toDateText(note.updatedAt),
  }));
});

export const getFeedbackQuestionsForView = cache(async () => {
  if (!isDatabaseConfigured()) {
    return seedFeedbackQuestions.map((q) => ({ ...q, answer: q.answer ?? "", note: q.note ?? "" }));
  }

  const questions = await getPrisma().feedbackQuestion.findMany({
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
  });
  return questions.map((q) => ({
    id: q.id,
    projectId: q.projectId,
    source: q.source,
    question: q.question,
    answer: q.answer ?? "",
    note: q.note ?? "",
    status: q.status as string,
  }));
});

// 周计划时间块：date 为空字符串 = 每天例行
export const getScheduleBlocksForView = cache(async () => {
  if (!isDatabaseConfigured()) {
    return seedScheduleBlocks.map((block) => ({
      ...block,
      location: "",
      participants: "",
      note: "",
      projectId: "",
    }));
  }

  const blocks = await getPrisma().scheduleBlock.findMany({
    orderBy: [{ startMin: "asc" }],
  });
  return blocks.map((block) => ({
    id: block.id,
    title: block.title,
    date: toDateText(block.date),
    startMin: block.startMin,
    endMin: block.endMin,
    kind: block.kind,
    location: block.location ?? "",
    participants: block.participants ?? "",
    note: block.note ?? "",
    projectId: block.projectId ?? "",
  }));
});

export const getMoneyRecordsForView = cache(async () => {
  if (!isDatabaseConfigured()) {
    return seedMoneyRecords.map((record) => ({ ...record, note: record.note ?? "" }));
  }

  const records = await getPrisma().moneyRecord.findMany({
    orderBy: { happenedAt: "desc" },
  });
  return records.map((record) => ({
    id: record.id,
    kind: record.kind as string,
    amount: record.amount,
    currency: record.currency,
    happenedAt: toDateText(record.happenedAt),
    note: record.note ?? "",
  }));
});

// AI 助手的自定义提示词模板（存 TextTemplate 表）
export const getPromptTemplatesForView = cache(async () => {
  if (!isDatabaseConfigured()) return [];
  const templates = await getPrisma().textTemplate.findMany({
    where: { type: "EMAIL", enabled: true },
    orderBy: { createdAt: "desc" },
  });
  return templates.map((tpl) => ({
    id: tpl.id,
    name: tpl.name,
    content: tpl.content,
  }));
});

export const getGrowthLogsForView = cache(async () => {
  if (!isDatabaseConfigured()) {
    return seedGrowthLogs.map((log) => ({
      id: log.id,
      category: log.category,
      title: log.title,
      detail: log.detail,
      projectId: log.projectId ?? "",
      happenedAt: log.happenedAt,
    }));
  }

  const logs = await getPrisma().growthLog.findMany({
    orderBy: { happenedAt: "desc" },
  });

  return logs.map((log) => ({
    id: log.id,
    category: log.category,
    title: log.title,
    detail: log.detail ?? "",
    projectId: log.projectId ?? "",
    happenedAt: toDateText(log.happenedAt),
  }));
});

export const getResourcesForView = cache(async () => {
  if (!isDatabaseConfigured()) {
    return seedResources;
  }

  const resources = await getPrisma().resource.findMany({
    orderBy: [{ important: "desc" }, { updatedAt: "desc" }],
  });

  return resources.map((resource) => ({
    id: resource.id,
    name: resource.name,
    category: resource.category,
    url: resource.url ?? "",
    note: resource.note ?? "",
    important: resource.important,
    updatedAt: toDateText(resource.updatedAt),
  }));
});

// ── 设置页：标签/文件类型/角色/阶段模板（带 id，供增删改）──

export const getTagsForView = cache(async () => {
  if (!isDatabaseConfigured()) return [];
  const tags = await getPrisma().tag.findMany({
    orderBy: [{ type: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
  });
  return tags.map((tag) => ({ id: tag.id, type: tag.type, name: tag.name }));
});

export const getFileTypesForView = cache(async () => {
  if (!isDatabaseConfigured()) return [];
  const types = await getPrisma().fileType.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  return types.map((type) => ({ id: type.id, name: type.name }));
});

export const getContactRolesForView = cache(async () => {
  if (!isDatabaseConfigured()) return [];
  const roles = await getPrisma().contactRole.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  return roles.map((role) => ({ id: role.id, name: role.name }));
});

export const getStageTemplateItemsForView = cache(async () => {
  if (!isDatabaseConfigured()) return [];
  const items = await getPrisma().stageTemplateItem.findMany({
    orderBy: { sortOrder: "asc" },
  });
  return items.map((item) => ({
    id: item.id,
    name: item.name,
    sortOrder: item.sortOrder,
    description: item.description ?? "",
  }));
});

export const getMeetingReviewsForView = cache(async () => {
  if (!isDatabaseConfigured()) {
    return seedMeetingReviews.map((review) => ({
      id: review.id,
      projectId: review.projectId,
      title: review.title,
      status: review.status,
      finalFileId: "",
      rounds: review.rounds.map((round) => ({
        roundNo: round.roundNo,
        senderId: round.senderId,
        receiverId: round.receiverId,
        sentAt: round.sentAt,
        feedback: round.feedback,
        status: round.status,
      })),
    }));
  }

  const reviews = await getPrisma().meetingReview.findMany({
    include: { rounds: { orderBy: { roundNo: "asc" } } },
    orderBy: { createdAt: "desc" },
  });

  return reviews.map((review) => ({
    id: review.id,
    projectId: review.projectId,
    title: review.title,
    status: review.status,
    finalFileId: review.finalFileId ?? "",
    rounds: review.rounds.map((round) => ({
      roundNo: round.roundNo,
      senderId: round.senderContactId ?? "",
      receiverId: round.receiverContactId ?? "",
      sentAt: toDateText(round.sentAt),
      feedback: round.feedback ?? "",
      status: round.status,
    })),
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
