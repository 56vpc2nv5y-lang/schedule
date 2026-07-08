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
      name: "会议纪要循环校对",
      description: "支持多轮往返校对与定稿入库提醒",
    },
    { sortOrder: 7, name: "合同谈判" },
    { sortOrder: 8, name: "合同签署" },
    { sortOrder: 9, name: "项目实施/交付跟进" },
    { sortOrder: 10, name: "验收" },
    { sortOrder: 11, name: "售后维护/年度回访" },
    { sortOrder: 12, name: "归档/复盘" },
  ],
};

export const regions = ["新加坡", "马来西亚", "澳门", "香港"];

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
];

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
  "合同",
  "验收单",
  "邀请函",
  "Brochure",
];

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

export const contacts = [
  {
    id: "c-our-chen",
    name: "陈予安",
    organization: "我方项目协调",
    title: "项目经理",
    region: "香港",
    email: "yuan.chen@example.com",
    wechat: "yuan_pm",
    roles: ["我方团队"],
  },
  {
    id: "c-client-lim",
    name: "Lim Wei",
    organization: "Orchard Digital Health",
    title: "Innovation Lead",
    region: "新加坡",
    email: "lim.wei@example.sg",
    wechat: "",
    roles: ["甲方对接人", "来访嘉宾"],
  },
  {
    id: "c-client-ho",
    name: "何嘉敏",
    organization: "Harbour Smart Mobility",
    title: "项目主任",
    region: "香港",
    email: "kaman.ho@example.hk",
    wechat: "kaman_h",
    roles: ["甲方对接人"],
  },
  {
    id: "c-supplier-wu",
    name: "吴教授",
    organization: "华南理工大学技术团队",
    title: "课题负责人",
    region: "香港",
    email: "prof.wu@example.edu.cn",
    wechat: "wu_lab",
    roles: ["供应商对接人"],
  },
  {
    id: "c-supplier-tan",
    name: "Tan Mei Ling",
    organization: "NUS Applied AI Lab",
    title: "Research Manager",
    region: "新加坡",
    email: "tan.ml@example.edu.sg",
    wechat: "",
    roles: ["供应商对接人"],
  },
] as const;

export const projects = [
  {
    id: "p-sg-health-ai",
    nameZh: "新加坡医疗 AI 影像评估",
    nameEn: "Singapore Medical AI Imaging Review",
    clientName: "Orchard Digital Health",
    region: "新加坡",
    type: "标准项目",
    status: "ACTIVE" as ProjectStatus,
    plannedStart: "2026-05-13",
    plannedEnd: "2026-11-20",
    ownerId: "c-our-chen",
    clientContactIds: ["c-client-lim"],
    supplierContactIds: ["c-supplier-tan"],
    progress: 42,
  },
  {
    id: "p-hk-mobility",
    nameZh: "香港智慧交通数据平台",
    nameEn: "Hong Kong Mobility Data Platform",
    clientName: "Harbour Smart Mobility",
    region: "香港",
    type: "标准项目",
    status: "ACTIVE" as ProjectStatus,
    plannedStart: "2026-04-02",
    plannedEnd: "2026-10-10",
    ownerId: "c-our-chen",
    clientContactIds: ["c-client-ho"],
    supplierContactIds: ["c-supplier-wu"],
    progress: 58,
  },
  {
    id: "p-macau-expo",
    nameZh: "澳门展会技术邀约",
    nameEn: "Macau Tech Expo Invitation",
    clientName: "Macau Innovation Bureau",
    region: "澳门",
    type: "接待/展会专项",
    status: "PAUSED" as ProjectStatus,
    plannedStart: "2026-06-18",
    plannedEnd: "2026-08-30",
    ownerId: "c-our-chen",
    clientContactIds: [],
    supplierContactIds: ["c-supplier-wu"],
    progress: 24,
  },
] as const;

export const stages = [
  {
    id: "s1",
    projectId: "p-sg-health-ai",
    name: "商机/需求对接",
    sortOrder: 1,
    plannedStart: "2026-05-13",
    plannedEnd: "2026-05-24",
    status: "COMPLETED" as StageStatus,
    contactIds: ["c-client-lim"],
  },
  {
    id: "s2",
    projectId: "p-sg-health-ai",
    name: "供应商匹配与方案沟通",
    sortOrder: 2,
    plannedStart: "2026-05-25",
    plannedEnd: "2026-06-08",
    status: "COMPLETED" as StageStatus,
    contactIds: ["c-supplier-tan"],
  },
  {
    id: "s3",
    projectId: "p-sg-health-ai",
    name: "报价/预算沟通",
    sortOrder: 3,
    plannedStart: "2026-06-09",
    plannedEnd: "2026-06-21",
    status: "IN_PROGRESS" as StageStatus,
    contactIds: ["c-client-lim", "c-supplier-tan"],
  },
  {
    id: "s4",
    projectId: "p-sg-health-ai",
    name: "技术方案/PPT 制作与审查",
    sortOrder: 4,
    plannedStart: "2026-06-22",
    plannedEnd: "2026-07-15",
    status: "IN_PROGRESS" as StageStatus,
    contactIds: ["c-supplier-tan"],
  },
  {
    id: "s5",
    projectId: "p-sg-health-ai",
    name: "会议纪要循环校对",
    sortOrder: 6,
    plannedStart: "2026-07-16",
    plannedEnd: "2026-07-30",
    status: "NOT_STARTED" as StageStatus,
    contactIds: ["c-client-lim", "c-supplier-tan"],
  },
  {
    id: "s6",
    projectId: "p-hk-mobility",
    name: "甲方会议 + 供应商会议",
    sortOrder: 5,
    plannedStart: "2026-06-01",
    plannedEnd: "2026-06-16",
    status: "COMPLETED" as StageStatus,
    contactIds: ["c-client-ho", "c-supplier-wu"],
  },
  {
    id: "s7",
    projectId: "p-hk-mobility",
    name: "会议纪要循环校对",
    sortOrder: 6,
    plannedStart: "2026-06-17",
    plannedEnd: "2026-07-12",
    status: "DELAYED" as StageStatus,
    contactIds: ["c-client-ho", "c-supplier-wu"],
  },
] as const;

export const tasks = [
  {
    id: "t1",
    projectId: "p-sg-health-ai",
    stageId: "s3",
    title: "确认供应商报价边界与付款节点",
    type: "报价/预算沟通",
    status: "IN_PROGRESS" as TaskStatus,
    priority: "HIGH" as Priority,
    dueDate: "2026-07-10",
    assigneeId: "c-our-chen",
    contactIds: ["c-client-lim", "c-supplier-tan"],
  },
  {
    id: "t2",
    projectId: "p-sg-health-ai",
    stageId: "s4",
    title: "PPT 英文版术语一致性检查",
    type: "PPT制作翻译审查",
    status: "WAITING" as TaskStatus,
    priority: "MEDIUM" as Priority,
    dueDate: "2026-07-12",
    assigneeId: "c-our-chen",
    contactIds: ["c-supplier-tan"],
  },
  {
    id: "t3",
    projectId: "p-hk-mobility",
    stageId: "s7",
    title: "会议纪要第二轮问题清单回收",
    type: "会议纪要循环校对",
    status: "OVERDUE" as TaskStatus,
    priority: "URGENT" as Priority,
    dueDate: "2026-07-06",
    assigneeId: "c-our-chen",
    contactIds: ["c-client-ho", "c-supplier-wu"],
  },
  {
    id: "t4",
    projectId: "p-macau-expo",
    stageId: undefined,
    title: "展会邀请函变量模板整理",
    type: "展会邀请函",
    status: "TODO" as TaskStatus,
    priority: "LOW" as Priority,
    dueDate: "2026-07-18",
    assigneeId: "c-our-chen",
    contactIds: ["c-supplier-wu"],
  },
] as const;

export const files = [
  {
    id: "f1",
    projectId: "p-sg-health-ai",
    stageId: "s4",
    name: "医疗 AI 影像评估方案_v0.4.pptx",
    type: "PPT",
    version: "0.4",
    status: "IN_REVIEW",
    updatedAt: "2026-07-07",
  },
  {
    id: "f2",
    projectId: "p-hk-mobility",
    stageId: "s7",
    name: "智慧交通会议纪要_R2.docx",
    type: "会议纪要",
    version: "R2",
    status: "DRAFT",
    updatedAt: "2026-07-05",
  },
  {
    id: "f3",
    projectId: "p-macau-expo",
    stageId: undefined,
    name: "澳门展会邀请函模板.txt",
    type: "邀请函",
    version: "1.0",
    status: "APPROVED",
    updatedAt: "2026-06-30",
  },
] as const;

export const meetingReviews = [
  {
    id: "mr1",
    projectId: "p-hk-mobility",
    title: "香港智慧交通数据平台会议纪要",
    status: "IN_PROGRESS",
    rounds: [
      {
        roundNo: 1,
        senderId: "c-our-chen",
        receiverId: "c-client-ho",
        sentAt: "2026-06-18",
        status: "FEEDBACK_RECEIVED",
        feedback: "甲方补充数据权限和验收口径。",
      },
      {
        roundNo: 2,
        senderId: "c-our-chen",
        receiverId: "c-supplier-wu",
        sentAt: "2026-07-02",
        status: "SENT",
        feedback: "等待供应商确认技术边界。",
      },
    ],
  },
] as const;

export const receptions = [
  {
    id: "r1",
    projectId: "p-sg-health-ai",
    type: "VISIT",
    title: "新加坡客户来访接待",
    location: "广州国际生物岛",
    startAt: "2026-08-06 09:30",
    endAt: "2026-08-06 17:30",
    status: "CONFIRMED",
    visitorIds: ["c-client-lim"],
  },
  {
    id: "r2",
    projectId: "p-macau-expo",
    type: "EXHIBITION_INVITE",
    title: "澳门科技展邀请函批次",
    location: "澳门威尼斯人会展中心",
    startAt: "2026-08-22 10:00",
    endAt: "2026-08-24 18:00",
    status: "PLANNED",
    visitorIds: ["c-supplier-wu"],
  },
] as const;

export const timelineEvents = [
  {
    id: "e1",
    projectId: "p-sg-health-ai",
    action: "阶段更新",
    message: "报价/预算沟通进入进行中，等待供应商确认付款节点。",
    createdAt: "2026-07-07 16:24",
  },
  {
    id: "e2",
    projectId: "p-hk-mobility",
    action: "联动提醒",
    message: "会议纪要第二轮任务逾期，建议确认是否调整阶段状态为已延期。",
    createdAt: "2026-07-06 09:15",
  },
  {
    id: "e3",
    projectId: "p-macau-expo",
    action: "模板更新",
    message: "邀请函文本模板新增变量：{{visitor_name}}、{{organization}}、{{event_date}}。",
    createdAt: "2026-06-30 12:10",
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
