import { PrismaClient, ProjectStatus, StageStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const project = await prisma.project.findUnique({
    where: { id: "p-uz-training-2026" },
    select: { id: true, nameZh: true },
  });
  if (!project) {
    console.log("Uzbekistan training project not found; nothing to repair.");
    return;
  }

  await prisma.$transaction(async (tx) => {
    await tx.project.update({
      where: { id: project.id },
      data: { status: ProjectStatus.PAUSED },
    });
    await tx.trainingProfile.upsert({
      where: { projectId: project.id },
      create: {
        projectId: project.id,
        currentPhase: "暂停 / 重启复核",
        postponed: true,
      },
      update: {
        currentPhase: "暂停 / 重启复核",
        postponed: true,
      },
    });
    await tx.projectStage.updateMany({
      where: { projectId: project.id, name: "筹备" },
      data: { status: StageStatus.DELAYED },
    });
    await tx.projectStage.updateMany({
      where: { projectId: project.id, name: "暂停 / 重启复核" },
      data: { status: StageStatus.IN_PROGRESS },
    });
    await tx.timelineEvent.upsert({
      where: { id: "workflow-integrity-uz-training-2026" },
      create: {
        id: "workflow-integrity-uz-training-2026",
        projectId: project.id,
        entityType: "Project",
        entityId: project.id,
        action: "状态一致性修复",
        message:
          "培训项目因客户 postpone 统一为 PAUSED；当前工作位置为暂停 / 重启复核。",
      },
      update: {
        message:
          "培训项目因客户 postpone 统一为 PAUSED；当前工作位置为暂停 / 重启复核。",
      },
    });
  });

  console.log("Repaired workflow integrity for " + project.nameZh + ".");
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });