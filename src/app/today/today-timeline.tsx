"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Users, X } from "lucide-react";
import {
  deleteScheduleBlockAction,
  moveScheduleBlockAction,
  updateScheduleBlockAction,
} from "@/app/actions";
import { Button } from "@/components/ui/button";
import { ContextMenu, type MenuItem } from "@/components/ui/context-menu";
import { cn } from "@/lib/utils";
import type { WeekBlock, TripSegment } from "../week/week-board";
import {
  START_HOUR,
  END_HOUR,
  HOUR_PX,
  SNAP,
  RANGE_MIN,
  HOURS,
  minToTop,
  fmt,
  fmtHM,
} from "../week/timeline-shared";

export function TodayTimeline({
  todayIso,
  blocks,
  trips,
  projects,
  nowMin,
  dbConnected,
}: {
  todayIso: string;
  blocks: WeekBlock[];
  trips: TripSegment[];
  projects: { id: string; name: string }[];
  nowMin: number;
  dbConnected: boolean;
}) {
  const [items, setItems] = useState<WeekBlock[]>(blocks);
  const [menu, setMenu] = useState<{ x: number; y: number; items: MenuItem[] } | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [editing, setEditing] = useState<WeekBlock | null>(null);
  const colRef = useRef<HTMLDivElement>(null);
  const [, startTransition] = useTransition();
  const router = useRouter();

  const tripTitles = Array.from(new Set(trips.map((trip) => trip.title)));
  const showNow = nowMin >= START_HOUR * 60 && nowMin <= END_HOUR * 60;

  function persist(block: WeekBlock) {
    if (!dbConnected) return;
    startTransition(async () => {
      await moveScheduleBlockAction(block.id, block.date || todayIso, block.startMin, block.endMin);
      router.refresh();
    });
  }

  function beginDrag(e: React.PointerEvent, block: WeekBlock, mode: "move" | "resize") {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    const startY = e.clientY;
    const origin = { ...block };
    setActiveId(block.id);
    const latest = { ...origin };
    let moved = false;

    function onMove(ev: PointerEvent) {
      if (Math.abs(ev.clientY - startY) > 3) moved = true;
      const deltaMin = Math.round((ev.clientY - startY) / ((HOUR_PX / 60) * SNAP)) * SNAP;
      let startMin = origin.startMin;
      let endMin = origin.endMin;
      if (mode === "move") {
        const len = origin.endMin - origin.startMin;
        startMin = Math.max(START_HOUR * 60, Math.min(origin.startMin + deltaMin, END_HOUR * 60 - len));
        endMin = startMin + len;
      } else {
        endMin = Math.max(origin.startMin + SNAP, Math.min(origin.endMin + deltaMin, END_HOUR * 60));
      }
      latest.startMin = startMin;
      latest.endMin = endMin;
      setItems((prev) => prev.map((b) => (b.id === block.id ? { ...b, startMin, endMin } : b)));
    }

    function onUp() {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      setActiveId(null);
      if (!moved) {
        setEditing(block);
        return;
      }
      if (latest.startMin !== origin.startMin || latest.endMin !== origin.endMin) persist(latest);
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
        { label: "编辑", onClick: () => setEditing(block) },
        {
          label: "删除",
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

  return (
    <div className="today-timeline min-w-0 w-full">
      <div className="border-b border-border bg-secondary/40 px-4 py-2 text-xs text-muted-foreground">
        {dbConnected ? "已连接数据库" : "演示模式"} / 点击编辑，拖拽调整时间
      </div>

      {tripTitles.length ? (
        <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-2">
          <span className="mono text-[10px] text-muted-foreground">All day</span>
          {tripTitles.map((title) => (
            <span key={title} title={title} className="sunny-chip max-w-full truncate">
              {title}
            </span>
          ))}
        </div>
      ) : null}

      <div className="grid grid-cols-[56px_1fr]">
        <div className="relative" style={{ height: (RANGE_MIN / 60) * HOUR_PX }}>
          {HOURS.map((h) => (
            <div key={h} className="tnum absolute right-2 -translate-y-1/2 text-[11px] text-muted-foreground" style={{ top: minToTop(h * 60) }}>
              {h}:00
            </div>
          ))}
        </div>

        <div ref={colRef} className="relative touch-none border-l border-border" style={{ height: (RANGE_MIN / 60) * HOUR_PX }}>
          {HOURS.map((h) => (
            <div key={h} className="pointer-events-none absolute inset-x-0 border-t border-border/50" style={{ top: minToTop(h * 60) }} />
          ))}

          {showNow ? (
            <div className="pointer-events-none absolute inset-x-0 z-20 h-px bg-[var(--status-danger)]" style={{ top: minToTop(nowMin) }}>
              <span className="absolute -left-1 -top-1 h-2 w-2 rounded-full bg-[var(--status-danger)]" />
            </div>
          ) : null}

          {items.map((block) => {
            const routine = block.date === "";
            const top = minToTop(block.startMin);
            const height = Math.max(18, minToTop(block.endMin) - minToTop(block.startMin));
            return (
              <div
                key={block.id}
                data-kind={routine ? "routine" : "work"}
                onPointerDown={(e) => beginDrag(e, block, "move")}
                onContextMenu={(e) => openMenu(e, block)}
                className={cn(
                  "today-time-block group absolute inset-x-2 z-10 cursor-pointer overflow-hidden border p-1.5 text-[11px] leading-4 transition-shadow active:cursor-grabbing",
                  activeId === block.id && "ring-2 ring-primary/60",
                )}
                style={{ top, height }}
                title={`${block.title} ${fmt(block.startMin)}-${fmt(block.endMin)}`}
              >
                <div className="line-clamp-2 font-medium">{block.title}</div>
                <div className="tnum text-[10px] opacity-70">
                  {fmt(block.startMin)}-{fmt(block.endMin)}{routine ? " / 例行" : ""}
                </div>
                {block.location && height > 46 ? <div className="truncate text-[10px] opacity-70">{block.location}</div> : null}
                <span onPointerDown={(e) => beginDrag(e, block, "resize")} className="absolute inset-x-0 bottom-0 h-2 cursor-ns-resize opacity-0 group-hover:opacity-100">
                  <span className="mx-auto mt-0.5 block h-1 w-8 rounded-full bg-foreground/20" />
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {menu ? <ContextMenu x={menu.x} y={menu.y} items={menu.items} onClose={() => setMenu(null)} /> : null}

      {editing ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setEditing(null)}>
          <div className="w-full max-w-lg rounded border border-border bg-card p-5 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <div className="sunny-title text-base">编辑时间块</div>
              <button onClick={() => setEditing(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form action={updateScheduleBlockAction} className="grid gap-3 sm:grid-cols-2">
              <input type="hidden" name="id" value={editing.id} />
              <input type="hidden" name="returnTo" value="today" />
              <label className="sm:col-span-2">
                <span className="flabel">主题</span>
                <input name="title" defaultValue={editing.title} className="field" />
              </label>
              <label>
                <span className="flabel">日期</span>
                <input type="date" name="date" defaultValue={editing.date} className="field" />
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label>
                  <span className="flabel">开始</span>
                  <input type="time" name="start" defaultValue={fmtHM(editing.startMin)} className="field" />
                </label>
                <label>
                  <span className="flabel">结束</span>
                  <input type="time" name="end" defaultValue={fmtHM(editing.endMin)} className="field" />
                </label>
              </div>
              <label>
                <span className="flabel"><MapPin className="mr-1 inline h-3 w-3" />地点</span>
                <input name="location" defaultValue={editing.location} className="field" />
              </label>
              <label>
                <span className="flabel"><Users className="mr-1 inline h-3 w-3" />参与人</span>
                <input name="participants" defaultValue={editing.participants} placeholder="可选" className="field" />
              </label>
              <label className="sm:col-span-2">
                <span className="flabel">备注</span>
                <input name="note" defaultValue={editing.note} placeholder="可选" className="field" />
              </label>
              <label className="sm:col-span-2">
                <span className="flabel">关联项目</span>
                <select name="projectId" defaultValue={editing.projectId} className="field">
                  <option value="">不关联项目</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </label>
              <div className="flex items-center justify-end gap-2 sm:col-span-2">
                <Button type="button" variant="outline" onClick={() => setEditing(null)}>取消</Button>
                <Button type="submit">保存</Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
