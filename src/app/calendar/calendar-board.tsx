"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addDays, differenceInCalendarDays, format, parseISO } from "date-fns";
import {
  deleteReceptionQuickAction,
  deleteTaskQuickAction,
  moveReceptionAction,
  moveTaskDueDateAction,
  setReceptionStatusQuickAction,
  setTaskStatusQuickAction,
} from "@/app/actions";
import { ContextMenu, type MenuItem } from "@/components/ui/context-menu";
import { useDict } from "@/components/layout/locale-provider";

export type CalendarEvent = {
  id: string; // 唯一 key，如 task-xxx
  rawId: string; // 数据库里的真实 id
  kind: "task" | "reception";
  title: string;
  start: string; // YYYY-MM-DD
  end: string; // YYYY-MM-DD
  color: string;
  tag: string;
  projectName?: string;
};

function shiftIso(iso: string, days: number) {
  return format(addDays(parseISO(iso), days), "yyyy-MM-dd");
}

export function CalendarBoard({
  days,
  events,
  currentMonth,
  todayIso,
  monthLabel,
  dbConnected,
}: {
  days: string[];
  events: CalendarEvent[];
  currentMonth: number;
  todayIso: string;
  monthLabel: string;
  dbConnected: boolean;
}) {
  const t = useDict();
  const [items, setItems] = useState<CalendarEvent[]>(events);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overIso, setOverIso] = useState<string | null>(null);
  const [menu, setMenu] = useState<{
    x: number;
    y: number;
    items: MenuItem[];
  } | null>(null);
  const [, startTransition] = useTransition();
  const router = useRouter();

  function eventsForDay(iso: string) {
    return items.filter((event) => event.start <= iso && iso <= event.end);
  }

  function handleDrop(targetIso: string) {
    const ev = items.find((event) => event.id === dragId);
    setDragId(null);
    setOverIso(null);
    if (!ev) return;

    const delta = differenceInCalendarDays(
      parseISO(targetIso),
      parseISO(ev.start),
    );
    if (delta === 0) return;
    applyShift(ev, delta);
  }

  // 本地乐观更新 + 落库
  function applyShift(ev: CalendarEvent, delta: number) {
    setItems((prev) =>
      prev.map((event) =>
        event.id === ev.id
          ? {
              ...event,
              start: shiftIso(event.start, delta),
              end: shiftIso(event.end, delta),
            }
          : event,
      ),
    );
    if (dbConnected) {
      startTransition(async () => {
        if (ev.kind === "task") {
          await moveTaskDueDateAction(ev.rawId, shiftIso(ev.start, delta));
        } else {
          await moveReceptionAction(ev.rawId, delta);
        }
        router.refresh();
      });
    }
  }

  function markDone(ev: CalendarEvent) {
    setItems((prev) => prev.filter((event) => event.id !== ev.id));
    if (dbConnected) {
      startTransition(async () => {
        if (ev.kind === "task") {
          await setTaskStatusQuickAction(ev.rawId, "DONE");
        } else {
          await setReceptionStatusQuickAction(ev.rawId, "DONE");
        }
        router.refresh();
      });
    }
  }

  function remove(ev: CalendarEvent) {
    setItems((prev) => prev.filter((event) => event.id !== ev.id));
    if (dbConnected) {
      startTransition(async () => {
        if (ev.kind === "task") {
          await deleteTaskQuickAction(ev.rawId);
        } else {
          await deleteReceptionQuickAction(ev.rawId);
        }
        router.refresh();
      });
    }
  }

  function openMenu(e: React.MouseEvent, ev: CalendarEvent) {
    e.preventDefault();
    e.stopPropagation();
    setMenu({
      x: e.clientX,
      y: e.clientY,
      items: [
        { label: t.calendar.menuDone, onClick: () => markDone(ev) },
        { label: t.calendar.menuPostponeDay, onClick: () => applyShift(ev, 1) },
        { label: t.calendar.menuPostponeWeek, onClick: () => applyShift(ev, 7) },
        { label: t.calendar.menuDelete, danger: true, onClick: () => remove(ev) },
      ],
    });
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-3">
        <div className="text-base font-semibold">{monthLabel}</div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <Legend color="bg-sky-500" label={t.calendar.legendTask} />
          <Legend color="bg-amber-500" label={t.calendar.legendTrip} />
          <Legend color="bg-emerald-500" label={t.calendar.legendVisit} />
          <Legend color="bg-violet-500" label={t.calendar.legendExpo} />
          <span className="hidden border-l border-border pl-3 sm:inline">
            {dbConnected ? t.calendar.dragTipLive : t.calendar.dragTipDemo}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-7 border-b border-border bg-secondary/60 text-center text-xs font-medium text-muted-foreground">
        {t.calendar.weekdays.map((label) => (
          <div key={label} className="px-2 py-2">
            {t.calendar.weekdayPrefix}
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {days.map((iso) => {
          const inMonth = parseISO(iso).getMonth() === currentMonth;
          const isToday = iso === todayIso;
          const dayEvents = eventsForDay(iso);
          const isOver = overIso === iso;

          return (
            <div
              key={iso}
              onDragOver={(e) => {
                e.preventDefault();
                if (overIso !== iso) setOverIso(iso);
              }}
              onDrop={() => handleDrop(iso)}
              className={`min-h-[112px] border-b border-r border-border p-1.5 transition-colors ${
                inMonth ? "bg-card" : "bg-secondary/30"
              } ${isOver ? "ring-2 ring-inset ring-primary/60" : ""}`}
            >
              <div className="mb-1 flex items-center justify-between px-1">
                <span
                  className={`tnum text-xs ${
                    inMonth ? "text-foreground" : "text-muted-foreground/60"
                  } ${
                    isToday
                      ? "flex h-5 w-5 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground"
                      : ""
                  }`}
                >
                  {parseISO(iso).getDate()}
                </span>
              </div>
              <div className="space-y-1">
                {dayEvents.map((event) => {
                  // 跨天事件只在起始日显示可拖动的整块，其余日显示浅色延续
                  const isStart = event.start === iso;
                  return (
                    <div
                      key={`${iso}-${event.id}`}
                      draggable={isStart}
                      onDragStart={() => setDragId(event.id)}
                      onDragEnd={() => {
                        setDragId(null);
                        setOverIso(null);
                      }}
                      onContextMenu={(e) => openMenu(e, event)}
                      title={`${event.tag} · ${event.title}${
                        event.projectName ? ` · ${event.projectName}` : ""
                      }`}
                      className={`flex items-center gap-1 rounded px-1 py-0.5 text-[11px] leading-4 ${
                        isStart
                          ? "cursor-grab bg-secondary/70 hover:bg-secondary active:cursor-grabbing"
                          : "opacity-60"
                      }`}
                    >
                      <span
                        className={`h-2 w-2 shrink-0 rounded-full ${event.color}`}
                      />
                      <span className="truncate">{event.title}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
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

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
      {label}
    </span>
  );
}
