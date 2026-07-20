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
import { addDaysToDateKey, todayDateKey } from "@/lib/date-time";
import { getT } from "@/lib/locale";
import { projectDisplayName } from "@/lib/i18n";
import {
  getProjectsForView,
  getReceptionsForView,
  getStagesForView,
  getTasksForView,
  getTimelineForView,
} from "@/lib/database-data";
import { GanttChart } from "./gantt-chart-summary";

export const dynamic = "force-dynamic";

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

  const today = todayDateKey();
  const horizon = addDaysToDateKey(today, 14);

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
          <CardContent className="p-0">
            {activeProjects.length === 0 ? (
              <div className="p-10 text-center text-sm text-muted-foreground">
                {t.dashboard.noProjects}
              </div>
            ) : null}
            {activeProjects
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
                const projectWaiting = projectOpenTasks.filter(
                  (task) => task.status === "WAITING",
                );
                const taskStatusWeight: Record<string, number> = {
                  IN_PROGRESS: 0,
                  OVERDUE: 1,
                  TODO: 2,
                  WAITING: 3,
                };
                const focusTask = [...projectOpenTasks].sort((a, b) => {
                  const statusDiff =
                    (taskStatusWeight[a.status] ?? 4) -
                    (taskStatusWeight[b.status] ?? 4);
                  return statusDiff || (a.dueDate || "9999").localeCompare(b.dueDate || "9999");
                })[0];

                return (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="block border-b border-border px-4 py-3 transition-colors last:border-b-0 hover:bg-secondary/45"
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
                      {focusTask?.dueDate ? (
                        <span className="tnum font-mono text-[11px] text-muted-foreground">
                          {focusTask.dueDate}
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-2 grid gap-2 text-xs sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.4fr)]">
                      <div className="min-w-0">
                        <span className="text-muted-foreground">
                          {t.dashboard.currentStage}
                        </span>
                        <span className="ml-1 font-medium text-foreground">
                          {currentStage
                            ? currentStage.name
                            : projectStages.length
                              ? t.dashboard.allStagesDone
                              : t.dashboard.noStages}
                        </span>
                        {currentStage?.status === "DELAYED" ? (
                          <span className="ml-1 font-medium text-red-600">
                            {t.dashboard.stageDelayed}
                          </span>
                        ) : null}
                      </div>
                      <div className="min-w-0 truncate">
                        <span className="text-muted-foreground">下一步：</span>
                        <span className="font-medium text-foreground">
                          {focusTask?.title ?? "暂无未完成任务"}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                      <span>{t.dashboard.openTasksCount(projectOpenTasks.length)}</span>
                      {projectWaiting.length ? (
                        <span className="font-medium text-amber-700">
                          {projectWaiting.length} 项等待外部反馈
                        </span>
                      ) : null}
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
            status: project.status,
            completedStageCount: project.completedStageCount,
            totalStageCount: project.totalStageCount,
            currentStageName: project.currentStageName,
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
