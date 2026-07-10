import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { addDays, format, parseISO, startOfWeek } from "date-fns";
import { createScheduleBlockAction } from "@/app/actions";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { CollapseCard } from "@/components/ui/collapse-card";
import { isDatabaseConfigured } from "@/lib/db-status";
import { getT } from "@/lib/locale";
import {
  getReceptionsForView,
  getScheduleBlocksForView,
} from "@/lib/database-data";
import { WeekBoard, type TripSegment, type WeekBlock } from "./week-board";

export const dynamic = "force-dynamic";

function parseTimeToMin(text: string) {
  // "2026-07-12 14:00" → 840
  const time = text.slice(11);
  if (!time) return 540;
  const [h, m] = time.split(":").map(Number);
  return (h || 9) * 60 + (m || 0);
}

export default async function WeekPage({
  searchParams,
}: {
  searchParams: Promise<{ w?: string; created?: string; error?: string; new?: string }>;
}) {
  const [{ w, created, error, new: openForm }, { t }, blocks, receptions] =
    await Promise.all([
      searchParams,
      getT(),
      getScheduleBlocksForView(),
      getReceptionsForView(),
    ]);

  const base =
    w && /^\d{4}-\d{2}-\d{2}$/.test(w) ? parseISO(w) : new Date();
  const weekStart = startOfWeek(base, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) =>
    format(addDays(weekStart, i), "yyyy-MM-dd"),
  );
  const todayIso = format(new Date(), "yyyy-MM-dd");
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();

  const prevW = format(addDays(weekStart, -7), "yyyy-MM-dd");
  const nextW = format(addDays(weekStart, 7), "yyyy-MM-dd");

  // 出差/接待 → 每天一段（首日从开始时刻起，中间日 9:00-18:00，末日到结束时刻）
  const trips: TripSegment[] = [];
  for (const reception of receptions) {
    if (reception.status === "CANCELLED" || !reception.startAt) continue;
    const startDay = reception.startAt.slice(0, 10);
    const endDay = (reception.endAt || reception.startAt).slice(0, 10);
    for (const day of days) {
      if (day < startDay || day > endDay) continue;
      trips.push({
        id: `${reception.id}-${day}`,
        title: reception.title,
        date: day,
        startMin: day === startDay ? parseTimeToMin(reception.startAt) : 540,
        endMin:
          day === endDay
            ? Math.max(parseTimeToMin(reception.endAt || reception.startAt), 600)
            : 1080,
      });
    }
  }

  const weekBlocks: WeekBlock[] = blocks
    .filter((block) => block.date === "" || days.includes(block.date))
    .map((block) => ({ ...block }));

  return (
    <AppShell>
      <PageHeader
        eyebrow={t.week.eyebrow}
        title={t.week.title}
        description={t.week.desc}
        action={
          <div className="flex items-center gap-2">
            <Link href={`/week?w=${prevW}`}>
              <Button variant="outline" size="icon" title={t.week.prevWeek}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/week">
              <Button variant="outline" size="sm">
                <CalendarDays className="h-4 w-4" />
                {t.week.thisWeek}
              </Button>
            </Link>
            <Link href={`/week?w=${nextW}`}>
              <Button variant="outline" size="icon" title={t.week.nextWeek}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/week?new=1#new">
              <Button>
                <Plus className="h-4 w-4" />
                {t.week.addBlock}
              </Button>
            </Link>
          </div>
        }
      />

      {created === "block" ? (
        <div className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          {t.common.saved}
        </div>
      ) : null}
      {error === "missing-required" ? (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          {t.common.required}
        </div>
      ) : null}

      <WeekBoard
        days={days}
        blocks={weekBlocks}
        trips={trips}
        todayIso={todayIso}
        nowMin={nowMin}
        dbConnected={isDatabaseConfigured()}
      />

      <CollapseCard
        className="mt-5"
        title={t.week.addBlock}
        open={openForm === "1" || Boolean(error)}
      >
        <form
          action={createScheduleBlockAction}
          className="grid gap-4 lg:grid-cols-5"
        >
          <label className="lg:col-span-2">
            <span className="flabel">{t.week.fTitle}</span>
            <input name="title" placeholder={t.week.fTitlePh} className="field" />
          </label>
          <label>
            <span className="flabel">{t.week.fDate}</span>
            <input type="date" name="date" className="field" />
          </label>
          <label>
            <span className="flabel">{t.week.fStart}</span>
            <input type="time" name="start" defaultValue="09:30" className="field" />
          </label>
          <label>
            <span className="flabel">{t.week.fEnd}</span>
            <input type="time" name="end" defaultValue="11:00" className="field" />
          </label>
          <div className="flex items-end lg:col-start-5">
            <Button className="w-full" type="submit">
              <Plus className="h-4 w-4" />
              {t.common.save}
            </Button>
          </div>
        </form>
      </CollapseCard>
    </AppShell>
  );
}
