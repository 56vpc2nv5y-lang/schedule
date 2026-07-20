"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Users, X } from "lucide-react";
import {
  deleteScheduleBlockAction,
  moveScheduleBlockAction,
  updateScheduleBlockAction,
} from "@/app/actions";
import { Button } from "@/components/ui/button";
import { ContextMenu, type MenuItem } from "@/components/ui/context-menu";
import { useDict } from "@/components/layout/locale-provider";
import { cn } from "@/lib/utils";
import {
  START_HOUR,
  END_HOUR,
  HOUR_PX,
  SNAP,
  RANGE_MIN,
  minToTop,
  fmt,
  fmtHM,
} from "./timeline-shared";

export type WeekBlock = {
  id: string;
  title: string;
  date: string; // "" = 每天例行
  startMin: number;
  endMin: number;
  kind: string; // routine | work
  location: string;
  participants: string;
  note: string;
  projectId: string;
};

export type TripSegment = {
  id: string;
  title: string;
  date: string;
  startMin: number;
  endMin: number;
};

export function WeekBoard({
  days,
  blocks,
  trips,
  projects,
  todayIso,
  nowMin,
  dbConnected,
}: {
  days: string[];
  blocks: WeekBlock[];
  trips: TripSegment[];
  projects: { id: string; name: string }[];
  todayIso: string;
  nowMin: number;
  dbConnected: boolean;
}) {
  const t = useDict();
  const [items, setItems] = useState<WeekBlock[]>(blocks);
  const [menu, setMenu] = useState<{ x: number; y: number; items: MenuItem[] } | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [editing, setEditing] = useState<WeekBlock | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [, startTransition] = useTransition();
  const router = useRouter();

  const weekdayNames = useMemo(() => {
    const names = t.calendar.weekdays;
    return days.map((iso) => {
      const dow = new Date(`${iso}T00:00:00`).getDay();
      return `${t.calendar.weekdayPrefix}${names[dow]}`;
    });
  }, [days, t]);

  // 顶部全天条：接待/出差按天分组，去重（避免和小时块叠字）
  const tripsByDay = useMemo(() => {
    const map = new Map<string, { key: string; title: string }[]>();
    for (const trip of trips) {
      const base = trip.id.replace(/-\d{4}-\d{2}-\d{2}$/, "");
      const list = map.get(trip.date) ?? [];
      if (!list.some((x) => x.key === base)) list.push({ key: base, title: trip.title });
      map.set(trip.date, list);
    }
    return map;
  }, [trips]);
  const hasTrips = trips.length > 0;

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
    const origin = { ...block };
    setActiveId(block.id);
    const latest = { ...origin };
    let moved = false;

    function onMove(ev: PointerEvent) {
      if (Math.abs(ev.clientY - startY) > 3 || Math.abs(ev.clientX - startX) > 3)
        moved = true;
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
      if (!moved) {
        // 没拖动 = 点击 → 打开编辑框
        setEditing(block);
        return;
      }
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
          label: t.week.edit,
          onClick: () => setEditing(block),
        },
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
        {dbConnected ? t.week.liveTip : t.week.demoTip} · {t.week.clickToEdit}
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[860px]">
          {/* 表头：星期 + 日期 */}
          <div className="grid grid-cols-[56px_repeat(7,minmax(0,1fr))] border-b border-border bg-secondary/40">
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

          {/* 全天条：接待/出差（避免压住小时块） */}
          {hasTrips ? (
            <div className="grid grid-cols-[56px_repeat(7,minmax(0,1fr))] border-b border-border">
              <div className="flex items-center justify-end pr-2 text-[10px] text-muted-foreground">
                {t.week.allDay}
              </div>
              {days.map((iso) => (
                <div key={iso} className="min-w-0 min-h-[26px] space-y-0.5 border-l border-border p-0.5">
                  {(tripsByDay.get(iso) ?? []).map((trip) => (
                    <div
                      key={trip.key}
                      title={trip.title}
                      className="truncate rounded bg-violet-500/15 px-1.5 py-0.5 text-[10px] font-medium text-violet-700"
                    >
                      {trip.title}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ) : null}

          {/* 主体：时间轴 + 7 列 */}
          <div className="grid grid-cols-[56px_repeat(7,minmax(0,1fr))]">
            <div className="relative" style={{ height: (RANGE_MIN / 60) * HOUR_PX }}>
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
              {hours.map((h) => (
                <div
                  key={h}
                  className="pointer-events-none absolute inset-x-0 border-t border-border/50"
                  style={{ top: minToTop(h * 60) }}
                />
              ))}
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

              {days.map((iso) => (
                <div
                  key={iso}
                  className={cn(
                    "relative touch-none border-l border-border",
                    iso === todayIso && "bg-primary/[0.04]",
                  )}
                  style={{ height: (RANGE_MIN / 60) * HOUR_PX }}
                >
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
                        onPointerDown={(e) => beginDrag(e, block, "move")}
                        onContextMenu={(e) => openMenu(e, block)}
                        className={cn(
                          "group absolute inset-x-1 z-10 cursor-pointer overflow-hidden rounded-md border p-1 text-[11px] leading-4 shadow-sm transition-shadow hover:shadow active:cursor-grabbing",
                          routine
                            ? "border-border bg-secondary/90 text-muted-foreground"
                            : "border-primary/30 bg-primary/15 text-foreground",
                          activeId === block.id && "ring-2 ring-primary/60",
                        )}
                        style={{ top, height }}
                        title={`${block.title} ${fmt(block.startMin)}–${fmt(block.endMin)}`}
                      >
                        <div className="line-clamp-2 font-medium">{block.title}</div>
                        <div className="tnum text-[10px] opacity-70">
                          {fmt(block.startMin)}–{fmt(block.endMin)}
                          {routine ? ` · ${t.week.routine}` : ""}
                        </div>
                        {block.location && height > 42 ? (
                          <div className="truncate text-[10px] opacity-70">
                            📍{block.location}
                          </div>
                        ) : null}
                        <span
                          onPointerDown={(e) => beginDrag(e, block, "resize")}
                          className="absolute inset-x-0 bottom-0 h-2 cursor-ns-resize opacity-0 group-hover:opacity-100"
                        >
                          <span className="mx-auto mt-0.5 block h-1 w-8 rounded-full bg-foreground/20" />
                        </span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {menu ? (
        <ContextMenu x={menu.x} y={menu.y} items={menu.items} onClose={() => setMenu(null)} />
      ) : null}

      {/* 编辑弹框 */}
      {editing ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setEditing(null)}
        >
          <div
            className="w-full max-w-lg rounded-xl border border-border bg-card p-5 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="text-base font-semibold">{t.week.editTitle}</div>
              <button
                onClick={() => setEditing(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form
              action={updateScheduleBlockAction}
              className="grid gap-3 sm:grid-cols-2"
            >
              <input type="hidden" name="id" value={editing.id} />
              <label className="sm:col-span-2">
                <span className="flabel">{t.week.fTitle}</span>
                <input
                  name="title"
                  defaultValue={editing.title}
                  className="field"
                />
              </label>
              <label>
                <span className="flabel">{t.week.fDate}</span>
                <input
                  type="date"
                  name="date"
                  defaultValue={editing.date}
                  className="field"
                />
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label>
                  <span className="flabel">{t.week.fStart}</span>
                  <input
                    type="time"
                    name="start"
                    defaultValue={fmtHM(editing.startMin)}
                    className="field"
                  />
                </label>
                <label>
                  <span className="flabel">{t.week.fEnd}</span>
                  <input
                    type="time"
                    name="end"
                    defaultValue={fmtHM(editing.endMin)}
                    className="field"
                  />
                </label>
              </div>
              <label>
                <span className="flabel">
                  <MapPin className="mr-1 inline h-3 w-3" />
                  {t.week.fLocation}
                </span>
                <input
                  name="location"
                  defaultValue={editing.location}
                  className="field"
                />
              </label>
              <label>
                <span className="flabel">
                  <Users className="mr-1 inline h-3 w-3" />
                  {t.week.fParticipants}
                </span>
                <input
                  name="participants"
                  defaultValue={editing.participants}
                  placeholder={t.week.fParticipantsPh}
                  className="field"
                />
              </label>
              <label className="sm:col-span-2">
                <span className="flabel">{t.week.fNote}</span>
                <input
                  name="note"
                  defaultValue={editing.note}
                  placeholder={t.week.fNotePh}
                  className="field"
                />
              </label>
              <label className="sm:col-span-2">
                <span className="flabel">{t.week.fProject}</span>
                <select
                  name="projectId"
                  defaultValue={editing.projectId}
                  className="field"
                >
                  <option value="">{t.week.fNoProject}</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex items-center justify-end gap-2 sm:col-span-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditing(null)}
                >
                  {t.common.cancel}
                </Button>
                <Button type="submit">{t.common.save}</Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
