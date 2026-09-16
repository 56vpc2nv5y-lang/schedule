import {
  FileStatus,
  GrowthCategory,
  Priority,
  PrismaClient,
  ProjectContactSide,
  ProjectStatus,
  QuestionStatus,
  ReceptionStatus,
  ReceptionType,
  StageStatus,
  TagType,
  TaskContactPurpose,
  TaskStatus,
} from "@prisma/client";

const prisma = new PrismaClient();

const date = (value: string) => new Date(`${value}T00:00:00+08:00`);
const dateTime = (value: string) => new Date(`${value}:00+08:00`);

async function main() {
  await prisma.$transaction(async (tx) => {
    const [regionTag, projectTypeTag, taskTypeTag, receptionTaskType] =
      await Promise.all([
        tx.tag.upsert({
          where: {
            type_name: { type: TagType.REGION, name: "乌兹别克斯坦" },
          },
          create: { type: TagType.REGION, name: "乌兹别克斯坦" },
          update: {},
        }),
        tx.tag.upsert({
          where: {
            type_name: { type: TagType.PROJECT_TYPE, name: "接待/展会专项" },
          },
          create: { type: TagType.PROJECT_TYPE, name: "接待/展会专项" },
          update: {},
        }),
        tx.tag.upsert({
          where: {
            type_name: { type: TagType.TASK_TYPE, name: "商务沟通" },
          },
          create: { type: TagType.TASK_TYPE, name: "商务沟通" },
          update: {},
        }),
        tx.tag.upsert({
          where: {
            type_name: { type: TagType.TASK_TYPE, name: "接待安排" },
          },
          create: { type: TagType.TASK_TYPE, name: "接待安排" },
          update: {},
        }),
      ]);

    const template = await tx.stageTemplate.findFirst({
      where: { isDefault: true },
      include: { items: { orderBy: { sortOrder: "asc" } } },
    });

    const [muru, quZong, delegation] = await Promise.all([
      tx.contact.upsert({
        where: { id: "c-muru" },
        create: {
          id: "c-muru",
          name: "Peh Mu Ru（Muru）",
          organization: "新加坡 HTX（内政科技局）",
          title: "项目对接人",
          note: "安全检测项目对接；已与晓卉姐、文静、Sunny 建立微信群。",
        },
        update: {
          name: "Peh Mu Ru（Muru）",
          organization: "新加坡 HTX（内政科技局）",
          title: "项目对接人",
          note: "安全检测项目对接；已与晓卉姐、文静、Sunny 建立微信群。",
        },
      }),
      tx.contact.upsert({
        where: { id: "c-quzong" },
        create: {
          id: "c-quzong",
          name: "曲总",
          organization: "我方团队",
          title: "负责人（待补全）",
        },
        update: {},
      }),
      tx.contact.upsert({
        where: { id: "c-uz-delegation" },
        create: {
          id: "c-uz-delegation",
          name: "乌兹住建监察局代表团",
          organization: "乌兹别克斯坦住建监察局",
          title: "30 人培训代表团",
          note: "2026-07-26 至 2026-08-06，北京与合肥培训。",
        },
        update: {
          title: "30 人培训代表团",
          note: "2026-07-26 至 2026-08-06，北京与合肥培训。",
        },
      }),
    ]);

    const uzProject = await tx.project.upsert({
      where: { id: "p-uz-training-2026" },
      create: {
        id: "p-uz-training-2026",
        nameZh: "乌兹别克斯坦住建监察局赴华培训",
        nameEn:
          "Uzbekistan Construction Supervision and Public Services Training",
        clientName: "乌兹别克斯坦住建监察局",
        status: ProjectStatus.ACTIVE,
        plannedStart: date("2026-07-26"),
        plannedEnd: date("2026-08-06"),
        note:
          "30 位官员；7/26 凌晨抵京，7/27 转赴合肥，7/28-8/4 授课与参观，8/5 返京，8/6 离境。议程依据 Training Agenda-0717.xlsx。",
        regionTagId: regionTag.id,
        projectTypeTagId: projectTypeTag.id,
        stageTemplateId: template?.id,
      },
      update: {
        nameZh: "乌兹别克斯坦住建监察局赴华培训",
        nameEn:
          "Uzbekistan Construction Supervision and Public Services Training",
        clientName: "乌兹别克斯坦住建监察局",
        status: ProjectStatus.ACTIVE,
        plannedStart: date("2026-07-26"),
        plannedEnd: date("2026-08-06"),
        note:
          "30 位官员；7/26 凌晨抵京，7/27 转赴合肥，7/28-8/4 授课与参观，8/5 返京，8/6 离境。议程依据 Training Agenda-0717.xlsx。",
        regionTagId: regionTag.id,
        projectTypeTagId: projectTypeTag.id,
        stageTemplateId: template?.id,
      },
    });

    await Promise.all([
      tx.projectContact.upsert({
        where: {
          projectId_contactId_side: {
            projectId: uzProject.id,
            contactId: "c-me",
            side: ProjectContactSide.OUR_TEAM,
          },
        },
        create: {
          projectId: uzProject.id,
          contactId: "c-me",
          side: ProjectContactSide.OUR_TEAM,
          isPrimary: true,
          note: "负责清华大学入校人员报备与日常协调。",
        },
        update: {
          isPrimary: true,
          note: "负责清华大学入校人员报备与日常协调。",
        },
      }),
      tx.projectContact.upsert({
        where: {
          projectId_contactId_side: {
            projectId: uzProject.id,
            contactId: delegation.id,
            side: ProjectContactSide.CLIENT,
          },
        },
        create: {
          projectId: uzProject.id,
          contactId: delegation.id,
          side: ProjectContactSide.CLIENT,
          isPrimary: true,
        },
        update: { isPrimary: true },
      }),
      tx.projectContact.upsert({
        where: {
          projectId_contactId_side: {
            projectId: "p-sec",
            contactId: muru.id,
            side: ProjectContactSide.CLIENT,
          },
        },
        create: {
          projectId: "p-sec",
          contactId: muru.id,
          side: ProjectContactSide.CLIENT,
          isPrimary: true,
          note: "缪子异常检测与安全检测项目对接。",
        },
        update: {
          isPrimary: true,
          note: "缪子异常检测与安全检测项目对接。",
        },
      }),
      tx.projectContact.upsert({
        where: {
          projectId_contactId_side: {
            projectId: "p-ev",
            contactId: quZong.id,
            side: ProjectContactSide.OUR_TEAM,
          },
        },
        create: {
          projectId: "p-ev",
          contactId: quZong.id,
          side: ProjectContactSide.OUR_TEAM,
          isPrimary: false,
          note: "接收北理工回复核验后的版本。",
        },
        update: { note: "接收北理工回复核验后的版本。" },
      }),
    ]);

    const existingStages = await tx.projectStage.count({
      where: { projectId: uzProject.id },
    });
    if (existingStages === 0 && template?.items.length) {
      const executionIndex = template.items.findIndex((item) =>
        item.name.includes("执行"),
      );
      await tx.projectStage.createMany({
        data: template.items.map((item, index) => ({
          id: `s-uz-${item.sortOrder}`,
          projectId: uzProject.id,
          sourceTemplateItemId: item.id,
          name: item.name,
          sortOrder: item.sortOrder,
          status:
            index < Math.max(executionIndex, 0)
              ? StageStatus.COMPLETED
              : index === Math.max(executionIndex, 0)
                ? StageStatus.IN_PROGRESS
                : StageStatus.NOT_STARTED,
          plannedStart:
            index === Math.max(executionIndex, 0)
              ? date("2026-07-17")
              : undefined,
          plannedEnd:
            index === Math.max(executionIndex, 0)
              ? date("2026-08-06")
              : undefined,
        })),
      });
    }

    await tx.reception.update({
      where: { id: "r-un" },
      data: {
        status: ReceptionStatus.CANCELLED,
        note:
          "原定 7/13 合肥接待因台风取消出差，改为 7/13 上午北京接待；平台讲解与探测点翻译任务取消。",
      },
    });

    await tx.reception.upsert({
      where: { id: "r-un-beijing-0713" },
      create: {
        id: "r-un-beijing-0713",
        type: ReceptionType.VISIT,
        title: "联合国人居署北京接待（台风调整）",
        location: "北京",
        purpose: "根据调整后的半天安排准备并确认接待议程。",
        startAt: dateTime("2026-07-13T09:00"),
        endAt: dateTime("2026-07-13T12:00"),
        status: ReceptionStatus.DONE,
        note:
          "原合肥出差受台风影响取消，接待地点改为北京，任务从平台/探测点翻译调整为准备议程。",
      },
      update: {
        title: "联合国人居署北京接待（台风调整）",
        location: "北京",
        purpose: "根据调整后的半天安排准备并确认接待议程。",
        startAt: dateTime("2026-07-13T09:00"),
        endAt: dateTime("2026-07-13T12:00"),
        status: ReceptionStatus.DONE,
        note:
          "原合肥出差受台风影响取消，接待地点改为北京，任务从平台/探测点翻译调整为准备议程。",
      },
    });

    const uzReception = await tx.reception.upsert({
      where: { id: "r-uz-training-2026" },
      create: {
        id: "r-uz-training-2026",
        projectId: uzProject.id,
        type: ReceptionType.VISIT,
        title: "乌兹住建监察局 30 人赴华培训接待",
        location: "北京 + 合肥",
        purpose:
          "7/26-8/6 建筑监管与公共服务培训、清华参访、合肥授课与实验平台参观。",
        startAt: dateTime("2026-07-26T05:25"),
        endAt: dateTime("2026-08-06T12:00"),
        status: ReceptionStatus.CONFIRMED,
        note:
          "7/26 凌晨抵京并参访清华昌平基地；7/27 清华主校区后转合肥；8/5 返京参访住建部展厅；8/6 离境。",
      },
      update: {
        projectId: uzProject.id,
        title: "乌兹住建监察局 30 人赴华培训接待",
        location: "北京 + 合肥",
        purpose:
          "7/26-8/6 建筑监管与公共服务培训、清华参访、合肥授课与实验平台参观。",
        startAt: dateTime("2026-07-26T05:25"),
        endAt: dateTime("2026-08-06T12:00"),
        status: ReceptionStatus.CONFIRMED,
        note:
          "7/26 凌晨抵京并参访清华昌平基地；7/27 清华主校区后转合肥；8/5 返京参访住建部展厅；8/6 离境。",
      },
    });

    await tx.receptionVisitor.upsert({
      where: {
        receptionId_contactId: {
          receptionId: uzReception.id,
          contactId: delegation.id,
        },
      },
      create: {
        receptionId: uzReception.id,
        contactId: delegation.id,
      },
      update: {},
    });

    const checklistItems = [
      {
        id: "cl-uz-01",
        title: "收集并核对 30 位官员的清华入校报备信息",
        dueDate: "2026-07-23",
        note:
          "字段：姓名、手机号、国籍、证件类型/号码、单位、职务、是否携带手机、车牌号、备注。",
        isMine: true,
        sortOrder: 0,
      },
      {
        id: "cl-uz-02",
        title: "提交清华昌平基地及主校区人员报备",
        dueDate: "2026-07-24",
        note: "依据 Attendee 模板提交并跟踪审核结果。",
        isMine: true,
        sortOrder: 1,
      },
      {
        id: "cl-uz-03",
        title: "核对 7/26-8/6 培训议程与授课教师",
        dueDate: "2026-07-23",
        note: "依据 Training Agenda-0717.xlsx。",
        isMine: false,
        sortOrder: 2,
      },
      {
        id: "cl-uz-04",
        title: "确认 7/26 凌晨抵京接机、车辆与昌平基地参访",
        dueDate: "2026-07-24",
        note: "",
        isMine: false,
        sortOrder: 3,
      },
      {
        id: "cl-uz-05",
        title: "确认 7/27 北京至合肥高铁及酒店入住",
        dueDate: "2026-07-24",
        note: "",
        isMine: false,
        sortOrder: 4,
      },
      {
        id: "cl-uz-06",
        title: "确认 8/5 返京及住建部展厅参访",
        dueDate: "2026-08-03",
        note: "",
        isMine: false,
        sortOrder: 5,
      },
    ];

    for (const item of checklistItems) {
      await tx.receptionChecklistItem.upsert({
        where: { id: item.id },
        create: {
          ...item,
          receptionId: uzReception.id,
          phase: "行前准备",
          ownerId: item.isMine ? "c-me" : null,
        },
        update: {
          ...item,
          receptionId: uzReception.id,
          phase: "行前准备",
          ownerId: item.isMine ? "c-me" : null,
        },
      });
    }

    await tx.receptionChecklistItem.upsert({
      where: { id: "cl-un-beijing-agenda" },
      create: {
        id: "cl-un-beijing-agenda",
        receptionId: "r-un-beijing-0713",
        phase: "行前准备",
        title: "准备调整后的半天接待议程",
        done: true,
        ownerId: "c-me",
        dueDate: "2026-07-13",
        note: "原平台讲解和探测点翻译取消。",
        isMine: true,
        sortOrder: 0,
      },
      update: { done: true },
    });

    await tx.task.update({
      where: { id: "t-un-script" },
      data: {
        title: "【已取消】联合国人居署合肥讲解与点位翻译（台风调整）",
        description:
          "原计划 7/13 合肥接待；因台风取消出差并改为北京接待。原平台及探测点翻译任务取消，替代任务为准备议程。",
        status: TaskStatus.DONE,
        dueDate: date("2026-07-13"),
      },
    });

    await tx.task.upsert({
      where: { id: "t-un-beijing-agenda-0713" },
      create: {
        id: "t-un-beijing-agenda-0713",
        title: "联合国人居署北京接待：准备议程",
        description:
          "受台风影响，原合肥出差取消并改为北京半天接待；已完成调整后的议程准备。",
        status: TaskStatus.DONE,
        priority: Priority.HIGH,
        dueDate: date("2026-07-13"),
        assigneeId: "c-me",
        typeTagId: receptionTaskType.id,
      },
      update: {
        description:
          "受台风影响，原合肥出差取消并改为北京半天接待；已完成调整后的议程准备。",
        status: TaskStatus.DONE,
        dueDate: date("2026-07-13"),
      },
    });

    await tx.task.update({
      where: { id: "t-ev-qa" },
      data: {
        title: "完成北理工回复的中英双语核验与对外发送",
        description:
          "7/13 修改北理工材料并核验是否答清客户需求，修订后发曲总；7/14 收到回复并整理中文版、继续追问；7/15 完成英文版并发新加坡。",
        status: TaskStatus.DONE,
        priority: Priority.HIGH,
        dueDate: date("2026-07-15"),
      },
    });

    const fanTask = await tx.task.findFirst({
      where: {
        OR: [
          { id: "cmreneet10001l704v9l3gax1" },
          { title: "整理樊老师资料" },
        ],
      },
    });
    if (fanTask) {
      await tx.task.update({
        where: { id: fanTask.id },
        data: {
          projectId: "p-sec",
          title: "整理樊老师缪子回复并翻译英文发 Muru",
          description:
            "7/16 上午确认客户关于缪子的提问进度，中午开会，下午整理回复并翻译成英文，已发给 Muru。",
          status: TaskStatus.DONE,
          priority: Priority.HIGH,
          dueDate: date("2026-07-16"),
          assigneeId: "c-me",
          typeTagId: taskTypeTag.id,
        },
      });
    } else {
      await tx.task.create({
        data: {
          id: "t-muon-materials-0716",
          projectId: "p-sec",
          title: "整理樊老师缪子回复并翻译英文发 Muru",
          description:
            "7/16 上午确认客户关于缪子的提问进度，中午开会，下午整理回复并翻译成英文，已发给 Muru。",
          status: TaskStatus.DONE,
          priority: Priority.HIGH,
          dueDate: date("2026-07-16"),
          assigneeId: "c-me",
          typeTagId: taskTypeTag.id,
        },
      });
    }

    await tx.task.upsert({
      where: { id: "t-muru-followup" },
      create: {
        id: "t-muru-followup",
        projectId: "p-sec",
        title: "跟进 Muru 内部讨论与 GSafety 后续会议安排",
        description:
          "Muru 表示评估材料反馈良好，将先内部讨论；继续跟踪缪子异常检测是否作为探索性研究推进，以及后续与 GSafety 的讨论时间。",
        status: TaskStatus.WAITING,
        priority: Priority.HIGH,
        assigneeId: "c-me",
        typeTagId: taskTypeTag.id,
      },
      update: {
        description:
          "Muru 表示评估材料反馈良好，将先内部讨论；继续跟踪缪子异常检测是否作为探索性研究推进，以及后续与 GSafety 的讨论时间。",
        status: TaskStatus.WAITING,
        priority: Priority.HIGH,
        assigneeId: "c-me",
      },
    });

    await tx.taskContact.upsert({
      where: {
        taskId_contactId_purpose: {
          taskId: "t-muru-followup",
          contactId: muru.id,
          purpose: TaskContactPurpose.CLIENT_CONTACT,
        },
      },
      create: {
        taskId: "t-muru-followup",
        contactId: muru.id,
        purpose: TaskContactPurpose.CLIENT_CONTACT,
      },
      update: {},
    });

    await tx.task.upsert({
      where: { id: "t-uz-tsinghua-registration" },
      create: {
        id: "t-uz-tsinghua-registration",
        projectId: uzProject.id,
        title: "完成 30 位乌兹官员清华大学入校人员报备",
        description:
          "按 Attendee 模板收集并核对姓名、手机号、国籍、证件类型/号码、单位、职务、手机携带、车牌和备注，提交清华昌平基地及主校区审核。",
        status: TaskStatus.IN_PROGRESS,
        priority: Priority.URGENT,
        dueDate: date("2026-07-24"),
        assigneeId: "c-me",
        typeTagId: receptionTaskType.id,
      },
      update: {
        description:
          "按 Attendee 模板收集并核对姓名、手机号、国籍、证件类型/号码、单位、职务、手机携带、车牌和备注，提交清华昌平基地及主校区审核。",
        status: TaskStatus.IN_PROGRESS,
        priority: Priority.URGENT,
        dueDate: date("2026-07-24"),
        assigneeId: "c-me",
      },
    });

    await tx.task.upsert({
      where: { id: "t-market-h2-forecast" },
      create: {
        id: "t-market-h2-forecast",
        title: "市场一部下半年度工作预测：完成分析并向 Leader 汇报",
        description:
          "整合三部分：乌兹住建监察局关联工作机会、越南培训机会、国家智库合作分析。计划 7/20 17:00 向 Leader 汇报。",
        status: TaskStatus.IN_PROGRESS,
        priority: Priority.HIGH,
        dueDate: date("2026-07-20"),
        assigneeId: "c-me",
        typeTagId: taskTypeTag.id,
      },
      update: {
        description:
          "整合三部分：乌兹住建监察局关联工作机会、越南培训机会、国家智库合作分析。计划 7/20 17:00 向 Leader 汇报。",
        status: TaskStatus.IN_PROGRESS,
        priority: Priority.HIGH,
        dueDate: date("2026-07-20"),
        assigneeId: "c-me",
      },
    });

    const blocks = [
      {
        id: "sb-un-beijing-0713-am",
        title: "联合国人居署北京接待：准备议程",
        date: "2026-07-13",
        startMin: 540,
        endMin: 720,
        location: "北京",
        participants: "联合国人居署",
        note: "台风调整：原合肥出差及翻译任务取消。",
        projectId: null,
      },
      {
        id: "sb-ev-review-0713-pm",
        title: "修改并核验北理工回复，修订后发曲总",
        date: "2026-07-13",
        startMin: 840,
        endMin: 1050,
        location: null,
        participants: "北理工团队、曲总",
        note: "重点判断是否真正答清客户需求并查缺补漏。",
        projectId: "p-ev",
      },
      {
        id: "sb-ev-cn-0714-am",
        title: "整理北理工回复中文版并追问未明确项",
        date: "2026-07-14",
        startMin: 540,
        endMin: 720,
        location: null,
        participants: "北理工团队",
        note: "上午收到回复后开始整理中文版。",
        projectId: "p-ev",
      },
      {
        id: "sb-ev-en-0715",
        title: "完成北理工回复英文版并发新加坡",
        date: "2026-07-15",
        startMin: 540,
        endMin: 720,
        location: null,
        participants: "新加坡项目方",
        note: "具体时段待聊天记录进一步校准。",
        projectId: "p-ev",
      },
      {
        id: "sb-muon-followup-0716-am",
        title: "询问樊老师缪子问题完成情况",
        date: "2026-07-16",
        startMin: 570,
        endMin: 600,
        location: null,
        participants: "樊老师",
        note: null,
        projectId: "p-sec",
      },
      {
        id: "sb-muon-meeting-0716-noon",
        title: "缪子客户问题讨论会",
        date: "2026-07-16",
        startMin: 690,
        endMin: 780,
        location: null,
        participants: "樊老师、项目团队",
        note: "中午会议，具体时间待聊天记录校准。",
        projectId: "p-sec",
      },
      {
        id: "sb-muon-translate-0716-pm",
        title: "整理缪子回复、翻译英文并发 Muru",
        date: "2026-07-16",
        startMin: 840,
        endMin: 1050,
        location: null,
        participants: "Muru",
        note: "下午完成并发送。",
        projectId: "p-sec",
      },
      {
        id: "sb-uz-registration-0717-am",
        title: "整理乌兹 30 人培训行程与清华入校报备",
        date: "2026-07-17",
        startMin: 540,
        endMin: 720,
        location: null,
        participants: "乌兹住建监察局代表团、清华大学",
        note: "依据 0717 版培训议程和 Attendee 模板。",
        projectId: uzProject.id,
      },
      {
        id: "sb-market-h2-0717-pm",
        title: "市场一部下半年度工作预测分析",
        date: "2026-07-17",
        startMin: 840,
        endMin: 1050,
        location: null,
        participants: "Leader",
        note: "乌兹关联机会、越南培训、国家智库三部分。",
        projectId: null,
      },
      {
        id: "sb-muru-reply-0718",
        title: "回复 Muru 缪子探索性研究问题",
        date: "2026-07-18",
        startMin: 570,
        endMin: 630,
        location: "微信",
        participants: "Muru",
        note:
          "说明长期潜力与当前货检时效技术路径限制，建议作为探索性研究继续讨论。",
        projectId: "p-sec",
      },
      {
        id: "sb-market-report-0720",
        title: "下半年度工作预测定稿并向 Leader 汇报",
        date: "2026-07-20",
        startMin: 960,
        endMin: 1050,
        location: null,
        participants: "Leader",
        note: "计划 17:00 汇报。",
        projectId: null,
      },
    ];

    for (const block of blocks) {
      await tx.scheduleBlock.upsert({
        where: { id: block.id },
        create: {
          ...block,
          date: date(block.date),
          kind: "work",
        },
        update: {
          ...block,
          date: date(block.date),
          kind: "work",
        },
      });
    }

    await tx.feedbackQuestion.update({
      where: { id: "q-ev-data" },
      data: {
        answer:
          "7/14 收到北理工回复，已整理中文版；7/15 完成英文版并发新加坡。",
        note:
          "7/13 先判断回复是否真正答清客户需求，修改并查缺补漏后发曲总；未明确项继续追问。",
        status: QuestionStatus.CONFIRMED,
      },
    });

    await tx.feedbackQuestion.update({
      where: { id: "q-muon" },
      data: {
        question:
          "Muru 询问：研究团队是否否定缪子异常检测，还是目前仅缺少证据？GSafety 是否愿意作为探索性研究继续推进？",
        answer:
          "已回复：团队长期研究该方向，并看好成本下降后的长期潜力；当前尚未找到满足货物筛查目标时效的明确技术路径，但可作为探索性研究继续讨论。",
        note:
          "7/16 整理樊老师回复并英译发 Muru；7/17 Muru 表示评估反馈良好，将先内部讨论；等待后续会议安排。",
        status: QuestionStatus.SENT,
      },
    });

    await Promise.all([
      tx.growthLog.upsert({
        where: { id: "g-ev-bilingual-0715" },
        create: {
          id: "g-ev-bilingual-0715",
          projectId: "p-ev",
          category: GrowthCategory.ACHIEVEMENT,
          title: "完成北理工技术回复的中英双语质量核验与对外交付",
          detail:
            "先判断是否真正答清客户需求，再查缺补漏、追问、整理中文版与英文版，7/15 发新加坡。",
          happenedAt: date("2026-07-15"),
        },
        update: {},
      }),
      tx.growthLog.upsert({
        where: { id: "g-muon-0716" },
        create: {
          id: "g-muon-0716",
          projectId: "p-sec",
          category: GrowthCategory.SKILL,
          title: "完成缪子技术回复的整理、英译与跨方沟通",
          detail:
            "从客户问题、专家回复到英文对外表述形成闭环，并向 Muru 清楚说明长期潜力与当前技术限制。",
          happenedAt: date("2026-07-16"),
        },
        update: {},
      }),
    ]);

    const excelType = await tx.fileType.upsert({
      where: { name: "Excel" },
      create: { name: "Excel" },
      update: {},
    });

    await tx.projectFile.upsert({
      where: { id: "f-uz-agenda-0717" },
      create: {
        id: "f-uz-agenda-0717",
        projectId: uzProject.id,
        fileTypeId: excelType.id,
        name: "Training Agenda-0717.xlsx",
        version: "0717",
        status: FileStatus.IN_REVIEW,
        note:
          "7/26-8/6 北京与合肥培训议程；Attendee 页为清华入校人员报备字段模板。",
      },
      update: {
        fileTypeId: excelType.id,
        version: "0717",
        status: FileStatus.IN_REVIEW,
        note:
          "7/26-8/6 北京与合肥培训议程；Attendee 页为清华入校人员报备字段模板。",
      },
    });

    const timelineEntries = [
      {
        id: "e-ev-0713-15",
        projectId: "p-ev",
        entityType: "WorkLog",
        action: "回复核验与交付",
        message:
          "7/13 核验北理工材料并发曲总；7/14 整理中文版并追问；7/15 完成英文版并发新加坡。",
        createdAt: dateTime("2026-07-15T17:30"),
      },
      {
        id: "e-sec-0716-18",
        projectId: "p-sec",
        entityType: "WorkLog",
        action: "缪子技术跟进",
        message:
          "7/16 整理樊老师回复并英译发 Muru；7/17 收到探索性研究问题；7/18 已回复，等待对方内部讨论和会议安排。",
        createdAt: dateTime("2026-07-18T10:00"),
      },
      {
        id: "e-uz-project-0717",
        projectId: uzProject.id,
        entityType: "Project",
        entityId: uzProject.id,
        action: "项目建立",
        message:
          "建立乌兹住建监察局 30 人赴华培训项目；Sunny 负责清华大学入校人员报备。",
        createdAt: dateTime("2026-07-17T10:00"),
      },
      {
        id: "e-uz-agenda-0717",
        projectId: uzProject.id,
        entityType: "ProjectFile",
        entityId: "f-uz-agenda-0717",
        action: "议程整理",
        message:
          "录入 Training Agenda-0717.xlsx：7/26-8/6 北京与合肥行程，并提取 Attendee 报备字段。",
        createdAt: dateTime("2026-07-17T16:00"),
      },
    ];

    for (const entry of timelineEntries) {
      await tx.timelineEvent.upsert({
        where: { id: entry.id },
        create: entry,
        update: entry,
      });
    }
  }, { maxWait: 10_000, timeout: 60_000 });

  console.log("2026-07-13 至 2026-07-20 工作记录已同步到看板。");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
