import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import {
  createGrowthLogAction,
  deleteGrowthLogAction,
  updateGrowthLogAction,
} from "@/app/actions";
import { InlineEdit } from "@/components/ui/inline-edit";
import { AppShell } from "@/components/layout/app-shell";
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
  const pname = (p: { nameZh: string; nameEn?: string }) => projectDisplayName(locale, p);
  const projectOptions = projects.map((project) => ({ id: project.id, name: pname(project) }));
  const recentLogs = logs.slice(0, 6);

  return (
    <AppShell>
      <div className="sunny-page growth-archive">
        <div className="sunny-page-head flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="page-eyebrow text-xs text-muted-foreground">Growth Archive</div>
            <h1 className="page-title mt-2">成长档案</h1>
            <p className="page-description mt-2 max-w-2xl text-sm leading-6">{t.growth.desc}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ResumeCoach configured={aiReady} projects={projectOptions} />
            <Link href="/growth?new=1#new">
              <Button>
                <Plus className="h-4 w-4" />
                {t.growth.addOne}
              </Button>
            </Link>
          </div>
        </div>

        {setup === "database-required" ? <Banner tone="warn">{t.common.demoMode}</Banner> : null}
        {created === "log" ? <Banner tone="ok">{t.growth.savedMsg}</Banner> : null}
        {resumePoint === "saved" ? <Banner tone="ok">简历要点已收藏，可在下方继续编辑。</Banner> : null}
        {error === "missing-required" || error === "missing-resume-point" ? <Banner tone="err">{t.common.required}</Banner> : null}

        <div className="mb-5 grid gap-3 md:grid-cols-3">
          <div className="focus-card border border-border bg-card">
            <strong className="tnum">{logs.length}</strong>
            <span>成长记录</span>
          </div>
          <div className="focus-card border border-border bg-card" data-tone="done">
            <strong className="tnum">{resumePoints.length}</strong>
            <span>简历要点</span>
          </div>
          <div className="focus-card border border-border bg-card" data-tone="waiting">
            <strong className="tnum">6M</strong>
            <span>六个月素材视角</span>
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-5">
            <ResumeBaseline />
            <ResumePointsLibrary points={resumePoints} projects={projectOptions} />
          </div>

          <Card>
            <CardHeader className="border-b border-border">
              <CardTitle>近期素材</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {recentLogs.length === 0 ? (
                <div className="rounded border border-dashed border-border p-6 text-center text-sm text-muted-foreground">{t.growth.empty}</div>
              ) : (
                recentLogs.map((log) => {
                  const meta = growthCategoryMeta[log.category as GrowthCategory];
                  const project = log.projectId ? projectMap.get(log.projectId) : undefined;
                  return (
                    <div key={log.id} className="todo-row">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone={meta.tone}>{meta.label}</Badge>
                        {project ? <span className="chip">{pname(project)}</span> : null}
                        <span className="chip">{log.happenedAt}</span>
                      </div>
                      <div className="mt-2 text-sm font-semibold">{log.title}</div>
                      {log.detail ? <p className="mt-1 text-sm leading-6 text-muted-foreground">{log.detail}</p> : null}
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>

        <div className="mb-5 mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {categoryOrder.map((category) => {
            const meta = growthCategoryMeta[category];
            const count = logs.filter((log) => log.category === category).length;
            return (
              <div key={category} className="focus-card border border-border bg-card">
                <strong className="tnum">{count}</strong>
                <span>{meta.label}</span>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">{meta.hint}</p>
              </div>
            );
          })}
        </div>

        <Card>
          <CardHeader className="border-b border-border">
            <CardTitle>{t.growth.listTitle}</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {logs.length === 0 ? (
              <div className="rounded border border-dashed border-border p-10 text-center text-sm text-muted-foreground">{t.growth.empty}</div>
            ) : (
              <div className="space-y-3">
                {logs.map((log) => {
                  const meta = growthCategoryMeta[log.category as GrowthCategory];
                  const project = log.projectId ? projectMap.get(log.projectId) : undefined;
                  return (
                    <div key={log.id} className="rounded border border-border p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge tone={meta.tone}>{meta.label}</Badge>
                            {project ? <span className="chip">{pname(project)}</span> : null}
                            <span className="tnum font-mono text-xs text-muted-foreground">{log.happenedAt}</span>
                          </div>
                          <div className="mt-2 text-sm font-semibold">{log.title}</div>
                          {log.detail ? <p className="mt-1 text-sm leading-6 text-muted-foreground">{log.detail}</p> : null}
                          <div className="mt-3 flex flex-wrap items-center gap-4">
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
                              <form action={updateGrowthLogAction} className="grid gap-2 sm:grid-cols-2">
                                <input type="hidden" name="id" value={log.id} />
                                <label className="sm:col-span-2">
                                  <span className="flabel">{t.growth.fTitle}</span>
                                  <input name="title" defaultValue={log.title} className="field field-sm" />
                                </label>
                                <label>
                                  <span className="flabel">{t.growth.fCategory}</span>
                                  <select name="category" defaultValue={log.category} className="field field-sm">
                                    {categoryOrder.map((c) => <option key={c} value={c}>{growthCategoryMeta[c].label}</option>)}
                                  </select>
                                </label>
                                <label>
                                  <span className="flabel">{t.growth.fProject}</span>
                                  <select name="projectId" defaultValue={log.projectId} className="field field-sm">
                                    <option value="">{t.growth.fNoProject}</option>
                                    {projects.map((p) => <option key={p.id} value={p.id}>{pname(p)}</option>)}
                                  </select>
                                </label>
                                <label>
                                  <span className="flabel">{t.growth.fDate}</span>
                                  <input type="date" name="happenedAt" defaultValue={log.happenedAt} className="field field-sm" />
                                </label>
                                <label className="sm:col-span-2">
                                  <span className="flabel">{t.growth.fDetail}</span>
                                  <input name="detail" defaultValue={log.detail} className="field field-sm" />
                                </label>
                                <div className="flex items-end justify-end sm:col-span-2">
                                  <Button type="submit" size="sm">{t.common.save}</Button>
                                </div>
                              </form>
                            </InlineEdit>
                          </div>
                        </div>
                        <form action={deleteGrowthLogAction}>
                          <input type="hidden" name="id" value={log.id} />
                          <Button variant="ghost" size="icon" type="submit" title={t.growth.deleteOne}>
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

        <CollapseCard className="mt-5" title={t.growth.formTitle} hint={t.growth.formHint} open={openForm === "1" || Boolean(created) || Boolean(error)}>
          <form action={createGrowthLogAction} className="grid gap-4 lg:grid-cols-6">
            <label className="lg:col-span-3">
              <span className="flabel">{t.growth.fTitle}</span>
              <input name="title" placeholder={t.growth.fTitlePh} className="field" />
            </label>
            <label>
              <span className="flabel">{t.growth.fCategory}</span>
              <select name="category" className="field">
                {categoryOrder.map((category) => <option key={category} value={category}>{growthCategoryMeta[category].label}</option>)}
              </select>
            </label>
            <label>
              <span className="flabel">{t.growth.fProject}</span>
              <select name="projectId" className="field">
                <option value="">{t.growth.fNoProject}</option>
                {projects.map((project) => <option key={project.id} value={project.id}>{pname(project)}</option>)}
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
      </div>
    </AppShell>
  );
}

function Banner({ tone, children }: { tone: "ok" | "warn" | "err"; children: React.ReactNode }) {
  return (
    <div className={tone === "err" ? "mb-5 rounded border border-red-200 bg-red-50 p-4 text-sm text-red-900" : "mb-5 rounded border border-border bg-secondary/50 p-4 text-sm"}>
      {children}
    </div>
  );
}
