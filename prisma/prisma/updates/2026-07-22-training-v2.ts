import {
  PrismaClient,
  ProjectStatus,
  StageStatus,
  TagType,
} from "@prisma/client";

const prisma = new PrismaClient();

const taskTypeNames = ["接待", "培训", "项目", "展会"] as const;

const trainingStages = [
  {
    name: "课程大纲",
    description:
      "客户已有明确主题则直接采用；否则先了解对方业务并定制。敲定主题数、总时长、地点、预算、客户对接人、每主题与每日学习时长。",
  },
  {
    name: "核算成本",
    description:
      "核算酒店、交通、人工、讲义费、餐费、胸牌，形成仅供内部使用的成本表。",
  },
  {
    name: "报价",
    description:
      "成本表绝不直接发客户。内部核对总数，经晓卉姐确认后报价；首轮可保留议价空间。",
  },
  {
    name: "合同签署 / 招标采购",
    description:
      "对内推进合肥院技术服务合同、法务审核和总部采购；对外合同明确保证金、预付比例与款项节点。",
  },
  {
    name: "筹备",
    description:
      "明确机票/酒店等费用归属，安排司机交通，完成姓名、电话、身份证/护照报备、盖章、日程与分工。",
  },
  {
    name: "暂停 / 重启复核",
    description:
      "客户 postpone 后，重启前复查人员名单、培训老师时间和课件更新三项。",
  },
] as const;

const checklist = {
  COST: [
    "酒店",
    "交通",
    "人工",
    "讲义费",
    "餐费",
    "胸牌",
  ],
  PREPARATION: [
    "确认国际机票费用归属",
    "确认国内机票费用归属",
    "确认酒店费用归属与预算",
    "确认市内交通费用归属",
    "联系司机并确认完整行程",
    "收齐报备姓名、电话、身份证号或护照号",
    "完成清华大学、住建部等单位报备",
    "完成盖章事项",
    "确认日程与现场分工",
  ],
  RESTART: [
    "复查来华培训人员名单是否变更",
    "复查培训老师时间是否仍可行",
    "复查课件是否需要更新确认",
  ],
} as const;

function classifyTask(projectName: string, title: string) {
  const text = `${projectName} ${title}`;
  if (/展会|邀请函/.test(text)) return "展会";
  if (/培训|课程|讲义|结业/.test(text)) return "培训";
  if (/接待|参访|来访|局长|代表团|接机|送机|酒店/.test(text)) return "接待";
  return "项目";
}

async function main() {
  await prisma.$transaction(
    async (tx) => {
      const typeIds = new Map<string, string>();
      for (const [index, name] of taskTypeNames.entries()) {
        const tag = await tx.tag.upsert({
          where: { type_name: { type: TagType.TASK_TYPE, name } },
          create: {
            type: TagType.TASK_TYPE,
            name,
            sortOrder: index + 1,
            enabled: true,
          },
          update: { sortOrder: index + 1, enabled: true },
        });
        typeIds.set(name, tag.id);
      }

      const tasks = await tx.task.findMany({
        select: {
          id: true,
          title: true,
          project: { select: { nameZh: true } },
        },
      });
      for (const task of tasks) {
        const category = classifyTask(task.project?.nameZh ?? "", task.title);
        await tx.task.update({
          where: { id: task.id },
          data: { typeTagId: typeIds.get(category) },
        });
      }
      await tx.tag.deleteMany({
        where: {
          type: TagType.TASK_TYPE,
          name: { notIn: [...taskTypeNames] },
        },
      });

      await tx.appSetting.upsert({
        where: { id: "APP_PASSWORD" },
        create: { id: "APP_PASSWORD", value: "sunny" },
        update: { value: "sunny" },
      });

      const trainingType = await tx.tag.upsert({
        where: {
          type_name: { type: TagType.PROJECT_TYPE, name: "接待/展会专项" },
        },
        create: {
          type: TagType.PROJECT_TYPE,
          name: "接待/展会专项",
          enabled: true,
        },
        update: { enabled: true },
      });
      const template = await tx.stageTemplate.upsert({
        where: { id: "tpl-training" },
        create: {
          id: "tpl-training",
          name: "培训类任务全流程",
          description: "课程大纲、内部成本、报价、双合同/采购、筹备，以及延期后的重启复核。",
          projectTypeTagId: trainingType.id,
        },
        update: {
          name: "培训类任务全流程",
          description: "课程大纲、内部成本、报价、双合同/采购、筹备，以及延期后的重启复核。",
          projectTypeTagId: trainingType.id,
        },
      });
      await tx.stageTemplateItem.deleteMany({
        where: { templateId: template.id },
      });
      await tx.stageTemplateItem.createMany({
        data: trainingStages.map((stage, index) => ({
          id: `tpl-training-${index + 1}`,
          templateId: template.id,
          name: stage.name,
          description: stage.description,
          sortOrder: index + 1,
        })),
      });

      const projects = await tx.project.findMany({
        where: {
          OR: [
            { id: "p-uz-training-2026" },
            { nameZh: { contains: "培训" } },
          ],
        },
        select: { id: true, nameZh: true, status: true },
      });

      for (const project of projects) {
        const isUz = project.id === "p-uz-training-2026";
        const isPaused = project.status === ProjectStatus.PAUSED;
        const currentPhase = isUz
          ? "筹备"
          : isPaused
            ? "暂停 / 重启复核"
            : "课程大纲";
        const profile = await tx.trainingProfile.upsert({
          where: { projectId: project.id },
          create: {
            projectId: project.id,
            currentPhase,
            participantCount: isUz ? 30 : null,
            totalDays: isUz ? 12 : null,
            location: isUz ? "北京入境后转赴合肥，合肥培训" : null,
            costOwnership: isUz
              ? "北京酒店由对方承担；国际机票、国内机票、合肥酒店及市内交通仍需逐项确认。"
              : null,
            reportingStatus: isUz
              ? "清华大学人员报备进行中；需收齐姓名、电话、身份证号或护照号。"
              : null,
            postponed: isPaused,
          },
          update: {
            currentPhase,
            participantCount: isUz ? 30 : undefined,
            totalDays: isUz ? 12 : undefined,
            location: isUz ? "北京入境后转赴合肥，合肥培训" : undefined,
            costOwnership: isUz
              ? "北京酒店由对方承担；国际机票、国内机票、合肥酒店及市内交通仍需逐项确认。"
              : undefined,
            reportingStatus: isUz
              ? "清华大学人员报备进行中；需收齐姓名、电话、身份证号或护照号。"
              : undefined,
            postponed: isPaused,
          },
        });

        for (const [section, labels] of Object.entries(checklist)) {
          for (const [index, label] of labels.entries()) {
            await tx.trainingChecklistItem.upsert({
              where: {
                trainingProfileId_section_label: {
                  trainingProfileId: profile.id,
                  section,
                  label,
                },
              },
              create: {
                trainingProfileId: profile.id,
                section,
                label,
                sortOrder: index + 1,
              },
              update: { sortOrder: index + 1 },
            });
          }
        }

        await tx.project.update({
          where: { id: project.id },
          data: { stageTemplateId: template.id },
        });

        const statuses = isUz
          ? [
              StageStatus.COMPLETED,
              StageStatus.COMPLETED,
              StageStatus.COMPLETED,
              StageStatus.COMPLETED,
              StageStatus.IN_PROGRESS,
              StageStatus.NOT_STARTED,
            ]
          : isPaused
            ? [
                StageStatus.IN_PROGRESS,
                StageStatus.NOT_STARTED,
                StageStatus.NOT_STARTED,
                StageStatus.NOT_STARTED,
                StageStatus.NOT_STARTED,
                StageStatus.DELAYED,
              ]
            : [
                StageStatus.IN_PROGRESS,
                StageStatus.NOT_STARTED,
                StageStatus.NOT_STARTED,
                StageStatus.NOT_STARTED,
                StageStatus.NOT_STARTED,
                StageStatus.NOT_STARTED,
              ];

        for (const [index, stage] of trainingStages.entries()) {
          const sortOrder = index + 1;
          await tx.projectStage.upsert({
            where: {
              projectId_sortOrder: { projectId: project.id, sortOrder },
            },
            create: {
              projectId: project.id,
              sourceTemplateItemId: `tpl-training-${sortOrder}`,
              name: stage.name,
              note: stage.description,
              sortOrder,
              status: statuses[index],
            },
            update: {
              sourceTemplateItemId: `tpl-training-${sortOrder}`,
              name: stage.name,
              note: stage.description,
              status: statuses[index],
            },
          });
        }
        await tx.projectStage.deleteMany({
          where: { projectId: project.id, sortOrder: { gt: 6 } },
        });

        await tx.timelineEvent.upsert({
          where: { id: `training-workflow-v2-${project.id}` },
          create: {
            id: `training-workflow-v2-${project.id}`,
            projectId: project.id,
            entityType: "TrainingProfile",
            entityId: profile.id,
            action: "培训流程重构",
            message: "已切换为课程大纲、内部成本、报价、双合同/采购、筹备及延期重启复核流程。",
          },
          update: {
            message: "已切换为课程大纲、内部成本、报价、双合同/采购、筹备及延期重启复核流程。",
          },
        });
      }
    },
    { maxWait: 10_000, timeout: 120_000 },
  );
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });