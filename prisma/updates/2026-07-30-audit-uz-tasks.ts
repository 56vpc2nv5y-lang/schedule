import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const tasks = await prisma.task.findMany({
    where: { OR: [{ title: { contains: "乌兹" } }, { title: { contains: "报备" } }, { description: { contains: "乌兹" } }, { sourceLabel: { contains: "乌兹" } }] },
    select: { id: true, title: true, status: true, source: true, sourceRefId: true, sourceLabel: true, description: true },
    orderBy: { updatedAt: "desc" },
  });
  console.log(JSON.stringify(tasks, null, 2));
}
main().finally(() => prisma.$disconnect());