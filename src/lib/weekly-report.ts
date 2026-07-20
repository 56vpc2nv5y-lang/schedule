import { getPrisma } from "@/lib/prisma";
import {
  addDaysToDateKey,
  parseDateKey,
  toDateKey,
  toDateTimeText,
} from "@/lib/date-time";

const STATUS_LABELS: Record<string, string> = {
  TODO: "待处理",
  IN_PROGRESS: "进行中",
  WAITING: "等待反馈",
  DONE: "已完成",
  OVERDUE: "已逾期",
  PLANNED: "计划中",
  CONFIRMED: "已确认",
  CANCELLED: "已取消",
  ACTIVE: "进行中",
  PAUSED: "暂停",
  COMPLETED: "已完成",
  DRAFT: "草稿",
  IN_REVIEW: "审阅中",
  APPROVED: "已批准",
  ARCHIVED: "已归档",
  FINALIZED: "已定稿",
  FEEDBACK_RECEIVED: "已收到反馈",
  OPEN: "待整理",
  SENT: "已发出，等待回复",
  ANSWERED: "已回复，待判断",
  UNCLEAR: "需追问",
  NEED_MEETING: "需开会确认",
  PENDING: "待发送",
};

function statusLabel(value: string) {
  return STATUS_LABELS[value] ?? value;
}

function minuteText(value: number) {
  const hour = Math.floor(value / 60);
  const minute = value % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function projectLabel(project: { nameZh: string } | null | undefined) {
  return project?.nameZh ? `【${project.nameZh}】` : "【未关联项目】";
}

export function isDateKey(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export async function buildWeeklyReportEvidence(start: string, end: string) {
  const startAt = parseDateKey(start);
  const endExclusive = parseDateKey(addDaysToDateKey(end, 1));
  const prisma = getPrisma();

  const [
    scheduleBlocks,
    tasks,
    projectFiles,
    meetingReviews,
    timelineEvents,
    receptions,
    questions,
    growthLogs,
  ] = await Promise.all([
    prisma.scheduleBlock.findMany({
      where: { date: { gte: startAt, lt: endExclusive } },
      include: { project: { select: { nameZh: true } } },
      orderBy: [{ date: "asc" }, { startMin: "asc" }],
      take: 100,
    }),
    prisma.task.findMany({
      where: {
        OR: [
          { dueDate: { gte: startAt, lt: endExclusive } },
          { updatedAt: { gte: startAt, lt: endExclusive } },
        ],
      },
      include: { project: { select: { nameZh: true } } },
      orderBy: [{ dueDate: "asc" }, { updatedAt: "asc" }],
      take: 100,
    }),
    prisma.projectFile.findMany({
      where: {
        OR: [
          { createdAt: { gte: startAt, lt: endExclusive } },
          { updatedAt: { gte: startAt, lt: endExclusive } },
        ],
      },
      include: { project: { select: { nameZh: true } } },
      orderBy: { updatedAt: "asc" },
      take: 100,
    }),
    prisma.meetingReview.findMany({
      where: {
        OR: [
          { createdAt: { gte: startAt, lt: endExclusive } },
          { updatedAt: { gte: startAt, lt: endExclusive } },
        ],
      },
      include: {
        project: { select: { nameZh: true } },
        rounds: { orderBy: { roundNo: "asc" }, take: 20 },
      },
      orderBy: { updatedAt: "asc" },
      take: 50,
    }),
    prisma.timelineEvent.findMany({
      where: { createdAt: { gte: startAt, lt: endExclusive } },
      include: { project: { select: { nameZh: true } } },
      orderBy: { createdAt: "asc" },
      take: 100,
    }),
    prisma.reception.findMany({
      where: {
        OR: [
          { startAt: { gte: startAt, lt: endExclusive } },
          { endAt: { gte: startAt, lt: endExclusive } },
          { updatedAt: { gte: startAt, lt: endExclusive } },
        ],
      },
      include: { project: { select: { nameZh: true } } },
      orderBy: { startAt: "asc" },
      take: 50,
    }),
    prisma.feedbackQuestion.findMany({
      where: { updatedAt: { gte: startAt, lt: endExclusive } },
      include: { project: { select: { nameZh: true } } },
      orderBy: { updatedAt: "asc" },
      take: 100,
    }),
    prisma.growthLog.findMany({
      where: { happenedAt: { gte: startAt, lt: endExclusive } },
      include: { project: { select: { nameZh: true } } },
      orderBy: { happenedAt: "asc" },
      take: 50,
    }),
  ]);

  const sections: string[] = [
    `周报范围：${start} 至 ${end}`,
    "身份说明：周报撰写人是 Sunny。晓卉姐、施嘉姐、杜总是 Sunny 的 Leader。",
    "整理要求：只把有完成证据的事项写成已完成；Leader 的安排、@Sunny 和待回复事项要区分为任务、进行中或等待反馈。",
  ];

  sections.push("\n【本周日程与工作记录】");
  if (!scheduleBlocks.length) {
    sections.push("- 无记录");
  } else {
    for (const block of scheduleBlocks) {
      sections.push(
        `- ${toDateKey(block.date)} ${minuteText(block.startMin)}-${minuteText(block.endMin)} ${projectLabel(block.project)}${block.title}${block.participants ? `；相关人：${block.participants}` : ""}${block.note ? `；备注：${block.note}` : ""}`,
      );
    }
  }

  sections.push("\n【任务进展】");
  if (!tasks.length) {
    sections.push("- 无记录");
  } else {
    for (const task of tasks) {
      sections.push(
        `- ${projectLabel(task.project)}${task.title}；状态：${statusLabel(task.status)}${task.dueDate ? `；日期/截止：${toDateKey(task.dueDate)}` : ""}${task.description ? `；说明：${task.description}` : ""}`,
      );
    }
  }

  sections.push("\n【交付件与审阅】");
  if (!projectFiles.length && !meetingReviews.length) {
    sections.push("- 无记录");
  } else {
    for (const file of projectFiles) {
      sections.push(
        `- ${projectLabel(file.project)}${file.name}${file.version ? `（${file.version}）` : ""}；状态：${statusLabel(file.status)}${file.note ? `；说明：${file.note}` : ""}`,
      );
    }
    for (const review of meetingReviews) {
      const rounds = review.rounds
        .map((round) => {
          const time = round.sentAt ? toDateTimeText(round.sentAt) : "时间待确认";
          return `第${round.roundNo}轮 ${time} ${statusLabel(round.status)}${round.feedback ? `：${round.feedback}` : ""}`;
        })
        .join("；");
      sections.push(
        `- ${projectLabel(review.project)}${review.title}；状态：${statusLabel(review.status)}${rounds ? `；${rounds}` : ""}`,
      );
    }
  }

  sections.push("\n【项目动态】");
  if (!timelineEvents.length) {
    sections.push("- 无记录");
  } else {
    for (const event of timelineEvents) {
      sections.push(
        `- ${toDateTimeText(event.createdAt)} ${projectLabel(event.project)}${event.action}：${event.message}`,
      );
    }
  }

  sections.push("\n【出差与接待】");
  if (!receptions.length) {
    sections.push("- 无记录");
  } else {
    for (const reception of receptions) {
      sections.push(
        `- ${projectLabel(reception.project)}${reception.title}；状态：${statusLabel(reception.status)}${reception.startAt ? `；开始：${toDateTimeText(reception.startAt)}` : ""}${reception.endAt ? `；结束：${toDateTimeText(reception.endAt)}` : ""}${reception.note ? `；说明：${reception.note}` : ""}`,
      );
    }
  }

  sections.push("\n【问题、反馈与等待事项】");
  if (!questions.length) {
    sections.push("- 无记录");
  } else {
    for (const question of questions) {
      sections.push(
        `- ${projectLabel(question.project)}${question.question}；状态：${statusLabel(question.status)}${question.answer ? `；当前答复：${question.answer}` : ""}${question.note ? `；跟进：${question.note}` : ""}`,
      );
    }
  }

  sections.push("\n【成果与能力积累】");
  if (!growthLogs.length) {
    sections.push("- 无记录");
  } else {
    for (const log of growthLogs) {
      sections.push(
        `- ${toDateKey(log.happenedAt)} ${projectLabel(log.project)}${log.title}${log.detail ? `；${log.detail}` : ""}`,
      );
    }
  }

  return sections.join("\n").slice(0, 12_000);
}
