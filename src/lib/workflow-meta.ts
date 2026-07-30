export type BusinessKind = "project" | "training" | "reception" | "expo" | "admin";

export const businessKindMeta: Record<BusinessKind, { label: string; className: string; calendarClass: string }> = {
  project: { label: "项目", className: "s3-type-project", calendarClass: "project" },
  training: { label: "培训", className: "s3-type-training", calendarClass: "training" },
  reception: { label: "接待", className: "s3-type-reception", calendarClass: "reception" },
  expo: { label: "展会", className: "s3-type-expo", calendarClass: "expo" },
  admin: { label: "行政", className: "status-idle", calendarClass: "admin" },
};

export const taskStatusOptions = [
  { value: "NOT_STARTED", label: "未开始", className: "status-idle", tone: "neutral" },
  { value: "IN_PROGRESS", label: "进行中", className: "status-progress", tone: "active" },
  { value: "SELF_CHECK", label: "待自查", className: "status-check", tone: "waiting" },
  { value: "LEADER_REVIEW", label: "待 Leader 审核", className: "status-leader", tone: "danger" },
  { value: "WAITING_EXTERNAL", label: "待外部回复", className: "status-waiting", tone: "waiting" },
  { value: "READY_TO_SEND", label: "待对外发送", className: "status-send", tone: "active" },
  { value: "DONE", label: "已完成", className: "status-done", tone: "done" },
] as const;

export const legacyTaskStatusMap: Record<string, string> = {
  TODO: "NOT_STARTED",
  WAITING: "WAITING_EXTERNAL",
  OVERDUE: "NOT_STARTED",
};

export function normalizeTaskStatus(status: string) {
  return legacyTaskStatusMap[status] ?? status;
}

export function taskStatusMeta(status: string) {
  const normalized = normalizeTaskStatus(status);
  return taskStatusOptions.find((item) => item.value === normalized) ?? taskStatusOptions[0];
}

export const issueStatusOptions = [
  { value: "ORGANIZING", label: "待整理", className: "status-idle", tone: "neutral" },
  { value: "TO_SUPPLIER", label: "待发供应商", className: "status-send", tone: "active" },
  { value: "WAITING_SUPPLIER", label: "等待供应商回复", className: "status-waiting", tone: "waiting" },
  { value: "EDITING_REVIEW", label: "修改纪要中", className: "status-check", tone: "waiting" },
  { value: "LEADER_REVIEW", label: "待 Leader 审核", className: "status-leader", tone: "danger" },
  { value: "TRANSLATION", label: "待翻译", className: "status-check", tone: "waiting" },
  { value: "TO_CLIENT", label: "待发客户", className: "status-send", tone: "active" },
  { value: "SENT_CLIENT", label: "已发客户", className: "status-done", tone: "done" },
] as const;

export const legacyIssueStatusMap: Record<string, string> = {
  OPEN: "ORGANIZING",
  SENT: "WAITING_SUPPLIER",
  ANSWERED: "EDITING_REVIEW",
  UNCLEAR: "WAITING_SUPPLIER",
  NEED_MEETING: "LEADER_REVIEW",
  CONFIRMED: "SENT_CLIENT",
};

export function normalizeIssueStatus(status: string) {
  return legacyIssueStatusMap[status] ?? status;
}

export function issueStatusMeta(status: string) {
  const normalized = normalizeIssueStatus(status);
  return issueStatusOptions.find((item) => item.value === normalized) ?? issueStatusOptions[0];
}

export const waitingOnOptions = ["供应商", "专家", "客户", "合作方", "内部同事", "其他"] as const;
export const sendChannelOptions = ["Email", "WhatsApp", "微信", "正式函件", "文件传输", "其他"] as const;

export function businessKindFromTask(task: { type?: string; projectId?: string }, project?: { type?: string; nameZh?: string; nameEn?: string }) : BusinessKind {
  const text = `${task.type ?? ""} ${project?.type ?? ""} ${project?.nameZh ?? ""} ${project?.nameEn ?? ""}`;
  if (/培训|training/i.test(text)) return "training";
  if (/接待|来访|visit/i.test(text)) return "reception";
  if (/展会|出差|大会|邀请|expo|trip/i.test(text)) return "expo";
  if (!task.projectId) return "admin";
  return "project";
}

export function businessKindFromReception(type: string): BusinessKind {
  return type === "VISIT" ? "reception" : "expo";
}