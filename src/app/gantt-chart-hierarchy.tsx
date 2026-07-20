"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  addDays,
  differenceInCalendarDays,
  endOfMonth,
  format,
  parseISO,
  startOfMonth,
} from "date-fns";
import {
  CalendarRange,
  ChevronRight,
  GanttChartSquare,
  GripVertical,
} from "lucide-react";
import {
  setStageStatusQuickAction,
  updateStageScheduleAction,
} from "@/app/actions";
import { useDict, useLocale } from "@/components/layout/locale-provider";
import { ContextMenu, type MenuItem } from "@/components/ui/context-menu";
import { cn } from "@/lib/utils";

type GanttProject = {
  id: string;
  nameZh: string;
  region: string;
  completedStageCount: number;
  totalStageCount: number;
  currentStageName: string;
};

type GanttStage = {
  id: string;
  projectId: string;
  name: string;
  plannedStart: string;
  plannedEnd: string;
  status: string;
};

type Schedule = Record<string, { start: string; end: string }>;
type DragMode = "move" | "left" | "right";

const DAY = 86_400_000;

function barTone(status: string) {
  if (status === "COMPLETED") return "bg-emerald-600";
  if (status === "IN_PROGRESS") return "bg-indigo-600";
  if (status === "DELAYED") return "bg-red-600";
  return "bg-slate-500";
}

function borderTone(status: string) {
  if (status === "COMPLETED") return "border-emerald-500";
  if (status === "IN_PROGRESS") return "border-indigo-500";
  if (status === "DELAYED") return "border-red-500";
  return "border-slate-400";
}

function shiftIso(iso: string, days: number) {
  return format(addDays(parseISO(iso), days), "yyyy-MM-dd");
}

export function GanttChart({
  projects,
  stages,
  dbConnected,
}: {
  projects: GanttProject[];
  stages: GanttStage[];
  dbConnected: boolean;
}) {
  const t = useDict();
  const locale = useLocale();
  const router = useRouter();
  const timelineRef = useRef<HTMLDivElement>(null);
  const [, startTransition] = useTransition();
  const [view, setView] = useState<"timeline" | "quarter">("timeline");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [menu, setMenu] = useState<{
    x: number;
    y: number;
    items: MenuItem[];
  } | null>(null);
  const [schedule, setSchedule] = useState<Schedule>(() =>
    Object.fromEntries(
      stages.map((stage) => [
        stage.id,
        { start: stage.plannedStart, end: stage.plannedEnd },
      ]),
    ),
  );

  const datedStages = stages.filter((stage) => {
    const current = schedule[stage.id];
    return current?.start && current?.end;
  });

  const { winStart, winEnd, months, markers } = useMemo(() => {
    const today = new Date();
    const todayIso = format(today, "yyyy-MM-dd");
    const starts = datedStages.map((stage) => schedule[stage.id].start);
    const ends = datedStages.map((stage) => schedule[stage.id].end);
    const minIso = starts.length
      ? [...starts, todayIso].sort()[0]
      : format(addDays(today, -30), "yyyy-MM-dd");
    const maxIso = ends.length
      ? [...ends, todayIso].sort().at(-1)!
      : format(addDays(today, 150), "yyyy-MM-dd");
    const start = startOfMonth(addDays(parseISO(minIso), -14));
    const end = endOfMonth(addDays(parseISO(maxIso), 30));
    const monthItems: { label: string; start: Date; days: number }[] = [];
    let monthCursor = start;
    while (monthCursor <= end) {
      const monthEnd = endOfMonth(monthCursor);
      monthItems.push({
        label:
          locale === "en"
            ? format(monthCursor, "MMM yyyy")
            : `${monthCursor.getFullYear()} 年 ${monthCursor.getMonth() + 1} 月`,
        start: monthCursor,
        days: differenceInCalendarDays(monthEnd, monthCursor) + 1,
      });
      monthCursor = addDays(monthEnd, 1);
    }

    const markerItems: Date[] = [];
    let marker = start;
    while (marker <= end) {
      markerItems.push(marker);
      marker = addDays(marker, 14);
    }
    return {
      winStart: start,
      winEnd: end,
      months: monthItems,
      markers: markerItems,
    };
    // schedule intentionally recalculates the visible range after dragging.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schedule, stages, locale]);

  const spanMs = winEnd.getTime() - winStart.getTime();
  const totalDays = spanMs / DAY;
  const toPercent = (iso: string) =>
    Math.max(
      0,
      Math.min(
        100,
        ((parseISO(iso).getTime() - winStart.getTime()) / spanMs) * 100,
      ),
    );
  const todayIso = format(new Date(), "yyyy-MM-dd");
  const todayPercent = toPercent(todayIso);
  const showToday = todayIso >= format(winStart, "yyyy-MM-dd") &&
    todayIso <= format(winEnd, "yyyy-MM-dd");

  function statusLabel(status: string) {
    if (status === "COMPLETED") return t.gantt.done;
    if (status === "IN_PROGRESS") return t.gantt.active;
    if (status === "DELAYED") return t.gantt.delayed;
    return t.gantt.notStarted;
  }

  function beginDrag(
    event: React.PointerEvent,
    stageId: string,
    mode: DragMode,
  ) {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    const timeline = timelineRef.current;
    const origin = schedule[stageId];
    if (!timeline || !origin?.start || !origin?.end) return;

    const pxPerDay = timeline.getBoundingClientRect().width / totalDays;
    const startX = event.clientX;
    const latest = { ...origin };
    setActiveId(stageId);

    function onMove(pointer: PointerEvent) {
      const deltaDays = Math.round((pointer.clientX - startX) / pxPerDay);
      let start = origin.start;
      let end = origin.end;
      if (mode === "move") {
        start = shiftIso(origin.start, deltaDays);
        end = shiftIso(origin.end, deltaDays);
      } else if (mode === "left") {
        start = shiftIso(origin.start, deltaDays);
        if (start > end) start = end;
      } else {
        end = shiftIso(origin.end, deltaDays);
        if (end < start) end = start;
      }
      latest.start = start;
      latest.end = end;
      setSchedule((previous) => ({
        ...previous,
        [stageId]: { start, end },
      }));
    }

    function onUp() {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      setActiveId(null);
      if (
        dbConnected &&
        (latest.start !== origin.start || latest.end !== origin.end)
      ) {
        startTransition(async () => {
          await updateStageScheduleAction(stageId, latest.start, latest.end);
          router.refresh();
        });
      }
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  function openStatusMenu(event: React.MouseEvent, stage: GanttStage) {
    event.preventDefault();
    event.stopPropagation();
    const statuses = ["COMPLETED", "IN_PROGRESS", "DELAYED", "NOT_STARTED"];
    setMenu({
      x: event.clientX,
      y: event.clientY,
      items: statuses
        .filter((status) => status !== stage.status)
        .map((status) => ({
          label: `${t.gantt.markAs}: ${statusLabel(status)}`,
          onClick: () => {
            if (!dbConnected) return;
            startTransition(async () => {
              await setStageStatusQuickAction(stage.id, status);
              router.refresh();
            });
          },
        })),
    });
  }

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <div className="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold">{t.gantt.title}</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {projects.length} 个项目 · {stages.length} 个阶段
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex rounded-md border border-border p-0.5">
            <button
              type="button"
              onClick={() => setView("timeline")}
              className={cn(
                "flex h-7 items-center gap-1.5 rounded px-2 text-xs font-medium",
                view === "timeline"
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <GanttChartSquare className="h-3.5 w-3.5" />
              {t.gantt.barView}
            </button>
            <button
              type="button"
              onClick={() => setView("quarter")}
              className={cn(
                "flex h-7 items-center gap-1.5 rounded px-2 text-xs font-medium",
                view === "quarter"
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <CalendarRange className="h-3.5 w-3.5" />
              {t.gantt.boardView}
            </button>
          </div>
          <div className="hidden items-center gap-2 text-xs lg:flex">
            <Legend color="bg-emerald-600" label={t.gantt.done} />
            <Legend color="bg-indigo-600" label={t.gantt.active} />
            <Legend color="bg-red-600" label={t.gantt.delayed} />
            <Legend color="bg-slate-500" label={t.gantt.notStarted} />
          </div>
        </div>
      </div>

      {view === "timeline" ? (
        <div className="overflow-x-auto">
          <div className="min-w-[1080px]">
            <div className="grid grid-cols-[280px_minmax(800px,1fr)]">
              <div className="sticky left-0 z-30 flex h-14 items-center border-b border-r border-border bg-secondary px-4 text-xs font-semibold text-muted-foreground">
                项目 / 阶段 / 计划日期
              </div>
              <div
                ref={timelineRef}
                className="relative h-14 border-b border-border bg-secondary"
              >
                <div className="flex h-8">
                  {months.map((month) => (
                    <div
                      key={month.label}
                      className="flex items-center border-r border-border px-2 text-xs font-medium"
                      style={{ width: `${(month.days / totalDays) * 100}%` }}
                    >
                      {month.label}
                    </div>
                  ))}
                </div>
                <div className="relative h-6 border-t border-border/70">
                  {markers.map((marker) => (
                    <span
                      key={marker.toISOString()}
                      className="absolute top-1 text-[10px] text-muted-foreground"
                      style={{
                        left: `${toPercent(format(marker, "yyyy-MM-dd"))}%`,
                      }}
                    >
                      {format(marker, "MM-dd")}
                    </span>
                  ))}
                </div>
              </div>

              {projects.map((project) => {
                const projectStages = stages
                  .filter((stage) => stage.projectId === project.id)
                  .sort((a, b) => {
                    const sa = schedule[a.id]?.start || "9999";
                    const sb = schedule[b.id]?.start || "9999";
                    return sa.localeCompare(sb);
                  });

                return (
                  <div key={project.id} className="contents">
                    <div className="sticky left-0 z-20 flex min-h-12 items-center border-b border-r border-border bg-secondary/80 px-4">
                      <Link
                        href={`/projects/${project.id}`}
                        className="group min-w-0 flex-1"
                      >
                        <div className="flex items-center gap-1.5 text-sm font-semibold group-hover:text-primary">
                          <span className="truncate">{project.nameZh}</span>
                          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                        </div>
                        <div className="mt-0.5 truncate text-xs text-muted-foreground">
                          {project.region ? `${project.region} · ` : ""}
                          阶段完成 {project.completedStageCount}/
                          {project.totalStageCount}
                          {project.currentStageName
                            ? ` · 当前：${project.currentStageName}`
                            : ""}
                        </div>
                      </Link>
                    </div>
                    <div className="relative min-h-12 border-b border-border bg-secondary/45">
                      <TimelineGrid
                        months={months}
                        markers={markers}
                        totalDays={totalDays}
                        toPercent={toPercent}
                        showToday={showToday}
                        todayPercent={todayPercent}
                        todayLabel={t.gantt.today}
                      />
                    </div>

                    {projectStages.map((stage) => {
                      const current = schedule[stage.id];
                      const hasDates = Boolean(current?.start && current?.end);
                      const left = hasDates ? toPercent(current.start) : 0;
                      const width = hasDates
                        ? Math.max(0.8, toPercent(current.end) - left)
                        : 0;

                      return (
                        <div key={stage.id} className="contents">
                          <div className="sticky left-0 z-20 flex h-14 items-center gap-2 border-b border-r border-border bg-card px-4 pl-7">
                            <GripVertical className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
                            <div className="min-w-0">
                              <div className="truncate text-xs font-medium">
                                {stage.name}
                              </div>
                              <div className="tnum mt-0.5 font-mono text-[10px] text-muted-foreground">
                                {hasDates
                                  ? `${current.start} - ${current.end}`
                                  : t.detail.notScheduled}
                              </div>
                            </div>
                          </div>
                          <div className="relative h-14 touch-none border-b border-border">
                            <TimelineGrid
                              months={months}
                              markers={markers}
                              totalDays={totalDays}
                              toPercent={toPercent}
                              showToday={showToday}
                              todayPercent={todayPercent}
                            />
                            {hasDates ? (
                              <div
                                className={cn(
                                  "group absolute top-3 z-10 flex h-8 min-w-28 cursor-grab items-center overflow-hidden rounded text-[11px] font-medium text-white shadow-sm active:cursor-grabbing",
                                  barTone(stage.status),
                                  activeId === stage.id &&
                                    "ring-2 ring-foreground/30 ring-offset-1",
                                )}
                                style={{
                                  left: `${left}%`,
                                  width: `max(${width}%, 112px)`,
                                  maxWidth: `calc(100% - ${left}%)`,
                                }}
                                onPointerDown={(event) =>
                                  beginDrag(event, stage.id, "move")
                                }
                                onContextMenu={(event) =>
                                  openStatusMenu(event, stage)
                                }
                                title={`${stage.name}\n${current.start} - ${current.end}\n${statusLabel(stage.status)}`}
                              >
                                <span
                                  className="h-full w-2 shrink-0 cursor-ew-resize bg-black/15 opacity-0 group-hover:opacity-100"
                                  onPointerDown={(event) =>
                                    beginDrag(event, stage.id, "left")
                                  }
                                />
                                <span className="min-w-0 flex-1 truncate px-1.5">
                                  {stage.name}
                                </span>
                                <span
                                  className="h-full w-2 shrink-0 cursor-ew-resize bg-black/15 opacity-0 group-hover:opacity-100"
                                  onPointerDown={(event) =>
                                    beginDrag(event, stage.id, "right")
                                  }
                                />
                              </div>
                            ) : (
                              <div className="absolute left-3 top-3 rounded border border-dashed border-border bg-secondary/60 px-2 py-1 text-[11px] text-muted-foreground">
                                {t.detail.notScheduled}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-px bg-border sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((quarter) => {
            const year = new Date().getFullYear();
            const items = datedStages
              .filter((stage) => {
                const start = parseISO(schedule[stage.id].start);
                return (
                  start.getFullYear() === year &&
                  Math.floor(start.getMonth() / 3) === quarter
                );
              })
              .sort((a, b) =>
                schedule[a.id].start.localeCompare(schedule[b.id].start),
              );
            return (
              <section key={quarter} className="min-h-72 bg-card">
                <header className="border-b border-border bg-secondary/70 px-3 py-2.5">
                  <div className="text-sm font-semibold">
                    Q{quarter + 1} · {year}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {t.gantt.itemsCount(items.length)}
                  </div>
                </header>
                <div className="space-y-2 p-2.5">
                  {items.map((stage) => (
                    <Link
                      key={stage.id}
                      href={`/projects/${stage.projectId}`}
                      className={cn(
                        "block border-l-4 bg-secondary/40 px-3 py-2 transition-colors hover:bg-secondary",
                        borderTone(stage.status),
                      )}
                    >
                      <div className="truncate text-xs font-medium">
                        {stage.name}
                      </div>
                      <div className="mt-1 truncate text-[11px] text-muted-foreground">
                        {
                          projects.find(
                            (project) => project.id === stage.projectId,
                          )?.nameZh
                        }
                      </div>
                      <div className="tnum mt-1 font-mono text-[10px] text-muted-foreground">
                        {schedule[stage.id].start} - {schedule[stage.id].end}
                      </div>
                    </Link>
                  ))}
                  {items.length === 0 ? (
                    <div className="border border-dashed border-border px-2 py-8 text-center text-xs text-muted-foreground">
                      {t.gantt.quarterEmpty}
                    </div>
                  ) : null}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {menu ? (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          items={menu.items}
          onClose={() => setMenu(null)}
        />
      ) : null}
    </section>
  );
}

function TimelineGrid({
  months,
  markers,
  totalDays,
  toPercent,
  showToday,
  todayPercent,
  todayLabel,
}: {
  months: { label: string; start: Date; days: number }[];
  markers: Date[];
  totalDays: number;
  toPercent: (iso: string) => number;
  showToday: boolean;
  todayPercent: number;
  todayLabel?: string;
}) {
  return (
    <div className="pointer-events-none absolute inset-0">
      {months.map((month) => (
        <span
          key={month.label}
          className="absolute bottom-0 top-0 border-r border-border/70"
          style={{
            left: `${toPercent(format(month.start, "yyyy-MM-dd"))}%`,
            width: `${(month.days / totalDays) * 100}%`,
          }}
        />
      ))}
      {markers.map((marker) => (
        <span
          key={marker.toISOString()}
          className="absolute bottom-0 top-0 border-l border-border/30"
          style={{ left: `${toPercent(format(marker, "yyyy-MM-dd"))}%` }}
        />
      ))}
      {showToday ? (
        <span
          className="absolute bottom-0 top-0 z-20 border-l border-red-500"
          style={{ left: `${todayPercent}%` }}
        >
          {todayLabel ? (
            <span className="absolute left-1 top-1 whitespace-nowrap bg-card px-1 text-[10px] font-medium text-red-600">
              {todayLabel}
            </span>
          ) : null}
        </span>
      ) : null}
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-muted-foreground">
      <span className={cn("h-2 w-2 rounded-full", color)} />
      {label}
    </span>
  );
}
