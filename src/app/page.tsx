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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusStamp, TaskStatusPill } from "@/components/ui/status-pill";
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

const projectStatusTone = {
  ACTIVE: "active",
  PAUSED: "pause",
  COMPLETED: "done",
  CANCELLED: "danger",
  ARCHIVED: "neutral",
} as const;

const projectStatusLabel = {
  ACTIVE: "进行中",
  PAUSED: "暂停",
  COMPLETED: "已完成",
  CANCELLED: "已取消",
  ARCHIVED: "已归档",
} as const;

function sourceText(source: string) {
  if (source === "PROJECT_STAGE") return "项目阶段";
  if (source === "RECEPTION_CHECKLIST") return "接待清单";
  if (source === "FEEDBACK_FOLLOW_UP") return "来自纪要";
  if (source === "TRAINING_CHECKLIST") return "培训清单";
  return "手动新建";
}

function sameMinute(a: string, b: string) {
  return a.slice(0, 16) === b.slice(0, 16);
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

  const today = todayDateKey();
  const horizon = addDaysToDateKey(today, 14);
  const visibleProjects = projects.filter(
    (project) => project.status !== "ARCHIVED" && project.status !== "CANCELLED",
  );
  const activeProjects = projects.filter((project) => project.status === "ACTIVE");
  const pushProjects = visibleProjects.filter((project) => project.status !== "COMPLETED");
  const regionCount = new Set(activeProjects.map((p) => p.region).filter(Boolean)).size;
  const openTasks = tasks.filter((task) => task.status !== "DONE");
  const waitingTasks = openTasks.filter((task) => task.status === "WAITING");
  const overdueTasks = openTasks.filter(
    (task) => task.status === "OVERDUE" || Boolean(task.dueDate && task.dueDate < today),
  );
  const personalTasks = openTasks.filter((task) => !task.projectId);

  const upcoming = [
    ...openTasks
      .filter((task) => task.dueDate && task.dueDate >= today && task.dueDate <= horizon)
      .map((task) => {
        const project = projects.find((p) => p.id === task.projectId);
        return {
          key: `task-${task.id}`,
          date: task.dueDate,
          kind: task.projectId ? "项目任务" : "个人事务",
          chore: !task.projectId,
          title: task.title,
          sub: project ? pname(project) : sourceText(task.source),
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
          receptionTypeMeta[reception.type as ReceptionType]?.short ?? "接待",
        chore: false,
        title: reception.title,
        sub: reception.location || "",
        href: "/receptions",
      })),
  ].sort((a, b) => a.date.localeCompare(b.date));

  const stats = [
    {
      label: "正在推进",
      value: activeProjects.length,
      meta: regionCount ? `覆盖 ${regionCount} 个地区` : "暂无进行中地区",
      Icon: Rocket,
      tone: "active",
    },
    {
      label: "未完成任务",
      value: openTasks.length,
      meta: `其中 ${personalTasks.length} 件个人杂事`,
      Icon: ListChecks,
      tone: "pause",
    },
    {
      label: "等待外部反馈",
      value: waitingTasks.length,
      meta: "供应商 / 客户 / 内部确认",
      Icon: Clock3,
      tone: "waiting",
    },
    {
      label: "逾期提醒",
      value: overdueTasks.length,
      meta: overdueTasks.length ? "需要今天处理" : "暂无逾期",
      Icon: AlertTriangle,
      tone: "danger",
    },
  ] as const;

  const dedupedTimeline = timelineEvents.filter((event, index, list) => {
    if (event.action !== "项目状态调整") return true;
    const previous = list.slice(0, index).find(
      (item) =>
        item.action === event.action &&
        item.projectId === event.projectId &&
        sameMinute(item.createdAt, event.createdAt),
    );
    return !previous || previous.message === event.message;
  });

  return (
    <AppShell>
      <div className="sunny-page">
        <div className="sunny-page-head flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="page-eyebrow text-xs text-muted-foreground">今天 {today}</div>
            <h1 className="page-title mt-2">Sunny 看板</h1>
            <p className="page-description mt-2 max-w-2xl text-sm leading-6">
              项目、任务、接待和纪要都留在原有数据结构里，这里只把今日工作台摊开成一页可扫的档案视图。
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/tasks?new=1#new">
              <Button variant="outline">
                <Plus className="h-4 w-4" />
                新建任务
              </Button>
            </Link>
            <Link href="/projects?new=1#new">
              <Button>
                <Plus className="h-4 w-4" />
                新建项目
              </Button>
            </Link>
          </div>
        </div>

        <section className="sunny-kpi-grid">
          {stats.map((item) => (
            <div key={item.label} className="sunny-kpi-card">
              <div className="mb-4 flex items-center justify-between gap-3">
                <item.Icon className="h-5 w-5" style={{ color: `var(--status-${item.tone === "waiting" ? "wait" : item.tone})` }} />
                <span className="mono text-[10px]">KPI</span>
              </div>
              <strong className="sunny-kpi-value tnum">{item.value}</strong>
              <div className="mt-2 text-sm font-medium text-foreground">{item.label}</div>
              <p className="mt-1">{item.meta}</p>
            </div>
          ))}
        </section>

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <section>
            <div className="section-label">正在推进</div>
            <div className="grid gap-4">
              {pushProjects.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center text-sm text-muted-foreground">
                    {t.dashboard.noProjects}
                  </CardContent>
                </Card>
              ) : null}
              {pushProjects.map((project) => {
                const projectStages = stages
                  .filter((stage) => stage.projectId === project.id)
                  .sort((a, b) => a.sortOrder - b.sortOrder);
                const currentStage =
                  projectStages.find((stage) => stage.status === "IN_PROGRESS") ??
                  projectStages.find((stage) => stage.status === "DELAYED") ??
                  projectStages.find((stage) => stage.status === "NOT_STARTED");
                const projectOpenTasks = openTasks.filter((task) => task.projectId === project.id);
                const currentStageTasks = projectOpenTasks.filter(
                  (task) => !currentStage || task.stageId === currentStage.id,
                );
                const waitingExternal = projectOpenTasks.filter(
                  (task) => task.status === "WAITING" || task.source === "FEEDBACK_FOLLOW_UP",
                );
                const nextTask = [...projectOpenTasks].sort((a, b) =>
                  (a.dueDate || "9999-12-31").localeCompare(b.dueDate || "9999-12-31"),
                )[0];
                const statusTone = projectStatusTone[project.status as keyof typeof projectStatusTone] ?? "neutral";
                const statusLabel = projectStatusLabel[project.status as keyof typeof projectStatusLabel] ?? project.status;

                return (
                  <article key={project.id} className="push-card bg-card">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link href={`/projects/${project.id}`} className="sunny-title text-lg hover:text-primary">
                          {pname(project)}
                        </Link>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <span className="chip">地区 {project.region || "未标注"}</span>
                          <StatusStamp tone={statusTone}>{statusLabel}</StatusStamp>
                        </div>
                      </div>
                      <Link href={`/projects/${project.id}`} className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                        查看项目
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-5">
                      <Field label="地区" value={project.region || "未标注"} />
                      <Field label="当前阶段" value={currentStage?.name || project.currentStageName || "阶段已完成"} />
                      <Field label="下一步" value={nextTask?.title || "暂无未完成任务"} />
                      <Field label="未完成任务数" value={`${projectOpenTasks.length}`} mono />
                      <Field label="等待外部反馈数" value={`${waitingExternal.length}`} mono tone={waitingExternal.length ? "waiting" : undefined} />
                    </div>

                    <div className="mt-4 border-t border-border pt-3">
                      <div className="mb-2 text-xs font-medium text-muted-foreground">
                        当前阶段具体待办（{currentStageTasks.length}）
                      </div>
                      {currentStageTasks.length === 0 ? (
                        <div className="rounded border border-dashed border-border p-3 text-sm text-muted-foreground">
                          当前阶段没有未完成待办。
                        </div>
                      ) : (
                        <div className="grid gap-2">
                          {currentStageTasks.slice(0, 6).map((task) => (
                            <div key={task.id} className="flex flex-wrap items-center justify-between gap-2 rounded border border-border bg-secondary/30 p-2.5">
                              <div className="min-w-0">
                                <div className="truncate text-sm font-medium">{task.title}</div>
                                <div className="mt-0.5 text-xs text-muted-foreground">
                                  {sourceText(task.source)}{task.dueDate ? ` / ${task.dueDate}` : ""}
                                </div>
                              </div>
                              <TaskStatusPill status={task.status} />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <aside className="space-y-6">
            <section>
              <div className="section-label">别忘了这些</div>
              <Card>
                <CardContent className="pt-4">
                  {[...overdueTasks, ...personalTasks.filter((task) => !overdueTasks.includes(task))]
                    .slice(0, 7)
                    .map((task) => {
                      const project = projects.find((p) => p.id === task.projectId);
                      return (
                        <div key={task.id} className="todo-row flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium">{task.title}</div>
                            <div className="mt-1 text-xs text-muted-foreground">
                              {project ? pname(project) : "个人/行政事务"}
                              <span className="mx-1">/</span>
                              {sourceText(task.source)}
                              {task.dueDate ? <span> / {task.dueDate}</span> : null}
                            </div>
                          </div>
                          <TaskStatusPill status={task.status} />
                        </div>
                      );
                    })}
                  {overdueTasks.length === 0 && personalTasks.length === 0 ? (
                    <div className="rounded border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                      {t.dashboard.remindersEmpty}
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </section>

            <section>
              <div className="section-label">未来 14 天</div>
              <Card>
                <CardHeader className="border-b border-border">
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle>近期日程</CardTitle>
                    <Link href="/calendar" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                      <CalendarDays className="h-4 w-4" />
                      日历
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 pt-4">
                  {upcoming.slice(0, 8).map((item) => (
                    <Link key={item.key} href={item.href} className="flex items-center gap-3 rounded border border-border p-2.5 transition-colors hover:bg-secondary/50">
                      <span className="tnum w-12 shrink-0 font-mono text-xs text-muted-foreground">{item.date.slice(5)}</span>
                      <Badge tone={item.chore ? "neutral" : "info"}>{item.kind}</Badge>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{item.title}</div>
                        {item.sub ? <div className="truncate text-xs text-muted-foreground">{item.sub}</div> : null}
                      </div>
                    </Link>
                  ))}
                  {upcoming.length === 0 ? (
                    <div className="rounded border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                      {t.dashboard.next14Empty}
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </section>
          </aside>
        </div>

        <section className="mt-6">
          <div className="section-label">近期项目时间线</div>
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
        </section>

        <section className="mt-6">
          <div className="section-label">项目动态</div>
          <Card>
            <CardContent className="pt-4">
              {dedupedTimeline.length === 0 ? (
                <div className="rounded border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  {t.dashboard.timelineEmpty}
                </div>
              ) : (
                dedupedTimeline.slice(0, 10).map((event) => (
                  <div key={event.id} className="feed-row grid gap-2 md:grid-cols-[150px_minmax(0,1fr)_150px]">
                    <Badge tone={event.action.includes("状态") ? "waiting" : "info"}>{event.action}</Badge>
                    <p className="text-sm leading-6">{event.message}</p>
                    <div className="tnum font-mono text-xs text-muted-foreground md:text-right">{event.createdAt}</div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </AppShell>
  );
}

function Field({
  label,
  value,
  mono,
  tone,
}: {
  label: string;
  value: string;
  mono?: boolean;
  tone?: "waiting";
}) {
  return (
    <div className="rounded border border-border bg-secondary/25 p-3">
      <div className="label mb-1">{label}</div>
      <div className={mono ? "tnum font-mono text-sm font-semibold" : "text-sm font-semibold"}>
        <span className={tone === "waiting" ? "sunny-text-wait" : undefined}>{value}</span>
      </div>
    </div>
  );
}
