"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { addDays, differenceInCalendarDays, format, parseISO } from "date-fns";
import { CircleHelp } from "lucide-react";
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
  id: string;
  rawId: string;
  kind: "task" | "reception" | "expo";
  title: string;
  start: string;
  end: string;
  tag: string;
  projectName?: string;
};

const kindLabels: Record<CalendarEvent["kind"], string> = { task: "任务", reception: "接待", expo: "展会/出差" };

function shiftIso(iso: string, days: number) { return format(addDays(parseISO(iso), days), "yyyy-MM-dd"); }
function hrefFor(event: CalendarEvent) { return event.kind === "task" ? "/tasks" : event.kind === "expo" ? "/projects?tab=expo" : "/projects?tab=reception"; }

export function CalendarBoard({ days, events, currentMonth, todayIso, dbConnected }: { days: string[]; events: CalendarEvent[]; currentMonth: number; todayIso: string; dbConnected: boolean; }) {
  const t = useDict();
  const [items, setItems] = useState<CalendarEvent[]>(events);
  const [filters, setFilters] = useState<Record<CalendarEvent["kind"], boolean>>({ task: true, reception: true, expo: true });
  const [selectedIso, setSelectedIso] = useState(todayIso);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overIso, setOverIso] = useState<string | null>(null);
  const [menu, setMenu] = useState<{ x: number; y: number; items: MenuItem[] } | null>(null);
  const [, startTransition] = useTransition();

  const visibleItems = useMemo(() => items.filter((event) => filters[event.kind]), [filters, items]);
  const eventsForDay = (iso: string) => visibleItems.filter((event) => event.start <= iso && iso <= event.end);

  function handleDrop(targetIso: string) {
    const ev = items.find((event) => event.id === dragId);
    setDragId(null); setOverIso(null);
    if (!ev) return;
    const delta = differenceInCalendarDays(parseISO(targetIso), parseISO(ev.start));
    if (delta !== 0) applyShift(ev, delta);
  }

  function applyShift(ev: CalendarEvent, delta: number) {
    setItems((prev) => prev.map((event) => event.id === ev.id ? { ...event, start: shiftIso(event.start, delta), end: shiftIso(event.end, delta) } : event));
    if (dbConnected) startTransition(async () => {
      if (ev.kind === "task") await moveTaskDueDateAction(ev.rawId, shiftIso(ev.start, delta));
      else await moveReceptionAction(ev.rawId, delta);
    });
  }

  function markDone(ev: CalendarEvent) {
    setItems((prev) => prev.filter((event) => event.id !== ev.id));
    if (dbConnected) startTransition(async () => {
      if (ev.kind === "task") await setTaskStatusQuickAction(ev.rawId, "DONE");
      else await setReceptionStatusQuickAction(ev.rawId, "DONE");
    });
  }

  function remove(ev: CalendarEvent) {
    setItems((prev) => prev.filter((event) => event.id !== ev.id));
    if (dbConnected) startTransition(async () => {
      if (ev.kind === "task") await deleteTaskQuickAction(ev.rawId);
      else await deleteReceptionQuickAction(ev.rawId);
    });
  }

  function openMenu(e: React.MouseEvent, ev: CalendarEvent) {
    e.preventDefault(); e.stopPropagation();
    setMenu({ x: e.clientX, y: e.clientY, items: [
      { label: t.calendar.menuDone, onClick: () => markDone(ev) },
      { label: t.calendar.menuPostponeDay, onClick: () => applyShift(ev, 1) },
      { label: t.calendar.menuPostponeWeek, onClick: () => applyShift(ev, 7) },
      { label: t.calendar.menuDelete, danger: true, onClick: () => remove(ev) },
    ] });
  }

  const selectedEvents = eventsForDay(selectedIso);

  return (
    <div className="calendar-layout">
      <div className="blueprint-calendar overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="calendar-toolbar flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3 text-xs text-muted-foreground">
          <div className="flex flex-wrap items-center gap-2">
            {(Object.keys(kindLabels) as CalendarEvent["kind"][]).map((kind) => (
              <button key={kind} type="button" className={`chip ${filters[kind] ? "" : "opacity-50"}`} onClick={() => setFilters((prev) => ({ ...prev, [kind]: !prev[kind] }))}>
                <span className="calendar-event-chip" data-kind={kind} aria-hidden="true"><span>{kindLabels[kind]}</span></span>
              </button>
            ))}
          </div>
          <span className="flex h-6 w-6 items-center justify-center border-l border-border pl-3" title={dbConnected ? t.calendar.dragTipLive : t.calendar.dragTipDemo}><CircleHelp className="h-4 w-4" /></span>
        </div>

        <div className="calendar-weekdays grid grid-cols-7 border-b border-border bg-secondary/60 text-center text-xs font-medium text-muted-foreground">
          {t.calendar.weekdays.map((label) => <div key={label} className="px-2 py-2">{t.calendar.weekdayPrefix}{label}</div>)}
        </div>

        <div className="grid grid-cols-7">
          {days.map((iso) => {
            const inMonth = parseISO(iso).getMonth() === currentMonth;
            const isToday = iso === todayIso;
            const dayEvents = eventsForDay(iso);
            const visibleDayEvents = dayEvents.slice(0, 2);
            const hiddenCount = Math.max(0, dayEvents.length - visibleDayEvents.length);
            const isOver = overIso === iso;
            return (
              <div key={iso} onClick={() => setSelectedIso(iso)} onDragOver={(e) => { e.preventDefault(); if (overIso !== iso) setOverIso(iso); }} onDrop={() => handleDrop(iso)} className={`calendar-day min-h-[112px] border-b border-r border-border p-1.5 transition-colors ${inMonth ? "bg-card" : "calendar-day-outside bg-secondary/30"} ${isOver ? "ring-2 ring-inset ring-primary/60" : ""} ${selectedIso === iso ? "is-selected" : ""}`}>
                <div className="mb-1 flex items-center justify-between px-1"><span className={`tnum text-xs ${inMonth ? "text-foreground" : "text-muted-foreground/60"} ${isToday ? "calendar-day-today flex h-5 w-5 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground" : ""}`}>{parseISO(iso).getDate()}</span></div>
                <div className="space-y-1">
                  {visibleDayEvents.map((event) => {
                    const isStart = event.start === iso;
                    return <div key={`${iso}-${event.id}`} draggable={isStart} onDragStart={() => setDragId(event.id)} onDragEnd={() => { setDragId(null); setOverIso(null); }} onClick={(e) => { e.stopPropagation(); setSelectedIso(iso); }} onContextMenu={(e) => openMenu(e, event)} title={`${event.tag} · ${event.title}${event.projectName ? ` · ${event.projectName}` : ""}`} className={`calendar-event-chip ${isStart ? "cursor-pointer hover:opacity-80 active:cursor-grabbing" : "opacity-60"}`} data-kind={event.kind}><span>{event.title}</span></div>;
                  })}
                  {hiddenCount > 0 ? <button type="button" className="calendar-more" onClick={(event) => { event.stopPropagation(); setSelectedIso(iso); }}>+{hiddenCount} 更多</button> : null}
                </div>
              </div>
            );
          })}
        </div>
        {menu ? <ContextMenu x={menu.x} y={menu.y} items={menu.items} onClose={() => setMenu(null)} /> : null}
      </div>

      <aside className="calendar-side-list">
        <div className="section-label">当日详情</div>
        <h3 className="sunny-title text-base">{selectedIso}</h3>
        <div className="mt-3 space-y-2">
          {selectedEvents.length === 0 ? <div className="rounded border border-dashed border-border p-4 text-sm text-muted-foreground">当天没有安排。</div> : null}
          {selectedEvents.map((event) => (
            <Link key={`side-${event.id}`} href={hrefFor(event)} className="calendar-event-chip" data-kind={event.kind}>
              <span>{event.tag} · {event.title}{event.projectName ? ` · ${event.projectName}` : ""}</span>
            </Link>
          ))}
        </div>
      </aside>
    </div>
  );
}
