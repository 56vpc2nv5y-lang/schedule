import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  Clock3,
  Inbox,
  ListChecks,
  Plus,
  Rocket,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TaskStatusPill } from "@/components/ui/status-pill";
import { isDatabaseConfigured } from "@/lib/db-status";
import { receptionTypeMeta, type ReceptionType } from "@/lib/default-data";
import { getT } from "@/lib/locale";
import { projectDisplayName } from "@/lib/i18n";
import {
  getProjectsForView,
  getReceptionsForView,
  getStagesForView,
  getTasksForView,
  getTimelineForView,
} from "@/lib/database-data";
import { GanttChart } from "./gantt-chart";

export const dynamic = "force-dynamic";

function isoToday() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

function addDaysIso(iso: string, days: number) {
  const date = new Date(`${iso}T00:00:00`);
  date.setDate(date.getDate() + days);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

export default async function DashboardPage() {
  const [{ locale, t }, projects, stages, tasks, timelineEvents, receptions] =
    await Promise.all([
      getT(),
      getProjectsForView(),
      getStagesForView(),
      getTasksForView(),
      getTimelineForView(),
      getReceptionsForView(),
    ]);

  const pname = (p: { nameZh: string; nameEn?: string }) =>
    projectDisplayName(locale, p);

  const today = isoToday();
  const horizon = addDaysIso(today, 14);

  const activeProjects = projects.filter((p) => p.status === "ACTIVE");
  const regionCount = new Set(
    activeProjects.map((p) => p.region).filter(Boolean),
  ).size;
  const openTasks = tasks.filter((task) => task.status !== "DONE");
  const waitingTasks = tasks.filter((task) => task.status === "WAITING");
  const overdueTasks = tasks.filter(
    (task) =>
      task.status === "OVERDUE" ||
      (task.status !== "DONE" && task.dueDate && task.dueDate < today),
  );
  const personalTasks = openTasks.filter((task) => !task.projectId);

  // 未来 14 天日程：任务截止 + 出差/接待/展会开始
  const upcoming = [
    ...openTasks
      .filter(
        (task) =>
          task.dueDate && task.dueDate >= today && task.dueDate <= horizon,
      )
      .map((task) => {
        const project = projects.find((p) => p.id === task.projectId);
        return {
          key: `task-${task.id}`,
          date: task.dueDate,
          kind: task.projectId ? t.dashboard.kindTask : t.dashboard.kindChore,
          chore: !task.projectId,
          title: task.title,
          sub: project ? pname(project) : t.common.personal,
          href: "/tasks",
        };
      }),
    ...receptions
      .filter((reception) => {
        const day = reception.startAt.slice(0, 10);
        return reception.status !== "CANCELLED" && day >= today && day <= horizon;
      })
      .map((reception) => ({
        key: `rec-${reception.id}`,
        date: reception.startAt.slice(0, 10),
        kind:
          receptionTypeMeta[reception.type as ReceptionType]?.short ??
          t.dashboard.kindTask,
        chore: false,
        title: reception.title,
        sub: reception.location || "",
        href: "/receptions",
      })),
  ].sort((a, b) => a.date.localeCompare(b.date));

  const stats = [
    {
      label: t.dashboard.statActive,
      value: activeProjects.length,
      meta:
        regionCount > 0
          ? t.dashboard.statActiveMeta(regionCount)
          : t.dashboard.statActiveEmpty,
      Icon: Rocket,
      tint: "bg-primary/10 text-primary",
    },
    {
      label: t.dashboard.statOpen,
      value: openTasks.length,
      meta: t.dashboard.statOpenMeta(personalTasks.length),
      Icon: ListChecks,
      tint: "bg-blue-500/10 text-blue-600",
    },
    {
      label: t.dashboard.statWaiting,
      value: waitingTasks.length,
      meta: t.dashboard.statWaitingMeta,
      Icon: Clock3,
      tint: "bg-amber-500/10 text-amber-600",
    },
    {
      label: t.dashboard.statOverdue,
      value: overdueTasks.length,
      meta: overdueTasks.length
        ? t.dashboard.statOverdueMeta
        : t.dashboard.statOverdueEmpty,
      Icon: AlertTriangle,
      tint: "bg-red-500/10 text-red-600",
    },
  ];

  return (
    <AppShell>
      <PageHeader
        eyebrow={`${t.dashboard.todayIs} ${today}`}
        title={t.dashboard.title}
        description={t.dashboard.desc}
        action={
          <>
            <Link href="/tasks?new=1#new">
              <Button variant="outline">
                <Plus className="h-4 w-4" />
                {t.dashboard.newTask}
              </Button>
            </Link>
            <Link href="/projects?new=1#new">
              <Button>
                <Plus className="h-4 w-4" />
                {t.dashboard.newProject}
              </Button>
            </Link>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <Card key={item.label}>
            <CardContent className="flex items-center gap-4 p-5">
              <span
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${item.tint}`}
              >
                <item.Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="tnum text-2xl font-semibold leading-none">
                    {item.value}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {item.meta}
                  </span>
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {item.label}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        {/* 项目进展一览：每个项目走到哪一步 */}
        <Card>
          <CardHeader className="border-b border-border">
            <div className="flex items-center justify-between gap-3">
              <CardTitle>{t.dashboard.projectOverview}</CardTitle>
              <Link
                href="/projects"
                className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                {t.dashboard.toBoard}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            {projects.filter((p) => p.status !== "ARCHIVED").length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
                {t.dashboard.noProjects}
              </div>
            ) : null}
            {projects
              .filter((p) => p.status !== "ARCHIVED")
              .map((project) => {
                const projectStages = stages
                  .filter((stage) => stage.projectId === project.id)
                  .sort((a, b) => a.sortOrder - b.sortOrder);
                const currentStage =
                  projectStages.find((s) => s.status === "IN_PROGRESS") ??
                  projectStages.find((s) => s.status === "DELAYED") ??
                  projectStages.find((s) => s.status === "NOT_STARTED");
                const projectOpenTasks = openTasks.filter(
                  (task) => task.projectId === project.id,
                );
                const projectOverdue = overdueTasks.filter(
                  (task) => task.projectId === project.id,
                );

                return (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="block rounded-lg border border-border p-4 transition-colors hover:border-primary/40 hover:bg-accent/40"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="truncate text-sm font-semibold">
                          {pname(project)}
                        </span>
                        {project.region ? (
                          <Badge tone="neutral">{project.region}</Badge>
                        ) : null}
                        {project.status === "PAUSED" ? (
                          <Badge tone="waiting">{t.dashboard.paused}</Badge>
                        ) : null}
                      </div>
                      <span className="tnum text-xs text-muted-foreground">
                        {project.progress}%
                      </span>
                    </div>
                    <div className="mt-3 h-2 rounded-md bg-secondary">
                      <div
                        className="h-2 rounded-md bg-primary"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>
                        {t.dashboard.currentStage}
                        <span className="font-medium text-foreground">
                          {currentStage
                            ? currentStage.name
                            : projectStages.length
                              ? t.dashboard.allStagesDone
                              : t.dashboard.noStages}
                        </span>
                        {currentStage?.status === "DELAYED" ? (
                          <span className="font-medium text-red-600">
                            {t.dashboard.stageDelayed}
                          </span>
                        ) : null}
                      </span>
                      <span>{t.dashboard.openTasksCount(projectOpenTasks.length)}</span>
                      {projectOverdue.length ? (
                        <span className="font-medium text-red-600">
                          {t.dashboard.overdueCount(projectOverdue.length)}
                        </span>
                      ) : null}
                    </div>
                  </Link>
                );
              })}
          </CardContent>
        </Card>

        <div className="space-y-5">
          {/* 未来 14 天日程 */}
          <Card>
            <CardHeader className="border-b border-border">
              <div className="flex items-center justify-between gap-3">
                <CardTitle>{t.dashboard.next14}</CardTitle>
                <Link
                  href="/calendar"
                  className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                >
                  <CalendarDays className="h-4 w-4" />
                  {t.dashboard.calendar}
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 pt-4">
              {upcoming.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  {t.dashboard.next14Empty}
                </div>
              ) : (
                upcoming.slice(0, 8).map((item) => (
                  <Link
                    key={item.key}
                    href={item.href}
                    className="flex items-center gap-3 rounded-lg border border-border p-2.5 transition-colors hover:bg-secondary/50"
                  >
                    <span className="tnum w-12 shrink-0 font-mono text-xs text-muted-foreground">
                      {item.date.slice(5)}
                    </span>
                    <Badge tone={item.chore ? "neutral" : "info"}>
                      {item.kind}
                    </Badge>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">
                        {item.title}
                      </div>
                      {item.sub ? (
                        <div className="truncate text-xs text-muted-foreground">
                          {item.sub}
                        </div>
                      ) : null}
                    </div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>

          {/* 逾期与杂事提醒 */}
          <Card>
            <CardHeader className="border-b border-border">
              <div className="flex items-center justify-between gap-3">
                <CardTitle>{t.dashboard.reminders}</CardTitle>
                <Link
                  href="/tasks"
                  className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                >
                  <Inbox className="h-4 w-4" />
                  {t.dashboard.taskList}
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 pt-4">
              {[
                ...overdueTasks,
                ...personalTasks.filter((task) => !overdueTasks.includes(task)),
              ]
                .slice(0, 6)
                .map((task) => {
                  const project = projects.find((p) => p.id === task.projectId);
                  return (
                    <div
                      key={task.id}
                      className="flex items-start justify-between gap-3 rounded-lg border border-border p-2.5"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">
                          {task.title}
                        </div>
                        <div className="mt-0.5 text-xs text-muted-foreground">
                          {project ? pname(project) : t.common.personal}
                          {task.dueDate
                            ? ` · ${task.dueDate} ${t.dashboard.due}`
                            : ""}
                        </div>
                      </div>
                      <TaskStatusPill status={task.status} />
                    </div>
                  );
                })}
              {overdueTasks.length === 0 && personalTasks.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  {t.dashboard.remindersEmpty}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-5">
        <GanttChart
          projects={projects.map((project) => ({
            id: project.id,
            nameZh: pname(project),
            region: project.region,
            progress: project.progress,
          }))}
          stages={stages.map((stage) => ({
            id: stage.id,
            projectId: stage.projectId,
            name: stage.name,
            plannedStart: stage.plannedStart,
            plannedEnd: stage.plannedEnd,
            status: stage.status,
          }))}
          dbConnected={isDatabaseConfigured()}
        />
      </div>

      <Card className="mt-5">
        <CardHeader className="border-b border-border">
          <CardTitle>{t.dashboard.timeline}</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {timelineEvents.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              {t.dashboard.timelineEmpty}
            </div>
          ) : (
            <div className="grid gap-3 lg:grid-cols-3">
              {timelineEvents.slice(0, 9).map((event) => (
                <div key={event.id} className="rounded-lg border border-border p-3">
                  <Badge tone="info">{event.action}</Badge>
                  <p className="mt-3 text-sm leading-6">{event.message}</p>
                  <div className="tnum mt-2 font-mono text-xs text-muted-foreground">
                    {event.createdAt}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}
