import { NextResponse } from "next/server";
import { Priority, TagType, TaskStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { parseDateKey } from "@/lib/date-time";
import { isDatabaseConfigured } from "@/lib/db-status";
import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type IntakeItem = {
  title?: string;
  description?: string;
  priority?: string;
  minutes?: number;
};

function safePriority(value: string | undefined): Priority {
  if (value === "HIGH") return Priority.HIGH;
  if (value === "LOW") return Priority.LOW;
  return Priority.MEDIUM;
}

function safeMinutes(value: number | undefined) {
  const minutes = Number.isFinite(value) ? Number(value) : 60;
  return Math.max(30, Math.min(180, Math.round(minutes / 15) * 15));
}

function findSlot(busy: Array<[number, number]>, duration: number) {
  const windows: Array<[number, number]> = [
    [540, 720],
    [810, 1080],
    [1080, 1320],
  ];
  for (const [windowStart, windowEnd] of windows) {
    for (let start = windowStart; start + duration <= windowEnd; start += 15) {
      const end = start + duration;
      const overlaps = busy.some(([busyStart, busyEnd]) => start < busyEnd && end > busyStart);
      if (!overlaps) return { start, end };
    }
  }
  return null;
}

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "数据库尚未连接。" }, { status: 400 });
  }

  let body: { projectId?: string; dueDate?: string; items?: IntakeItem[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "请求格式有误。" }, { status: 400 });
  }

  const dueDateText = String(body.dueDate ?? "").trim();
  const items = Array.isArray(body.items) ? body.items.slice(0, 20) : [];
  if (!dueDateText || items.length === 0) {
    return NextResponse.json({ error: "日期或任务内容缺失。" }, { status: 400 });
  }

  const date = parseDateKey(dueDateText);
  const projectId = String(body.projectId ?? "").trim() || null;
  let taskTypeName = "项目";
  if (projectId) {
    const project = await getPrisma().project.findUnique({
      where: { id: projectId },
      select: { id: true, nameZh: true },
    });
    if (!project) return NextResponse.json({ error: "所选项目不存在。" }, { status: 400 });
    if (/展会/.test(project.nameZh)) taskTypeName = "展会";
    else if (/培训|课程/.test(project.nameZh)) taskTypeName = "培训";
    else if (/接待|参访|来访|代表团/.test(project.nameZh)) taskTypeName = "接待";
  }

  const [blocks, defaultType] = await Promise.all([
    getPrisma().scheduleBlock.findMany({
      where: { OR: [{ date }, { date: null }] },
      select: { startMin: true, endMin: true },
    }),
    getPrisma().tag.findFirst({
      where: { type: TagType.TASK_TYPE, name: taskTypeName },
      select: { id: true },
    }),
  ]);
  const busy: Array<[number, number]> = blocks.map((block) => [block.startMin, block.endMin]);
  let created = 0;
  let scheduled = 0;
  let skipped = 0;

  for (const item of items) {
    const title = String(item.title ?? "").trim().slice(0, 180);
    if (!title) continue;
    const duplicate = await getPrisma().task.findFirst({
      where: { projectId, title, dueDate: date, status: { not: TaskStatus.DONE } },
      select: { id: true },
    });
    if (duplicate) {
      skipped += 1;
      continue;
    }

    const task = await getPrisma().task.create({
      data: {
        projectId,
        title,
        description: String(item.description ?? "").trim().slice(0, 600) || null,
        dueDate: date,
        priority: safePriority(item.priority),
        typeTagId: defaultType?.id,
      },
    });
    created += 1;

    if (projectId) {
      await getPrisma().timelineEvent.create({
        data: {
          projectId,
          entityType: "Task",
          entityId: task.id,
          action: "AI 录入",
          message: `根据工作记录新增任务「${title}」。`,
        },
      });
    }

    const slot = findSlot(busy, safeMinutes(item.minutes));
    if (slot) {
      await getPrisma().scheduleBlock.create({
        data: {
          title,
          date,
          startMin: slot.start,
          endMin: slot.end,
          kind: "work",
          note: "AI 录入",
          projectId,
        },
      });
      busy.push([slot.start, slot.end]);
      scheduled += 1;
    }
  }

  for (const path of ["/", "/today", "/tasks", "/calendar", "/week", "/assistant"]) {
    revalidatePath(path);
  }
  if (projectId) revalidatePath(`/projects/${projectId}`);

  return NextResponse.json({ created, scheduled, skipped });
}
