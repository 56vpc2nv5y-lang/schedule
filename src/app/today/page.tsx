import Link from "next/link";
import { ArrowRight, MapPin, Plus } from "lucide-react";
import {
  addDays,
  differenceInCalendarDays,
  format,
  parseISO,
  startOfWeek,
} from "date-fns";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TaskStatusPill } from "@/components/ui/status-pill";
import { isDatabaseConfigured } from "@/lib/db-status";
import { receptionTypeMeta, type ReceptionType } from "@/lib/default-data";
import { getT } from "@/lib/locale";
import { projectDisplayName } from "@/lib/i18n";
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

export default async function TodayPage() {
  const [{ locale, t }, tasks, receptions, blocks, projects] = await Promise.all([
    getT(),
    getTasksForView(),
    getReceptionsForView(),
    getScheduleBlocksForView(),
    getProjectsForView(),
  ]);

  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const todayIso = format(now, "yyyy-MM-dd");
  const tomorrowIso = format(addDays(now, 1), "yyyy-MM-dd");
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) =>
    format(addDays(weekStart, i), "yyyy-MM-dd"),
  );

  const projectName = new Map(
    projects.map((p) => [p.id, projectDisplayName(locale, p)]),
  );
  const projectById = new Map(projects.map((project) => [project.id, project]));
  const isPausedProjectTask = (task: (typeof tasks)[number]) =>
    Boolean(task.projectId && projectById.get(task.projectId)?.status === "PAUSED");
  const isPauseFollowUpTask = (task: (typeof tasks)[number]) =>
    task.source === "TRAINING_CHECKLIST" && task.sourceLabel.includes("暂停期间复核");
  const shouldSurfaceTask = (task: (typeof tasks)[number]) =>
    !isPausedProjectTask(task) || isPauseFollowUpTask(task);
  const projectOptions = projects.map((p) => ({
    id: p.id,
    name: projectDisplayName(locale, p),
  }));

  // ── 任务 ────────────────────────────────────────────────
  const openTasks = tasks.filter((task) => task.status !== "DONE" && shouldSurfaceTask(task));
  const overdue = openTasks.filter(
    (task) => task.dueDate && task.dueDate < todayIso,
  );
  const dueToday = openTasks.filter((task) => task.dueDate === todayIso);
  const todayTodos = [...overdue, ...dueToday];
  const projectTodayTodos = todayTodos.filter((task) => Boolean(task.projectId));
  const adminTodayTodos = todayTodos.filter((task) => !task.projectId);
  const waiting = tasks.filter((task) => task.status === "WAITING");

  // ── 接待 / 出差 ─────────────────────────────────────────
  const activeReceptions = receptions.filter((r) => r.status !== "CANCELLED");
  const startDayOf = (r: { startAt: string }) => r.startAt.slice(0, 10);
  const endDayOf = (r: { startAt: string; endAt: string }) =>
    (r.endAt || r.startAt).slice(0, 10);

  const upcoming = activeReceptions
    .filter((r) => r.startAt && endDayOf(r) >= todayIso)
    .sort((a, b) => a.startAt.localeCompare(b.startAt));
  const nearest = upcoming[0];
  const near3 = format(addDays(now, 3), "yyyy-MM-dd");
  const prepCount = upcoming.filter((r) => startDayOf(r) <= near3).length;
  const tomorrowTrip = activeReceptions.find(
    (r) => r.startAt && startDayOf(r) === tomorrowIso,
  );

  // 一周内每天的忙碌度（到期任务数 + 出差/接待）
  const receptionDay = new Set<string>();
  for (const r of activeReceptions) {
    if (!r.startAt) continue;
    const s = startDayOf(r);
    const e = endDayOf(r);
    for (const iso of weekDays) if (iso >= s && iso <= e) receptionDay.add(iso);
  }
  const dayLoads = weekDays.map(
    (iso) =>
      openTasks.filter((task) => task.dueDate === iso).length +
      (receptionDay.has(iso) ? 1 : 0),
  );
  const maxLoad = Math.max(1, ...dayLoads);

  // ── 今日时间轴数据 ──────────────────────────────────────
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
        endMin:
          endDayOf(r) === todayIso
            ? Math.max(parseTimeToMin(r.endAt || r.startAt), 600)
            : 1080,
      });
    }
  }

  const weekdayNames = t.calendar.weekdays;
  const dateLabel = `${format(now, "yyyy 年 M 月 d 日")} · ${t.calendar.weekdayPrefix}${weekdayNames[now.getDay()]}`;

  const renderTodoList = (items: typeof todayTodos, emptyText: string) =>
    items.length ? (
      <div className="flex flex-col gap-1">
        {items.map((task) => {
          const isOverdue = task.dueDate && task.dueDate < todayIso;
          return (
            <div
              key={task.id}
              className={
                "flex items-start gap-3 rounded-lg px-2 py-2 hover:bg-secondary/60 " +
                (isOverdue && task.projectId ? "bg-red-50/70" : "")
              }
            >
              <TodayTaskCheck
                taskId={task.id}
                title={task.title}
                overdue={Boolean(isOverdue)}
              />
              <Link href="/tasks" className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{task.title}</div>
                <div className="truncate text-xs text-muted-foreground">
                  {task.projectId
                    ? projectName.get(task.projectId) ?? t.common.personal
                    : t.common.personal}
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
      {/* Hero */}
      <div className="today-hero mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="today-date text-sm font-medium text-muted-foreground">{dateLabel}</div>
          <h1 className="today-title mt-1 text-2xl font-semibold tracking-tight sm:text-[1.9rem]">
            {t.today.greeting}
          </h1>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <ReminderButton
            overdue={overdue.length}
            dueToday={dueToday.length}
            receptions={prepCount}
          />
          <Link href="/week?new=1#new">
            <Button variant="outline">
              <Plus className="h-4 w-4" />
              {t.today.quickLog}
            </Button>
          </Link>
          <Link href="/tasks?new=1#new">
            <Button>
              <Plus className="h-4 w-4" />
              {t.today.newTask}
            </Button>
          </Link>
        </div>
      </div>

      {/* 摘要行 */}
      <div className="today-summary-row mb-5 flex flex-wrap gap-2.5">
        <SummaryTile
          dot="bg-red-500"
          strong={t.today.sumDueUnit(dueToday.length)}
          text={t.today.sumDue}
        />
        <SummaryTile
          dot="bg-primary"
          strong={t.today.sumReceptionUnit(prepCount)}
          text={t.today.sumReception}
        />
        {tomorrowTrip ? (
          <SummaryTile
            dot="bg-amber-500"
            strong={t.today.sumTripTomorrow}
            text={`${t.today.sumTripGo}${tomorrowTrip.location ? ` · ${tomorrowTrip.location}` : ""}`}
          />
        ) : (
          <SummaryTile dot="bg-muted-foreground/40" strong="" text={t.today.sumTripNone} />
        )}
      </div>

      {/* 本周条 */}
      <div className="today-week-strip mb-5 grid grid-cols-7 gap-2">
        {weekDays.map((iso, i) => {
          const isToday = iso === todayIso;
          const dow = new Date(`${iso}T00:00:00`).getDay();
          return (
            <div
              key={iso}
              className={
                "today-day rounded-xl border p-3 " +
                (isToday
                  ? "today-day-active border-primary/30 bg-primary/10"
                  : "border-border bg-card shadow-[var(--shadow-card)]")
              }
            >
              <div className="flex items-baseline justify-between">
                <span
                  className={
                    "text-[11px] font-medium " +
                    (isToday ? "text-primary" : "text-muted-foreground")
                  }
                >
                  {t.calendar.weekdayPrefix}
                  {weekdayNames[dow]}
                </span>
                <span
                  className={
                    "tnum text-sm font-semibold " +
                    (isToday ? "text-primary" : "text-foreground")
                  }
                >
                  {iso.slice(8)}
                </span>
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-secondary">
                <div
                  className={"h-full rounded-full " + (isToday ? "bg-primary" : "bg-primary/45")}
                  style={{ width: `${Math.round((dayLoads[i] / maxLoad) * 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* 两栏 */}
      <div className="today-work-grid grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        {/* 左：今日时间轴 */}
        <section className="min-w-0">
          <div className="mb-2.5 flex items-baseline justify-between">
            <div className="flex items-baseline gap-2">
              <h2 className="text-base font-semibold">{t.today.timelineTitle}</h2>
              <span className="text-xs text-muted-foreground">{t.today.timelineHint}</span>
            </div>
            <Link
              href="/week"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              {t.today.toWeek}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
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

        {/* 右：待办 / 接待 / 等回复 */}
        <div className="min-w-0 flex flex-col gap-4">
          {/* 今日待办 */}
          <Panel title="项目任务" count={t.today.countItems(projectTodayTodos.length)}>
            {renderTodoList(projectTodayTodos, "今天没有到期的项目任务。")}
          </Panel>

          <Panel title="个人 / 行政事务" count={t.today.countItems(adminTodayTodos.length)}>
            {renderTodoList(adminTodayTodos, "今天没有到期的个人或行政事项。")}
          </Panel>
          {/* 接待预告 */}
          <Panel title={t.today.receptionTitle}>
            {nearest ? (
              <ReceptionPreview
                reception={nearest}
                daysLabel={t.today.receptionInDays(
                  differenceInCalendarDays(parseISO(startDayOf(nearest)), now),
                )}
                progressLabel={
                  nearest.checklistTotal > 0
                    ? t.receptions.checklistProgress(
                        nearest.checklistDone,
                        nearest.checklistTotal,
                      )
                    : ""
                }
              />
            ) : (
              <Empty text={t.today.receptionEmpty} />
            )}
          </Panel>

          {/* 等待对方回复 */}
          <Panel title={t.today.waitingTitle} count={t.today.waitingHint}>
            {waiting.length ? (
              <div className="flex flex-col gap-1">
                {waiting.map((task) => (
                  <Link
                    key={task.id}
                    href="/tasks"
                    className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-secondary/60"
                  >
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-amber-500 shadow-[0_0_0_3px_rgba(245,158,11,0.15)]" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{task.title}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {task.projectId
                          ? projectName.get(task.projectId) ?? t.common.personal
                          : t.common.personal}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <Empty text={t.today.waitingEmpty} />
            )}
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}

function SummaryTile({
  dot,
  strong,
  text,
}: {
  dot: string;
  strong: string;
  text: string;
}) {
  return (
    <div className="today-summary-tile flex items-center gap-2.5 rounded-xl bg-card px-4 py-2.5 shadow-[var(--shadow-card)]">
      <span className={"h-2 w-2 shrink-0 rounded-full " + dot} />
      <span className="text-sm text-muted-foreground">
        {strong ? <b className="font-semibold text-foreground">{strong}</b> : null}{" "}
        {text}
      </span>
    </div>
  );
}

function Panel({
  title,
  count,
  children,
}: {
  title: string;
  count?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="today-panel rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
      <div className="flex items-baseline justify-between px-4 pb-2 pt-4">
        <h3 className="text-base font-semibold">{title}</h3>
        {count ? <span className="text-xs text-muted-foreground">{count}</span> : null}
      </div>
      <div className="px-2.5 pb-3">{children}</div>
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="px-2 py-4 text-sm text-muted-foreground">{text}</div>;
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
  daysLabel: string;
  progressLabel: string;
}) {
  const meta = receptionTypeMeta[reception.type];
  const range = `${reception.startAt.slice(0, 10)}${
    reception.endAt ? ` → ${reception.endAt.slice(0, 10)}` : ""
  }`;
  return (
    <Link href={`/receptions/${reception.id}`} className="block px-2 pb-1">
      <div className="flex items-center justify-between">
        <Badge tone="active">{meta.short}</Badge>
        <Badge tone="active">{daysLabel}</Badge>
      </div>
      <div className="mt-2 text-[15px] font-semibold hover:text-primary">
        {reception.title}
      </div>
      <div className="tnum mt-1 text-xs text-muted-foreground">{range}</div>
      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
        {reception.location ? (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {reception.location}
          </span>
        ) : null}
        {progressLabel ? (
          <span className="tnum text-xs font-medium text-primary">{progressLabel}</span>
        ) : null}
      </div>
    </Link>
  );
}
