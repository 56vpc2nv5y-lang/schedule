"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  deleteScheduleBlockAction,
  moveScheduleBlockAction,
} from "@/app/actions";
import { ContextMenu, type MenuItem } from "@/components/ui/context-menu";
import { useDict } from "@/components/layout/locale-provider";
import { cn } from "@/lib/utils";

export type WeekBlock = {
  id: string;
  title: string;
  date: string; // "" = 每天例行
  startMin: number;
  endMin: number;
  kind: string; // routine | work
};

export type TripSegment = {
  id: string;
  title: string;
  date: string;
  startMin: number;
  endMin: number;
};

const START_HOUR = 6;
const END_HOUR = 23;
const HOUR_PX = 44;
const SNAP = 15;
const RANGE_MIN = (END_HOUR - START_HOUR) * 60;

function minToTop(min: number) {
  return ((min - START_HOUR * 60) / 60) * HOUR_PX;
}

function fmt(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}:${String(m).padStart(2, "0")}`;
}

export function WeekBoard({
  days,
  blocks,
  trips,
  todayIso,
  nowMin,
  dbConnected,
}: {
  days: string[]; // 7 个 ISO 日期，周一开始
  blocks: WeekBlock[];
  trips: TripSegment[];
  todayIso: string;
  nowMin: number;
  dbConnected: boolean;
}) {
  const t = useDict();
  const [items, setItems] = useState<WeekBlock[]>(blocks);
  const [menu, setMenu] = useState<{ x: number; y: number; items: MenuItem[] } | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [, startTransition] = useTransition();
  const router = useRouter();

  const weekdayNames = useMemo(() => {
    const names = t.calendar.weekdays; // 周日开头
    // days 从周一开始：Mon..Sun
    return days.map((iso) => {
      const dow = new Date(`${iso}T00:00:00`).getDay();
      return `${t.calendar.weekdayPrefix}${names[dow]}`;
    });
  }, [days, t]);

  function blocksForDay(iso: string) {
    return items.filter((b) => b.date === "" || b.date === iso);
  }

  function persist(block: WeekBlock) {
    if (!dbConnected) return;
    startTransition(async () => {
      await moveScheduleBlockAction(
        block.id,
        block.date || todayIso,
        block.startMin,
        block.endMin,
      );
      router.refresh();
    });
  }

  function beginDrag(
    e: React.PointerEvent,
    block: WeekBlock,
    mode: "move" | "resize",
    dayIso: string,
  ) {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    const grid = gridRef.current;
    if (!grid) return;
    const rect = grid.getBoundingClientRect();
    const colWidth = rect.width / 7;
    const startY = e.clientY;
    const startX = e.clientX;
    const origin = { ...block, currentDay: block.date === "" ? "" : dayIso };
    setActiveId(block.id);
    const latest = { ...origin };

    function onMove(ev: PointerEvent) {
      const deltaMin =
        Math.round((ev.clientY - startY) / ((HOUR_PX / 60) * SNAP)) * SNAP;
      let startMin = origin.startMin;
      let endMin = origin.endMin;
      let date = origin.date;

      if (mode === "move") {
        const len = origin.endMin - origin.startMin;
        startMin = Math.max(
          START_HOUR * 60,
          Math.min(origin.startMin + deltaMin, END_HOUR * 60 - len),
        );
        endMin = startMin + len;
        // 只有具体日期的块可以横向换天
        if (origin.date !== "") {
          const colDelta = Math.round((ev.clientX - startX) / colWidth);
          const originIdx = days.indexOf(origin.date);
          const idx = Math.max(0, Math.min(6, originIdx + colDelta));
          date = days[idx];
        }
      } else {
        endMin = Math.max(
          origin.startMin + SNAP,
          Math.min(origin.endMin + deltaMin, END_HOUR * 60),
        );
      }

      latest.startMin = startMin;
      latest.endMin = endMin;
      latest.date = date;
      setItems((prev) =>
        prev.map((b) =>
          b.id === block.id ? { ...b, startMin, endMin, date } : b,
        ),
      );
    }

    function onUp() {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      setActiveId(null);
      if (
        latest.startMin !== origin.startMin ||
        latest.endMin !== origin.endMin ||
        latest.date !== origin.date
      ) {
        persist(latest);
      }
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  function openMenu(e: React.MouseEvent, block: WeekBlock) {
    e.preventDefault();
    e.stopPropagation();
    setMenu({
      x: e.clientX,
      y: e.clientY,
      items: [
        {
          label: t.week.delete,
          danger: true,
          onClick: () => {
            setItems((prev) => prev.filter((b) => b.id !== block.id));
            if (dbConnected) {
              startTransition(async () => {
                await deleteScheduleBlockAction(block.id);
                router.refresh();
              });
            }
          },
        },
      ],
    });
  }

  const hours = Array.from(
    { length: END_HOUR - START_HOUR },
    (_, i) => START_HOUR + i,
  );

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="border-b border-border bg-secondary/40 px-4 py-2 text-xs text-muted-foreground">
        {dbConnected ? t.week.liveTip : t.week.demoTip}
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[860px]">
          {/* 表头：星期 + 日期 */}
          <div className="grid grid-cols-[56px_repeat(7,1fr)] border-b border-border bg-secondary/40">
            <div />
            {days.map((iso, i) => (
              <div
                key={iso}
                className={cn(
                  "border-l border-border px-2 py-2 text-center",
                  iso === todayIso && "bg-primary/10",
                )}
              >
                <div className="text-xs font-medium">{weekdayNames[i]}</div>
                <div
                  className={cn(
                    "tnum text-xs text-muted-foreground",
                    iso === todayIso && "font-semibold text-primary",
                  )}
                >
                  {iso.slice(5)}
                </div>
              </div>
            ))}
          </div>

          {/* 主体：时间轴 + 7 列 */}
          <div className="grid grid-cols-[56px_repeat(7,1fr)]">
            {/* 小时标签列 */}
            <div
              className="relative"
              style={{ height: (RANGE_MIN / 60) * HOUR_PX }}
            >
              {hours.map((h) => (
                <div
                  key={h}
                  className="tnum absolute right-2 -translate-y-1/2 text-[11px] text-muted-foreground"
                  style={{ top: minToTop(h * 60) }}
                >
                  {h}:00
                </div>
              ))}
            </div>

            <div ref={gridRef} className="relative col-span-7 grid grid-cols-7">
              {/* 小时横线 */}
              {hours.map((h) => (
                <div
                  key={h}
                  className="pointer-events-none absolute inset-x-0 border-t border-border/50"
                  style={{ top: minToTop(h * 60) }}
                />
              ))}
              {/* 现在时刻线 */}
              {days.includes(todayIso) &&
              nowMin >= START_HOUR * 60 &&
              nowMin <= END_HOUR * 60 ? (
                <div
                  className="pointer-events-none absolute z-20 h-px bg-red-500"
                  style={{
                    top: minToTop(nowMin),
                    left: `${(days.indexOf(todayIso) / 7) * 100}%`,
                    width: `${100 / 7}%`,
                  }}
                >
                  <span className="absolute -left-1 -top-1 h-2 w-2 rounded-full bg-red-500" />
                </div>
              ) : null}

              {days.map((iso) => {
                const dayTrips = trips.filter((trip) => trip.date === iso);
                return (
                  <div
                    key={iso}
                    className={cn(
                      "relative touch-none border-l border-border",
                      iso === todayIso && "bg-primary/[0.04]",
                    )}
                    style={{ height: (RANGE_MIN / 60) * HOUR_PX }}
                  >
                    {/* 出差/接待：只读叠加 */}
                    {dayTrips.map((trip) => (
                      <div
                        key={trip.id}
                        className="absolute inset-x-1 z-0 rounded-md border border-violet-300 bg-violet-100/70 p-1"
                        style={{
                          top: minToTop(Math.max(trip.startMin, START_HOUR * 60)),
                          height: Math.max(
                            20,
                            minToTop(Math.min(trip.endMin, END_HOUR * 60)) -
                              minToTop(Math.max(trip.startMin, START_HOUR * 60)),
                          ),
                        }}
                        title={trip.title}
                      >
                        <span className="line-clamp-2 text-[10px] leading-4 text-violet-800">
                          【{t.week.receptionTag}】{trip.title}
                        </span>
                      </div>
                    ))}

                    {blocksForDay(iso).map((block) => {
                      const routine = block.date === "";
                      const top = minToTop(block.startMin);
                      const height = Math.max(
                        18,
                        minToTop(block.endMin) - minToTop(block.startMin),
                      );
                      return (
                        <div
                          key={`${iso}-${block.id}`}
                          onPointerDown={(e) => beginDrag(e, block, "move", iso)}
                          onContextMenu={(e) => openMenu(e, block)}
                          className={cn(
                            "group absolute inset-x-1 z-10 cursor-grab overflow-hidden rounded-md border p-1 text-[11px] leading-4 shadow-sm transition-shadow hover:shadow active:cursor-grabbing",
                            routine
                              ? "border-border bg-secondary/90 text-muted-foreground"
                              : "border-primary/30 bg-primary/15 text-foreground",
                            activeId === block.id && "ring-2 ring-primary/60",
                          )}
                          style={{ top, height }}
                          title={`${block.title} ${fmt(block.startMin)}–${fmt(block.endMin)}`}
                        >
                          <div className="line-clamp-2 font-medium">
                            {block.title}
                          </div>
                          <div className="tnum text-[10px] opacity-70">
                            {fmt(block.startMin)}–{fmt(block.endMin)}
                            {routine ? ` · ${t.week.routine}` : ""}
                          </div>
                          <span
                            onPointerDown={(e) =>
                              beginDrag(e, block, "resize", iso)
                            }
                            className="absolute inset-x-0 bottom-0 h-2 cursor-ns-resize opacity-0 group-hover:opacity-100"
                          >
                            <span className="mx-auto mt-0.5 block h-1 w-8 rounded-full bg-foreground/20" />
                          </span>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
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
    </div>
  );
}
