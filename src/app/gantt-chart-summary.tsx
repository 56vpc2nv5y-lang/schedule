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
import { ArrowUpRight, ChevronRight } from "lucide-react";
import {
  setStageStatusQuickAction,
  updateStageScheduleAction,
} from "@/app/actions";
import { useDict, useLocale } from "@/components/layout/locale-provider";
import { Badge } from "@/components/ui/badge";
import { ContextMenu, type MenuItem } from "@/components/ui/context-menu";
import { cn } from "@/lib/utils";

type GanttProject = {
  id: string;
  nameZh: string;
  region: string;
  status: string;
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

function stageTone(status: string) {
  if (status === "COMPLETED") return "bg-emerald-600";
  if (status === "IN_PROGRESS") return "bg-indigo-600";
  if (status === "DELAYED") return "bg-red-600";
  return "bg-slate-500";
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
  const [expandedId, setExpandedId] = useState<string | null>(null);
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

  const { winStart, winEnd, months } = useMemo(() => {
    const today = new Date();
    const start = startOfMonth(addDays(today, -30));
    const end = endOfMonth(addDays(today, 90));
    const monthItems: { label: string; start: Date; days: number }[] = [];
    let cursor = start;
    while (cursor <= end) {
      const monthEnd = endOfMonth(cursor);
      monthItems.push({
        label:
          locale === "en"
            ? format(cursor, "MMM")
            : `${cursor.getMonth() + 1} 月`,
        start: cursor,
        days: differenceInCalendarDays(monthEnd, cursor) + 1,
      });
      cursor = addDays(monthEnd, 1);
    }
    return { winStart: start, winEnd: end, months: monthItems };
  }, [locale]);

  const winStartIso = format(winStart, "yyyy-MM-dd");
  const winEndIso = format(winEnd, "yyyy-MM-dd");
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

  const visibleProjects = projects
    .filter(
      (project) => project.status === "ACTIVE" || project.status === "PAUSED",
    )
    .filter((project) => {
      const projectStages = stages.filter(
        (stage) => stage.projectId === project.id,
      );
      const hasCurrent = projectStages.some(
        (stage) =>
          stage.status === "IN_PROGRESS" || stage.status === "DELAYED",
      );
      const overlapsWindow = projectStages.some((stage) => {
        const current = schedule[stage.id];
        return (
          current?.start &&
          current?.end &&
          current.start <= winEndIso &&
          current.end >= winStartIso
        );
      });
      return hasCurrent || overlapsWindow || projectStages.length === 0;
    })
    .sort((a, b) => {
      const aPaused = a.status === "PAUSED" ? 1 : 0;
      const bPaused = b.status === "PAUSED" ? 1 : 0;
      if (aPaused !== bPaused) return aPaused - bPaused;
      return a.nameZh.localeCompare(b.nameZh, "zh-CN");
    });

  function statusLabel(status: string) {
    if (status === "COMPLETED") return t.gantt.done;
    if (status === "IN_PROGRESS") return t.gantt.active;
    if (status === "DELAYED") return t.gantt.delayed;
    return t.gantt.notStarted;
  }

  function projectRange(projectId: string) {
    const dated = stages
      .filter((stage) => stage.projectId === projectId)
      .map((stage) => schedule[stage.id])
      .filter((item) => item?.start && item?.end);
    if (!dated.length) return null;
    const start = dated.map((item) => item.start).sort()[0];
    const end = dated.map((item) => item.end).sort().at(-1)!;
    if (start > winEndIso || end < winStartIso) return null;
    const visibleStart = start < winStartIso ? winStartIso : start;
    const visibleEnd = end > winEndIso ? winEndIso : end;
    return {
      start,
      end,
      left: toPercent(visibleStart),
      width: Math.max(1, toPercent(visibleEnd) - toPercent(visibleStart)),
    };
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
    <section className="blueprint-gantt overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <header className="blueprint-gantt-header flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold">近期项目时间线</h2>
          <p className="tnum mt-0.5 font-mono text-[11px] text-muted-foreground">
            {winStartIso} - {winEndIso} · {visibleProjects.length} 个活跃项目
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <Legend color="bg-emerald-600" label={t.gantt.done} />
          <Legend color="bg-indigo-600" label={t.gantt.active} />
          <Legend color="bg-red-600" label={t.gantt.delayed} />
        </div>
      </header>

      <div className="overflow-x-auto">
        <div className="min-w-[980px]">
          <div className="grid grid-cols-[300px_minmax(680px,1fr)]">
            <div className="sticky left-0 z-30 flex h-11 items-center border-b border-r border-border bg-secondary px-4 text-xs font-medium text-muted-foreground">
              现在正在推进
            </div>
            <div
              ref={timelineRef}
              className="relative flex h-11 border-b border-border bg-secondary"
            >
              {months.map((month) => (
                <div
                  key={month.label}
                  className="flex items-center border-r border-border px-2 text-xs text-muted-foreground"
                  style={{ width: `${(month.days / totalDays) * 100}%` }}
                >
                  {month.label}
                </div>
              ))}
            </div>

            {visibleProjects.map((project) => {
              const isExpanded = expandedId === project.id;
              const range = projectRange(project.id);
              const projectStages = stages
                .filter((stage) => stage.projectId === project.id)
                .sort((a, b) =>
                  (schedule[a.id]?.start || "9999").localeCompare(
                    schedule[b.id]?.start || "9999",
                  ),
                );

              return (
                <div key={project.id} className="contents">
                  <div className="blueprint-gantt-project sticky left-0 z-20 flex h-14 items-center gap-2 border-b border-r border-border bg-card px-3">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedId(isExpanded ? null : project.id)
                      }
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded hover:bg-secondary"
                      title={isExpanded ? "收起阶段" : "展开阶段"}
                    >
                      <ChevronRight
                        className={cn(
                          "h-4 w-4 transition-transform",
                          isExpanded && "rotate-90",
                        )}
                      />
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-semibold">
                          {project.nameZh}
                        </span>
                        {project.status === "PAUSED" ? (
                          <Badge tone="waiting">暂停</Badge>
                        ) : null}
                      </div>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {project.currentStageName
                          ? `当前：${project.currentStageName}`
                          : "当前阶段待确认"}
                        {project.region ? ` · ${project.region}` : ""}
                      </p>
                    </div>
                    <Link
                      href={`/projects/${project.id}`}
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-secondary hover:text-foreground"
                      title="打开项目详情"
                    >
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                  <div className="blueprint-gantt-grid relative h-14 border-b border-border bg-card">
                    <TimelineGrid
                      months={months}
                      totalDays={totalDays}
                      winStart={winStart}
                      toPercent={toPercent}
                      todayPercent={todayPercent}
                    />
                    {range ? (
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedId(isExpanded ? null : project.id)
                        }
                        className="blueprint-gantt-summary-bar absolute top-3 z-10 flex h-8 min-w-36 items-center overflow-hidden rounded bg-foreground px-3 text-left text-[11px] font-semibold text-background shadow-sm hover:bg-foreground/90"
                        style={{
                          left: `${range.left}%`,
                          width: `max(${range.width}%, 144px)`,
                          maxWidth: `calc(100% - ${range.left}%)`,
                        }}
                        title={`${project.nameZh}\n${range.start} - ${range.end}`}
                      >
                        <span className="truncate">
                          {project.currentStageName || project.nameZh}
                        </span>
                        <span className="ml-auto shrink-0 pl-2 opacity-70">
                          {project.completedStageCount}/
                          {project.totalStageCount}
                        </span>
                      </button>
                    ) : (
                      <span className="absolute left-3 top-4 text-xs text-muted-foreground">
                        近期未排期
                      </span>
                    )}
                  </div>

                  {isExpanded
                    ? projectStages.map((stage) => {
                        const current = schedule[stage.id];
                        const hasDates = Boolean(
                          current?.start && current?.end,
                        );
                        const overlaps =
                          hasDates &&
                          current.start <= winEndIso &&
                          current.end >= winStartIso;
                        const visibleStart =
                          overlaps && current.start < winStartIso
                            ? winStartIso
                            : current?.start;
                        const visibleEnd =
                          overlaps && current.end > winEndIso
                            ? winEndIso
                            : current?.end;
                        const left =
                          overlaps && visibleStart
                            ? toPercent(visibleStart)
                            : 0;
                        const width =
                          overlaps && visibleStart && visibleEnd
                            ? Math.max(
                                0.8,
                                toPercent(visibleEnd) -
                                  toPercent(visibleStart),
                              )
                            : 0;

                        return (
                          <div key={stage.id} className="contents">
                            <div className="sticky left-0 z-20 flex h-12 items-center border-b border-r border-border bg-secondary/35 pl-12 pr-3">
                              <div className="min-w-0">
                                <p className="truncate text-xs font-medium">
                                  {stage.name}
                                </p>
                                <p className="tnum mt-0.5 font-mono text-[10px] text-muted-foreground">
                                  {hasDates
                                    ? `${current.start} - ${current.end}`
                                    : t.detail.notScheduled}
                                </p>
                              </div>
                            </div>
                            <div className="blueprint-gantt-grid relative h-12 touch-none border-b border-border bg-secondary/15">
                              <TimelineGrid
                                months={months}
                                totalDays={totalDays}
                                winStart={winStart}
                                toPercent={toPercent}
                                todayPercent={todayPercent}
                              />
                              {overlaps ? (
                                <div
                                  className={cn(
                                    "blueprint-gantt-stage-bar group absolute top-2.5 z-10 flex h-7 min-w-24 cursor-grab items-center overflow-hidden rounded text-[11px] font-medium text-white shadow-sm active:cursor-grabbing",
                                    stageTone(stage.status),
                                    activeId === stage.id &&
                                      "ring-2 ring-foreground/30 ring-offset-1",
                                  )}
                                  style={{
                                    left: `${left}%`,
                                    width: `max(${width}%, 96px)`,
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
                                <span className="absolute left-3 top-4 text-[11px] text-muted-foreground">
                                  {hasDates ? "不在近期窗口" : t.detail.notScheduled}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    : null}
                </div>
              );
            })}
          </div>
          {visibleProjects.length === 0 ? (
            <div className="border-t border-border px-4 py-10 text-center text-sm text-muted-foreground">
              近期没有处于推进中的项目
            </div>
          ) : null}
        </div>
      </div>

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
  totalDays,
  winStart,
  toPercent,
  todayPercent,
}: {
  months: { label: string; start: Date; days: number }[];
  totalDays: number;
  winStart: Date;
  toPercent: (iso: string) => number;
  todayPercent: number;
}) {
  return (
    <div className="pointer-events-none absolute inset-0">
      {months.map((month) => (
        <span
          key={month.label}
          className="absolute bottom-0 top-0 border-r border-border/65"
          style={{
            left: `${toPercent(format(month.start, "yyyy-MM-dd"))}%`,
            width: `${(month.days / totalDays) * 100}%`,
          }}
        />
      ))}
      {Array.from({
        length: Math.ceil(totalDays / 14),
      }).map((_, index) => {
        const date = addDays(winStart, index * 14);
        return (
          <span
            key={index}
            className="absolute bottom-0 top-0 border-l border-border/25"
            style={{ left: `${toPercent(format(date, "yyyy-MM-dd"))}%` }}
          />
        );
      })}
      <span
        className="blueprint-today-line absolute bottom-0 top-0 z-20 border-l border-red-500"
        style={{ left: `${todayPercent}%` }}
      />
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn("h-2 w-2 rounded-full", color)} />
      {label}
    </span>
  );
}
