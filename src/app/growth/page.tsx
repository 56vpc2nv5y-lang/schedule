import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import {
  createGrowthLogAction,
  deleteGrowthLogAction,
  updateGrowthLogAction,
} from "@/app/actions";
import { InlineEdit } from "@/components/ui/inline-edit";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CollapseCard } from "@/components/ui/collapse-card";
import { growthCategoryMeta, type GrowthCategory } from "@/lib/default-data";
import { isAiConfigured } from "@/lib/ai";
import { getT } from "@/lib/locale";
import { projectDisplayName } from "@/lib/i18n";
import { getGrowthLogsForView, getProjectsForView, getResumePointsForView } from "@/lib/database-data";
import { ResumeCoach } from "./resume-coach";
import { ResumePointsLibrary } from "./resume-points-library";
import { ResumeBaseline } from "./resume-baseline";

export const dynamic = "force-dynamic";

const categoryOrder: GrowthCategory[] = [
  "ACHIEVEMENT",
  "SKILL",
  "LESSON",
  "CERTIFICATE",
  "NETWORK",
];

export default async function GrowthPage({
  searchParams,
}: {
  searchParams: Promise<{
    setup?: string;
    created?: string;
    error?: string;
    new?: string;
    resumePoint?: string;
  }>;
}) {
  const [{ setup, created, error, new: openForm, resumePoint }, { locale, t }, logs, projects, resumePoints, aiReady] =
    await Promise.all([
      searchParams,
      getT(),
      getGrowthLogsForView(),
      getProjectsForView(),
      getResumePointsForView(),
      isAiConfigured(),
    ]);
  const projectMap = new Map(projects.map((project) => [project.id, project]));
  const pname = (p: { nameZh: string; nameEn?: string }) =>
    projectDisplayName(locale, p);
  const projectOptions = projects.map((project) => ({ id: project.id, name: pname(project) }));

  return (
    <AppShell>
      <PageHeader
        eyebrow={t.growth.eyebrow}
        title={t.growth.title}
        description={t.growth.desc}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <ResumeCoach configured={aiReady} projects={projectOptions} />
            <Link href="/growth?new=1#new">
              <Button>
                <Plus className="h-4 w-4" />
                {t.growth.addOne}
              </Button>
            </Link>
          </div>
        }
      />

      {setup === "database-required" ? (
        <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          {t.common.demoMode}
        </div>
      ) : null}
      {created === "log" ? (
        <div className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          {t.growth.savedMsg}
        </div>
      ) : null}
      {resumePoint === "saved" ? (
        <div className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          简历要点已收藏，可在下方继续编辑。
        </div>
      ) : null}
      {error === "missing-required" || error === "missing-resume-point" ? (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          {t.common.required}
        </div>
      ) : null}

      <ResumeBaseline />

      <ResumePointsLibrary points={resumePoints} projects={projectOptions} />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {categoryOrder.map((category) => {
          const meta = growthCategoryMeta[category];
          const count = logs.filter((log) => log.category === category).length;
          return (
            <Card key={category}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <Badge tone={meta.tone}>{meta.label}</Badge>
                  <span className="tnum text-xl font-semibold">{count}</span>
                </div>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  {meta.hint}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader className="border-b border-border">
          <CardTitle>{t.growth.listTitle}</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {logs.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              {t.growth.empty}
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => {
                const meta = growthCategoryMeta[log.category as GrowthCategory];
                const project = log.projectId
                  ? projectMap.get(log.projectId)
                  : undefined;
                return (
                  <div
                    key={log.id}
                    className="rounded-lg border border-border p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge tone={meta.tone}>{meta.label}</Badge>
                          {project ? (
                            <Badge tone="neutral">{pname(project)}</Badge>
                          ) : null}
                          <span className="tnum font-mono text-xs text-muted-foreground">
                            {log.happenedAt}
                          </span>
                        </div>
                        <div className="mt-2 text-sm font-medium">
                          {log.title}
                        </div>
                        {log.detail ? (
                          <p className="mt-1 text-sm leading-6 text-muted-foreground">
                            {log.detail}
                          </p>
                        ) : null}
                        <div className="mt-2 flex items-center gap-4">
                          <ResumeCoach
                            configured={aiReady}
                            projects={projectOptions}
                            source={{
                              title: log.title,
                              detail: log.detail,
                              projectId: log.projectId,
                              projectName: project ? pname(project) : "",
                              happenedAt: log.happenedAt,
                            }}
                          />
                          <InlineEdit label={t.common.edit}>
                            <form
                              action={updateGrowthLogAction}
                              className="grid gap-2 sm:grid-cols-2"
                            >
                              <input type="hidden" name="id" value={log.id} />
                              <label className="sm:col-span-2">
                                <span className="flabel">{t.growth.fTitle}</span>
                                <input
                                  name="title"
                                  defaultValue={log.title}
                                  className="field field-sm"
                                />
                              </label>
                              <label>
                                <span className="flabel">{t.growth.fCategory}</span>
                                <select
                                  name="category"
                                  defaultValue={log.category}
                                  className="field field-sm"
                                >
                                  {categoryOrder.map((c) => (
                                    <option key={c} value={c}>
                                      {growthCategoryMeta[c].label}
                                    </option>
                                  ))}
                                </select>
                              </label>
                              <label>
                                <span className="flabel">{t.growth.fProject}</span>
                                <select
                                  name="projectId"
                                  defaultValue={log.projectId}
                                  className="field field-sm"
                                >
                                  <option value="">{t.growth.fNoProject}</option>
                                  {projects.map((p) => (
                                    <option key={p.id} value={p.id}>
                                      {pname(p)}
                                    </option>
                                  ))}
                                </select>
                              </label>
                              <label>
                                <span className="flabel">{t.growth.fDate}</span>
                                <input
                                  type="date"
                                  name="happenedAt"
                                  defaultValue={log.happenedAt}
                                  className="field field-sm"
                                />
                              </label>
                              <label className="sm:col-span-2">
                                <span className="flabel">{t.growth.fDetail}</span>
                                <input
                                  name="detail"
                                  defaultValue={log.detail}
                                  className="field field-sm"
                                />
                              </label>
                              <div className="flex items-end justify-end sm:col-span-2">
                                <Button type="submit" size="sm">
                                  {t.common.save}
                                </Button>
                              </div>
                            </form>
                          </InlineEdit>
                        </div>
                      </div>
                      <form action={deleteGrowthLogAction}>
                        <input type="hidden" name="id" value={log.id} />
                        <Button
                          variant="ghost"
                          size="icon"
                          type="submit"
                          title={t.growth.deleteOne}
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </form>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <CollapseCard
        className="mt-5"
        title={t.growth.formTitle}
        hint={t.growth.formHint}
        open={openForm === "1" || Boolean(created) || Boolean(error)}
      >
        <form action={createGrowthLogAction} className="grid gap-4 lg:grid-cols-6">
          <label className="lg:col-span-3">
            <span className="flabel">{t.growth.fTitle}</span>
            <input name="title" placeholder={t.growth.fTitlePh} className="field" />
          </label>
          <label>
            <span className="flabel">{t.growth.fCategory}</span>
            <select name="category" className="field">
              {categoryOrder.map((category) => (
                <option key={category} value={category}>
                  {growthCategoryMeta[category].label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="flabel">{t.growth.fProject}</span>
            <select name="projectId" className="field">
              <option value="">{t.growth.fNoProject}</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {pname(project)}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="flabel">{t.growth.fDate}</span>
            <input type="date" name="happenedAt" className="field" />
          </label>
          <label className="lg:col-span-5">
            <span className="flabel">{t.growth.fDetail}</span>
            <input name="detail" placeholder={t.growth.fDetailPh} className="field" />
          </label>
          <div className="flex items-end">
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
