"use client";

import type { ComponentProps } from "react";
import { useDict } from "@/components/layout/locale-provider";
import { cn } from "@/lib/utils";

export type StatusStampTone =
  | "active"
  | "waiting"
  | "pause"
  | "danger"
  | "done"
  | "neutral";

type StatusStampProps = ComponentProps<"span"> & {
  tone: StatusStampTone;
};

const stageTones = {
  NOT_STARTED: "pause",
  IN_PROGRESS: "active",
  COMPLETED: "done",
  DELAYED: "danger",
} as const;

const taskTones = {
  TODO: "waiting",
  IN_PROGRESS: "active",
  WAITING: "waiting",
  DONE: "done",
  OVERDUE: "danger",
} as const;

type StageStatus = keyof typeof stageTones;
type TaskStatus = keyof typeof taskTones;

export function StatusStamp({ tone, className, ...props }: StatusStampProps) {
  return (
    <span
      data-tone={tone}
      className={cn("sunny-status-stamp", className)}
      {...props}
    />
  );
}

export function StageStatusPill({ status }: { status: StageStatus }) {
  const t = useDict();

  return (
    <StatusStamp tone={stageTones[status]}>
      {t.statuses.stage[status]}
    </StatusStamp>
  );
}

export function TaskStatusPill({ status }: { status: TaskStatus }) {
  const t = useDict();

  return (
    <StatusStamp tone={taskTones[status]}>
      {t.statuses.task[status]}
    </StatusStamp>
  );
}
