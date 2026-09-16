import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const item = await prisma.receptionChecklistItem.findFirst({ where: { reception: { title: { contains: "乌兹" } }, title: { contains: "报备" } }, select: { id: true, title: true } });
  if (item) {
    await prisma.task.updateMany({ where: { source: "RECEPTION_CHECKLIST", sourceRefId: item.id }, data: { status: "DONE" } });
    await prisma.receptionChecklistItem.update({ where: { id: item.id }, data: { done: true } });
  }
  const tasks = item ? await prisma.task.findMany({ where: { source: "RECEPTION_CHECKLIST", sourceRefId: item.id }, select: { title: true, status: true } }) : [];
  console.log(JSON.stringify({ item, tasks }, null, 2));
}
main().finally(() => prisma.$disconnect());