import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { addDays, addMonths, endOfMonth, format, parse, startOfMonth, startOfWeek } from "date-fns";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { isDatabaseConfigured } from "@/lib/db-status";
import { getProjectsForView, getReceptionsForView, getTasksForView } from "@/lib/database-data";
import { buildWorkEvents } from "@/lib/work-calendar";
import { CalendarBoard } from "./calendar-board";

export const dynamic = "force-dynamic";

function ymToDate(ym: string | undefined): Date | null {
  if (ym && /^\d{4}-\d{2}$/.test(ym)) return startOfMonth(parse(ym, "yyyy-MM", new Date()));
  return null;
}

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ ym?: string }> }) {
  const [{ ym }, tasks, receptions, projects] = await Promise.all([searchParams, getTasksForView(), getReceptionsForView(), getProjectsForView()]);
  const events = buildWorkEvents({ tasks, receptions, projects });
  const today = new Date();
  const todayIso = format(today, "yyyy-MM-dd");
  const requested = ymToDate(ym);
  const monthStart = requested ?? startOfMonth(today);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const days = Array.from({ length: 42 }, (_, i) => format(addDays(gridStart, i), "yyyy-MM-dd"));
  const prevYm = format(addMonths(monthStart, -1), "yyyy-MM");
  const nextYm = format(addMonths(monthStart, 1), "yyyy-MM");
  const monthStartIso = format(monthStart, "yyyy-MM-dd");
  const monthEndIso = format(endOfMonth(monthStart), "yyyy-MM-dd");
  const monthEvents = events.filter((event) => event.start <= monthEndIso && event.end >= monthStartIso);

  return (
    <AppShell>
      <div className="sunny-page calendar-board-shell">
        <div className="sunny-page-head flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="page-eyebrow">日历</div>
            <h1 className="page-title mt-2">{format(monthStart, "yyyy 年 M 月")}</h1>
            <p className="page-description mt-2 text-sm leading-6">本月 {monthEvents.length} 项安排 · 点击日期或“更多”查看当天详情。</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/tasks?new=1"><Button variant="outline" size="sm"><Plus className="h-4 w-4" />新事项</Button></Link>
            <Link href={'/calendar?ym=' + prevYm}><Button variant="outline" size="icon" title="上一月"><ChevronLeft className="h-4 w-4" /></Button></Link>
            <Link href="/calendar"><Button variant="outline" size="sm"><CalendarDays className="h-4 w-4" />今天</Button></Link>
            <Link href={'/calendar?ym=' + nextYm}><Button variant="outline" size="icon" title="下一月"><ChevronRight className="h-4 w-4" /></Button></Link>
          </div>
        </div>
        <CalendarBoard days={days} events={events} currentMonth={monthStart.getMonth()} todayIso={todayIso} dbConnected={isDatabaseConfigured()} />
      </div>
    </AppShell>
  );
}