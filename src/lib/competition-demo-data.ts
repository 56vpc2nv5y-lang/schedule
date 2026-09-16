import {
  contacts,
  feedbackQuestions,
  files,
  growthLogs,
  knowledgeNotes,
  meetingReviews,
  moneyRecords,
  projects,
  receptionChecklistItems,
  receptions,
  resources,
  scheduleBlocks,
  stages,
  tasks,
  timelineEvents,
} from "@/lib/default-data";

const demoId = (value: string | undefined) => value ? `demo-${value}` : value;
const code = (prefix: string, index: number) => `${prefix}-${String(index + 1).padStart(3, "0")}`;

const contactStories = [
  ["林澜", "辰安国际业务中心", "海外项目经理", "新加坡", ["我方负责人"]],
  ["陈志远", "星港智慧交通局", "安全数字化负责人", "新加坡", ["甲方联系人"]],
  ["Aisha Rahman", "MetroLink Asia", "Operations Director", "新加坡", ["甲方联系人"]],
  ["王锐", "远航会展服务", "项目总监", "国内", ["合作方"]],
  ["Markus Vogel", "EuroSafe Consulting", "Fire Safety Advisor", "其他", ["专家顾问"]],
  ["周敏", "辰安技术支持中心", "解决方案架构师", "国内", ["我方技术"]],
  ["Nguyen Minh", "VietSecure Systems", "Country Manager", "越南", ["渠道伙伴"]],
  ["何雨欣", "辰安培训中心", "课程运营", "国内", ["培训协同"]],
  ["Farah Aziz", "Kuala Lumpur Resilience Office", "Programme Lead", "其他", ["甲方联系人"]],
  ["赵扬", "辰安市场品牌部", "海外市场经理", "国内", ["展会协同"]],
  ["黄启明", "华安检测技术", "检测工程师", "国内", ["供应商"]],
  ["Sofia Rossi", "Urban Safety Lab", "Research Partner", "其他", ["合作方"]],
] as const;

const projectStories = [
  ["P-001 新加坡地铁火灾监测优化", "Singapore Metro Fire Monitoring Improvement", "星港智慧交通局", "新加坡", "标准项目"],
  ["P-002 海外伙伴解决方案培训", "Overseas Partner Solution Training", "VietSecure Systems", "越南", "培训项目"],
  ["P-003 城市生命线平台升级", "Urban Lifeline Platform Upgrade", "Kuala Lumpur Resilience Office", "其他", "标准项目"],
  ["P-004 东南亚渠道能力建设", "SEA Channel Enablement", "MetroLink Asia", "新加坡", "培训项目"],
  ["P-005 智慧园区安全试点", "Smart Campus Safety Pilot", "Urban Safety Lab", "其他", "标准项目"],
  ["P-006 客户声音闭环专项", "Voice of Customer Closure", "星港智慧交通局", "新加坡", "标准项目"],
  ["P-007 海外方案标准化", "International Solution Standardization", "辰安国际业务中心", "国内", "标准项目"],
] as const;

const taskStories = [
  "确认客户最关心的高湿环境误报率指标",
  "整理站点历史告警样本并标注原因",
  "输出英文版技术澄清邮件",
  "与算法团队复核误报抑制方案",
  "安排客户现场访谈并记录痛点",
  "更新培训大纲中的场景化案例",
  "核算双语培训与差旅成本",
  "准备方案报价的价值说明页",
  "跟进客户对数据接口的安全顾虑",
  "汇总供应商回复并给出内部判断",
  "制作展会客户需求速记模板",
  "确认新加坡接待路线与讲解分工",
  "整理竞品对比和差异化表达",
  "把客户问题转成可追踪任务",
  "复核合同中的验收口径",
  "形成项目周报并标记下一步",
  "沉淀高湿环境排障知识卡",
  "复盘本周客户沟通的有效做法",
] as const;

const knowledgeStories = [
  ["客户痛点", "K-001 高湿环境误报排查框架", "先确认传感器部署位置、历史告警样本与环境湿度，再区分设备故障、阈值设置和算法识别问题。对外答复必须说明适用边界，不直接承诺零误报。"],
  ["国际沟通", "K-002 技术澄清邮件结构", "结论先行：复述客户关切、列出已确认事实、说明待验证项、明确责任人与回复时间。避免把内部推测写成最终结论。"],
  ["项目管理", "K-003 客户问题转任务的方法", "每个问题必须形成唯一编号，关联项目、负责人、截止日期和证据文件。收到供应商回复后仍需增加 Sunny 判断，不能直接转发。"],
  ["培训交付", "K-004 海外培训需求访谈清单", "确认受众角色、已有基础、业务场景、期望输出、语言偏好与考核方式，再决定课程深度和案例比例。"],
  ["展会运营", "K-005 展会线索分级规则", "A 类为已有明确项目与时间表；B 类为有痛点但预算未定；C 类为一般咨询。24 小时内完成记录，72 小时内完成首次跟进。"],
  ["接待", "K-006 客户参访体验检查表", "从行前信息、抵达动线、讲解重点、技术问答、会后资料五个环节检查。每个环节明确负责人和兜底方案。"],
] as const;

const resourceStories = [
  ["R-001 海外客户需求访谈模板", "公司模板", "把模糊诉求拆成场景、影响、证据、优先级和期望结果。", true],
  ["R-002 技术澄清双语邮件模板", "公司模板", "适用于客户问题确认、供应商追问和阶段性回复。", true],
  ["R-003 客户问题闭环台账说明", "工作方法", "统一问题编号、回复轮次、判断和最终答复。", true],
  ["R-004 海外培训成本核算表", "培训交付", "包含讲师、翻译、差旅、材料和预留成本。", false],
  ["R-005 新加坡客户接待手册", "接待资料", "含行程、讲解点位、联系人和应急预案。", true],
  ["R-006 Asia Safety Expo 参展清单", "展会资料", "覆盖展品、物料、线索记录与会后跟进。", false],
  ["R-007 公司对外介绍演示文稿", "公司模板", "比赛演示用匿名化版本，不含真实客户数据。", true],
  ["R-008 客户声音月度复盘模板", "工作方法", "按痛点、影响、处理动作和结果复盘。", false],
] as const;

export const competitionContacts = contacts.map((item, index) => {
  const story = contactStories[index % contactStories.length];
  return {
    ...item,
    id: demoId(item.id)!,
    name: `${code("C", index)} ${story[0]}`,
    organization: story[1],
    title: story[2],
    region: story[3],
    roles: [...story[4]],
    email: `contact${String(index + 1).padStart(2, "0")}@example-demo.com`,
    wechat: `DEMO_${String(index + 1).padStart(3, "0")}`,
  };
});

export const competitionProjects = projects.map((item, index) => {
  const story = projectStories[index % projectStories.length];
  return {
    ...item,
    id: demoId(item.id)!,
    nameZh: story[0],
    nameEn: story[1],
    clientName: story[2],
    region: story[3],
    type: story[4],
    ownerId: demoId(item.ownerId) ?? competitionContacts[0]?.id ?? "",
    clientContactIds: item.clientContactIds.map((id) => demoId(id)!),
    supplierContactIds: item.supplierContactIds.map((id) => demoId(id)!),
  };
});

export const competitionStages = stages.map((item, index) => ({
  ...item,
  id: demoId(item.id)!,
  projectId: demoId(item.projectId)!,
  name: `${code("S", index)} ${item.name}`,
  contactIds: item.contactIds.map((id) => demoId(id)!),
}));

const baseCompetitionTasks = tasks.map((item, index) => ({
  ...item,
  dueDate: `2026-09-${String(17 + (index % 10)).padStart(2, "0")}`,
  id: demoId(item.id)!,
  projectId: demoId(item.projectId) ?? "",
  stageId: demoId(item.stageId),
  assigneeId: demoId(item.assigneeId) ?? competitionContacts[index % competitionContacts.length]?.id ?? "",
  title: `${code("T", index)} ${taskStories[index % taskStories.length]}`,
}));

const extraCalendarTaskStories = [
  ["2026-09-17", "确认客户访谈提纲与参会人员"],
  ["2026-09-18", "复核英文技术回复中的适用边界"],
  ["2026-09-19", "整理展会 A 类线索并分配跟进人"],
  ["2026-09-21", "完成海外培训课件的案例替换"],
  ["2026-09-22", "与供应商确认接口安全问题回复"],
  ["2026-09-23", "演练客户接待路线与讲解衔接"],
  ["2026-09-24", "输出客户痛点与产品改进建议"],
  ["2026-09-25", "复盘项目阶段风险与下周动作"],
  ["2026-09-27", "沉淀高湿环境告警排查知识卡"],
] as const;

export const competitionTasks = [
  ...baseCompetitionTasks,
  ...extraCalendarTaskStories.map(([dueDate, title], index) => {
    const source = baseCompetitionTasks[index % baseCompetitionTasks.length]!;
    return {
      ...source,
      id: `demo-calendar-task-${String(index + 1).padStart(3, "0")}`,
      projectId: competitionProjects[index % competitionProjects.length]?.id ?? source.projectId,
      assigneeId: competitionContacts[(index + 1) % competitionContacts.length]?.id ?? source.assigneeId,
      status: (["IN_PROGRESS", "WAITING_EXTERNAL", "NOT_STARTED"] as const)[index % 3],
      dueDate,
      title: `T-${String(baseCompetitionTasks.length + index + 1).padStart(3, "0")} ${title}`,
    };
  }),
];

const fileNames = ["客户痛点访谈纪要", "技术澄清说明", "培训需求确认表", "项目报价说明", "接待讲解稿", "展会线索记录", "方案复核意见", "阶段交付清单"];
export const competitionFiles = files.map((item, index) => ({
  ...item,
  id: demoId(item.id)!,
  projectId: demoId(item.projectId)!,
  stageId: demoId(item.stageId),
  name: `${code("F", index)} ${fileNames[index % fileNames.length]}`,
  url: "",
}));

export const competitionKnowledgeNotes = knowledgeNotes.map((item, index) => {
  const story = knowledgeStories[index % knowledgeStories.length];
  return { ...item, id: demoId(item.id)!, topic: story[0], title: story[1], content: story[2], url: "", projectId: demoId(item.projectId) ?? "" };
});

export const competitionFeedbackQuestions = feedbackQuestions.map((item, index) => ({
  ...item,
  id: demoId(item.id)!,
  projectId: demoId(item.projectId)!,
  question: `${code("Q", index)} ${[
    "客户担心高温高湿环境下出现误报，如何提供可验证的说明？",
    "现有接口能否满足客户的数据安全与审计要求？",
    "培训案例是否能贴近一线运维人员的实际工作？",
    "展会后如何确保高意向线索得到及时跟进？",
  ][index % 4]}`,
  answer: [
    "已整理历史样本与测试边界，建议先完成现场参数核验，再提供分场景说明。",
    "已与技术团队确认接口权限、日志留存和数据脱敏方案。",
    "将课程调整为场景演练，并增加学员问题收集与课后行动清单。",
    "采用 A/B/C 分级并自动生成跟进任务，明确 24 小时与 72 小时节点。",
  ][index % 4],
  note: "客户痛点已转入任务台账，并保留事实、判断与待确认项。",
}));

export const competitionResources = resources.map((item, index) => {
  const story = resourceStories[index % resourceStories.length];
  return { ...item, id: demoId(item.id)!, name: story[0], category: story[1], url: "", note: story[2], important: story[3] };
});

export const competitionGrowthLogs = growthLogs.map((item, index) => ({
  ...item,
  id: demoId(item.id)!,
  title: `${code("G", index)} ${["把客户模糊诉求拆成可执行任务", "完成双语技术澄清与跨团队协同", "建立展会线索闭环方法", "沉淀海外培训交付模板"][index % 4]}`,
  detail: "通过工作台关联项目、联系人、问题、任务和资料，减少重复整理，并让客户关切能够被持续追踪。",
  projectId: demoId(item.projectId) ?? "",
}));

export const competitionMeetingReviews = meetingReviews.map((item, index) => ({
  ...item,
  id: demoId(item.id)!,
  projectId: demoId(item.projectId)!,
  title: `${code("MR", index)} ${["高湿环境误报问题闭环", "数据接口安全澄清", "培训场景适配纪要", "展会线索跟进复盘"][index % 4]}`,
  status: index === 0 ? "IN_PROGRESS" : item.status,
  rounds: item.rounds.map((round) => ({ ...round, senderId: demoId(round.senderId) ?? "", receiverId: demoId(round.receiverId) ?? "" })),
}));

export const competitionReceptions = receptions.map((item, index) => ({
  ...item,
  id: demoId(item.id)!,
  projectId: demoId(item.projectId),
  type: (["VISIT", "EXHIBITION_INVITE", "BUSINESS_TRIP"] as const)[index % 3],
  startAt: `2026-09-${String(18 + (index % 7)).padStart(2, "0")}T09:00:00`,
  endAt: `2026-09-${String(18 + (index % 7)).padStart(2, "0")}T17:30:00`,
  title: `${code("EV", index)} ${["新加坡客户技术考察接待", "Asia Safety Expo 客户邀约", "马来西亚合作伙伴拜访"][index % 3]}`,
  purpose: ["围绕客户对误报、接口与运维效率的关切安排现场交流。", "展示解决方案并收集潜在客户的真实业务痛点。", "复盘合作进展并确认下一阶段培训和项目机会。"][index % 3],
  visitorIds: item.visitorIds.map((id) => demoId(id)!),
}));

export const competitionReceptionChecklist = receptionChecklistItems.map((item, index) => ({
  ...item,
  id: demoId(item.id)!,
  receptionId: demoId(item.receptionId)!,
  title: `${code("CL", index)} ${item.title}`,
  ownerId: demoId(item.ownerId) ?? "",
}));

export const competitionTimelineEvents = timelineEvents.map((item, index) => ({
  ...item,
  id: demoId(item.id)!,
  projectId: demoId(item.projectId)!,
  message: `${code("TL", index)} ${item.message}`,
}));

export const competitionScheduleBlocks = scheduleBlocks.map((item, index) => ({
  ...item,
  id: demoId(item.id)!,
  title: `${code("CAL", index)} ${["客户痛点访谈", "技术回复复核", "海外培训筹备", "接待讲解演练", "展会线索跟进", "项目周度复盘"][index % 6]}`,
  date: `2026-09-${String(16 + (index % 10)).padStart(2, "0")}`,
  projectId: demoId((item as { projectId?: string }).projectId) ?? "",
  note: "会前查看关联项目和问题记录，会后更新结论、责任人和下一步。",
}));

export const competitionMoneyRecords = moneyRecords.map((item, index) => ({
  ...item,
  id: demoId(item.id)!,
  note: `${code("FIN", index)} ${["海外培训差旅垫付", "客户接待交通费", "展会物料采购", "差旅报销到账"][index % 4]}`,
}));

export const competitionResumePoints = [
  { id: "demo-resume-001", title: "客户问题闭环", chinese: "建立客户问题编号、跨团队协同与双语回复闭环，提升海外项目响应效率。", english: "Built a traceable customer-issue workflow across teams and bilingual communications.", sourceNote: "P-001 / Q-001", projectId: competitionProjects[0]?.id ?? "", updatedAt: "2026-09-12" },
  { id: "demo-resume-002", title: "培训交付标准化", chinese: "将海外培训需求、成本、合同和交付检查清单统一到工作台。", english: "Standardized overseas training planning, costing, contracting and delivery checklists.", sourceNote: "P-002", projectId: competitionProjects[1]?.id ?? "", updatedAt: "2026-09-10" },
  { id: "demo-resume-003", title: "客户声音沉淀", chinese: "把访谈、问题与行动记录转为可复用知识和资料模板。", english: "Converted customer conversations into reusable knowledge and delivery templates.", sourceNote: "K-001 / R-001", projectId: competitionProjects[5]?.id ?? "", updatedAt: "2026-09-08" },
];

export const competitionPromptTemplates = [
  { id: "demo-prompt-001", name: "PT-001 客户问题澄清", content: "请按事实、影响、待确认项、责任人与回复时间整理客户问题。" },
  { id: "demo-prompt-002", name: "PT-002 双语跟进邮件", content: "请生成简洁、专业、结论先行的中英文客户跟进邮件。" },
  { id: "demo-prompt-003", name: "PT-003 会议纪要转任务", content: "请提取决定、行动项、负责人、截止日期与风险。" },
];
