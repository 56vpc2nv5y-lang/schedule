import {
  FileStatus,
  GrowthCategory,
  MeetingReviewStatus,
  Priority,
  PrismaClient,
  ProjectContactSide,
  ProjectStatus,
  QuestionStatus,
  ReviewRoundStatus,
  TaskContactPurpose,
  TaskStatus,
} from "@prisma/client";

const prisma = new PrismaClient();

const date = (value: string) => new Date(`${value}T00:00:00+08:00`);
const dateTime = (value: string) => new Date(`${value}:00+08:00`);

async function main() {
  await prisma.$transaction(
    async (tx) => {
      const [
        sunny,
        xiaohui,
        wenjing,
        weiyu,
        duzong,
        shijia,
        fan,
        yuan,
        liu,
        quZong,
        farrukhbek,
      ] = await Promise.all([
        tx.contact.update({
          where: { id: "c-me" },
          data: {
            name: "章静怡（Sunny）",
            organization: "我方团队",
            title: "市场一部项目助理",
            note: "工作看板使用者；聊天记录中的 Sunny / 章静怡。",
          },
        }),
        tx.contact.update({
          where: { id: "c-xiaohui" },
          data: {
            name: "彭晓卉（Eva）",
            title: "Innovation & Partnerships Lead / Leader",
            note: "Sunny 的 Leader；负责国际合作、项目统筹和交付复核。",
          },
        }),
        tx.contact.update({
          where: { id: "c-wenjing" },
          data: {
            name: "秦文静",
            title: "市场一部同事",
            note: "参与新加坡 HTX、安全检测和接待项目协作。",
          },
        }),
        tx.contact.update({
          where: { id: "c-weiyu" },
          data: {
            name: "蔡玮郁",
            title: "市场一部同事",
          },
        }),
        tx.contact.update({
          where: { id: "c-duzong" },
          data: {
            name: "杜能熊",
            title: "部门主管 / Leader",
            note: "Sunny 的 Leader；参与方案审阅与方向判断。",
          },
        }),
        tx.contact.upsert({
          where: { id: "c-shijia" },
          create: {
            id: "c-shijia",
            name: "曹诗嘉（Shijia）",
            organization: "我方团队",
            title: "Leader",
            note: "Sunny 的 Leader；参与对外材料审阅和技术项目协调。",
          },
          update: {
            name: "曹诗嘉（Shijia）",
            organization: "我方团队",
            title: "Leader",
            note: "Sunny 的 Leader；参与对外材料审阅和技术项目协调。",
          },
        }),
        tx.contact.update({
          where: { id: "c-fan" },
          data: {
            name: "樊星明",
            organization: "高能物理 / 缪子技术团队",
            title: "负责老师",
            note: "宇宙射线缪子成像技术对接与专业审阅。",
          },
        }),
        tx.contact.upsert({
          where: { id: "c-bit-yuan" },
          create: {
            id: "c-bit-yuan",
            name: "袁博士",
            organization: "北京理工大学荧光淬灭团队",
            title: "课题负责人",
          },
          update: {
            name: "袁博士",
            organization: "北京理工大学荧光淬灭团队",
            title: "课题负责人",
          },
        }),
        tx.contact.upsert({
          where: { id: "c-bit-liu" },
          create: {
            id: "c-bit-liu",
            name: "刘博士",
            organization: "北京理工大学荧光淬灭团队",
            title: "技术对接人",
          },
          update: {
            name: "刘博士",
            organization: "北京理工大学荧光淬灭团队",
            title: "技术对接人",
          },
        }),
        tx.contact.update({
          where: { id: "c-quzong" },
          data: {
            name: "曲昌辉",
            organization: "北理新源（工商全称待确认）",
            title: "车辆预测性维保项目对接人",
            note: "聊天中称曲总；负责车辆预测能力相关回复。",
          },
        }),
        tx.contact.upsert({
          where: { id: "c-farrukhbek" },
          create: {
            id: "c-farrukhbek",
            name: "Farrukhbek",
            organization: "乌兹别克斯坦住建监察局",
            title: "项目联系人",
            note: "确认上合组织案例分享范围及信息边界。",
          },
          update: {
            organization: "乌兹别克斯坦住建监察局",
            title: "项目联系人",
            note: "确认上合组织案例分享范围及信息边界。",
          },
        }),
      ]);

      await tx.projectContact.deleteMany({
        where: {
          projectId: "p-ev",
          contactId: quZong.id,
          side: ProjectContactSide.OUR_TEAM,
        },
      });

      const projectContacts = [
        {
          projectId: "p-sec",
          contactId: sunny.id,
          side: ProjectContactSide.OUR_TEAM,
          isPrimary: true,
          note: "负责技术问题梳理、双语材料和后续客户跟踪。",
        },
        {
          projectId: "p-sec",
          contactId: xiaohui.id,
          side: ProjectContactSide.OUR_TEAM,
          isPrimary: false,
          note: "项目统筹与交付复核。",
        },
        {
          projectId: "p-sec",
          contactId: wenjing.id,
          side: ProjectContactSide.OUR_TEAM,
          isPrimary: false,
          note: "参与客户沟通、会议纪要和材料复核。",
        },
        {
          projectId: "p-sec",
          contactId: shijia.id,
          side: ProjectContactSide.OUR_TEAM,
          isPrimary: false,
          note: "参与项目协调与材料审阅。",
        },
        {
          projectId: "p-sec",
          contactId: duzong.id,
          side: ProjectContactSide.OUR_TEAM,
          isPrimary: false,
          note: "方案方向与技术表达复核。",
        },
        {
          projectId: "p-sec",
          contactId: fan.id,
          side: ProjectContactSide.SUPPLIER,
          isPrimary: true,
          note: "缪子技术负责人和专业审阅人。",
        },
        {
          projectId: "p-sec",
          contactId: yuan.id,
          side: ProjectContactSide.SUPPLIER,
          isPrimary: true,
          note: "荧光淬灭技术负责人。",
        },
        {
          projectId: "p-sec",
          contactId: liu.id,
          side: ProjectContactSide.SUPPLIER,
          isPrimary: false,
          note: "荧光淬灭技术答疑与数据补充。",
        },
        {
          projectId: "p-ev",
          contactId: sunny.id,
          side: ProjectContactSide.OUR_TEAM,
          isPrimary: true,
          note: "负责客户问题核验、中英双语整理与对外发送。",
        },
        {
          projectId: "p-ev",
          contactId: weiyu.id,
          side: ProjectContactSide.OUR_TEAM,
          isPrimary: false,
          note: "参与OA供应商新增与协议流程协作。",
        },
        {
          projectId: "p-ev",
          contactId: quZong.id,
          side: ProjectContactSide.SUPPLIER,
          isPrimary: true,
          note: "车辆预测能力和特种车辆案例回复对接。",
        },
        {
          projectId: "p-vn",
          contactId: sunny.id,
          side: ProjectContactSide.OUR_TEAM,
          isPrimary: true,
          note: "负责课程大纲与越南需求适配调研。",
        },
        {
          projectId: "p-uz-training-2026",
          contactId: farrukhbek.id,
          side: ProjectContactSide.CLIENT,
          isPrimary: true,
          note: "案例分享范围和项目信息确认。",
        },
      ];

      for (const contact of projectContacts) {
        await tx.projectContact.upsert({
          where: {
            projectId_contactId_side: {
              projectId: contact.projectId,
              contactId: contact.contactId,
              side: contact.side,
            },
          },
          create: contact,
          update: {
            isPrimary: contact.isPrimary,
            note: contact.note,
          },
        });
      }

      await Promise.all([
        tx.project.update({
          where: { id: "p-sit" },
          data: {
            status: ProjectStatus.ACTIVE,
            note:
              "对方已表达继续会面的意向，当前等待确认具体时间；不应标记为已完成。",
          },
        }),
        tx.task.update({
          where: { id: "t-sit" },
          data: {
            title: "SIT 后续合作：等待对方确认会面时间",
            description:
              "对方 7/6 表示会再找时间；当前尚未确认后续会面，保持等待反馈状态。",
            status: TaskStatus.WAITING,
            dueDate: null,
          },
        }),
        tx.task.update({
          where: { id: "t-thz" },
          data: {
            title: "等待太赫兹团队补充误报率、通行速度与场景吞吐数据",
            description:
              "已多次追问；现有材料仍缺少可直接用于客户回复的统计口径和场景化数据。收到后需先判断是否答清，再决定是否继续追问。",
            status: TaskStatus.WAITING,
            dueDate: null,
          },
        }),
      ]);

      const sourceNote =
        "来源：Sunny.docx 聊天记录；原始聊天缺少统一时间戳，日期以会议邀请和消息相对顺序校准。";

      const tasks = [
        {
          id: "t-sec-minutes-0609",
          projectId: "p-sec",
          title: "完成 6/9 新加坡安检技术交流会议纪要",
          description:
            "Sunny 记录会议主要内容，文静删减调整后提交领导审阅；后续又补入太赫兹 stationary/TDS 扫描方式反馈。",
          status: TaskStatus.DONE,
          priority: Priority.HIGH,
          dueDate: date("2026-06-09"),
        },
        {
          id: "t-sec-sessions-0629",
          projectId: "p-sec",
          title: "协调并参与 6/29 新加坡三场安检技术交流",
          description:
            "协调宇宙射线/缪子、太赫兹+荧光探测、安防推演三场交流，负责会议链接、供应商入会提醒、延时同步和会后事项跟进。",
          status: TaskStatus.DONE,
          priority: Priority.HIGH,
          dueDate: date("2026-06-29"),
        },
        {
          id: "t-sec-scenario-ppt-0629",
          projectId: "p-sec",
          title: "完成安全筛查 Scenario Analysis PPT 三稿迭代",
          description:
            "按场景地图、成熟度分层和 FABE 逻辑重构 6 个 use cases，补充监狱、边境、港口、大型活动等应用，并完成 6/29 展示版。",
          status: TaskStatus.DONE,
          priority: Priority.HIGH,
          dueDate: date("2026-06-29"),
        },
        {
          id: "t-uz-sco-case-0714",
          projectId: "p-uz-training-2026",
          title: "完成上合组织国际合作案例简要描述与乌方确认",
          description:
            "7/13 晚接受修改要求；随后完成产业合作对接需求、国际项目合作计划和乌方机构名称核验，输出清洁版并向 Farrukhbek 说明只分享总体框架、不披露课程细节和人员信息；乌方确认无异议。",
          status: TaskStatus.DONE,
          priority: Priority.HIGH,
          dueDate: date("2026-07-14"),
        },
        {
          id: "t-vn-course-outline",
          projectId: "p-vn",
          title: "完成越南公共安全培训课程大纲初稿",
          description:
            "在既有大纲基础上补充课程整体预览、具体课程安排和越南本地需求调研；聊天顺序显示发生在 7/13 前，精确日期待确认。",
          status: TaskStatus.DONE,
          priority: Priority.MEDIUM,
          dueDate: null,
        },
      ];

      for (const task of tasks) {
        await tx.task.upsert({
          where: { id: task.id },
          create: {
            ...task,
            description: `${task.description} ${sourceNote}`,
            assigneeId: sunny.id,
          },
          update: {
            ...task,
            description: `${task.description} ${sourceNote}`,
            assigneeId: sunny.id,
          },
        });
      }

      const muonTask = await tx.task.findFirst({
        where: {
          OR: [
            { id: "cmreneet10001l704v9l3gax1" },
            { id: "t-muon-materials-0716" },
          ],
        },
      });
      if (muonTask) {
        await tx.task.update({
          where: { id: muonTask.id },
          data: {
            title: "完成缪子阶段性评估、专家复核和英文发送",
            description:
              "7/15 10:50-11:50 组织樊老师团队讨论并于下午形成第一版；7/16 按专家意见修改、确认、翻译并发新加坡。7/17 收到 Muru 追问，7/18 已回复。来源：Sunny.docx 明确会议邀请及往返记录。",
            status: TaskStatus.DONE,
            priority: Priority.HIGH,
            dueDate: date("2026-07-16"),
            assigneeId: sunny.id,
          },
        });
      }

      const [wordType, pptType] = await Promise.all([
        tx.fileType.upsert({
          where: { name: "Word" },
          create: { name: "Word" },
          update: {},
        }),
        tx.fileType.upsert({
          where: { name: "PPT" },
          create: { name: "PPT" },
          update: {},
        }),
      ]);

      const files = [
        {
          id: "f-sec-minutes-0609",
          projectId: "p-sec",
          fileTypeId: wordType.id,
          name: "HTX 安检技术交流会议纪要（6月9日）.docx",
          version: "final",
          status: FileStatus.APPROVED,
          note:
            "Sunny 记录主要内容，文静调整；补入太赫兹 stationary/TDS 扫描方式反馈。",
          createdAt: dateTime("2026-06-09T18:00"),
        },
        {
          id: "f-ev-customer-response-0715",
          projectId: "p-ev",
          fileTypeId: wordType.id,
          name: "HTX 车辆预测性维保客户问题回复（中英双语）.docx",
          version: "0715-final",
          status: FileStatus.APPROVED,
          note:
            "7/13 核验并查缺补漏，7/14 整理中文版并追问，7/15 英文版发新加坡。",
          createdAt: dateTime("2026-07-15T17:30"),
        },
        {
          id: "f-sec-muon-assessment-0716",
          projectId: "p-sec",
          fileTypeId: wordType.id,
          name: "缪子异常检测阶段性技术评估（中英双语）.docx",
          version: "0716-final",
          status: FileStatus.APPROVED,
          note:
            "7/15 专家讨论和初稿，7/16 专家复核、翻译并发送新加坡。",
          createdAt: dateTime("2026-07-16T17:30"),
        },
        {
          id: "f-uz-sco-case-0714",
          projectId: "p-uz-training-2026",
          fileTypeId: wordType.id,
          name: "上合组织国际合作案例简要描述（中英文清洁版）.docx",
          version: "0714-final",
          status: FileStatus.APPROVED,
          note:
            "已核对乌方机构名称，并与 Farrukhbek 确认分享边界和项目表述。",
          createdAt: dateTime("2026-07-14T17:30"),
        },
        {
          id: "f-vn-course-outline-july",
          projectId: "p-vn",
          fileTypeId: wordType.id,
          name: "越南公共安全培训课程大纲（初稿）.docx",
          version: "v1",
          status: FileStatus.IN_REVIEW,
          note:
            "补充课程预览、课程安排和越南本地需求调研；发生于7/13前，具体日期待确认。",
          createdAt: dateTime("2026-07-12T18:00"),
        },
      ];

      for (const file of files) {
        await tx.projectFile.upsert({
          where: { id: file.id },
          create: file,
          update: {
            projectId: file.projectId,
            fileTypeId: file.fileTypeId,
            name: file.name,
            version: file.version,
            status: file.status,
            note: file.note,
            createdAt: file.createdAt,
          },
        });
      }

      await tx.projectFile.update({
        where: { id: "f-sec-ppt" },
        data: {
          fileTypeId: pptType.id,
          note:
            "5天内完成三稿迭代；6/29用于缪子、太赫兹+荧光和安防推演技术交流。",
        },
      });

      const evReview = await tx.meetingReview.upsert({
        where: { id: "mr-ev-response-0713-15" },
        create: {
          id: "mr-ev-response-0713-15",
          projectId: "p-ev",
          title: "HTX 车辆预测性维保客户问题回复审阅",
          status: MeetingReviewStatus.FINALIZED,
          finalFileId: "f-ev-customer-response-0715",
        },
        update: {
          status: MeetingReviewStatus.FINALIZED,
          finalFileId: "f-ev-customer-response-0715",
        },
      });

      const muonReview = await tx.meetingReview.upsert({
        where: { id: "mr-muon-assessment-0715-16" },
        create: {
          id: "mr-muon-assessment-0715-16",
          projectId: "p-sec",
          title: "缪子异常检测阶段性评估审阅",
          status: MeetingReviewStatus.FINALIZED,
          finalFileId: "f-sec-muon-assessment-0716",
        },
        update: {
          status: MeetingReviewStatus.FINALIZED,
          finalFileId: "f-sec-muon-assessment-0716",
        },
      });

      const reviewRounds = [
        {
          id: "mrr-ev-1",
          reviewId: evReview.id,
          roundNo: 1,
          senderContactId: sunny.id,
          receiverContactId: quZong.id,
          sentAt: dateTime("2026-07-13T17:30"),
          feedback:
            "请补充非国标车辆、ACC/CAN、协议解码、查全率/误报率和部署规模等信息。",
          status: ReviewRoundStatus.FEEDBACK_RECEIVED,
        },
        {
          id: "mrr-ev-2",
          reviewId: evReview.id,
          roundNo: 2,
          senderContactId: sunny.id,
          receiverContactId: quZong.id,
          sentAt: dateTime("2026-07-14T11:30"),
          feedback: "收到技术回复后整理中文版并继续确认未答清项。",
          status: ReviewRoundStatus.FEEDBACK_RECEIVED,
        },
        {
          id: "mrr-ev-3",
          reviewId: evReview.id,
          roundNo: 3,
          senderContactId: sunny.id,
          receiverContactId: "c-htx",
          sentAt: dateTime("2026-07-15T17:30"),
          feedback: "中英文版本完成核验并对外发送。",
          status: ReviewRoundStatus.FINALIZED,
          finalizedAt: dateTime("2026-07-15T17:30"),
        },
        {
          id: "mrr-muon-1",
          reviewId: muonReview.id,
          roundNo: 1,
          senderContactId: sunny.id,
          receiverContactId: fan.id,
          sentAt: dateTime("2026-07-15T15:30"),
          feedback:
            "樊老师确认整体专业完整，提出删除一处深度问题并修改两个专业表述。",
          status: ReviewRoundStatus.FEEDBACK_RECEIVED,
        },
        {
          id: "mrr-muon-2",
          reviewId: muonReview.id,
          roundNo: 2,
          senderContactId: sunny.id,
          receiverContactId: fan.id,
          sentAt: dateTime("2026-07-16T09:30"),
          feedback: "专家通读后确认无问题，可以翻译发送。",
          status: ReviewRoundStatus.FEEDBACK_RECEIVED,
        },
        {
          id: "mrr-muon-3",
          reviewId: muonReview.id,
          roundNo: 3,
          senderContactId: sunny.id,
          receiverContactId: "c-muru",
          sentAt: dateTime("2026-07-16T17:30"),
          feedback: "英文版已发新加坡。",
          status: ReviewRoundStatus.FINALIZED,
          finalizedAt: dateTime("2026-07-16T17:30"),
        },
      ];

      for (const round of reviewRounds) {
        await tx.meetingReviewRound.upsert({
          where: {
            reviewId_roundNo: {
              reviewId: round.reviewId,
              roundNo: round.roundNo,
            },
          },
          create: round,
          update: round,
        });
      }

      const scheduleBlocks = [
        {
          id: "sb-muon-followup-0716-am",
          title: "联系樊老师并确认缪子阶段性讨论",
          date: date("2026-07-15"),
          startMin: 570,
          endMin: 650,
          participants: "樊星明",
          note: "聊天中的会议邀请明确为7/15，修正此前按回忆记录的7/16。",
        },
        {
          id: "sb-muon-meeting-0716-noon",
          title: "宇宙射线缪子技术讨论会",
          date: date("2026-07-15"),
          startMin: 650,
          endMin: 710,
          participants: "樊星明、衡老师、徐老师、项目团队",
          note: "腾讯会议邀请：2026/07/15 10:50-11:50。",
        },
        {
          id: "sb-muon-translate-0716-pm",
          title: "整理缪子会议内容并形成第一版客户回复",
          date: date("2026-07-15"),
          startMin: 840,
          endMin: 1050,
          participants: "樊星明",
          note: "会后结合文献起草，提交专家审阅。",
        },
        {
          id: "sb-muon-review-0716-am",
          title: "按专家意见修改缪子阶段性评估并复核",
          date: date("2026-07-16"),
          startMin: 540,
          endMin: 720,
          participants: "樊星明",
          note: "上午提交修改稿，专家通读确认无问题。",
        },
        {
          id: "sb-muon-translate-0716-pm-final",
          title: "翻译缪子阶段性评估并发新加坡",
          date: date("2026-07-16"),
          startMin: 840,
          endMin: 1050,
          participants: "新加坡 HTX、Muru",
          note: "专家确认后完成英文版并发送。",
        },
      ];

      for (const block of scheduleBlocks) {
        await tx.scheduleBlock.upsert({
          where: { id: block.id },
          create: {
            ...block,
            kind: "work",
            projectId: "p-sec",
          },
          update: {
            ...block,
            kind: "work",
            projectId: "p-sec",
          },
        });
      }

      await Promise.all([
        tx.feedbackQuestion.update({
          where: { id: "q-thz" },
          data: {
            note:
              "已多次向太赫兹团队追问；仍缺误报率、通行速度、实际项目吞吐规模等统一统计口径，收到后需要继续核验。",
            status: QuestionStatus.UNCLEAR,
          },
        }),
        tx.feedbackQuestion.update({
          where: { id: "q-muon" },
          data: {
            note:
              "7/15组织专家讨论并起草；7/16确认、翻译并发送；7/17 Muru追问探索性研究意愿；7/18已回复，等待其内部讨论和后续会议。",
            status: QuestionStatus.SENT,
          },
        }),
      ]);

      await Promise.all([
        tx.knowledgeNote.update({
          where: { id: "k-muon" },
          data: {
            title: "缪子异常检测：当前边界与探索方向",
            content:
              "缪子适合大型、高密度或长时间停留目标的无损检测。大面积探测器可提升粒子采集效率，但目前没有公开实测证据证明可把货检异常判断压缩到10-20秒。团队看好长期潜力，并愿意作为长期探索性研究推进；对客表达需同时说明潜力与当前证据边界。",
          },
        }),
        tx.knowledgeNote.update({
          where: { id: "k-fluor" },
          data: {
            title: "荧光淬灭爆炸物检测：已确认指标与待研究方向",
            content:
              "北理工团队确认的现有场景指标：机场安检门，单通道约6-8秒/人，报警比例约1/15000。含氯类爆炸物和毒品检测仍应表述为后续材料设计、传感膜/涂层、样本数据和算法验证方向，不能写成已有成熟能力。",
          },
        }),
        tx.knowledgeNote.update({
          where: { id: "k-ev" },
          data: {
            title: "车辆预测性维保：已确认能力边界",
            content:
              "北理工车辆团队回复：阈值模型通常可提前0.5-1天，数据驱动模型约7-30天，具体取决于车型、电池类型和管理策略；新故障一般需要调试模型但不必完全重训；已测试部分欧美品牌（含特斯拉）；支持纯电和混动车，不支持燃油车。对外使用前仍需说明样本口径和实车验证范围。",
          },
        }),
        tx.knowledgeNote.upsert({
          where: { id: "k-client-response-workflow" },
          create: {
            id: "k-client-response-workflow",
            topic: "工作方法",
            title: "技术回复交付：翻译前先核验是否真正答清",
            content:
              "标准流程：拆解客户原始问题 → 对照供应商回复逐项判断是否答到、是否答清 → 标出缺口和统计口径 → 追问或开会 → 中文版内部复核 → 英文版对外发送 → 记录后续反馈。翻译是最后一步，不等于完成技术判断。",
          },
          update: {
            content:
              "标准流程：拆解客户原始问题 → 对照供应商回复逐项判断是否答到、是否答清 → 标出缺口和统计口径 → 追问或开会 → 中文版内部复核 → 英文版对外发送 → 记录后续反馈。翻译是最后一步，不等于完成技术判断。",
          },
        }),
        tx.knowledgeNote.upsert({
          where: { id: "k-commercial-pricing-boundary" },
          create: {
            id: "k-commercial-pricing-boundary",
            topic: "商务/流程",
            title: "供应商价格与客户报价的沟通边界",
            content:
              "不能把供应商给出的价格直接转述给客户，也不要在信息不完整时轻易报价。供应商成本、我方利润和客户报价是不同层级；会议中不确定时先记录并回到内部确认。",
          },
          update: {
            content:
              "不能把供应商给出的价格直接转述给客户，也不要在信息不完整时轻易报价。供应商成本、我方利润和客户报价是不同层级；会议中不确定时先记录并回到内部确认。",
          },
        }),
      ]);

      await Promise.all([
        tx.growthLog.upsert({
          where: { id: "g-sec-minutes-0609" },
          create: {
            id: "g-sec-minutes-0609",
            projectId: "p-sec",
            category: GrowthCategory.SKILL,
            title: "独立记录并迭代新加坡安检技术交流会议纪要",
            detail:
              "6/9记录主要内容，吸收文静和技术团队反馈，补齐stationary/TDS扫描方式并形成可审阅版本。",
            happenedAt: date("2026-06-09"),
          },
          update: {},
        }),
        tx.growthLog.upsert({
          where: { id: "g-uz-sco-0714" },
          create: {
            id: "g-uz-sco-0714",
            projectId: "p-uz-training-2026",
            category: GrowthCategory.ACHIEVEMENT,
            title: "完成上合组织国际合作案例双语材料与乌方确认",
            detail:
              "完成机构信息核验、材料清洁版、英文沟通和保密边界说明，并获得乌方确认。",
            happenedAt: date("2026-07-14"),
          },
          update: {},
        }),
        tx.growthLog.update({
          where: { id: "g-muon-0716" },
          data: {
            title: "完成缪子技术评估的专家复核、英译与对外沟通",
            detail:
              "7/15组织技术讨论并形成初稿，7/16按专家反馈定稿和英译，7/18回应Muru探索性研究追问。",
            happenedAt: date("2026-07-16"),
          },
        }),
      ]);

      const timelineEntries = [
        {
          id: "e-sec-0609-minutes",
          projectId: "p-sec",
          entityType: "ProjectFile",
          entityId: "f-sec-minutes-0609",
          action: "会议纪要",
          message:
            "完成6/9新加坡安检技术交流会议纪要；记录主要内容并吸收文静、太赫兹团队反馈。",
          createdAt: dateTime("2026-06-09T18:00"),
        },
        {
          id: "e-sec-0629-sessions",
          projectId: "p-sec",
          entityType: "WorkLog",
          action: "技术交流与方案展示",
          message:
            "协调并参与缪子、太赫兹+荧光、安防推演三场新加坡技术交流，完成Scenario Analysis PPT展示与会后跟进。",
          createdAt: dateTime("2026-06-29T18:30"),
        },
        {
          id: "e-uz-sco-0714",
          projectId: "p-uz-training-2026",
          entityType: "ProjectFile",
          entityId: "f-uz-sco-case-0714",
          action: "国际合作案例",
          message:
            "完成上合组织案例简要描述、乌方机构信息核验、英文沟通和分享边界确认；Farrukhbek确认无异议。",
          createdAt: dateTime("2026-07-14T17:30"),
        },
        {
          id: "e-sec-0716-18",
          projectId: "p-sec",
          entityType: "WorkLog",
          action: "缪子技术跟进",
          message:
            "7/15组织樊老师团队讨论并完成初稿；7/16专家复核、英译并发新加坡；7/17收到Muru探索性研究追问；7/18已回复，等待内部讨论。",
          createdAt: dateTime("2026-07-18T10:00"),
        },
      ];

      for (const entry of timelineEntries) {
        await tx.timelineEvent.upsert({
          where: { id: entry.id },
          create: entry,
          update: entry,
        });
      }

      await tx.taskContact.upsert({
        where: {
          taskId_contactId_purpose: {
            taskId: "t-sit",
            contactId: "c-sit",
            purpose: TaskContactPurpose.CLIENT_CONTACT,
          },
        },
        create: {
          taskId: "t-sit",
          contactId: "c-sit",
          purpose: TaskContactPurpose.CLIENT_CONTACT,
        },
        update: {},
      });
    },
    { maxWait: 10_000, timeout: 60_000 },
  );

  console.log(
    "Sunny.docx 高置信工作记录、日期修正、交付件和审阅轮次已同步。",
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
