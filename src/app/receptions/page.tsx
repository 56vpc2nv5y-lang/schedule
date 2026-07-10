import Link from "next/link";
import { MapPin, PlaneTakeoff, Plus, Users } from "lucide-react";
import { createReceptionAction } from "@/app/actions";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CollapseCard } from "@/components/ui/collapse-card";
import { receptionTypeMeta } from "@/lib/default-data";
import { getT } from "@/lib/locale";
import { projectDisplayName } from "@/lib/i18n";
import {
  getContactsForView,
  getProjectsForView,
  getReceptionsForView,
} from "@/lib/database-data";

export const dynamic = "force-dynamic";

function statusTone(status: string): "done" | "waiting" | "neutral" | "risk" {
  if (status === "CONFIRMED" || status === "DONE") return "done";
  if (status === "CANCELLED") return "risk";
  if (status === "PLANNED") return "waiting";
  return "neutral";
}

function typeMeta(type: string) {
  return (
    receptionTypeMeta[type as keyof typeof receptionTypeMeta] ??
    receptionTypeMeta.VISIT
  );
}

export default async function ReceptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string; error?: string; new?: string }>;
}) {
  const [
    { created, error, new: openForm },
    { locale, t },
    receptions,
    projects,
    contacts,
  ] = await Promise.all([
    searchParams,
    getT(),
    getReceptionsForView(),
    getProjectsForView(),
    getContactsForView(),
  ]);
  const projectMap = new Map(projects.map((project) => [project.id, project]));
  const contactMap = new Map(contacts.map((contact) => [contact.id, contact]));
  const pname = (p: { nameZh: string; nameEn?: string }) =>
    projectDisplayName(locale, p);

  const rangeText = (start: string, end: string) => {
    if (!start) return t.receptions.tbd;
    if (!end || end === start) return start;
    return `${start} → ${end}`;
  };

  return (
    <AppShell>
      <PageHeader
        eyebrow={t.receptions.eyebrow}
        title={t.receptions.title}
        description={t.receptions.desc}
        action={
          <Link href="/receptions?new=1#new">
            <Button>
              <Plus className="h-4 w-4" />
              {t.receptions.newOne}
            </Button>
          </Link>
        }
      />

      {created === "reception" ? (
        <div className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          {t.receptions.saved}
        </div>
      ) : null}
      {created === "reception-checklist" ? (
        <div className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          {t.receptions.savedWithChecklist}
        </div>
      ) : null}
      {error === "missing-required" ? (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          {t.common.required}
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-2">
        {receptions.map((reception) => {
          const project = reception.projectId
            ? projectMap.get(reception.projectId)
            : undefined;
          const meta = typeMeta(reception.type);
          const isTrip = reception.type === "BUSINESS_TRIP";
          const statusLabel =
            t.statuses.reception[
              reception.status as keyof typeof t.statuses.reception
            ] ?? reception.status;

          return (
            <Card key={reception.id}>
              <CardHeader className="border-b border-border">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <CardTitle className="flex items-center gap-2">
                      <PlaneTakeoff
                        className={`h-4 w-4 ${isTrip ? "text-amber-500" : "text-primary"}`}
                      />
                      {reception.title}
                    </CardTitle>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <Badge tone={isTrip ? "waiting" : "info"}>{meta.label}</Badge>
                      {project ? (
                        <span className="text-xs text-muted-foreground">
                          {pname(project)}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <Badge tone={statusTone(reception.status)}>{statusLabel}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                {reception.purpose ? (
                  <div className="rounded-lg bg-secondary/50 p-3 text-sm leading-6">
                    {reception.purpose}
                  </div>
                ) : null}
                <div className="grid gap-3 sm:grid-cols-2">
                  <Info
                    icon={<MapPin className="h-3.5 w-3.5" />}
                    label={meta.locationLabel}
                    value={reception.location}
                  />
                  <Info
                    label={t.receptions.time}
                    value={rangeText(reception.startAt, reception.endAt)}
                  />
                </div>
                <div>
                  <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <Users className="h-3.5 w-3.5" />
                    {meta.peopleLabel}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {reception.visitorIds.length === 0 ? (
                      <span className="text-xs text-muted-foreground">
                        {t.receptions.noPeople}
                      </span>
                    ) : null}
                    {reception.visitorIds.map((visitorId) => {
                      const visitor = contactMap.get(visitorId);
                      return visitor ? (
                        <Badge key={visitor.id} tone="neutral">
                          {visitor.name} · {visitor.organization}
                        </Badge>
                      ) : null;
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <CollapseCard
        className="mt-5"
        title={t.receptions.newOne}
        open={openForm === "1" || Boolean(error)}
      >
        <form action={createReceptionAction} className="grid gap-4 lg:grid-cols-6">
          <label className="lg:col-span-2">
            <span className="flabel">{t.common.type}</span>
            <select name="type" className="field" defaultValue="BUSINESS_TRIP">
              <option value="BUSINESS_TRIP">{t.receptions.fTypeTrip}</option>
              <option value="VISIT">{t.receptions.fTypeVisit}</option>
              <option value="EXHIBITION_INVITE">{t.receptions.fTypeExpo}</option>
            </select>
          </label>
          <label className="lg:col-span-4">
            <span className="flabel">{t.receptions.fTitle}</span>
            <input
              name="title"
              placeholder={t.receptions.fTitlePh}
              className="field"
            />
          </label>

          <label className="lg:col-span-2">
            <span className="flabel">{t.receptions.fProject}</span>
            <select name="projectId" className="field">
              <option value="">{t.receptions.fNoProject}</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {pname(project)}
                </option>
              ))}
            </select>
          </label>
          <label className="lg:col-span-2">
            <span className="flabel">{t.receptions.fLocation}</span>
            <input
              name="location"
              placeholder={t.receptions.fLocationPh}
              className="field"
            />
          </label>
          <label className="lg:col-span-2">
            <span className="flabel">{t.receptions.fStatus}</span>
            <select name="status" className="field" defaultValue="PLANNED">
              {(["PLANNED", "CONFIRMED", "DONE", "CANCELLED"] as const).map(
                (value) => (
                  <option key={value} value={value}>
                    {t.statuses.reception[value]}
                  </option>
                ),
              )}
            </select>
          </label>

          <label className="lg:col-span-2">
            <span className="flabel">{t.receptions.fStart}</span>
            <input type="datetime-local" name="startAt" className="field" />
          </label>
          <label className="lg:col-span-2">
            <span className="flabel">{t.receptions.fEnd}</span>
            <input type="datetime-local" name="endAt" className="field" />
          </label>
          <label className="lg:col-span-2">
            <span className="flabel">{t.receptions.fPurpose}</span>
            <input
              name="purpose"
              placeholder={t.receptions.fPurposePh}
              className="field"
            />
          </label>

          <label className="lg:col-span-4">
            <span className="flabel">{t.receptions.fPeople}</span>
            <select
              name="visitorIds"
              multiple
              size={4}
              className="field h-auto py-2"
            >
              {contacts.map((contact) => (
                <option key={contact.id} value={contact.id}>
                  {contact.name} · {contact.organization}
                  {contact.title ? ` · ${contact.title}` : ""}
                </option>
              ))}
            </select>
            <span className="mt-1 block text-xs text-muted-foreground">
              {t.receptions.fPeopleHint}
            </span>
          </label>
          <div className="flex flex-col justify-end gap-3 lg:col-span-2">
            <label className="flex items-start gap-2 rounded-lg border border-border bg-secondary/30 p-3 text-sm">
              <input type="checkbox" name="checklist" className="mt-0.5" />
              <span>
                <span className="font-medium">{t.receptions.fChecklist}</span>
                <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">
                  {t.receptions.fChecklistHint}
                </span>
              </span>
            </label>
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

function Info({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="tnum mt-1 text-sm font-medium">{value || "—"}</div>
    </div>
  );
}
