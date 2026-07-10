import Link from "next/link";
import {
  BadgeCheck,
  HandCoins,
  PiggyBank,
  Plus,
  Trash2,
  Undo2,
} from "lucide-react";
import {
  createMoneyRecordAction,
  deleteMoneyRecordAction,
  markReimbursedAction,
} from "@/app/actions";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CollapseCard } from "@/components/ui/collapse-card";
import { getT } from "@/lib/locale";
import { getMoneyRecordsForView } from "@/lib/database-data";

export const dynamic = "force-dynamic";

function fmtMoney(amount: number, currency: string) {
  const symbol =
    currency === "CNY" ? "¥" : currency === "SGD" ? "S$" : currency === "MOP" ? "MOP$" : currency + " ";
  return `${symbol}${amount.toLocaleString("zh-CN", { maximumFractionDigits: 2 })}`;
}

export default async function MoneyPage({
  searchParams,
}: {
  searchParams: Promise<{ setup?: string; created?: string; error?: string; new?: string }>;
}) {
  const [{ setup, created, error, new: openForm }, { t }, records] =
    await Promise.all([searchParams, getT(), getMoneyRecordsForView()]);

  const sum = (kind: string) =>
    records
      .filter((r) => r.kind === kind && r.currency === "CNY")
      .reduce((acc, r) => acc + r.amount, 0);
  const salary = sum("SALARY");
  const advance = sum("ADVANCE");
  const reimbursed = sum("REIMBURSED");

  const kindMeta: Record<string, { label: string; tone: "active" | "waiting" | "done" | "neutral" }> = {
    SALARY: { label: t.money.kindSalary, tone: "active" },
    ADVANCE: { label: t.money.kindAdvance, tone: "waiting" },
    REIMBURSED: { label: t.money.kindReimbursed, tone: "done" },
    OTHER: { label: t.money.kindOther, tone: "neutral" },
  };

  const stats = [
    {
      label: t.money.statSalary,
      value: fmtMoney(salary, "CNY"),
      Icon: PiggyBank,
      tint: "bg-primary/10 text-primary",
    },
    {
      label: t.money.statAdvance,
      value: fmtMoney(advance, "CNY"),
      Icon: HandCoins,
      tint: advance > 0 ? "bg-amber-500/10 text-amber-600" : "bg-emerald-500/10 text-emerald-600",
    },
    {
      label: t.money.statReimbursed,
      value: fmtMoney(reimbursed, "CNY"),
      Icon: BadgeCheck,
      tint: "bg-emerald-500/10 text-emerald-600",
    },
  ];

  return (
    <AppShell>
      <PageHeader
        eyebrow={t.money.eyebrow}
        title={t.money.title}
        description={t.money.desc}
        action={
          <Link href="/money?new=1#new">
            <Button>
              <Plus className="h-4 w-4" />
              {t.money.addOne}
            </Button>
          </Link>
        }
      />

      {setup === "database-required" ? (
        <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          {t.common.demoMode}
        </div>
      ) : null}
      {created === "record" ? (
        <div className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          {t.common.saved}
        </div>
      ) : null}
      {error === "missing-required" ? (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          {t.common.required}
        </div>
      ) : null}

      <div className="mb-5 grid gap-4 md:grid-cols-3">
        {stats.map((item) => (
          <Card key={item.label}>
            <CardContent className="flex items-center gap-4 p-5">
              <span
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${item.tint}`}
              >
                <item.Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <div className="tnum truncate text-xl font-semibold leading-none">
                  {item.value}
                </div>
                <div className="mt-1.5 text-sm text-muted-foreground">
                  {item.label}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="border-b border-border">
          <CardTitle>{t.money.listTitle}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 pt-4">
          {records.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              {t.money.empty}
            </div>
          ) : (
            records.map((record) => {
              const meta = kindMeta[record.kind] ?? kindMeta.OTHER;
              return (
                <div
                  key={record.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3"
                >
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <Badge tone={meta.tone}>{meta.label}</Badge>
                    <span className="tnum text-sm font-semibold">
                      {fmtMoney(record.amount, record.currency)}
                    </span>
                    <span className="tnum font-mono text-xs text-muted-foreground">
                      {record.happenedAt}
                    </span>
                    {record.note ? (
                      <span className="truncate text-xs text-muted-foreground">
                        {record.note}
                      </span>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {record.kind === "ADVANCE" ? (
                      <form action={markReimbursedAction}>
                        <input type="hidden" name="id" value={record.id} />
                        <Button variant="outline" size="sm" type="submit">
                          <Undo2 className="h-3.5 w-3.5" />
                          {t.money.markBack}
                        </Button>
                      </form>
                    ) : null}
                    <form action={deleteMoneyRecordAction}>
                      <input type="hidden" name="id" value={record.id} />
                      <Button
                        variant="ghost"
                        size="icon"
                        type="submit"
                        className="h-8 w-8"
                        title={t.common.delete}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    </form>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <CollapseCard
        className="mt-5"
        title={t.money.addOne}
        open={openForm === "1" || Boolean(error)}
      >
        <form action={createMoneyRecordAction} className="grid gap-4 lg:grid-cols-6">
          <label>
            <span className="flabel">{t.money.fKind}</span>
            <select name="kind" className="field" defaultValue="ADVANCE">
              <option value="ADVANCE">{t.money.kindAdvance}</option>
              <option value="SALARY">{t.money.kindSalary}</option>
              <option value="REIMBURSED">{t.money.kindReimbursed}</option>
              <option value="OTHER">{t.money.kindOther}</option>
            </select>
          </label>
          <label>
            <span className="flabel">{t.money.fAmount}</span>
            <input
              name="amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              className="field"
            />
          </label>
          <label>
            <span className="flabel">{t.money.fCurrency}</span>
            <select name="currency" className="field" defaultValue="CNY">
              <option>CNY</option>
              <option>SGD</option>
              <option>MOP</option>
              <option>HKD</option>
              <option>USD</option>
            </select>
          </label>
          <label>
            <span className="flabel">{t.money.fDate}</span>
            <input type="date" name="happenedAt" className="field" />
          </label>
          <label className="lg:col-span-2">
            <span className="flabel">{t.money.fNote}</span>
            <input
              name="note"
              placeholder="例如：合肥接待打车+餐费"
              className="field"
            />
          </label>
          <div className="flex items-end lg:col-start-6">
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
