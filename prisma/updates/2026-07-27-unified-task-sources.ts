import {
  PrismaClient,
  Priority,
  ProjectStatus,
  ReceptionStatus,
  TagType,
  TaskSource,
  TaskStatus,
} from '@prisma/client';

const prisma = new PrismaClient();

const trainingSectionNames: Record<string, string> = {
  COST: '成本核算',
  PREPARATION: '筹备',
  RESTART: '暂停期间复核',
};

function currentTrainingSection(status: ProjectStatus, phase: string) {
  if (status === ProjectStatus.PAUSED) return 'RESTART';
  if (phase === '核算成本') return 'COST';
  if (phase === '筹备') return 'PREPARATION';
  return null;
}

function checklistTaskStatus(done: boolean, current: boolean, existing?: TaskStatus) {
  if (done) return TaskStatus.DONE;
  if (!current) return TaskStatus.WAITING;
  return existing === TaskStatus.IN_PROGRESS ? TaskStatus.IN_PROGRESS : TaskStatus.TODO;
}

function dateFromText(value?: string | null, fallback?: Date | null) {
  if (!value) return fallback ?? null;
  const date = new Date(value + 'T12:00:00');
  return Number.isNaN(date.getTime()) ? fallback ?? null : date;
}

async function taskType(name: string) {
  return prisma.tag.upsert({
    where: { type_name: { type: TagType.TASK_TYPE, name } },
    create: { type: TagType.TASK_TYPE, name },
    update: {},
  });
}

async function syncTraining() {
  const tag = await taskType('培训');
  const profiles = await prisma.trainingProfile.findMany({
    include: {
      project: { select: { id: true, nameZh: true, status: true } },
      checklistItems: { orderBy: [{ section: 'asc' }, { sortOrder: 'asc' }] },
    },
  });
  let count = 0;

  for (const profile of profiles) {
    const activeSection = currentTrainingSection(profile.project.status, profile.currentPhase);
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
      const current = item.section === activeSection;
      const data = {
        projectId: profile.projectId,
        typeTagId: tag.id,
        title: item.label,
        description: item.note,
        priority: item.section === 'RESTART' ? Priority.HIGH : Priority.MEDIUM,
        status: checklistTaskStatus(item.done, current, existing?.status),
        dueDate: current && !item.done ? existing?.dueDate ?? new Date() : null,
        source: TaskSource.TRAINING_CHECKLIST,
        sourceRefId: item.id,
        sourceLabel:
          profile.project.nameZh + ' / ' + (trainingSectionNames[item.section] ?? '培训清单'),
      };

      if (existing) {
        await prisma.task.update({ where: { id: existing.id }, data });
      } else {
        await prisma.task.create({ data });
      }
      count += 1;
    }
  }

  return count;
}

async function syncReceptions() {
  const tag = await taskType('接待');
  const receptions = await prisma.reception.findMany({
    include: { checklistItems: { orderBy: [{ phase: 'asc' }, { sortOrder: 'asc' }] } },
  });
  let count = 0;

  for (const reception of receptions) {
    const actionable =
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
      const data = {
        projectId: reception.projectId,
        typeTagId: tag.id,
        title: '接待清单：' + item.title,
        description: item.note,
        priority: Priority.MEDIUM,
        status: checklistTaskStatus(item.done, actionable, existing?.status),
        dueDate: dateFromText(item.dueDate, reception.startAt),
        source: TaskSource.RECEPTION_CHECKLIST,
        sourceRefId: item.id,
        sourceLabel: reception.title + ' / ' + item.phase,
      };

      if (existing) {
        await prisma.task.update({ where: { id: existing.id }, data });
      } else {
        await prisma.task.create({ data });
      }
      count += 1;
    }
  }

  return count;
}

async function syncFeedbackFollowUps() {
  const questions = await prisma.feedbackQuestion.findMany({
    where: { followUpTaskId: { not: null } },
    select: { id: true, source: true, followUpTaskId: true },
  });
  for (const question of questions) {
    if (!question.followUpTaskId) continue;
    await prisma.task.updateMany({
      where: { id: question.followUpTaskId },
      data: {
        source: TaskSource.FEEDBACK_FOLLOW_UP,
        sourceRefId: question.id,
        sourceLabel: '纪要追问 / ' + question.source,
      },
    });
  }
  return questions.length;
}

async function normalizeTrainingPausePhase() {
  return prisma.trainingProfile.updateMany({
    where: { currentPhase: { in: ['暂停 / 重启复核', '鏆傚仠 / 閲嶅惎澶嶆牳'] } },
    data: { currentPhase: '筹备', postponed: true },
  });
}

async function main() {
  const pause = await normalizeTrainingPausePhase();
  await prisma.task.updateMany({
    where: { stageId: { not: null }, source: TaskSource.MANUAL },
    data: { source: TaskSource.PROJECT_STAGE, sourceLabel: '项目阶段' },
  });
  const trainingCount = await syncTraining();
  const receptionCount = await syncReceptions();
  const feedbackCount = await syncFeedbackFollowUps();

  console.log(
    `Unified task sources. training=${trainingCount}, reception=${receptionCount}, feedback=${feedbackCount}, normalizedTrainingPause=${pause.count}`,
  );
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });