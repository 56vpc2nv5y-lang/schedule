import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { addDays, addMonths, endOfMonth, format, parse, startOfMonth, startOfWeek } from "date-fns";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { isDatabaseConfigured } from "@/lib/db-status";
import { getT } from "@/lib/locale";
import { receptionTypeMeta } from "@/lib/default-data";
import {
  getProjectsForView,
  getReceptionsForView,
  getTasksForView,
} from "@/lib/database-data";
import { CalendarBoard, type CalendarEvent } from "./calendar-board";

export const dynamic = "force-dynamic";

function ymToDate(ym: string | undefined): Date | null {
  if (ym && /^\d{4}-\d{2}$/.test(ym)) {
    return startOfMonth(parse(ym, "yyyy-MM", new Date()));
  }
  return null;
}

function receptionKind(type: string): "reception" | "expo" {
  return type === "VISIT" ? "reception" : "expo";
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ ym?: string }>;
}) {
  const [{ ym }, { t }, tasks, receptions, projects] = await Promise.all([
    searchParams,
    getT(),
    getTasksForView(),
    getReceptionsForView(),
    getProjectsForView(),
  ]);
  const projectMap = new Map(projects.map((project) => [project.id, project]));
  const isPausedProject = (projectId?: string) => Boolean(projectId && projectMap.get(projectId)?.status === "PAUSED");
  const isPauseFollowUpTask = (task: (typeof tasks)[number]) =>
    task.source === "TRAINING_CHECKLIST" && task.sourceLabel.includes("暂停期间复核");
  const shouldShowTask = (task: (typeof tasks)[number]) => {
    if (!task.dueDate) return false;
    if (task.status === "DONE") return true;
    if (isPausedProject(task.projectId)) return isPauseFollowUpTask(task);
    return true;
  };
  const shouldShowReception = (reception: (typeof receptions)[number]) => {
    if (!reception.startAt || reception.status === "CANCELLED") return false;
    if (isPausedProject(reception.projectId)) return reception.status === "DONE";
    return true;
  };

  const events: CalendarEvent[] = [
    ...tasks.filter(shouldShowTask).map((task) => ({
      id: `task-${task.id}`,
      rawId: task.id,
      kind: "task" as const,
      title: task.title,
      start: task.dueDate,
      end: task.dueDate,
      tag: isPauseFollowUpTask(task) ? "暂停复核" : t.calendar.legendTask,
      projectName: task.projectId ? projectMap.get(task.projectId)?.nameZh : undefined,
    })),
    ...receptions.filter(shouldShowReception).map((reception) => {
      const start = reception.startAt.slice(0, 10);
      const end = reception.endAt ? reception.endAt.slice(0, 10) : start;
      return {
        id: `reception-${reception.id}`,
        rawId: reception.id,
        kind: receptionKind(reception.type),
        title: reception.title,
        start,
        end,
        tag: receptionTypeMeta[reception.type as keyof typeof receptionTypeMeta]?.short ?? "接待",
        projectName: reception.projectId ? projectMap.get(reception.projectId)?.nameZh : undefined,
      };
    }),
  ];

  const today = new Date();
  const todayIso = format(today, "yyyy-MM-dd");
  const requested = ymToDate(ym);
  const nearest = events
    .map((event) => event.start)
    .sort((a, b) => Math.abs(+new Date(a) - +today) - Math.abs(+new Date(b) - +today))[0];
  const monthStart = requested ?? (isDatabaseConfigured() ? startOfMonth(today) : startOfMonth(nearest ? new Date(nearest) : today));

  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const days = Array.from({ length: 42 }, (_, i) => format(addDays(gridStart, i), "yyyy-MM-dd"));

  const prevYm = format(addMonths(monthStart, -1), "yyyy-MM");
  const nextYm = format(addMonths(monthStart, 1), "yyyy-MM");
  const monthStartIso = format(monthStart, "yyyy-MM-dd");
  const monthEndIso = format(endOfMonth(monthStart), "yyyy-MM-dd");
  const monthEventCount = events.filter((event) => event.start <= monthEndIso && event.end >= monthStartIso).length;
  const taskCount = events.filter((event) => event.kind === "task").length;
  const receptionCount = events.filter((event) => event.kind !== "task").length;
  const monthLabel = t.calendar.monthLabel(monthStart.getFullYear(), monthStart.getMonth() + 1);

  return (
    <AppShell>
      <div className="sunny-page calendar-board-shell">
        <div className="sunny-page-head flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="page-eyebrow text-xs text-muted-foreground">Calendar</div>
            <h1 className="page-title mt-2">{monthLabel}</h1>
            <p className="page-description mt-2 text-sm leading-6">{t.calendar.summary(monthEventCount)}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/calendar?ym=${prevYm}`}>
              <Button variant="outline" size="icon" title={t.calendar.prev}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/calendar">
              <Button variant="outline" size="sm">
                <CalendarDays className="h-4 w-4" />
                {t.calendar.backToday}
              </Button>
            </Link>
            <Link href={`/calendar?ym=${nextYm}`}>
              <Button variant="outline" size="icon" title={t.calendar.next}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>

        <div className="mb-5 kpi-bar" data-cols="3">
          <Mini label="本月安排" value={monthEventCount} />
          <Mini label="任务" value={taskCount} />
          <Mini label="出差/接待" value={receptionCount} />
        </div>

        <CalendarBoard days={days} events={events} currentMonth={monthStart.getMonth()} todayIso={todayIso} dbConnected={isDatabaseConfigured()} />
      </div>
    </AppShell>
  );
}

function Mini({ label, value }: { label: string; value: number }) {
  return (
    <div className="kpi-cell">
      <strong className="tnum">{value}</strong>
      <span>{label}</span>
    </div>
  );
}
