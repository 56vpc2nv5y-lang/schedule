import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { isDatabaseConfigured } from "@/lib/db-status";
import { receptionTypeMeta } from "@/lib/default-data";
import { getT } from "@/lib/locale";
import { projectDisplayName } from "@/lib/i18n";
import {
  getContactsForView,
  getProjectsForView,
  getReceptionDetailForView,
} from "@/lib/database-data";
import { ReceptionChecklist } from "./checklist";

export const dynamic = "force-dynamic";

function statusTone(status: string): "done" | "waiting" | "neutral" | "risk" {
  if (status === "CONFIRMED" || status === "DONE") return "done";
  if (status === "CANCELLED") return "risk";
  if (status === "PLANNED") return "waiting";
  return "neutral";
}

export default async function ReceptionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [{ locale, t }, reception, contacts, projects] = await Promise.all([
    getT(),
    getReceptionDetailForView(id),
    getContactsForView(),
    getProjectsForView(),
  ]);

  if (!reception) notFound();

  const meta =
    receptionTypeMeta[reception.type as keyof typeof receptionTypeMeta] ??
    receptionTypeMeta.VISIT;
  const contactMap = new Map(contacts.map((c) => [c.id, c]));
  const project = reception.projectId
    ? projects.find((p) => p.id === reception.projectId)
    : undefined;
  const statusLabel =
    t.statuses.reception[reception.status as keyof typeof t.statuses.reception] ??
    reception.status;

  const startText = reception.startAt || t.receptions.tbd;
  const endText = reception.endAt;

  return (
    <AppShell>
      {/* 面包屑 */}
      <div className="mb-1.5 text-xs text-muted-foreground">
        <Link href="/receptions" className="hover:text-primary">
          {t.receptionDetail.breadcrumb}
        </Link>
        <span className="px-1.5 text-border">/</span>
        {t.receptionDetail.detail}
      </div>

      {/* 头部 */}
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-[1.6rem] font-semibold tracking-tight">
              {reception.title}
            </h1>
            <Badge tone={statusTone(reception.status)}>{statusLabel}</Badge>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm text-muted-foreground">
            {reception.location ? (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {reception.location}
              </span>
            ) : null}
            {reception.location ? <span className="text-border">·</span> : null}
            <span className="tnum">
              {startText}
              {endText ? ` → ${endText}` : ""}
            </span>
            <span className="text-border">·</span>
            <Badge tone="waiting">{meta.short}</Badge>
          </div>
        </div>
        <Link
          href="/receptions"
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-sm font-medium text-muted-foreground hover:border-primary/40 hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          {t.receptionDetail.back}
        </Link>
      </div>

      {/* 两栏 */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_316px] lg:items-start">
        {/* 左：清单 */}
        <ReceptionChecklist
          receptionId={reception.id}
          initialItems={reception.items}
          dbConnected={isDatabaseConfigured()}
        />

        {/* 右：信息 */}
        <div className="flex flex-col gap-4">
          <InfoCard title={t.receptionDetail.basicInfo}>
            <Row label={t.receptionDetail.fType} value={meta.label} />
            {project ? (
              <Row
                label={t.receptionDetail.fProject}
                value={projectDisplayName(locale, project)}
                accent
              />
            ) : null}
            <Row label={t.receptionDetail.fLocation} value={reception.location || "—"} />
            <Row label={t.receptionDetail.fStatus} value={statusLabel} accent />
          </InfoCard>

          <InfoCard title={t.receptionDetail.keyDates}>
            <div className="relative flex flex-col gap-4 pl-1">
              <Dot label={startText} sub={meta.short} tone="bg-amber-500" />
              {endText ? (
                <Dot label={endText} sub="" tone="bg-muted-foreground/50" />
              ) : null}
            </div>
          </InfoCard>

          <InfoCard title={t.receptionDetail.people} hint={t.receptionDetail.fromContacts}>
            <div className="mb-1.5 text-[11px] font-semibold text-muted-foreground">
              {t.receptionDetail.visitors}
            </div>
            <div className="flex flex-wrap gap-2">
              {reception.visitorIds.length === 0 ? (
                <span className="text-xs text-muted-foreground">
                  {t.receptions.noPeople}
                </span>
              ) : (
                reception.visitorIds.map((vid) => {
                  const c = contactMap.get(vid);
                  return c ? (
                    <Badge key={vid} tone="neutral">
                      {c.name} · {c.organization}
                    </Badge>
                  ) : null;
                })
              )}
            </div>
          </InfoCard>
        </div>
      </div>
    </AppShell>
  );
}

function InfoCard({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">{title}</h3>
        {hint ? <span className="text-[11px] text-primary">{hint}</span> : null}
      </div>
      {children}
    </section>
  );
}

function Row({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span
        className={
          "text-xs font-medium " + (accent ? "text-primary" : "text-foreground")
        }
      >
        {value}
      </span>
    </div>
  );
}

function Dot({ label, sub, tone }: { label: string; sub: string; tone: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className={"mt-1 h-3 w-3 shrink-0 rounded-full " + tone} />
      <div>
        <div className="tnum text-xs font-semibold">{label}</div>
        {sub ? <div className="text-[11px] text-muted-foreground">{sub}</div> : null}
      </div>
    </div>
  );
}
