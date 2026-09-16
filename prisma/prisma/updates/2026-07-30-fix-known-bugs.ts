import { PrismaClient, ProjectStatus, TagType } from "@prisma/client";
import { syncReceptionChecklistTasks } from "../../src/lib/task-sync";

const prisma = new PrismaClient();

async function fixVietnamTraining() {
  const tag = await prisma.tag.upsert({
    where: { type_name: { type: TagType.PROJECT_TYPE, name: "培训项目" } },
    create: { type: TagType.PROJECT_TYPE, name: "培训项目" },
    update: {},
  });
  const rows = await prisma.project.findMany({ where: { nameZh: { contains: "越南" } }, select: { id: true, nameZh: true } });
  for (const row of rows) {
    await prisma.project.update({ where: { id: row.id }, data: { status: ProjectStatus.ACTIVE, projectTypeTagId: tag.id } });
    await prisma.trainingProfile.updateMany({ where: { projectId: row.id }, data: { postponed: false } });
  }
  return rows.map((row) => row.nameZh);
}

async function syncUzReception() {
  const rows = await prisma.reception.findMany({ where: { title: { contains: "乌兹" } }, select: { id: true, title: true } });
  for (const row of rows) await syncReceptionChecklistTasks(row.id);
  const result = [];
  for (const row of rows) {
    const items = await prisma.receptionChecklistItem.findMany({ where: { receptionId: row.id }, select: { id: true } });
    const ids = items.map((item) => item.id);
    const tasks = ids.length ? await prisma.task.findMany({ where: { source: "RECEPTION_CHECKLIST", sourceRefId: { in: ids } }, select: { status: true } }) : [];
    result.push({ title: row.title, done: tasks.filter((task) => task.status === "DONE").length, total: tasks.length || ids.length });
  }
  return result;
}

async function cleanupStatusLogs() {
  const events = await prisma.timelineEvent.findMany({
    where: { OR: [{ action: "项目状态调整" }, { action: "项目状态" }] },
    orderBy: [{ projectId: "asc" }, { createdAt: "asc" }],
    select: { id: true, projectId: true, createdAt: true, message: true },
  });
  const keep = new Map<string, string>();
  const remove: string[] = [];
  for (const event of events) {
    const minute = event.createdAt.toISOString().slice(0, 16);
    const key = event.projectId + "|" + minute;
    const previous = keep.get(key);
    if (previous) remove.push(previous);
    keep.set(key, event.id);
  }
  if (remove.length) await prisma.timelineEvent.deleteMany({ where: { id: { in: remove } } });
  return remove.length;
}

async function main() {
  const vietnam = await fixVietnamTraining();
  const uz = await syncUzReception();
  const removedLogs = await cleanupStatusLogs();
  console.log(JSON.stringify({ vietnam, uz, removedLogs }, null, 2));
}

main().finally(() => prisma.$disconnect());