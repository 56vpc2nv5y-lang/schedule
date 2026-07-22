import {
  GrowthCategory,
  Priority,
  PrismaClient,
  ProjectStatus,
  StageStatus,
  TagType,
  TaskStatus,
} from "@prisma/client";

const prisma = new PrismaClient();
const date = (value: string) => new Date(`${value}T00:00:00+08:00`);

const juneTasks = [
  ["june-sec-0603", "p-sec", "s-sec-1", "整理新加坡安检技术交流参会人员背景", "2026-06-03", "梳理 6/9 交流参会人员背景，为现场沟通准备。", "MEDIUM"],
  ["june-ev-0604", "p-ev", "s-ev-1", "整理 6/18 车辆维保交流参会背景与北理工团队优势", "2026-06-04", "汇总参会人员背景、北理工团队研究方向与匹配优势。", "MEDIUM"],
  ["june-sec-0605", "p-sec", "s-sec-6", "核对荧光检测材料并整理技术追问", "2026-06-05", "完成荧光检测解释与翻译，结合项目报告整理待确认问题。", "HIGH"],
  ["june-sec-0608", "p-sec", "s-sec-5", "赴北理工现场确认安检技术不确定项", "2026-06-08", "会前与北理工团队核对技术口径和未确认信息。", "HIGH"],
  ["june-sec-0612", "p-sec", "s-sec-6", "评估太赫兹团队首轮回复并提出补充问题", "2026-06-12", "判断回复是否覆盖客户需求，标记缺失信息并继续追问。", "HIGH"],
  ["june-ev-0615", "p-ev", "s-ev-4", "翻译北理工车辆维保 PPT 并适配公司模板", "2026-06-15", "完成技术内容英译、版式统一和公司模板适配。", "HIGH"],
  ["june-ev-0616", "p-ev", "s-ev-4", "审查车辆维保 PPT 的内容与表达问题", "2026-06-16", "逐页检查技术逻辑、术语和对外表达，汇总修改点。", "HIGH"],
  ["june-ev-0617", "p-ev", "s-ev-4", "翻译车辆维保 PPT 修订版", "2026-06-17", "根据北理工修订内容完成英文版本更新。", "HIGH"],
  ["june-ev-0618", "p-ev", "s-ev-5", "参与北理工车辆维保会议并当日发送纪要", "2026-06-18", "现场支持三方交流，会后整理会议纪要并发送新加坡。", "HIGH"],
  ["june-sec-0618", "p-sec", "s-sec-6", "复核安检团队第二轮回复并标记未解决问题", "2026-06-18", "检查太赫兹等团队补充回复，保留仍需确认的技术点。", "HIGH"],
  ["june-ev-0622", "p-ev", "s-ev-6", "整理 HTX 对车辆维保方案的后续问题", "2026-06-22", "归并客户追问并形成供北理工回复的问题清单。", "HIGH"],
  ["june-sec-0622", "p-sec", "s-sec-6", "整理太赫兹中文回复与荧光检测追问", "2026-06-22", "核对两条技术线的回复状态和下一轮问题。", "HIGH"],
  ["june-sec-0623", "p-sec", "s-sec-4", "启动安全筛查 Scenario Analysis PPT", "2026-06-23", "根据客户场景和现有技术资料搭建分析结构。", "HIGH"],
  ["june-sec-0625", "p-sec", "s-sec-6", "继续追踪太赫兹团队缺失回复", "2026-06-25", "针对未覆盖的客户问题再次向团队确认。", "MEDIUM"],
  ["june-sec-0626", "p-sec", "s-sec-4", "完成 Scenario Analysis PPT 第一稿", "2026-06-26", "完成场景分析框架和主要内容初稿。", "HIGH"],
  ["june-sec-0627-ppt", "p-sec", "s-sec-4", "根据反馈完成 Scenario Analysis PPT 第二稿", "2026-06-27", "补充场景、技术匹配和表达逻辑。", "HIGH"],
  ["june-sec-0627-tech", "p-sec", "s-sec-6", "整理缪子团队介绍及 MHA 机构与场景资料", "2026-06-27", "同步推进太赫兹追问、缪子团队介绍和客户场景背景整理。", "MEDIUM"],
  ["june-sec-0628-ppt", "p-sec", "s-sec-4", "完成 Scenario Analysis PPT 第三稿", "2026-06-28", "按内部反馈继续收敛内容，形成会议展示版本。", "HIGH"],
  ["june-sec-0628-meeting", "p-sec", "s-sec-5", "发送新加坡第二轮会议链接并参加缪子会前准备", "2026-06-28", "确认三场交流安排并于 14:45-15:15 参加缪子团队会前准备。", "HIGH"],
  ["june-visit-0629", "p-visit", "s-vis-2", "搜集 11 月新加坡局长参访点位与路线资料", "2026-06-29", "覆盖高能所、电动车辆国家工程中心、亦庄自动驾驶和清华智能车辆研究中心。", "MEDIUM"],
  ["june-ev-0630", "p-ev", "s-ev-6", "核验并翻译北理工车辆维保回复后发新加坡", "2026-06-30", "先判断回复是否覆盖 HTX 问题，再完成中英整理与对外交付。", "HIGH"],
  ["june-sec-0630", "p-sec", "s-sec-6", "收集并核对太赫兹团队中文技术材料", "2026-06-30", "接收太赫兹材料并核对与客户问题的对应关系。", "HIGH"],
  ["june-vn-0630", "p-vn", null, "整理越南培训提案工作范围", "2026-06-30", "归纳培训主题、可能资源与后续待确认事项。", "MEDIUM"],
] as const;

async function main() {
  await prisma.$transaction(
    async (tx) => {
    const taskType = await tx.tag.upsert({
      where: { type_name: { type: TagType.TASK_TYPE, name: "技术评估与交付" } },
      create: { type: TagType.TASK_TYPE, name: "技术评估与交付", sortOrder: 15 },
      update: { enabled: true },
    });

    for (const [id, projectId, stageId, title, dueDate, description, priority] of juneTasks) {
      await tx.task.upsert({
        where: { id },
        create: {
          id,
          projectId,
          stageId,
          title,
          description,
          dueDate: date(dueDate),
          priority: priority as Priority,
          status: TaskStatus.DONE,
          typeTagId: taskType.id,
        },
        update: {
          projectId,
          stageId,
          title,
          description,
          dueDate: date(dueDate),
          priority: priority as Priority,
          status: TaskStatus.DONE,
          typeTagId: taskType.id,
        },
      });
    }

    const trainingType = await tx.tag.upsert({
      where: { type_name: { type: TagType.PROJECT_TYPE, name: "接待/展会专项" } },
      create: { type: TagType.PROJECT_TYPE, name: "接待/展会专项" },
      update: { enabled: true },
    });
    const template = await tx.stageTemplate.upsert({
      where: { id: "tpl-training" },
      create: {
        id: "tpl-training",
        name: "国际培训与接待",
        description: "适用于来华培训、政府代表团与配套参访项目。",
        projectTypeTagId: trainingType.id,
      },
      update: {
        name: "国际培训与接待",
        description: "适用于来华培训、政府代表团与配套参访项目。",
        projectTypeTagId: trainingType.id,
      },
    });
    await tx.stageTemplateItem.deleteMany({ where: { templateId: template.id } });
    await tx.stageTemplateItem.createMany({
      data: [
        "商机/需求对接",
        "供应商匹配与方案沟通",
        "报价/预算沟通",
        "日程与人员安排",
        "入校报备与出行手续",
        "培训实施与现场协调",
        "参访与接待执行",
        "结业与成果交付",
        "借款/报销与费用结算",
        "资料归档",
        "合作机会跟踪",
        "项目复盘",
      ].map((name, index) => ({
        id: `tpl-training-${index + 1}`,
        templateId: template.id,
        name,
        sortOrder: index + 1,
      })),
    });

    await tx.project.update({
      where: { id: "p-uz-training-2026" },
      data: {
        status: ProjectStatus.ACTIVE,
        plannedStart: date("2026-07-26"),
        plannedEnd: date("2026-08-06"),
        stageTemplateId: template.id,
      },
    });
    const stageNames = [
      "商机/需求对接",
      "供应商匹配与方案沟通",
      "报价/预算沟通",
      "日程与人员安排",
      "入校报备与出行手续",
      "培训实施与现场协调",
      "参访与接待执行",
      "结业与成果交付",
      "借款/报销与费用结算",
      "资料归档",
      "合作机会跟踪",
      "项目复盘",
    ];
    const stageStatus = [
      StageStatus.COMPLETED,
      StageStatus.COMPLETED,
      StageStatus.COMPLETED,
      StageStatus.IN_PROGRESS,
      StageStatus.IN_PROGRESS,
      StageStatus.NOT_STARTED,
      StageStatus.NOT_STARTED,
      StageStatus.NOT_STARTED,
      StageStatus.NOT_STARTED,
      StageStatus.NOT_STARTED,
      StageStatus.NOT_STARTED,
      StageStatus.NOT_STARTED,
    ];
    for (let index = 0; index < stageNames.length; index += 1) {
      const sortOrder = index + 1;
      await tx.projectStage.upsert({
        where: { projectId_sortOrder: { projectId: "p-uz-training-2026", sortOrder } },
        create: {
          id: `s-uz-${sortOrder}`,
          projectId: "p-uz-training-2026",
          sourceTemplateItemId: `tpl-training-${sortOrder}`,
          name: stageNames[index],
          sortOrder,
          status: stageStatus[index],
        },
        update: {
          sourceTemplateItemId: `tpl-training-${sortOrder}`,
          name: stageNames[index],
          status: stageStatus[index],
        },
      });
    }

    await tx.growthLog.upsert({
      where: { id: "growth-ev-bilingual-delivery" },
      create: {
        id: "growth-ev-bilingual-delivery",
        category: GrowthCategory.ACHIEVEMENT,
        projectId: "p-ev",
        happenedAt: date("2026-06-30"),
        title: "完成车辆维保技术材料的双语核验与客户交付",
        detail: "连续完成 PPT 翻译、问题审查、会议纪要和北理工回复核验，6/30 将确认后的英文回复交付新加坡 HTX。",
      },
      update: {},
    });
    await tx.growthLog.upsert({
      where: { id: "growth-sec-multitrack" },
      create: {
        id: "growth-sec-multitrack",
        category: GrowthCategory.SKILL,
        projectId: "p-sec",
        happenedAt: date("2026-06-29"),
        title: "并行推进多技术团队评估与两轮跨境沟通",
        detail: "协调荧光、太赫兹、缪子等技术线的问题反馈，迭代 Scenario Analysis PPT，并支持两轮新加坡技术交流。",
      },
      update: {},
    });

    await tx.timelineEvent.upsert({
      where: { id: "timeline-uz-training-workflow-20260722" },
      create: {
        id: "timeline-uz-training-workflow-20260722",
        projectId: "p-uz-training-2026",
        entityType: "Project",
        entityId: "p-uz-training-2026",
        action: "流程调整",
        message: "项目改用国际培训与接待流程，当前并行推进日程与人员安排、入校报备与出行手续。",
      },
      update: {
        message: "项目改用国际培训与接待流程，当前并行推进日程与人员安排、入校报备与出行手续。",
      },
    });
    },
    { maxWait: 10_000, timeout: 60_000 },
  );
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
