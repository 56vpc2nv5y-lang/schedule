import Link from "next/link";
import { ArrowRight, MapPin, Plus } from "lucide-react";
import {
  addDays,
  differenceInCalendarDays,
  parseISO,
  startOfWeek,
} from "date-fns";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusStamp, TaskStatusPill } from "@/components/ui/status-pill";
import { isDatabaseConfigured } from "@/lib/db-status";
import { receptionTypeMeta, type ReceptionType } from "@/lib/default-data";
import { getT } from "@/lib/locale";
import { projectDisplayName } from "@/lib/i18n";
import {
  addDaysToDateKey,
  parseDateKey,
  todayDateKey,
  toDateKey,
  weekdayFromDateKey,
} from "@/lib/date-time";
import {
  getProjectsForView,
  getReceptionsForView,
  getScheduleBlocksForView,
  getTasksForView,
} from "@/lib/database-data";
import { TodayTaskCheck } from "./today-task-check";
import { TodayTimeline } from "./today-timeline";
import { ReminderButton } from "./reminder-button";
import type { TripSegment, WeekBlock } from "../week/week-board";
import { parseTimeToMin } from "../week/timeline-shared";

export const dynamic = "force-dynamic";

const weekdayNames = ["日", "一", "二", "三", "四", "五", "六"];

function taskSourceLabel(source: string) {
  if (source === "RECEPTION_CHECKLIST") return "接待清单";
  if (source === "FEEDBACK_FOLLOW_UP") return "来自纪要";
  if (source === "TRAINING_CHECKLIST") return "培训清单";
  if (source === "PROJECT_STAGE") return "项目阶段";
  return "手动新建";
}

export default async function TodayPage() {
  const [{ locale }, tasks, receptions, blocks, projects] = await Promise.all([
    getT(),
    getTasksForView(),
    getReceptionsForView(),
    getScheduleBlocksForView(),
    getProjectsForView(),
  ]);

  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const todayIso = todayDateKey(now);
  const tomorrowIso = addDaysToDateKey(todayIso, 1);
  const todayDate = parseDateKey(todayIso);
  const weekStart = startOfWeek(todayDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => toDateKey(addDays(weekStart, i)));

  const projectName = new Map(projects.map((p) => [p.id, projectDisplayName(locale, p)]));
  const projectById = new Map(projects.map((project) => [project.id, project]));
  const isPausedProjectTask = (task: (typeof tasks)[number]) =>
    Boolean(task.projectId && projectById.get(task.projectId)?.status === "PAUSED");
  const isPauseFollowUpTask = (task: (typeof tasks)[number]) =>
    task.source === "TRAINING_CHECKLIST" && task.sourceLabel.includes("暂停期间复核");
  const shouldSurfaceTask = (task: (typeof tasks)[number]) =>
    !isPausedProjectTask(task) || isPauseFollowUpTask(task);
  const projectOptions = projects.map((p) => ({ id: p.id, name: projectDisplayName(locale, p) }));

  const openTasks = tasks.filter((task) => task.status !== "DONE" && shouldSurfaceTask(task));
  const overdue = openTasks.filter((task) => task.dueDate && task.dueDate < todayIso);
  const dueToday = openTasks.filter((task) => task.dueDate === todayIso);
  const todayTodos = [...overdue, ...dueToday];
  const doingNow = todayTodos.filter((task) => task.status !== "WAITING");
  const projectTodayTodos = todayTodos.filter((task) => Boolean(task.projectId));
  const adminTodayTodos = todayTodos.filter((task) => !task.projectId);
  const waiting = openTasks.filter((task) => task.status === "WAITING");

  const activeReceptions = receptions.filter((r) => r.status !== "CANCELLED");
  const startDayOf = (r: { startAt: string }) => r.startAt.slice(0, 10);
  const endDayOf = (r: { startAt: string; endAt: string }) => (r.endAt || r.startAt).slice(0, 10);
  const upcoming = activeReceptions
    .filter((r) => r.startAt && endDayOf(r) >= todayIso)
    .sort((a, b) => a.startAt.localeCompare(b.startAt));
  const nearest = upcoming[0];
  const near3 = addDaysToDateKey(todayIso, 3);
  const prepCount = upcoming.filter((r) => startDayOf(r) <= near3).length;
  const tomorrowTrip = activeReceptions.find((r) => r.startAt && startDayOf(r) === tomorrowIso);

  const receptionDay = new Set<string>();
  for (const r of activeReceptions) {
    if (!r.startAt) continue;
    const s = startDayOf(r);
    const e = endDayOf(r);
    for (const iso of weekDays) if (iso >= s && iso <= e) receptionDay.add(iso);
  }
  const dayLoads = weekDays.map(
    (iso) => openTasks.filter((task) => task.dueDate === iso).length + (receptionDay.has(iso) ? 1 : 0),
  );
  const maxLoad = Math.max(1, ...dayLoads);

  const todayBlocks: WeekBlock[] = blocks
    .filter((block) => block.date === "" || block.date === todayIso)
    .map((block) => ({ ...block }));
  const todayTrips: TripSegment[] = [];
  for (const r of activeReceptions) {
    if (!r.startAt) continue;
    if (startDayOf(r) <= todayIso && endDayOf(r) >= todayIso) {
      todayTrips.push({
        id: `${r.id}-${todayIso}`,
        title: r.title,
        date: todayIso,
        startMin: startDayOf(r) === todayIso ? parseTimeToMin(r.startAt) : 540,
        endMin: endDayOf(r) === todayIso ? Math.max(parseTimeToMin(r.endAt || r.startAt), 600) : 1080,
      });
    }
  }

  const dateLabel = `${todayIso} · 周${weekdayNames[weekdayFromDateKey(todayIso)]}`;

  const renderTodoList = (items: typeof todayTodos, emptyText: string) =>
    items.length ? (
      <div className="sunny-list">
        {items.map((task) => {
          const isOverdue = Boolean(task.dueDate && task.dueDate < todayIso);
          const project = task.projectId ? projectName.get(task.projectId) : "个人/行政事务";
          return (
            <div key={task.id} className="sunny-today-row">
              <TodayTaskCheck taskId={task.id} title={task.title} overdue={isOverdue} />
              <Link href="/tasks" className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{task.title}</div>
                <div className="truncate text-xs text-muted-foreground">
                  {project} / {taskSourceLabel(task.source)}{task.dueDate ? ` / ${task.dueDate}` : ""}
                </div>
              </Link>
              <TaskStatusPill status={isOverdue ? "OVERDUE" : task.status} />
            </div>
          );
        })}
      </div>
    ) : (
      <Empty text={emptyText} />
    );

  return (
    <AppShell>
      <div className="sunny-page">
        <div className="sunny-page-head flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="page-eyebrow text-xs text-muted-foreground">{dateLabel}</div>
            <h1 className="page-title mt-2">今日</h1>
            <p className="page-description mt-2 max-w-2xl text-sm leading-6">
              这是个人时间轴：今天几点做什么、哪些事项要推进、哪些还在等对方。不和工作台的项目总览混在一起。
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <ReminderButton overdue={overdue.length} dueToday={dueToday.length} receptions={prepCount} />
            <Link href="/tasks?new=1#new">
              <Button>
                <Plus className="h-4 w-4" />
                新建任务
              </Button>
            </Link>
          </div>
        </div>

        <section className="sunny-focus-bar" data-cols="3">
          <div className="sunny-focus-cell">
            <div className="num tnum">{doingNow.length}</div>
            <div className="label">现在该做几件</div>
          </div>
          <div className="sunny-focus-cell" data-tone={waiting.length > 0 ? "waiting" : undefined}>
            <div className="num tnum">{waiting.length}</div>
            <div className="label">等对方回复几件</div>
          </div>
          <div className="sunny-focus-cell" data-tone={overdue.length > 0 ? "danger" : undefined}>
            <div className="num tnum">{overdue.length}</div>
            <div className="label">今日已逾期几件</div>
          </div>
        </section>

        <div className="mt-5 grid grid-cols-7 gap-2">
          {weekDays.map((iso, i) => {
            const isToday = iso === todayIso;
            return (
              <div key={iso} className={isToday ? "today-day today-day-active border p-3" : "today-day border p-3"}>
                <div className="flex items-baseline justify-between">
                  <span className={isToday ? "text-[11px] font-medium text-primary" : "text-[11px] font-medium text-muted-foreground"}>
                    周{weekdayNames[weekdayFromDateKey(iso)]}
                  </span>
                  <span className={isToday ? "tnum text-sm font-semibold text-primary" : "tnum text-sm font-semibold"}>{iso.slice(8)}</span>
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-secondary">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${Math.round((dayLoads[i] / maxLoad) * 100)}%`, opacity: isToday ? 1 : 0.45 }} />
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-5 grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
          <section className="min-w-0">
            <div className="sunny-section-label mt-0">
              <span className="num">01</span>
              <h2>个人时间轴</h2>
              <span className="desc">点击时间块可编辑，拖拽可调整时间</span>
            </div>
            <TodayTimeline
              todayIso={todayIso}
              blocks={todayBlocks}
              trips={todayTrips}
              projects={projectOptions}
              nowMin={nowMin}
              dbConnected={isDatabaseConfigured()}
            />
          </section>

          <div className="min-w-0 space-y-5">
            <section>
              <div className="sunny-section-label mt-0">
                <span className="num">02</span>
                <h2>项目任务</h2>
                <span className="desc">{projectTodayTodos.length} 项</span>
              </div>
              {renderTodoList(projectTodayTodos, "今天没有到期的项目任务。")}
            </section>

            <section>
              <div className="sunny-section-label mt-0">
                <span className="num">03</span>
                <h2>个人/行政事务</h2>
                <span className="desc">{adminTodayTodos.length} 项</span>
              </div>
              {renderTodoList(adminTodayTodos, "今天没有到期的个人或行政事项。")}
            </section>

            <section>
              <div className="sunny-section-label mt-0">
                <span className="num">04</span>
                <h2>接待预告</h2>
              </div>
              {nearest ? (
                <ReceptionPreview
                  reception={nearest}
                  daysLabel={differenceInCalendarDays(parseISO(startDayOf(nearest)), todayDate)}
                  progressLabel={nearest.checklistTotal > 0 ? `${nearest.checklistDone}/${nearest.checklistTotal}` : ""}
                />
              ) : (
                <Empty text="近期没有接待或出差安排。" />
              )}
            </section>

            <section>
              <div className="sunny-section-label mt-0">
                <span className="num">05</span>
                <h2>等待对方回复</h2>
                <span className="desc">{waiting.length} 项</span>
              </div>
              {waiting.length ? (
                <div className="sunny-list">
                  {waiting.map((task) => (
                    <Link key={task.id} href="/tasks" className="sunny-today-row">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--status-wait)]" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{task.title}</div>
                        <div className="truncate text-xs text-muted-foreground">
                          {task.projectId ? projectName.get(task.projectId) ?? "项目" : "个人/行政事务"}
                        </div>
                      </div>
                      <StatusStamp tone="waiting">等待</StatusStamp>
                    </Link>
                  ))}
                </div>
              ) : (
                <Empty text="没有等待对方回复的事项。" />
              )}
            </section>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="sunny-card border border-dashed border-border p-6 text-center text-sm text-muted-foreground">{text}</div>;
}

function ReceptionPreview({
  reception,
  daysLabel,
  progressLabel,
}: {
  reception: {
    id: string;
    type: ReceptionType;
    title: string;
    location: string;
    startAt: string;
    endAt: string;
  };
  daysLabel: number;
  progressLabel: string;
}) {
  const meta = receptionTypeMeta[reception.type];
  const range = `${reception.startAt.slice(0, 10)}${reception.endAt ? ` → ${reception.endAt.slice(0, 10)}` : ""}`;
  const dayText = daysLabel <= 0 ? "进行中" : `${daysLabel} 天后`;
  return (
    <Link href={`/receptions/${reception.id}`} className="sunny-card block border border-border p-4 hover:border-primary">
      <div className="flex items-center justify-between gap-3">
        <Badge tone="active">{meta.short}</Badge>
        <StatusStamp tone={daysLabel <= 0 ? "active" : "waiting"}>{dayText}</StatusStamp>
      </div>
      <div className="mt-3 text-[15px] font-semibold">{reception.title}</div>
      <div className="tnum mt-1 text-xs text-muted-foreground">{range}</div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {reception.location ? (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {reception.location}
          </span>
        ) : null}
        {progressLabel ? <span className="sunny-chip">清单 {progressLabel}</span> : null}
      </div>
    </Link>
  );
}
