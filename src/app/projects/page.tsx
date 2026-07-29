import Link from "next/link";
import { Plus } from "lucide-react";
import { createProjectAction } from "@/app/actions";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { CollapseCard } from "@/components/ui/collapse-card";
import { regions } from "@/lib/default-data";
import { isDatabaseConfigured } from "@/lib/db-status";
import { getT } from "@/lib/locale";
import { projectDisplayName } from "@/lib/i18n";
import {
  getContactsForView,
  getProjectsForView,
  getTasksForView,
} from "@/lib/database-data";
import { ProjectBoard } from "./project-board-v2";

export const dynamic = "force-dynamic";

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ setup?: string; error?: string; new?: string }>;
}) {
  const [{ setup, error, new: openForm }, { locale, t }, projects, tasks, contacts] =
    await Promise.all([
      searchParams,
      getT(),
      getProjectsForView(),
      getTasksForView(),
      getContactsForView(),
    ]);
  const pname = (p: { nameZh: string; nameEn?: string }) =>
    projectDisplayName(locale, p);
  const taskCounts = new Map<string, number>();
  for (const task of tasks) {
    if (!task.projectId) continue;
    taskCounts.set(task.projectId, (taskCounts.get(task.projectId) ?? 0) + 1);
  }
  const activeCount = projects.filter((project) => project.status === "ACTIVE").length;
  const pausedCount = projects.filter((project) => project.status === "PAUSED").length;

  const columns = [
    { label: t.projects.colActive, status: "ACTIVE", tone: "active" as const },
    { label: t.projects.colPaused, status: "PAUSED", tone: "waiting" as const },
    { label: t.projects.colDone, status: "COMPLETED", tone: "done" as const },
    { label: "已取消", status: "CANCELLED", tone: "neutral" as const },
    { label: t.projects.colArchived, status: "ARCHIVED", tone: "neutral" as const },
  ];

  return (
    <AppShell>
      <PageHeader
        eyebrow={t.projects.workspace}
        title={t.projects.title}
        description={t.projects.summary(activeCount, pausedCount, projects.length)}
        action={
          <Link href="/projects?new=1#new">
            <Button>
              <Plus className="h-4 w-4" />
              {t.projects.newProject}
            </Button>
          </Link>
        }
      />

      {setup === "database-required" ? (
        <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          {t.common.demoMode}
        </div>
      ) : null}
      {error === "missing-required" ? (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          {t.projects.requiredErr}
        </div>
      ) : null}

      <ProjectBoard
        projects={projects.map((project) => ({
          id: project.id,
          name: pname(project),
          nameSub: locale === "zh" ? project.nameEn : "",
          region: project.region,
          type: project.type,
          status: project.status,
          completedStageCount: project.completedStageCount,
          totalStageCount: project.totalStageCount,
          currentStageName:
            project.status === "PAUSED"
              ? `已暂停 · ${project.currentStageName || "待重启复核"}`
              : project.currentStageName,
          taskCount: taskCounts.get(project.id) ?? 0,
        }))}
        columns={columns}
        stageLabel={t.projects.progress}
        taskCountLabel={t.projects.taskCountTpl}
        emptyLabel={t.projects.empty}
        moveLabel={t.projects.moveTo}
        dbConnected={isDatabaseConfigured()}
      />

      <CollapseCard
        className="mt-5"
        title={t.projects.newProject}
        hint={t.projects.formHint}
        open={openForm === "1" || Boolean(error)}
      >
        <form action={createProjectAction} className="grid gap-4 lg:grid-cols-6">
          <label className="lg:col-span-2">
            <span className="flabel">{t.projects.fNameZh}</span>
            <input
              name="nameZh"
              placeholder="例如：新加坡医疗 AI 项目"
              className="field"
            />
          </label>
          <label className="lg:col-span-2">
            <span className="flabel">{t.projects.fNameEn}</span>
            <input
              name="nameEn"
              placeholder="Optional English name"
              className="field"
            />
          </label>
          <label className="lg:col-span-2">
            <span className="flabel">{t.projects.fClient}</span>
            <input name="clientName" className="field" />
          </label>
          <label>
            <span className="flabel">{t.projects.fRegion}</span>
            <select name="region" className="field">
              {regions.map((region) => (
                <option key={region}>{region}</option>
              ))}
            </select>
          </label>
          <label>
            <span className="flabel">{t.projects.fType}</span>
            <select name="projectType" className="field">
              <option>标准项目</option>
              <option>接待/展会专项</option>
            </select>
          </label>
          <label>
            <span className="flabel">{t.projects.fStart}</span>
            <input type="date" name="plannedStart" className="field" />
          </label>
          <label>
            <span className="flabel">{t.projects.fEnd}</span>
            <input type="date" name="plannedEnd" className="field" />
          </label>
          <label>
            <span className="flabel">{t.projects.fOwner}</span>
            <select name="ownerId" className="field">
              <option value="">{t.common.notSelected}</option>
              {contacts.map((contact) => (
                <option key={contact.id} value={contact.id}>
                  {contact.name}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-end">
            <Button className="w-full" type="submit">
              <Plus className="h-4 w-4" />
              {t.projects.saveProject}
            </Button>
          </div>
        </form>
      </CollapseCard>
    </AppShell>
  );
}
