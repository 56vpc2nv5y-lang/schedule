import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

try {
  const project = await prisma.project.findUnique({
    where: { id: "p-uz-training-2026" },
    select: {
      nameZh: true,
      status: true,
      plannedStart: true,
      plannedEnd: true,
      _count: { select: { stages: true, tasks: true, receptions: true } },
    },
  });
  const reception = await prisma.reception.findUnique({
    where: { id: "r-uz-training-2026" },
    select: {
      title: true,
      status: true,
      _count: { select: { checklistItems: true } },
    },
  });
  const tasks = await prisma.task.findMany({
    where: {
      id: {
        in: [
          "t-un-beijing-agenda-0713",
          "t-ev-qa",
          "t-uz-tsinghua-registration",
          "t-market-h2-forecast",
          "t-muru-followup",
        ],
      },
    },
    select: { id: true, title: true, status: true },
    orderBy: { id: "asc" },
  });

  console.log(JSON.stringify({ project, reception, tasks }, null, 2));
} finally {
  await prisma.$disconnect();
}
