"use client";

import { Badge } from "@/components/ui/badge";
import { useDict } from "@/components/layout/locale-provider";

const stageTones = {
  NOT_STARTED: "neutral",
  IN_PROGRESS: "active",
  COMPLETED: "done",
  DELAYED: "risk",
} as const;

const taskTones = {
  TODO: "neutral",
  IN_PROGRESS: "active",
  WAITING: "waiting",
  DONE: "done",
  OVERDUE: "risk",
} as const;

type StageStatus = keyof typeof stageTones;
type TaskStatus = keyof typeof taskTones;

export function StageStatusPill({ status }: { status: StageStatus }) {
  const t = useDict();
  return <Badge tone={stageTones[status]}>{t.statuses.stage[status]}</Badge>;
}

export function TaskStatusPill({ status }: { status: TaskStatus }) {
  const t = useDict();
  return <Badge tone={taskTones[status]}>{t.statuses.task[status]}</Badge>;
}
