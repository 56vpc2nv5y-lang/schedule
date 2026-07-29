import Link from "next/link";
import { MapPin, PlaneTakeoff, Plus, Users } from "lucide-react";
import {
  createReceptionAction,
  deleteReceptionFormAction,
  updateReceptionAction,
} from "@/app/actions";
import { InlineEdit } from "@/components/ui/inline-edit";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CollapseCard } from "@/components/ui/collapse-card";
import { StatusStamp, type StatusStampTone } from "@/components/ui/status-pill";
import { receptionTypeMeta } from "@/lib/default-data";
import { getT } from "@/lib/locale";
import { projectDisplayName } from "@/lib/i18n";
import {
  getContactsForView,
  getProjectsForView,
  getReceptionsForView,
} from "@/lib/database-data";

export const dynamic = "force-dynamic";

function statusTone(status: string): StatusStampTone {
  if (status === "CONFIRMED" || status === "DONE") return "done";
  if (status === "CANCELLED") return "danger";
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
                    <Link href={`/receptions/${reception.id}`} className="group">
                      <CardTitle className="flex items-center gap-2 group-hover:text-primary">
                        <PlaneTakeoff
                          className={`h-4 w-4 ${isTrip ? "text-amber-500" : "text-primary"}`}
                        />
                        {reception.title}
                      </CardTitle>
                    </Link>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <Badge tone={isTrip ? "waiting" : "info"}>{meta.label}</Badge>
                      {project ? (
                        <span className="text-xs text-muted-foreground">
                          {pname(project)}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <StatusStamp tone={statusTone(reception.status)}>{statusLabel}</StatusStamp>
                    {reception.checklistTotal > 0 ? (
                      <Link
                        href={`/receptions/${reception.id}`}
                        className="progress-ring"
                        style={{
                          background: `conic-gradient(var(--status-active) ${Math.round((reception.checklistDone / reception.checklistTotal) * 100)}%, var(--hairline) 0)`,
                        }}
                        title={t.receptions.checklistProgress(reception.checklistDone, reception.checklistTotal)}
                      >
                        <span>{reception.checklistDone}/{reception.checklistTotal}</span>
                      </Link>
                    ) : (
                      <Link
                        href={`/receptions/${reception.id}`}
                        className="text-xs text-muted-foreground hover:text-primary"
                      >
                        {t.receptions.openDetail}
                      </Link>
                    )}
                  </div>
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

                <div className="flex items-center gap-4 border-t border-border/60 pt-3">
                  <InlineEdit label={t.common.edit}>
                    <form
                      action={updateReceptionAction}
                      className="grid gap-2 sm:grid-cols-2"
                    >
                      <input type="hidden" name="id" value={reception.id} />
                      <label className="sm:col-span-2">
                        <span className="flabel">{t.receptions.fTitle}</span>
                        <input
                          name="title"
                          defaultValue={reception.title}
                          className="field field-sm"
                        />
                      </label>
                      <label>
                        <span className="flabel">{t.common.type}</span>
                        <select
                          name="type"
                          defaultValue={reception.type}
                          className="field field-sm"
                        >
                          <option value="BUSINESS_TRIP">{t.receptions.fTypeTrip}</option>
                          <option value="VISIT">{t.receptions.fTypeVisit}</option>
                          <option value="EXHIBITION_INVITE">{t.receptions.fTypeExpo}</option>
                        </select>
                      </label>
                      <label>
                        <span className="flabel">{t.receptions.fStatus}</span>
                        <select
                          name="status"
                          defaultValue={reception.status}
                          className="field field-sm"
                        >
                          {(["PLANNED", "CONFIRMED", "DONE", "CANCELLED"] as const).map(
                            (v) => (
                              <option key={v} value={v}>
                                {t.statuses.reception[v]}
                              </option>
                            ),
                          )}
                        </select>
                      </label>
                      <label>
                        <span className="flabel">{t.receptions.fProject}</span>
                        <select
                          name="projectId"
                          defaultValue={reception.projectId ?? ""}
                          className="field field-sm"
                        >
                          <option value="">{t.receptions.fNoProject}</option>
                          {projects.map((p) => (
                            <option key={p.id} value={p.id}>
                              {pname(p)}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        <span className="flabel">{t.receptions.fLocation}</span>
                        <input
                          name="location"
                          defaultValue={reception.location}
                          className="field field-sm"
                        />
                      </label>
                      <label>
                        <span className="flabel">{t.receptions.fStart}</span>
                        <input
                          type="datetime-local"
                          name="startAt"
                          defaultValue={reception.startAt.replace(" ", "T")}
                          className="field field-sm"
                        />
                      </label>
                      <label>
                        <span className="flabel">{t.receptions.fEnd}</span>
                        <input
                          type="datetime-local"
                          name="endAt"
                          defaultValue={reception.endAt.replace(" ", "T")}
                          className="field field-sm"
                        />
                      </label>
                      <label className="sm:col-span-2">
                        <span className="flabel">{t.receptions.fPurpose}</span>
                        <input
                          name="purpose"
                          defaultValue={reception.purpose}
                          className="field field-sm"
                        />
                      </label>
                      <label className="sm:col-span-2">
                        <span className="flabel">{t.receptions.fPeople}</span>
                        <select
                          name="visitorIds"
                          multiple
                          size={3}
                          defaultValue={reception.visitorIds}
                          className="field field-sm h-auto py-1"
                        >
                          {contacts.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name} · {c.organization}
                            </option>
                          ))}
                        </select>
                      </label>
                      <div className="flex items-end justify-end sm:col-span-2">
                        <Button type="submit" size="sm">
                          {t.common.save}
                        </Button>
                      </div>
                    </form>
                  </InlineEdit>
                  <form action={deleteReceptionFormAction}>
                    <input type="hidden" name="id" value={reception.id} />
                    <button
                      type="submit"
                      className="text-xs font-medium text-muted-foreground hover:text-red-600"
                    >
                      {t.common.delete}
                    </button>
                  </form>
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
