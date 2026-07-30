import { businessKindFromReception, businessKindFromTask, type BusinessKind } from "@/lib/workflow-meta";

type ProjectLike = { id: string; nameZh: string; nameEn?: string; type?: string; status?: string };
type TaskLike = {
  id: string;
  projectId?: string;
  title: string;
  type?: string;
  status: string;
  dueDate?: string;
  source?: string;
  sourceLabel?: string;
};
type ReceptionLike = {
  id: string;
  projectId?: string;
  type: string;
  title: string;
  status: string;
  startAt?: string;
  endAt?: string;
  location?: string;
};

export type WorkEvent = {
  id: string;
  rawId: string;
  source: "task" | "reception";
  kind: BusinessKind;
  title: string;
  start: string;
  end: string;
  tag: string;
  status: string;
  projectId?: string;
  projectName?: string;
  href: string;
};

function firstDate(value?: string) {
  return value ? value.slice(0, 10) : "";
}

export function buildWorkEvents({
  tasks,
  receptions,
  projects,
}: {
  tasks: TaskLike[];
  receptions: ReceptionLike[];
  projects: ProjectLike[];
}) {
  const projectMap = new Map(projects.map((project) => [project.id, project]));
  const events: WorkEvent[] = [];

  for (const task of tasks) {
    if (!task.dueDate || task.status === "DONE") continue;
    const project = task.projectId ? projectMap.get(task.projectId) : undefined;
    const kind = businessKindFromTask(task, project);
    events.push({
      id: `task-${task.id}`,
      rawId: task.id,
      source: "task",
      kind,
      title: task.title,
      start: task.dueDate,
      end: task.dueDate,
      tag: task.sourceLabel || task.type || "任务",
      status: task.status,
      projectId: task.projectId || undefined,
      projectName: project?.nameZh,
      href: "/tasks",
    });
  }

  for (const reception of receptions) {
    const start = firstDate(reception.startAt);
    if (!start || reception.status === "CANCELLED") continue;
    const end = firstDate(reception.endAt) || start;
    const project = reception.projectId ? projectMap.get(reception.projectId) : undefined;
    const kind = businessKindFromReception(reception.type);
    events.push({
      id: `reception-${reception.id}`,
      rawId: reception.id,
      source: "reception",
      kind,
      title: reception.title,
      start,
      end,
      tag: kind === "reception" ? "接待" : reception.type === "BUSINESS_TRIP" ? "出差" : "展会",
      status: reception.status,
      projectId: reception.projectId || undefined,
      projectName: project?.nameZh,
      href: kind === "reception" ? "/projects?tab=reception" : "/projects?tab=expo",
    });
  }

  return events.sort((a, b) => a.start.localeCompare(b.start) || a.title.localeCompare(b.title));
}

export function eventsForDate(events: WorkEvent[], iso: string) {
  return events.filter((event) => event.start <= iso && iso <= event.end);
}