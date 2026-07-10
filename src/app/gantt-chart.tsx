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
import { CalendarRange, GanttChartSquare } from "lucide-react";
import {
  setStageStatusQuickAction,
  updateStageScheduleAction,
} from "@/app/actions";
import { ContextMenu, type MenuItem } from "@/components/ui/context-menu";
import { useDict, useLocale } from "@/components/layout/locale-provider";
import { cn } from "@/lib/utils";

type GanttProject = {
  id: string;
  nameZh: string;
  region: string;
  progress: number;
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

const DAY = 86400000;
const LANE_H = 34; // 每条泳道高度
const ROW_PAD = 10;

function stageBarColor(status: string) {
  if (status === "COMPLETED") return "bg-emerald-500";
  if (status === "IN_PROGRESS") return "bg-primary";
  if (status === "DELAYED") return "bg-red-500";
  return "bg-slate-400";
}

function stageBorderColor(status: string) {
  if (status === "COMPLETED") return "border-emerald-500";
  if (status === "IN_PROGRESS") return "border-primary";
  if (status === "DELAYED") return "border-red-500";
  return "border-slate-400";
}

function shiftIso(iso: string, days: number) {
  return format(addDays(parseISO(iso), days), "yyyy-MM-dd");
}

/** 按占位区间（含标签宽度）分配泳道，保证条与标签都不重叠 */
function assignLanes(
  items: { id: string; startPct: number; endPct: number }[],
): Map<string, number> {
  const lanes: number[] = []; // 每条泳道当前占用到的右边界（百分比）
  const result = new Map<string, number>();
  const sorted = [...items].sort((a, b) => a.startPct - b.startPct);
  for (const item of sorted) {
    let lane = lanes.findIndex((end) => end <= item.startPct);
    if (lane === -1) {
      lane = lanes.length;
      lanes.push(item.endPct);
    } else {
      lanes[lane] = item.endPct;
    }
    result.set(item.id, lane);
  }
  return result;
}

// 窄条标签宽度预估（百分比）：按字数估宽，用于给标签在右侧留出泳道空间。
// 假设时间轴可视宽度约 820px（偏小以更保守，宁可多留空也不叠字）。
const ASSUMED_TIMELINE_PX = 820;
const MAX_LABEL_CHARS = 16;
function labelReservePct(name: string) {
  const chars = Math.min(name.length, MAX_LABEL_CHARS);
  const px = chars * 12 + 20; // 每字约 12px + 内边距
  return (px / ASSUMED_TIMELINE_PX) * 100;
}
const NARROW_PCT = 9; // 条宽小于此值时，标签放到条外右侧

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
  const initial: Schedule = {};
  for (const stage of stages) {
    initial[stage.id] = { start: stage.plannedStart, end: stage.plannedEnd };
  }
  const [sched, setSched] = useState<Schedule>(initial);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [view, setView] = useState<"bars" | "board">("bars");
  const [menu, setMenu] = useState<{
    x: number;
    y: number;
    items: MenuItem[];
  } | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [, startTransition] = useTransition();
  const router = useRouter();

  const projectMap = new Map(projects.map((p) => [p.id, p]));

  const dated = stages.filter(
    (s) => (sched[s.id]?.start ?? s.plannedStart) && (sched[s.id]?.end ?? s.plannedEnd),
  );
  const undated = stages.filter(
    (s) => !(sched[s.id]?.start ?? s.plannedStart) || !(sched[s.id]?.end ?? s.plannedEnd),
  );

  // ── 动态时间窗：按数据算范围（前 2 周 ~ 后 1 个月），无数据则今天前后 ──
  const { winStart, winEnd, months } = useMemo(() => {
    const starts = dated.map((s) => sched[s.id]?.start ?? s.plannedStart);
    const ends = dated.map((s) => sched[s.id]?.end ?? s.plannedEnd);
    const todayIso = format(new Date(), "yyyy-MM-dd");
    const minIso = starts.length
      ? [...starts, todayIso].sort()[0]
      : format(addDays(new Date(), -30), "yyyy-MM-dd");
    const maxIso = ends.length
      ? [...ends, todayIso].sort().at(-1)!
      : format(addDays(new Date(), 150), "yyyy-MM-dd");
    const winStart = startOfMonth(addDays(parseISO(minIso), -14));
    const winEnd = endOfMonth(addDays(parseISO(maxIso), 30));

    const months: { label: string; start: Date; days: number }[] = [];
    let cursor = winStart;
    while (cursor < winEnd) {
      const end = endOfMonth(cursor);
      months.push({
        label:
          locale === "en"
            ? format(cursor, "MMM yyyy")
            : `${cursor.getFullYear()} 年 ${cursor.getMonth() + 1} 月`,
        start: cursor,
        days: differenceInCalendarDays(end, cursor) + 1,
      });
      cursor = addDays(end, 1);
    }
    return { winStart, winEnd, months };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(sched), stages.length, locale]);

  const spanMs = winEnd.getTime() - winStart.getTime();
  const totalDays = spanMs / DAY;

  function percent(dateIso: string) {
    if (!dateIso) return 0;
    return Math.max(
      0,
      Math.min(
        100,
        ((parseISO(dateIso).getTime() - winStart.getTime()) / spanMs) * 100,
      ),
    );
  }

  const todayIso = format(new Date(), "yyyy-MM-dd");
  const todayPct = percent(todayIso);
  const showToday =
    new Date().getTime() >= winStart.getTime() &&
    new Date().getTime() <= winEnd.getTime();

  function beginDrag(e: React.PointerEvent, stageId: string, mode: DragMode) {
    if (e.button !== 0) return; // 右键留给菜单
    e.preventDefault();
    e.stopPropagation();
    const grid = gridRef.current;
    if (!grid) return;
    const pxPerDay = grid.getBoundingClientRect().width / totalDays;
    const startX = e.clientX;
    const origin = sched[stageId] ?? { start: "", end: "" };
    if (!origin.start || !origin.end) return;
    setActiveId(stageId);

    const latest = { start: origin.start, end: origin.end };

    function onMove(ev: PointerEvent) {
      const deltaDays = Math.round((ev.clientX - startX) / pxPerDay);
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
      setSched((prev) => ({ ...prev, [stageId]: { start, end } }));
    }

    function onUp() {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      setActiveId(null);
      const changed = latest.start !== origin.start || latest.end !== origin.end;
      if (changed && dbConnected) {
        startTransition(async () => {
          await updateStageScheduleAction(stageId, latest.start, latest.end);
          router.refresh();
        });
      }
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  function openStatusMenu(e: React.MouseEvent, stage: GanttStage) {
    e.preventDefault();
    e.stopPropagation();
    const statuses = [
      { value: "COMPLETED", label: t.gantt.done },
      { value: "IN_PROGRESS", label: t.gantt.active },
      { value: "DELAYED", label: t.gantt.delayed },
      { value: "NOT_STARTED", label: t.gantt.notStarted },
    ];
    setMenu({
      x: e.clientX,
      y: e.clientY,
      items: statuses
        .filter((s) => s.value !== stage.status)
        .map((s) => ({
          label: `${t.gantt.markAs}: ${s.label}`,
          onClick: () => {
            if (!dbConnected) return;
            startTransition(async () => {
              await setStageStatusQuickAction(stage.id, s.value);
              router.refresh();
            });
          },
        })),
    });
  }

  // 每个项目的泳道分配：把窄条标签宽度算进占位，避免条与标签互相叠字
  const projectLanes = new Map<string, { lanes: Map<string, number>; count: number }>();
  for (const project of projects) {
    const items = dated
      .filter((s) => s.projectId === project.id)
      .map((s) => {
        const start = sched[s.id]?.start ?? s.plannedStart;
        const end = sched[s.id]?.end ?? s.plannedEnd;
        const startPct = percent(start);
        const barEndPct = percent(end);
        const narrow = barEndPct - startPct < NARROW_PCT;
        // 窄条标签在条右侧，占位到 end + 标签宽度；宽条标签在条内，仅占条本身
        const endPct = narrow
          ? barEndPct + labelReservePct(s.name) + 1
          : barEndPct;
        return { id: s.id, startPct, endPct };
      });
    const lanes = assignLanes(items);
    const count = Math.max(1, ...[...lanes.values()].map((l) => l + 1));
    projectLanes.set(project.id, { lanes, count });
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-base font-semibold">{t.gantt.title}</div>
          <p className="mt-1 text-xs text-muted-foreground">
            {view === "bars" ? t.gantt.barHint : t.gantt.boardHint}{" "}
            {dbConnected ? t.gantt.liveHint : t.gantt.demoHint}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg border border-border p-0.5">
            <button
              onClick={() => setView("bars")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                view === "bars"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <GanttChartSquare className="h-3.5 w-3.5" />
              {t.gantt.barView}
            </button>
            <button
              onClick={() => setView("board")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                view === "board"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <CalendarRange className="h-3.5 w-3.5" />
              {t.gantt.boardView}
            </button>
          </div>
          <div className="hidden gap-2 text-xs sm:flex">
            <LegendPill className="bg-emerald-500" label={t.gantt.done} />
            <LegendPill className="bg-primary" label={t.gantt.active} />
            <LegendPill className="bg-red-500" label={t.gantt.delayed} />
            <LegendPill className="bg-slate-400" label={t.gantt.notStarted} />
          </div>
        </div>
      </div>

      {view === "bars" ? (
        <div className="overflow-x-auto">
          <div className="grid min-w-[900px] grid-cols-[190px_minmax(0,1fr)]">
            <div className="border-r border-border bg-secondary/40">
              <div className="flex h-10 items-center border-b border-border px-4 text-xs font-medium text-muted-foreground">
                {t.gantt.colHeader}
              </div>
              {projects.map((project) => {
                const laneCount = projectLanes.get(project.id)?.count ?? 1;
                return (
                  <div
                    key={project.id}
                    className="flex flex-col justify-center border-b border-border px-4"
                    style={{ height: laneCount * LANE_H + ROW_PAD * 2 }}
                  >
                    <Link
                      href={`/projects/${project.id}`}
                      className="line-clamp-2 text-sm font-medium leading-5 hover:text-primary"
                    >
                      {project.nameZh}
                    </Link>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {project.region ? `${project.region} · ` : ""}
                      {project.progress}%
                    </div>
                  </div>
                );
              })}
            </div>

            <div>
              <div className="flex h-10 border-b border-border bg-secondary/40 text-xs text-muted-foreground">
                {months.map((month) => (
                  <div
                    key={month.label}
                    className="flex items-center overflow-hidden whitespace-nowrap border-r border-border px-2"
                    style={{ width: `${(month.days / totalDays) * 100}%` }}
                  >
                    {month.label}
                  </div>
                ))}
              </div>

              <div ref={gridRef} className="relative">
                {/* 月份网格线 */}
                <div className="pointer-events-none absolute inset-0 flex">
                  {months.map((month) => (
                    <div
                      key={month.label}
                      className="border-r border-border/50"
                      style={{ width: `${(month.days / totalDays) * 100}%` }}
                    />
                  ))}
                </div>
                {/* 今天参考线 */}
                {showToday ? (
                  <div
                    className="pointer-events-none absolute bottom-0 top-0 z-20 w-px bg-red-400"
                    style={{ left: `${todayPct}%` }}
                  >
                    <span className="absolute left-1 top-0 rounded-sm bg-red-50 px-1 text-[10px] font-medium text-red-500">
                      {t.gantt.today}
                    </span>
                  </div>
                ) : null}

                {projects.map((project) => {
                  const info = projectLanes.get(project.id);
                  const laneCount = info?.count ?? 1;
                  const projectStages = dated.filter(
                    (stage) => stage.projectId === project.id,
                  );

                  return (
                    <div
                      key={project.id}
                      className="relative touch-none border-b border-border"
                      style={{ height: laneCount * LANE_H + ROW_PAD * 2 }}
                    >
                      {projectStages.map((stage) => {
                        const current = sched[stage.id] ?? {
                          start: stage.plannedStart,
                          end: stage.plannedEnd,
                        };
                        const left = percent(current.start);
                        const width = Math.max(
                          1.2,
                          percent(current.end) - left,
                        );
                        const lane = info?.lanes.get(stage.id) ?? 0;
                        const active = activeId === stage.id;
                        const narrow = width < 9;

                        return (
                          <div
                            key={stage.id}
                            onPointerDown={(e) => beginDrag(e, stage.id, "move")}
                            onContextMenu={(e) => openStatusMenu(e, stage)}
                            className={cn(
                              "group absolute z-10 flex h-7 cursor-grab items-center rounded-md text-[11px] font-medium text-white shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing",
                              stageBarColor(stage.status),
                              active && "ring-2 ring-primary/70 ring-offset-1",
                            )}
                            style={{
                              left: `${left}%`,
                              width: `${width}%`,
                              top: ROW_PAD + lane * LANE_H,
                            }}
                            title={`${stage.name}\n${current.start} → ${current.end}`}
                          >
                            <span
                              onPointerDown={(e) => beginDrag(e, stage.id, "left")}
                              className="h-full w-2 shrink-0 cursor-ew-resize rounded-l-md bg-black/20 opacity-0 group-hover:opacity-100"
                            />
                            {!narrow ? (
                              <span className="min-w-0 flex-1 truncate px-1">
                                {stage.name}
                              </span>
                            ) : (
                              <span className="min-w-0 flex-1" />
                            )}
                            <span
                              onPointerDown={(e) => beginDrag(e, stage.id, "right")}
                              className="h-full w-2 shrink-0 cursor-ew-resize rounded-r-md bg-black/20 opacity-0 group-hover:opacity-100"
                            />
                            {narrow ? (
                              <span className="pointer-events-none absolute left-full top-1/2 z-20 ml-1.5 max-w-[190px] -translate-y-1/2 truncate whitespace-nowrap text-[11px] font-medium text-foreground group-hover:z-30">
                                {stage.name}
                              </span>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {undated.length ? (
            <div className="flex flex-wrap items-center gap-2 border-t border-border bg-secondary/30 px-4 py-2.5 text-xs text-muted-foreground">
              <span>{t.gantt.noDates}</span>
              {undated.slice(0, 8).map((stage) => (
                <Link
                  key={stage.id}
                  href={`/projects/${stage.projectId}`}
                  className="rounded-md border border-border bg-card px-2 py-0.5 hover:text-primary"
                >
                  {stage.name}
                </Link>
              ))}
              {undated.length > 8 ? <span>+{undated.length - 8}</span> : null}
            </div>
          ) : null}
        </div>
      ) : (
        <div className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((qi) => {
            const year = new Date().getFullYear();
            const label = `Q${qi + 1} · ${year}`;
            const items = dated
              .filter((stage) => {
                const iso = sched[stage.id]?.start ?? stage.plannedStart;
                if (!iso) return false;
                const d = parseISO(iso);
                return (
                  d.getFullYear() === year && Math.floor(d.getMonth() / 3) === qi
                );
              })
              .sort((a, b) => {
                const sa = sched[a.id]?.start ?? a.plannedStart;
                const sb = sched[b.id]?.start ?? b.plannedStart;
                return sa.localeCompare(sb);
              });

            return (
              <div
                key={qi}
                className="rounded-lg border border-border bg-secondary/30"
              >
                <div className="border-b border-border px-3 py-2.5">
                  <div className="text-sm font-semibold">{label}</div>
                  <div className="text-xs text-muted-foreground">
                    {t.gantt.itemsCount(items.length)}
                  </div>
                </div>
                <div className="space-y-2 p-2">
                  {items.map((stage) => {
                    const current = sched[stage.id] ?? {
                      start: stage.plannedStart,
                      end: stage.plannedEnd,
                    };
                    return (
                      <Link
                        key={stage.id}
                        href={`/projects/${stage.projectId}`}
                        className={cn(
                          "block rounded-md border-l-4 bg-card p-2.5 shadow-sm transition-colors hover:bg-accent/40",
                          stageBorderColor(stage.status),
                        )}
                      >
                        <div className="text-xs font-medium leading-5">
                          {stage.name}
                        </div>
                        <div className="mt-0.5 truncate text-[11px] text-muted-foreground">
                          {projectMap.get(stage.projectId)?.nameZh}
                        </div>
                        <div className="tnum mt-1 font-mono text-[11px] text-muted-foreground">
                          {current.start}
                          {current.end && current.end !== current.start
                            ? ` → ${current.end}`
                            : ""}
                        </div>
                      </Link>
                    );
                  })}
                  {items.length === 0 ? (
                    <div className="rounded-md border border-dashed border-border px-2 py-6 text-center text-xs text-muted-foreground">
                      {t.gantt.quarterEmpty}
                    </div>
                  ) : null}
                </div>
              </div>
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
    </div>
  );
}

function LegendPill({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-muted-foreground">
      <span className={cn("h-2.5 w-2.5 rounded-full", className)} />
      {label}
    </span>
  );
}
