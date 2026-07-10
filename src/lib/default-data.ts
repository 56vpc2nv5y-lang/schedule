export const defaultStageTemplate = {
  name: "标准技术合作项目模板",
  isDefault: true,
  items: [
    {
      sortOrder: 1,
      name: "商机/需求对接",
      description: "客户提出需求或我方主动匹配供应商",
    },
    { sortOrder: 2, name: "供应商匹配与方案沟通" },
    { sortOrder: 3, name: "报价/预算沟通" },
    { sortOrder: 4, name: "技术方案/PPT 制作与审查" },
    { sortOrder: 5, name: "甲方会议 + 供应商会议" },
    {
      sortOrder: 6,
      name: "会议纪要与问题反馈循环",
      description: "多轮往返：问题清单、翻译、判断回复、追问",
    },
    { sortOrder: 7, name: "协议谈判/法务审批" },
    { sortOrder: 8, name: "合同签署" },
    { sortOrder: 9, name: "项目实施/交付跟进" },
    { sortOrder: 10, name: "验收" },
    { sortOrder: 11, name: "售后维护/年度回访" },
    { sortOrder: 12, name: "归档/复盘" },
  ],
};

export const regions = ["新加坡", "澳门", "越南", "国内", "其他"];

export const taskTypes = [
  "商务沟通",
  "甲方会议",
  "供应商会议",
  "甲方邮件问题",
  "供应商文件问题",
  "PPT制作翻译审查",
  "会议纪要循环校对",
  "合同跟进",
  "交付跟进",
  "验收跟进",
  "售后跟进",
  "接待安排",
  "展会邀请函",
  "文档翻译",
  "口译/交传",
  "背景资料搜集",
  "行政/报销",
  "内部流程",
];

// ── 流程模板：一键生成一组任务（offset 为相对开始日期的天数）──
export const workflowTemplates = [
  {
    key: "reimburse",
    name: "报销",
    items: [
      { title: "整理发票、行程单、票据拍照", offset: 0 },
      { title: "OA 提交报销申请", offset: 1 },
      { title: "跟进主管/财务审批", offset: 3 },
      { title: "确认报销到账", offset: 14 },
    ],
  },
  {
    key: "trip-apply",
    name: "出差申请",
    items: [
      { title: "OA 提交出差申请单", offset: 0 },
      { title: "预订车票/机票与酒店", offset: 1 },
      { title: "准备出差材料与议程", offset: 2 },
      { title: "出差结束后走报销流程", offset: 7 },
    ],
  },
  {
    key: "car-apply",
    name: "用车申请",
    items: [
      { title: "OA 提交用车申请（时间/路线/人数）", offset: 0 },
      { title: "确认司机与车辆信息", offset: 1 },
      { title: "行程前一天与司机确认时间地点", offset: 2 },
    ],
  },
  {
    key: "supplier-add",
    name: "供应商新增（OA）",
    items: [
      { title: "收集供应商资质与盖章文件", offset: 0 },
      { title: "OA 新增供应商/客户信息", offset: 1 },
      { title: "跟进 OA 审批并确认共享权限", offset: 5 },
    ],
  },
  {
    key: "reception-full",
    name: "接待全流程",
    items: [
      { title: "确认议程并制作桌牌", offset: 0 },
      { title: "预订饭店与酒店", offset: 1 },
      { title: "安排车辆路线 / 提交用车申请", offset: 1 },
      { title: "确认接机/送机与酒店入住", offset: 2 },
      { title: "准备伴手礼与讲解材料", offset: 3 },
      { title: "接待结束整理照片纪要并报销", offset: 7 },
    ],
  },
  {
    key: "invitation",
    name: "邀请函批量发放",
    items: [
      { title: "整理受邀人名单与邮箱", offset: 0 },
      { title: "用模板生成邀请函（可用 AI 助手）", offset: 1 },
      { title: "逐一发送并登记回复", offset: 2 },
      { title: "汇总确认名单", offset: 7 },
    ],
  },
] as const;

// 问题反馈清单的状态文案
export const questionStatusMeta = {
  OPEN: { label: "待发出", tone: "neutral" as const },
  SENT: { label: "已发供应商", tone: "waiting" as const },
  ANSWERED: { label: "已回复待判断", tone: "info" as const },
  UNCLEAR: { label: "不清楚需追问", tone: "risk" as const },
  NEED_MEETING: { label: "需开会讲解", tone: "risk" as const },
  CONFIRMED: { label: "已确认", tone: "done" as const },
};
export type QuestionStatusKey = keyof typeof questionStatusMeta;

export const knowledgeTopics = [
  "电动汽车维保",
  "荧光检测",
  "叠氮酸检测",
  "太赫兹",
  "缪子/中微子",
  "商务/流程",
  "其他",
];

export const knowledgeNotes = [
  {
    id: "k-thz",
    topic: "太赫兹",
    title: "太赫兹安检的基本原理与关键指标",
    content:
      "太赫兹波介于微波与红外之间，能穿透衣物但对人体无电离伤害，用于人体安检成像。关键指标：分辨率、成像速度、误报率、通行速度。英文：Terahertz (THz) imaging。",
    url: "",
    projectId: "p-sec",
  },
  {
    id: "k-muon",
    topic: "缪子/中微子",
    title: "缪子成像（Muon Tomography）一句话解释",
    content:
      "宇宙射线中的缪子穿透力极强，通过测量缪子穿过物体后的散射角，可以给集装箱/建筑内部做“CT”，无需辐射源。适合大型集装箱查验。团队：中科大（樊老师）。",
    url: "",
    projectId: "p-sec",
  },
  {
    id: "k-fluor",
    topic: "荧光检测",
    title: "荧光标记检测要点（交传备用）",
    content:
      "利用荧光标记物与目标物质结合后的特征光谱做痕量检测，灵敏度高、响应快。交传常用词：fluorescence labeling 荧光标记、trace detection 痕量检测、sensitivity 灵敏度、false positive 误报。",
    url: "",
    projectId: "p-sec",
  },
  {
    id: "k-azide",
    topic: "叠氮酸检测",
    title: "叠氮酸（HN3）检测背景",
    content:
      "叠氮酸及叠氮化物属于高危易爆物质，检测重点是低浓度快速识别。英文：hydrazoic acid / azide detection。北理工团队负责。",
    url: "",
    projectId: "p-sec",
  },
  {
    id: "k-ev",
    topic: "电动汽车维保",
    title: "预测性维保（PHM）核心概念",
    content:
      "通过电池/电机/整车数据预测故障，提前维保而非坏了再修。关键词：Predictive Maintenance、PHM (Prognostics and Health Management)、SOH 电池健康度、RUL 剩余寿命。北理工（北理新源）有全国新能源车大数据平台优势。",
    url: "",
    projectId: "p-ev",
  },
  {
    id: "k-htx",
    topic: "商务/流程",
    title: "HTX 与 MHA 的关系（开会/写材料常用）",
    content:
      "MHA = 新加坡内政部（Ministry of Home Affairs），HTX = 内政科技局（Home Team Science and Technology Agency），隶属 MHA，负责为警察、民防等 Home Team 部门做科技赋能。给团队介绍场景时按 Home Team 各部门的业务需求来梳理。",
    url: "",
    projectId: "p-sec",
  },
  {
    id: "k-oa",
    topic: "商务/流程",
    title: "OA 新增供应商所需材料清单",
    content:
      "营业执照副本、开户许可证、法人身份证复印件（盖章）、银行账户信息。流程：收集盖章文件 → OA 录入 → 审批 → 共享给同事。注意：没有权限时先请同事代办，之后共享客户。",
    url: "",
    projectId: "p-ev",
  },
] as const;

export const feedbackQuestions = [
  {
    id: "q-muon",
    projectId: "p-sec",
    source: "甲方",
    question: "新加坡方对缪子技术的专业困惑与学术材料确认（多条汇总）",
    answer: "",
    note: "0707 已催樊老师，对方表示还在继续分析",
    status: "SENT",
  },
  {
    id: "q-thz",
    projectId: "p-sec",
    source: "甲方",
    question: "太赫兹成像的误报率与通行速度具体指标？",
    answer: "第二轮回复仍是定性描述，没给出具体数值。",
    note: "需第三次追问：要具体数值和测试条件，不行就安排会议",
    status: "UNCLEAR",
  },
  {
    id: "q-ev-data",
    projectId: "p-ev",
    source: "甲方",
    question: "HTX 0706 新一轮问题：维保模型所需的车辆数据接口与采集频率清单",
    answer: "",
    note: "0707 已整理成问题反馈明细发北理工团队",
    status: "SENT",
  },
  {
    id: "q-ev-export",
    projectId: "p-ev",
    source: "供应商",
    question: "北理工问：新加坡车辆数据能否出境用于模型训练？",
    answer: "拿不准，涉及数据跨境合规。",
    note: "表述为「需与 HTX 确认后回复」，下次会议提出",
    status: "NEED_MEETING",
  },
] as const;

export const contactRoles = [
  "甲方对接人",
  "供应商对接人",
  "我方团队",
  "来访嘉宾",
];

export const fileTypes = [
  "会议纪要",
  "问题反馈清单",
  "PPT",
  "合同/协议",
  "验收单",
  "邀请函",
  "Brochure",
  "讲解词",
];

export const fileStatuses = [
  { value: "DRAFT", label: "草稿" },
  { value: "IN_REVIEW", label: "审阅中" },
  { value: "APPROVED", label: "已定稿" },
  { value: "ARCHIVED", label: "已归档" },
] as const;

export const stageStatuses = [
  { value: "NOT_STARTED", label: "未开始" },
  { value: "IN_PROGRESS", label: "进行中" },
  { value: "COMPLETED", label: "已完成" },
  { value: "DELAYED", label: "已延期" },
] as const;

export type ReceptionType = "VISIT" | "EXHIBITION_INVITE" | "BUSINESS_TRIP";

// 接待安排分三类，界面文案和字段含义按类型区分
export const receptionTypeMeta: Record<
  ReceptionType,
  { label: string; short: string; locationLabel: string; peopleLabel: string }
> = {
  BUSINESS_TRIP: {
    label: "我方出差",
    short: "出差",
    locationLabel: "出差目的地",
    peopleLabel: "拜访对象 / 随行人员",
  },
  VISIT: {
    label: "接待外方来访",
    short: "接待",
    locationLabel: "接待地点",
    peopleLabel: "来访嘉宾",
  },
  EXHIBITION_INVITE: {
    label: "展会邀请",
    short: "展会",
    locationLabel: "展会地点",
    peopleLabel: "受邀嘉宾",
  },
};

export const receptionStatuses = [
  { value: "PLANNED", label: "计划中" },
  { value: "CONFIRMED", label: "已确认" },
  { value: "DONE", label: "已完成" },
  { value: "CANCELLED", label: "已取消" },
] as const;

// 资料库分类：涵盖公司模板、报销、接待、流程制度等常用参考资料
export const resourceCategories = [
  "公司模板",
  "报销",
  "接待讲解",
  "流程制度",
  "对外资料",
  "其他",
];

export const resources = [
  {
    id: "res-ppt",
    name: "辰安对外 PPT 模板（含封面/图表页）",
    category: "公司模板",
    url: "",
    note: "翻译北理工 PPT 后统一调成这套模板",
    important: true,
    updatedAt: "2026-06-15",
  },
  {
    id: "res-reimburse-flow",
    name: "差旅报销流程说明",
    category: "报销",
    url: "",
    note: "出差回来：线上申请→贴票→主管审批",
    important: true,
    updatedAt: "2026-06-20",
  },
  {
    id: "res-script",
    name: "清华合肥院平台英文讲解稿（我负责的两个点位）",
    category: "接待讲解",
    url: "",
    note: "0713 联合国人居署接待用，可背诵版 + 另外三个点位翻译要点",
    important: true,
    updatedAt: "2026-07-08",
  },
  {
    id: "res-mha",
    name: "MHA 组织架构介绍 + HTX 所需场景梳理",
    category: "对外资料",
    url: "",
    note: "给中科缪子团队介绍甲方背景用，其他新团队也可复用",
    important: true,
    updatedAt: "2026-06-25",
  },
  {
    id: "res-brochure",
    name: "公司 Brochure（对外宣传册）",
    category: "对外资料",
    url: "",
    note: "发给潜在甲方/供应商",
    important: false,
    updatedAt: "2026-05-10",
  },
] as const;

// 成长档案分类：为职业发展/跳槽积累素材
export type GrowthCategory =
  | "ACHIEVEMENT"
  | "SKILL"
  | "LESSON"
  | "CERTIFICATE"
  | "NETWORK";

export const growthCategoryMeta: Record<
  GrowthCategory,
  { label: string; hint: string; tone: "active" | "info" | "waiting" | "done" | "neutral" }
> = {
  ACHIEVEMENT: {
    label: "成果亮点",
    hint: "能直接写进简历的一句话成果，最好带数字",
    tone: "active",
  },
  SKILL: {
    label: "技能积累",
    hint: "新学会的硬技能/软技能，如商务谈判、双语纪要",
    tone: "info",
  },
  LESSON: {
    label: "复盘教训",
    hint: "踩过的坑和下次的改进办法",
    tone: "waiting",
  },
  CERTIFICATE: {
    label: "证书培训",
    hint: "考下的证书、参加的培训",
    tone: "done",
  },
  NETWORK: {
    label: "人脉资源",
    hint: "值得长期维护的行业联系人和渠道",
    tone: "neutral",
  },
};

export const growthLogs = [
  {
    id: "g1",
    category: "ACHIEVEMENT" as GrowthCategory,
    title: "入职第 3 天独立完成荧光检测项目的中英交传",
    detail:
      "新加坡方提问→翻译给老师→老师回答→翻译回英文，全程无卡顿，会后获领导认可。",
    projectId: "p-sec",
    happenedAt: "2026-06-05",
  },
  {
    id: "g2",
    category: "ACHIEVEMENT" as GrowthCategory,
    title: "0618 北理工三方会议当天完成双语会议纪要并发送新加坡",
    detail: "线下会议结束当晚定稿发出，甲方零催促。",
    projectId: "p-ev",
    happenedAt: "2026-06-18",
  },
  {
    id: "g3",
    category: "ACHIEVEMENT" as GrowthCategory,
    title: "5 天内完成 scenario analysis PPT 三稿迭代",
    detail:
      "0623 接任务，0626/0627/0628 连出三稿，0629 由部门主管在对新加坡会议上展示。",
    projectId: "p-sec",
    happenedAt: "2026-06-28",
  },
  {
    id: "g4",
    category: "ACHIEVEMENT" as GrowthCategory,
    title: "独立执行 5 天外宾接待全流程（澳门工程学会+新加坡理工）",
    detail: "议程、桌牌、饭店酒店、车辆路线、接机送机、伴手礼全链路无差错。",
    projectId: "",
    happenedAt: "2026-07-02",
  },
  {
    id: "g5",
    category: "SKILL" as GrowthCategory,
    title: "掌握 OA 供应商新增与协议法务审批全流程",
    detail: "战略协议+保密协议：团队审核→法务审批→双方盖章回寄→OA 录入供应商。",
    projectId: "p-ev",
    happenedAt: "2026-07-07",
  },
  {
    id: "g6",
    category: "LESSON" as GrowthCategory,
    title: "问题清单要判断“回答了”和“答清楚了”是两回事",
    detail:
      "太赫兹团队两轮回复都没给具体指标。教训：转发前先自己判断，不清楚的当轮就追问，别等甲方发现。",
    projectId: "p-sec",
    happenedAt: "2026-06-22",
  },
] as const;

export type ProjectStatus = "ACTIVE" | "PAUSED" | "COMPLETED" | "ARCHIVED";
export type StageStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "DELAYED";
export type TaskStatus =
  | "TODO"
  | "IN_PROGRESS"
  | "WAITING"
  | "DONE"
  | "OVERDUE";
export type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

// ── 联系人（示例名可在联系人库里改）───────────────────────
export const contacts = [
  {
    id: "c-me",
    name: "我（立早）",
    organization: "我方团队",
    title: "项目助理",
    region: "国内",
    email: "zaozhang146@gmail.com",
    wechat: "",
    roles: ["我方团队"],
  },
  {
    id: "c-wenjing",
    name: "文静",
    organization: "我方团队",
    title: "同事（参访项目负责人）",
    region: "国内",
    email: "",
    wechat: "",
    roles: ["我方团队"],
  },
  {
    id: "c-weiyu",
    name: "玮郁",
    organization: "我方团队",
    title: "同事",
    region: "国内",
    email: "",
    wechat: "",
    roles: ["我方团队"],
  },
  {
    id: "c-xiaohui",
    name: "晓卉姐",
    organization: "我方团队",
    title: "领导",
    region: "国内",
    email: "",
    wechat: "",
    roles: ["我方团队"],
  },
  {
    id: "c-duzong",
    name: "杜总",
    organization: "我方团队",
    title: "部门主管",
    region: "国内",
    email: "",
    wechat: "",
    roles: ["我方团队"],
  },
  {
    id: "c-htx",
    name: "HTX 对接人（补姓名）",
    organization: "新加坡 HTX（内政科技局）",
    title: "项目官员",
    region: "新加坡",
    email: "",
    wechat: "",
    roles: ["甲方对接人"],
  },
  {
    id: "c-bit-v",
    name: "北理工车辆团队老师",
    organization: "北京理工大学（北理新源）",
    title: "课题负责人",
    region: "国内",
    email: "",
    wechat: "",
    roles: ["供应商对接人"],
  },
  {
    id: "c-bit-f",
    name: "荧光/叠氮酸团队老师",
    organization: "北京理工大学",
    title: "课题负责人",
    region: "国内",
    email: "",
    wechat: "",
    roles: ["供应商对接人"],
  },
  {
    id: "c-thz",
    name: "太赫兹团队老师",
    organization: "中国科学技术大学",
    title: "课题负责人",
    region: "国内",
    email: "",
    wechat: "",
    roles: ["供应商对接人"],
  },
  {
    id: "c-fan",
    name: "樊老师",
    organization: "中科大缪子团队",
    title: "负责老师",
    region: "国内",
    email: "",
    wechat: "",
    roles: ["供应商对接人"],
  },
  {
    id: "c-macau",
    name: "澳门工程学会理事长",
    organization: "澳门工程学会",
    title: "理事长",
    region: "澳门",
    email: "",
    wechat: "",
    roles: ["来访嘉宾"],
  },
  {
    id: "c-sit",
    name: "新加坡理工教授",
    organization: "新加坡理工大学（SIT）",
    title: "教授",
    region: "新加坡",
    email: "",
    wechat: "",
    roles: ["来访嘉宾", "甲方对接人"],
  },
] as const;

// ── 项目 ──────────────────────────────────────────────────
export const projects = [
  {
    id: "p-ev",
    nameZh: "电动汽车预测性维保",
    nameEn: "EV Predictive Maintenance",
    clientName: "新加坡 HTX",
    region: "新加坡",
    type: "标准项目",
    status: "ACTIVE" as ProjectStatus,
    plannedStart: "2026-06-04",
    plannedEnd: "2026-12-31",
    ownerId: "c-me",
    clientContactIds: ["c-htx"],
    supplierContactIds: ["c-bit-v"],
    progress: 45,
  },
  {
    id: "p-sec",
    nameZh: "安全检测多技术合作",
    nameEn: "Security Screening Technologies",
    clientName: "新加坡 HTX",
    region: "新加坡",
    type: "标准项目",
    status: "ACTIVE" as ProjectStatus,
    plannedStart: "2026-06-03",
    plannedEnd: "2027-01-31",
    ownerId: "c-me",
    clientContactIds: ["c-htx"],
    supplierContactIds: ["c-bit-f", "c-thz", "c-fan"],
    progress: 40,
  },
  {
    id: "p-visit",
    nameZh: "11月新加坡局长参访（北京/合肥）",
    nameEn: "Nov Delegation Visit (Beijing/Hefei)",
    clientName: "新加坡 HTX",
    region: "新加坡",
    type: "接待/展会专项",
    status: "ACTIVE" as ProjectStatus,
    plannedStart: "2026-07-01",
    plannedEnd: "2026-11-30",
    ownerId: "c-wenjing",
    clientContactIds: ["c-htx"],
    supplierContactIds: [],
    progress: 15,
  },
  {
    id: "p-invite",
    nameZh: "11月合作伙伴来访邀请函",
    nameEn: "Nov Partners Invitations",
    clientName: "多国客户",
    region: "其他",
    type: "接待/展会专项",
    status: "ACTIVE" as ProjectStatus,
    plannedStart: "2026-07-01",
    plannedEnd: "2026-11-15",
    ownerId: "c-me",
    clientContactIds: [],
    supplierContactIds: [],
    progress: 10,
  },
  {
    id: "p-vn",
    nameZh: "越南培训提案",
    nameEn: "Vietnam Training Proposal",
    clientName: "越南客户",
    region: "越南",
    type: "标准项目",
    status: "PAUSED" as ProjectStatus,
    plannedStart: "2026-06-30",
    plannedEnd: "2026-12-31",
    ownerId: "c-xiaohui",
    clientContactIds: [],
    supplierContactIds: [],
    progress: 5,
  },
  {
    id: "p-sit",
    nameZh: "SIT 后续合作跟进",
    nameEn: "SIT Follow-up",
    clientName: "新加坡理工大学",
    region: "新加坡",
    type: "标准项目",
    status: "ACTIVE" as ProjectStatus,
    plannedStart: "2026-06-30",
    plannedEnd: "2026-12-31",
    ownerId: "c-me",
    clientContactIds: ["c-sit"],
    supplierContactIds: [],
    progress: 8,
  },
] as const;

// ── 项目阶段（甘特图数据源）───────────────────────────────
export const stages = [
  // 电动汽车预测性维保
  {
    id: "s-ev-1",
    projectId: "p-ev",
    name: "商机/需求对接",
    sortOrder: 1,
    plannedStart: "2026-06-04",
    plannedEnd: "2026-06-10",
    status: "COMPLETED" as StageStatus,
    contactIds: ["c-htx"],
  },
  {
    id: "s-ev-4",
    projectId: "p-ev",
    name: "技术方案/PPT 制作与审查",
    sortOrder: 4,
    plannedStart: "2026-06-11",
    plannedEnd: "2026-06-17",
    status: "COMPLETED" as StageStatus,
    contactIds: ["c-bit-v"],
  },
  {
    id: "s-ev-5",
    projectId: "p-ev",
    name: "北理工三方会议",
    sortOrder: 5,
    plannedStart: "2026-06-18",
    plannedEnd: "2026-06-18",
    status: "COMPLETED" as StageStatus,
    contactIds: ["c-htx", "c-bit-v"],
  },
  {
    id: "s-ev-6",
    projectId: "p-ev",
    name: "会议纪要与问题反馈循环",
    sortOrder: 6,
    plannedStart: "2026-06-18",
    plannedEnd: "2026-07-20",
    status: "IN_PROGRESS" as StageStatus,
    contactIds: ["c-htx", "c-bit-v"],
  },
  {
    id: "s-ev-7",
    projectId: "p-ev",
    name: "战略+保密协议法务审批",
    sortOrder: 7,
    plannedStart: "2026-07-01",
    plannedEnd: "2026-07-20",
    status: "IN_PROGRESS" as StageStatus,
    contactIds: ["c-bit-v"],
  },
  {
    id: "s-ev-8",
    projectId: "p-ev",
    name: "合同签署",
    sortOrder: 8,
    plannedStart: "2026-07-21",
    plannedEnd: "2026-08-10",
    status: "NOT_STARTED" as StageStatus,
    contactIds: [],
  },
  {
    id: "s-ev-9",
    projectId: "p-ev",
    name: "项目实施/交付跟进",
    sortOrder: 9,
    plannedStart: "2026-08-11",
    plannedEnd: "2026-12-20",
    status: "NOT_STARTED" as StageStatus,
    contactIds: [],
  },

  // 安全检测多技术合作
  {
    id: "s-sec-1",
    projectId: "p-sec",
    name: "商机/需求对接",
    sortOrder: 1,
    plannedStart: "2026-06-03",
    plannedEnd: "2026-06-08",
    status: "COMPLETED" as StageStatus,
    contactIds: ["c-htx"],
  },
  {
    id: "s-sec-2",
    projectId: "p-sec",
    name: "供应商匹配（缪子团队新增）",
    sortOrder: 2,
    plannedStart: "2026-06-25",
    plannedEnd: "2026-06-30",
    status: "COMPLETED" as StageStatus,
    contactIds: ["c-fan"],
  },
  {
    id: "s-sec-4",
    projectId: "p-sec",
    name: "Scenario Analysis PPT",
    sortOrder: 4,
    plannedStart: "2026-06-23",
    plannedEnd: "2026-06-29",
    status: "COMPLETED" as StageStatus,
    contactIds: ["c-duzong"],
  },
  {
    id: "s-sec-5",
    projectId: "p-sec",
    name: "三方会议（两轮）",
    sortOrder: 5,
    plannedStart: "2026-06-09",
    plannedEnd: "2026-06-29",
    status: "COMPLETED" as StageStatus,
    contactIds: ["c-htx", "c-thz", "c-bit-f"],
  },
  {
    id: "s-sec-6",
    projectId: "p-sec",
    name: "问题反馈循环（多团队）",
    sortOrder: 6,
    plannedStart: "2026-06-09",
    plannedEnd: "2026-07-31",
    status: "IN_PROGRESS" as StageStatus,
    contactIds: ["c-thz", "c-fan", "c-bit-f"],
  },

  // 11月局长参访
  {
    id: "s-vis-1",
    projectId: "p-visit",
    name: "需求对接与分工",
    sortOrder: 1,
    plannedStart: "2026-07-01",
    plannedEnd: "2026-07-07",
    status: "COMPLETED" as StageStatus,
    contactIds: ["c-wenjing", "c-weiyu"],
  },
  {
    id: "s-vis-2",
    projectId: "p-visit",
    name: "参观路线与资料搜集（4 个点位）",
    sortOrder: 2,
    plannedStart: "2026-07-07",
    plannedEnd: "2026-08-15",
    status: "IN_PROGRESS" as StageStatus,
    contactIds: ["c-fan", "c-bit-v"],
  },
  {
    id: "s-vis-3",
    projectId: "p-visit",
    name: "Brochure 制作",
    sortOrder: 3,
    plannedStart: "2026-08-16",
    plannedEnd: "2026-09-30",
    status: "NOT_STARTED" as StageStatus,
    contactIds: [],
  },
  {
    id: "s-vis-4",
    projectId: "p-visit",
    name: "行程确认与接待执行",
    sortOrder: 4,
    plannedStart: "2026-10-15",
    plannedEnd: "2026-11-30",
    status: "NOT_STARTED" as StageStatus,
    contactIds: [],
  },
] as const;

// ── 任务 ──────────────────────────────────────────────────
export const tasks = [
  {
    id: "t-fan",
    projectId: "p-sec",
    stageId: "s-sec-6",
    title: "催樊老师：新加坡方缪子困惑的分析结果",
    type: "供应商文件问题",
    status: "WAITING" as TaskStatus,
    priority: "HIGH" as Priority,
    dueDate: "2026-07-10",
    assigneeId: "c-me",
    contactIds: ["c-fan"],
  },
  {
    id: "t-thz",
    projectId: "p-sec",
    stageId: "s-sec-6",
    title: "第三次追问太赫兹团队：误报率/通行速度具体数值",
    type: "供应商文件问题",
    status: "TODO" as TaskStatus,
    priority: "HIGH" as Priority,
    dueDate: "2026-07-13",
    assigneeId: "c-me",
    contactIds: ["c-thz"],
  },
  {
    id: "t-ev-qa",
    projectId: "p-ev",
    stageId: "s-ev-6",
    title: "跟进北理工对 0706 新一轮问题的回复并翻译",
    type: "会议纪要循环校对",
    status: "IN_PROGRESS" as TaskStatus,
    priority: "HIGH" as Priority,
    dueDate: "2026-07-11",
    assigneeId: "c-me",
    contactIds: ["c-bit-v", "c-htx"],
  },
  {
    id: "t-ev-agree",
    projectId: "p-ev",
    stageId: "s-ev-7",
    title: "跟进两份协议盖章回寄（北理新源）",
    type: "合同跟进",
    status: "WAITING" as TaskStatus,
    priority: "MEDIUM" as Priority,
    dueDate: "2026-07-15",
    assigneeId: "c-me",
    contactIds: ["c-bit-v"],
  },
  {
    id: "t-ev-oa",
    projectId: "p-ev",
    stageId: "s-ev-7",
    title: "OA 新增北理新源供应商（玮郁代办，确认后共享）",
    type: "内部流程",
    status: "IN_PROGRESS" as TaskStatus,
    priority: "MEDIUM" as Priority,
    dueDate: "2026-07-14",
    assigneeId: "c-weiyu",
    contactIds: [],
  },
  {
    id: "t-un-script",
    projectId: "",
    stageId: undefined,
    title: "背熟合肥院两个点位英文讲解稿 + 准备三个翻译点位",
    type: "口译/交传",
    status: "IN_PROGRESS" as TaskStatus,
    priority: "URGENT" as Priority,
    dueDate: "2026-07-12",
    assigneeId: "c-me",
    contactIds: [],
  },
  {
    id: "t-hep",
    projectId: "p-visit",
    stageId: "s-vis-2",
    title: "高能物理所参观资料自行搜集（缪子团队未提供）",
    type: "背景资料搜集",
    status: "IN_PROGRESS" as TaskStatus,
    priority: "MEDIUM" as Priority,
    dueDate: "2026-07-16",
    assigneeId: "c-me",
    contactIds: [],
  },
  {
    id: "t-evcenter",
    projectId: "p-visit",
    stageId: "s-vis-2",
    title: "整理电动车辆国家工程研究中心参观内容",
    type: "背景资料搜集",
    status: "DONE" as TaskStatus,
    priority: "MEDIUM" as Priority,
    dueDate: "2026-07-09",
    assigneeId: "c-me",
    contactIds: ["c-bit-v"],
  },
  {
    id: "t-sit",
    projectId: "p-sit",
    stageId: undefined,
    title: "SIT 跟进：等对方确认会面时间（0706 说 find a time）",
    type: "商务沟通",
    status: "WAITING" as TaskStatus,
    priority: "LOW" as Priority,
    dueDate: "2026-07-13",
    assigneeId: "c-me",
    contactIds: ["c-sit"],
  },
  {
    id: "t-report",
    projectId: "",
    stageId: undefined,
    title: "给晓卉姐做团队目前进展汇报 PPT",
    type: "内部流程",
    status: "TODO" as TaskStatus,
    priority: "MEDIUM" as Priority,
    dueDate: "2026-07-17",
    assigneeId: "c-me",
    contactIds: [],
  },
  {
    id: "t-reimburse",
    projectId: "",
    stageId: undefined,
    title: "提交 6/28-7/2 合肥接待出差报销（贴票+OA）",
    type: "行政/报销",
    status: "TODO" as TaskStatus,
    priority: "MEDIUM" as Priority,
    dueDate: "2026-07-15",
    assigneeId: "c-me",
    contactIds: [],
  },
] as const;

// ── 项目文件 ──────────────────────────────────────────────
export const files = [
  {
    id: "f-ev-minutes",
    projectId: "p-ev",
    stageId: "s-ev-6",
    name: "0618 北理工三方会议纪要（双语定稿）.docx",
    type: "会议纪要",
    version: "final",
    status: "APPROVED",
    url: "",
    updatedAt: "2026-06-18",
  },
  {
    id: "f-ev-agree",
    projectId: "p-ev",
    stageId: "s-ev-7",
    name: "战略合作协议+保密协议（法务审批版）.pdf",
    type: "合同/协议",
    version: "v2",
    status: "IN_REVIEW",
    url: "",
    updatedAt: "2026-07-06",
  },
  {
    id: "f-sec-ppt",
    projectId: "p-sec",
    stageId: "s-sec-4",
    name: "Scenario Analysis PPT（0629 展示版）.pptx",
    type: "PPT",
    version: "v3",
    status: "APPROVED",
    url: "",
    updatedAt: "2026-06-28",
  },
  {
    id: "f-sec-mha",
    projectId: "p-sec",
    stageId: "s-sec-6",
    name: "MHA 组织架构 + HTX 场景梳理.docx",
    type: "问题反馈清单",
    version: "v1",
    status: "APPROVED",
    url: "",
    updatedAt: "2026-06-25",
  },
  {
    id: "f-vis-ev",
    projectId: "p-visit",
    stageId: "s-vis-2",
    name: "电动车辆国家工程研究中心参观介绍.docx",
    type: "Brochure",
    version: "v1",
    status: "DRAFT",
    url: "",
    updatedAt: "2026-07-09",
  },
] as const;

// ── 会议纪要流程 ──────────────────────────────────────────
export const meetingReviews = [
  {
    id: "mr-ev",
    projectId: "p-ev",
    title: "0618 北理工三方会议纪要循环",
    status: "IN_PROGRESS",
    rounds: [
      {
        roundNo: 1,
        senderId: "c-me",
        receiverId: "c-htx",
        sentAt: "2026-06-18",
        status: "FEEDBACK_RECEIVED",
        feedback: "当天发出；0622 收到 HTX 问题清单。",
      },
      {
        roundNo: 2,
        senderId: "c-me",
        receiverId: "c-bit-v",
        sentAt: "2026-06-22",
        status: "FEEDBACK_RECEIVED",
        feedback: "0630 北理工确认所有问题，翻译后已回新加坡。",
      },
      {
        roundNo: 3,
        senderId: "c-me",
        receiverId: "c-bit-v",
        sentAt: "2026-07-07",
        status: "SENT",
        feedback: "0706 新一轮 HTX 问题，已整理成明细文档发出。",
      },
    ],
  },
  {
    id: "mr-sec1",
    projectId: "p-sec",
    title: "0609 安检项目三方会议纪要",
    status: "FINALIZED",
    rounds: [
      {
        roundNo: 1,
        senderId: "c-me",
        receiverId: "c-htx",
        sentAt: "2026-06-09",
        status: "FINALIZED",
        feedback: "与文静合作整理，同期发放 HTX 需求清单给太赫兹团队。",
      },
    ],
  },
  {
    id: "mr-sec2",
    projectId: "p-sec",
    title: "0629 第二次会议纪要（文静整理，收存备份）",
    status: "FINALIZED",
    rounds: [
      {
        roundNo: 1,
        senderId: "c-wenjing",
        receiverId: "c-htx",
        sentAt: "2026-06-29",
        status: "FINALIZED",
        feedback: "当时我在忙接待，纪要由文静单独负责；文件已收存。",
      },
    ],
  },
] as const;

// ── 出差/接待 ─────────────────────────────────────────────
export const receptions = [
  {
    id: "r-macau",
    projectId: "",
    type: "VISIT",
    title: "澳门工程学会理事长 + 新加坡理工教授接待（合肥）",
    location: "合肥（科技馆/清华合肥院）",
    purpose: "议程、桌牌、饭店酒店、车辆路线、接机送机、伴手礼全流程",
    startAt: "2026-06-28 09:00",
    endAt: "2026-07-02 18:00",
    status: "DONE",
    visitorIds: ["c-macau", "c-sit"],
  },
  {
    id: "r-un",
    projectId: "",
    type: "VISIT",
    title: "联合国人居署来访接待（合肥）",
    location: "合肥（清华合肥院各平台）",
    purpose: "英文讲解合肥院平台：我负责 2 个点位背稿 + 3 个点位翻译",
    startAt: "2026-07-12 14:00",
    endAt: "2026-07-14 18:00",
    status: "CONFIRMED",
    visitorIds: [],
  },
  {
    id: "r-lanzhou",
    projectId: "",
    type: "BUSINESS_TRIP",
    title: "8月安全大会（兰州）",
    location: "兰州",
    purpose: "具体安排待定",
    startAt: "2026-08-20 08:00",
    endAt: "2026-08-23 20:00",
    status: "PLANNED",
    visitorIds: [],
  },
  {
    id: "r-visit11",
    projectId: "p-visit",
    type: "VISIT",
    title: "11月新加坡局长参访（北京+合肥）",
    location: "北京（高能所/亦庄/清华）+ 合肥",
    purpose: "参观 4+ 技术平台，brochure 引导",
    startAt: "2026-11-10 09:00",
    endAt: "2026-11-14 18:00",
    status: "PLANNED",
    visitorIds: ["c-htx"],
  },
] as const;

// ── 项目动态 ──────────────────────────────────────────────
export const timelineEvents = [
  {
    id: "e1",
    projectId: "p-ev",
    action: "问题清单",
    message: "0706 收到 HTX 新一轮问题，0707 整理成明细文档发北理工，同步发放两份协议审核。",
    createdAt: "2026-07-07 18:20",
  },
  {
    id: "e2",
    projectId: "p-sec",
    action: "供应商跟进",
    message: "0707 催樊老师缪子材料分析结果，对方表示还在继续分析。",
    createdAt: "2026-07-07 15:40",
  },
  {
    id: "e3",
    projectId: "p-visit",
    action: "资料搜集",
    message: "0709 整理完电动车辆国家工程研究中心参观内容；高能物理所资料改为自行搜集。",
    createdAt: "2026-07-09 11:05",
  },
] as const;

// ── 周计划：例行安排 + 本周时间块（date 为空 = 每天例行）──
export const scheduleBlocks = [
  { id: "sb-wake", title: "起床/洗漱", date: "", startMin: 450, endMin: 480, kind: "routine" },
  { id: "sb-commute1", title: "通勤 → 公司", date: "", startMin: 480, endMin: 510, kind: "routine" },
  { id: "sb-mail", title: "收邮件/整理今日待办", date: "", startMin: 510, endMin: 560, kind: "routine" },
  { id: "sb-lunch", title: "午饭 + 午睡", date: "", startMin: 700, endMin: 840, kind: "routine" },
  { id: "sb-commute2", title: "回程 → 到家", date: "", startMin: 1080, endMin: 1140, kind: "routine" },
  { id: "sb-1", title: "翻译北理工回复 + 回 HTX", date: "2026-07-10", startMin: 570, endMin: 690, kind: "work" },
  { id: "sb-2", title: "背合肥院讲解稿", date: "2026-07-10", startMin: 900, endMin: 990, kind: "work" },
  { id: "sb-3", title: "追问太赫兹团队（写邮件）", date: "2026-07-13", startMin: 570, endMin: 630, kind: "work" },
] as const;

// ── 财务记录 ──────────────────────────────────────────────
export const moneyRecords = [
  {
    id: "m-salary6",
    kind: "SALARY",
    amount: 0,
    currency: "CNY",
    happenedAt: "2026-07-05",
    note: "6 月工资（金额自己填，示例为 0）",
  },
  {
    id: "m-adv-hefei",
    kind: "ADVANCE",
    amount: 1280,
    currency: "CNY",
    happenedAt: "2026-07-02",
    note: "0628-0702 合肥接待垫付（打车+餐费，示例金额）",
  },
] as const;

export function getContact(id: string) {
  return contacts.find((contact) => contact.id === id);
}

export function getProject(id: string) {
  return projects.find((project) => project.id === id);
}

export function getProjectStages(projectId: string) {
  return stages
    .filter((stage) => stage.projectId === projectId)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getProjectTasks(projectId: string) {
  return tasks.filter((task) => task.projectId === projectId);
}

export function getProjectFiles(projectId: string) {
  return files.filter((file) => file.projectId === projectId);
}

export function getProjectTimeline(projectId: string) {
  return timelineEvents.filter((event) => event.projectId === projectId);
}
