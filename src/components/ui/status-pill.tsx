"use client";

import type { ComponentProps } from "react";
import { useDict } from "@/components/layout/locale-provider";
import { taskStatusMeta } from "@/lib/workflow-meta";
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

const stageTones: Record<string, StatusStampTone> = {
  NOT_STARTED: "pause",
  IN_PROGRESS: "active",
  COMPLETED: "done",
  DELAYED: "danger",
};

export function StatusStamp({ tone, className, ...props }: StatusStampProps) {
  return (
    <span
      data-tone={tone}
      className={cn("sunny-status-stamp", className)}
      {...props}
    />
  );
}

export function StageStatusPill({ status }: { status: string }) {
  const t = useDict();
  const label = (t.statuses.stage as Record<string, string>)[status] ?? status;

  return <StatusStamp tone={stageTones[status] ?? "neutral"}>{label}</StatusStamp>;
}

export function TaskStatusPill({ status }: { status: string }) {
  const meta = taskStatusMeta(status);
  return <StatusStamp tone={meta.tone as StatusStampTone}>{meta.label}</StatusStamp>;
}