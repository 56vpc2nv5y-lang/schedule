"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { addDays, differenceInCalendarDays, format, parseISO } from "date-fns";
import { CircleHelp, X } from "lucide-react";
import { deleteReceptionQuickAction, deleteTaskQuickAction, moveReceptionAction, moveTaskDueDateAction, setReceptionStatusQuickAction, setTaskStatusQuickAction } from "@/app/actions";
import { ContextMenu, type MenuItem } from "@/components/ui/context-menu";
import { businessKindMeta, type BusinessKind } from "@/lib/workflow-meta";
import { eventsForDate, type WorkEvent } from "@/lib/work-calendar";

export type CalendarEvent = WorkEvent;

const kindOrder: BusinessKind[] = ["project", "training", "reception", "expo", "admin"];
const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

function shiftIso(iso: string, days: number) {
  return format(addDays(parseISO(iso), days), "yyyy-MM-dd");
}

function kindColor(kind: BusinessKind) {
  if (kind === "training") return "var(--os-purple)";
  if (kind === "reception") return "var(--os-green)";
  if (kind === "expo") return "var(--os-orange)";
  if (kind === "admin") return "var(--os-gray)";
  return "var(--os-blue)";
}

export function CalendarBoard({ days, events, currentMonth, todayIso, dbConnected }: { days: string[]; events: CalendarEvent[]; currentMonth: number; todayIso: string; dbConnected: boolean; }) {
  const [items, setItems] = useState<CalendarEvent[]>(events);
  const [filters, setFilters] = useState<Record<BusinessKind, boolean>>({ project: true, training: true, reception: true, expo: true, admin: true });
  const [selectedIso, setSelectedIso] = useState(todayIso);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overIso, setOverIso] = useState<string | null>(null);
  const [menu, setMenu] = useState<{ x: number; y: number; items: MenuItem[] } | null>(null);
  const [, startTransition] = useTransition();

  const visibleItems = useMemo(() => items.filter((event) => filters[event.kind]), [filters, items]);
  const selectedEvents = eventsForDate(visibleItems, selectedIso);

  function openDay(iso: string) {
    setSelectedIso(iso);
    setDrawerOpen(true);
  }

  function applyShift(ev: CalendarEvent, delta: number) {
    const nextStart = shiftIso(ev.start, delta);
    setItems((prev) => prev.map((event) => event.id === ev.id ? { ...event, start: shiftIso(event.start, delta), end: shiftIso(event.end, delta) } : event));
    if (dbConnected) startTransition(async () => {
      if (ev.source === "task") await moveTaskDueDateAction(ev.rawId, nextStart);
      else await moveReceptionAction(ev.rawId, delta);
    });
  }

  function handleDrop(targetIso: string) {
    const ev = items.find((event) => event.id === dragId);
    setDragId(null);
    setOverIso(null);
    if (!ev) return;
    const delta = differenceInCalendarDays(parseISO(targetIso), parseISO(ev.start));
    if (delta !== 0) applyShift(ev, delta);
  }

  function markDone(ev: CalendarEvent) {
    setItems((prev) => prev.filter((event) => event.id !== ev.id));
    if (dbConnected) startTransition(async () => {
      if (ev.source === "task") await setTaskStatusQuickAction(ev.rawId, "DONE");
      else await setReceptionStatusQuickAction(ev.rawId, "DONE");
    });
  }

  function remove(ev: CalendarEvent) {
    setItems((prev) => prev.filter((event) => event.id !== ev.id));
    if (dbConnected) startTransition(async () => {
      if (ev.source === "task") await deleteTaskQuickAction(ev.rawId);
      else await deleteReceptionQuickAction(ev.rawId);
    });
  }

  function menuItems(ev: CalendarEvent): MenuItem[] {
    return [
      { label: "标记完成", onClick: () => markDone(ev) },
      { label: "推迟一天", onClick: () => applyShift(ev, 1) },
      { label: "推迟一周", onClick: () => applyShift(ev, 7) },
      { label: "删除", danger: true, onClick: () => remove(ev) },
    ];
  }

  function openMenu(e: React.MouseEvent, ev: CalendarEvent) {
    e.preventDefault();
    e.stopPropagation();
    setMenu({ x: e.clientX, y: e.clientY, items: menuItems(ev) });
  }

  return (
    <div className="calendar-layout">
      <div className="blueprint-calendar overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="calendar-toolbar flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3 text-xs text-muted-foreground">
          <div className="flex flex-wrap items-center gap-2">
            {kindOrder.map((kind) => {
              const meta = businessKindMeta[kind];
              return (
                <button key={kind} type="button" className={`s3-pill ${meta.className}${filters[kind] ? "" : " opacity-50"}`} onClick={() => setFilters((prev) => ({ ...prev, [kind]: !prev[kind] }))}>
                  {meta.label}
                </button>
              );
            })}
          </div>
          <span className="flex items-center gap-2" title={dbConnected ? "拖动改期，右键操作" : "演示模式下拖动只预览"}><CircleHelp className="h-4 w-4" />{dbConnected ? "拖动自动保存" : "演示预览"}</span>
        </div>

        <div className="calendar-weekdays grid grid-cols-7 border-b border-border bg-secondary/60 text-center text-xs font-medium text-muted-foreground">
          {weekdays.map((label) => <div key={label} className="px-2 py-2">{label}</div>)}
        </div>

        <div className="grid grid-cols-7">
          {days.map((iso) => {
            const inMonth = parseISO(iso).getMonth() === currentMonth;
            const isToday = iso === todayIso;
            const dayEvents = eventsForDate(visibleItems, iso);
            const visibleDayEvents = dayEvents.slice(0, 2);
            const hiddenCount = Math.max(0, dayEvents.length - visibleDayEvents.length);
            const isOver = overIso === iso;
            return (
              <div key={iso} onClick={() => openDay(iso)} onDragOver={(e) => { e.preventDefault(); if (overIso !== iso) setOverIso(iso); }} onDrop={() => handleDrop(iso)} className={`calendar-day min-h-[132px] border-b border-r border-border p-2 transition-colors ${inMonth ? "bg-card" : "calendar-day-outside bg-secondary/30"} ${isOver ? "ring-2 ring-inset ring-primary/60" : ""}`}>
                <div className="mb-1 flex items-center justify-between"><span className={`tnum text-xs ${inMonth ? "text-foreground" : "text-muted-foreground/60"} ${isToday ? "calendar-day-today flex h-6 w-6 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground" : ""}`}>{parseISO(iso).getDate()}</span></div>
                <div className="space-y-1">
                  {visibleDayEvents.map((event) => {
                    const isStart = event.start === iso;
                    return (
                      <div key={iso + "-" + event.id} draggable={isStart} onDragStart={() => setDragId(event.id)} onDragEnd={() => { setDragId(null); setOverIso(null); }} onClick={(e) => { e.stopPropagation(); openDay(iso); }} onContextMenu={(e) => openMenu(e, event)} title={event.tag + " · " + event.title} className="calendar-event-chip s3-calendar-event" data-kind={event.kind}>
                        {isStart ? event.title : "持续中 · " + event.tag}
                      </div>
                    );
                  })}
                  {hiddenCount > 0 ? <button type="button" className="calendar-more" onClick={(e) => { e.stopPropagation(); openDay(iso); }}>还有 {hiddenCount} 项</button> : null}
                </div>
              </div>
            );
          })}
        </div>
        {menu ? <ContextMenu x={menu.x} y={menu.y} items={menu.items} onClose={() => setMenu(null)} /> : null}
      </div>

      <div className={`s3-drawer ${drawerOpen ? "is-open" : ""}`} role="dialog" aria-modal="true">
        <button type="button" className="s3-backdrop" aria-label="关闭" onClick={() => setDrawerOpen(false)} />
        <aside className="s3-drawer-panel">
          <div className="s3-drawer-head">
            <div><div className="s3-page-title">{selectedIso}</div><div className="s3-page-sub">当天详情 · {selectedEvents.length} 项</div></div>
            <button type="button" className="s3-close" onClick={() => setDrawerOpen(false)}><X className="mx-auto h-4 w-4" /></button>
          </div>
          <div className="s3-drawer-body">
            <div className="calendar-drawer-list">
              {selectedEvents.length === 0 ? <div className="s3-empty">当天没有安排。</div> : null}
              {selectedEvents.map((event) => {
                const meta = businessKindMeta[event.kind];
                return (
                  <article key={"drawer-" + event.id} className="calendar-drawer-item" style={{ borderLeft: `4px solid ${kindColor(event.kind)}` }}>
                    <div className="row between wrap"><span className={`s3-pill ${meta.className}`}>{meta.label}</span><span className="small muted">{event.start}{event.end !== event.start ? " → " + event.end : ""}</span></div>
                    <div className="mt s3-row-title">{event.title}</div>
                    <div className="s3-row-detail">{event.projectName ?? event.tag} · {event.status}</div>
                    <div className="calendar-drawer-actions">
                      <Link href={event.href} className="calendar-action-btn">打开来源</Link>
                      <button type="button" className="calendar-action-btn" onClick={() => markDone(event)}>完成</button>
                      <button type="button" className="calendar-action-btn" onClick={() => applyShift(event, 1)}>推迟一天</button>
                      <button type="button" className="calendar-action-btn" onClick={() => applyShift(event, 7)}>推迟一周</button>
                      <button type="button" className="calendar-action-btn danger" onClick={() => remove(event)}>删除</button>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}