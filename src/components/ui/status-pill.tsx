import { Badge } from "@/components/ui/badge";

const stageStatusMap = {
  NOT_STARTED: { label: "未开始", tone: "neutral" },
  IN_PROGRESS: { label: "进行中", tone: "active" },
  COMPLETED: { label: "已完成", tone: "done" },
  DELAYED: { label: "已延期", tone: "risk" },
} as const;

const taskStatusMap = {
  TODO: { label: "待处理", tone: "neutral" },
  IN_PROGRESS: { label: "进行中", tone: "active" },
  WAITING: { label: "等待反馈", tone: "waiting" },
  DONE: { label: "已完成", tone: "done" },
  OVERDUE: { label: "已逾期", tone: "risk" },
} as const;

type StageStatus = keyof typeof stageStatusMap;
type TaskStatus = keyof typeof taskStatusMap;

export function StageStatusPill({ status }: { status: StageStatus }) {
  const item = stageStatusMap[status];
  return <Badge tone={item.tone}>{item.label}</Badge>;
}

export function TaskStatusPill({ status }: { status: TaskStatus }) {
  const item = taskStatusMap[status];
  return <Badge tone={item.tone}>{item.label}</Badge>;
}
