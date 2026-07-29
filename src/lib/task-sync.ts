import {
  Priority,
  ProjectStatus,
  ReceptionStatus,
  TagType,
  TaskSource,
  TaskStatus,
} from "@prisma/client";
import { getPrisma } from "@/lib/prisma";

const trainingSectionNames: Record<string, string> = {
  COST: "成本核算",
  PREPARATION: "筹备",
  RESTART: "暂停期间复核",
};

export function taskSourceName(source: TaskSource | string) {
  const names: Record<string, string> = {
    MANUAL: "手动新建",
    PROJECT_STAGE: "项目阶段",
    TRAINING_CHECKLIST: "培训清单",
    RECEPTION_CHECKLIST: "接待清单",
    FEEDBACK_FOLLOW_UP: "来自纪要",
  };
  return names[source] ?? "其他来源";
}

function currentTrainingSection(status: ProjectStatus, phase: string) {
  if (status === ProjectStatus.PAUSED) return "RESTART";
  if (phase === "核算成本") return "COST";
  if (phase === "筹备") return "PREPARATION";
  return null;
}

function toTaskDueDate(value?: string | null, fallback?: Date | null) {
  if (!value) return fallback ?? null;
  const date = new Date(value + "T12:00:00");
  return Number.isNaN(date.getTime()) ? fallback ?? null : date;
}

async function taskType(name: string) {
  return getPrisma().tag.upsert({
    where: { type_name: { type: TagType.TASK_TYPE, name } },
    create: { type: TagType.TASK_TYPE, name },
    update: {},
  });
}

function checklistTaskStatus(
  done: boolean,
  isCurrent: boolean,
  existing: TaskStatus | undefined,
) {
  if (done) return TaskStatus.DONE;
  if (!isCurrent) return TaskStatus.WAITING;
  return existing === TaskStatus.IN_PROGRESS ? TaskStatus.IN_PROGRESS : TaskStatus.TODO;
}

/**
 * Creates or refreshes task-index records for the checklist section that is
 * actionable now. Items outside that section remain visible in their project
 * context but are parked as WAITING in the shared task list.
 */
export async function syncTrainingChecklistTasks(projectId: string) {
  const prisma = getPrisma();
  const profile = await prisma.trainingProfile.findUnique({
    where: { projectId },
    include: {
      project: { select: { id: true, nameZh: true, status: true } },
      checklistItems: { orderBy: [{ section: "asc" }, { sortOrder: "asc" }] },
    },
  });
  if (!profile) return;

  const activeSection = currentTrainingSection(
    profile.project.status,
    profile.currentPhase,
  );
  const tag = await taskType("培训");

  for (const item of profile.checklistItems) {
    const existing = await prisma.task.findUnique({
      where: {
        source_sourceRefId: {
          source: TaskSource.TRAINING_CHECKLIST,
          sourceRefId: item.id,
        },
      },
      select: { id: true, status: true, dueDate: true },
    });
    const isCurrent = item.section === activeSection;
    const status = checklistTaskStatus(item.done, isCurrent, existing?.status);
    const sourceLabel =
      profile.project.nameZh + " / " + (trainingSectionNames[item.section] ?? "培训清单");
    const data = {
      projectId,
      typeTagId: tag.id,
      title: item.label,
      description: item.note ?? null,
      priority: item.section === "RESTART" ? Priority.HIGH : Priority.MEDIUM,
      status,
      dueDate: isCurrent && !item.done ? existing?.dueDate ?? new Date() : null,
      source: TaskSource.TRAINING_CHECKLIST,
      sourceRefId: item.id,
      sourceLabel,
    };

    if (existing) {
      await prisma.task.update({
        where: { id: existing.id },
        data,
      });
    } else {
      await prisma.task.create({ data });
    }
  }
}

/** Rebuilds the shared task entries for a reception checklist. */
export async function syncReceptionChecklistTasks(receptionId: string) {
  const prisma = getPrisma();
  const reception = await prisma.reception.findUnique({
    where: { id: receptionId },
    include: {
      checklistItems: { orderBy: [{ phase: "asc" }, { sortOrder: "asc" }] },
      project: { select: { id: true, nameZh: true } },
    },
  });
  if (!reception) return;

  const tag = await taskType("接待");
  const isActionable =
    reception.status !== ReceptionStatus.CANCELLED && reception.status !== ReceptionStatus.DONE;

  for (const item of reception.checklistItems) {
    const existing = await prisma.task.findUnique({
      where: {
        source_sourceRefId: {
          source: TaskSource.RECEPTION_CHECKLIST,
          sourceRefId: item.id,
        },
      },
      select: { id: true, status: true },
    });
    const sourceLabel = reception.title + " / " + item.phase;
    const status = checklistTaskStatus(item.done, isActionable, existing?.status);
    const data = {
      projectId: reception.projectId,
      typeTagId: tag.id,
      title: "接待清单：" + item.title,
      description: item.note ?? null,
      priority: Priority.MEDIUM,
      status,
      dueDate: toTaskDueDate(item.dueDate, reception.startAt),
      source: TaskSource.RECEPTION_CHECKLIST,
      sourceRefId: item.id,
      sourceLabel,
    };

    if (existing) {
      await prisma.task.update({ where: { id: existing.id }, data });
    } else {
      await prisma.task.create({ data });
    }
  }
}

export async function deleteChecklistTask(source: TaskSource, sourceRefId: string) {
  await getPrisma().task.deleteMany({ where: { source, sourceRefId } });
}