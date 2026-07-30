import Link from "next/link";
import { Plus } from "lucide-react";
import { createProjectAction } from "@/app/actions";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { CollapseCard } from "@/components/ui/collapse-card";
import { regions, receptionTypeMeta } from "@/lib/default-data";
import { getT } from "@/lib/locale";
import { normalizeTaskStatus } from "@/lib/workflow-meta";
import { projectDisplayName } from "@/lib/i18n";
import {
  getContactsForView,
  getProjectsForView,
  getReceptionsForView,
  getStagesForView,
  getTasksForView,
} from "@/lib/database-data";

export const dynamic = "force-dynamic";

type TabKey = "project" | "training" | "reception" | "expo";
type ProjectItem = Awaited<ReturnType<typeof getProjectsForView>>[number];
type TaskItem = Awaited<ReturnType<typeof getTasksForView>>[number];
type StageItem = Awaited<ReturnType<typeof getStagesForView>>[number];
type ReceptionItem = Awaited<ReturnType<typeof getReceptionsForView>>[number];

const tabs: { key: TabKey; label: string }[] = [
  { key: "project", label: "项目" },
  { key: "training", label: "培训" },
  { key: "reception", label: "接待" },
  { key: "expo", label: "展会" },
];

const statusMeta: Record<string, { label: string; tone: string }> = {
  ACTIVE: { label: "进行中", tone: "active" },
  PAUSED: { label: "暂停", tone: "pause" },
  COMPLETED: { label: "已完成", tone: "done" },
  CANCELLED: { label: "已取消", tone: "neutral" },
  ARCHIVED: { label: "已归档", tone: "neutral" },
  PLANNED: { label: "计划中", tone: "wait" },
  CONFIRMED: { label: "进行中", tone: "active" },
  DONE: { label: "已完成", tone: "done" },
};

const trainFlow = ["大纲", "核算成本", "报价", "合同", "筹备", "暂停复核"];
const restartChecklist = ["来华人员名单是否变更", "培训老师时间是否仍可行", "课件是否需要更新确认"];

function isTrainingProject(project: { type?: string; nameZh: string; nameEn?: string }) {
  const name = `${project.nameZh} ${project.nameEn ?? ""}`;
  return project.type === "培训项目" || /培训|training/i.test(name);
}

function visibleStatus(status: string) {
  return statusMeta[status] ?? { label: status, tone: "neutral" };
}

function stageState(status: string) {
  if (status === "COMPLETED") return "done";
  if (status === "IN_PROGRESS" || status === "DELAYED") return status === "DELAYED" ? "now pause" : "now";
  return "";
}

function sortOpenTasks(tasks: TaskItem[]) {
  return [...tasks]
    .filter((task) => task.status !== "DONE")
    .sort((a, b) => (a.dueDate || "9999-12-31").localeCompare(b.dueDate || "9999-12-31"));
}

function progressTone(done: number, total: number) {
  if (total > 0 && done >= total) return "done";
  if (done === 0) return "danger";
  return "wait";
}

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; new?: string; tab?: string }>;
}) {
  const [{ error, new: openForm, tab }, { locale, t }, projects, tasks, contacts, stages, receptions] =
    await Promise.all([
      searchParams,
      getT(),
      getProjectsForView(),
      getTasksForView(),
      getContactsForView(),
      getStagesForView(),
      getReceptionsForView(),
    ]);

  const activeTab = tabs.some((item) => item.key === tab) ? (tab as TabKey) : "project";
  const pname = (p: { nameZh: string; nameEn?: string }) => projectDisplayName(locale, p);
  const stagesByProject = new Map<string, StageItem[]>();
  for (const stage of stages) {
    const list = stagesByProject.get(stage.projectId) ?? [];
    list.push(stage);
    stagesByProject.set(stage.projectId, list);
  }
  const tasksByProject = new Map<string, TaskItem[]>();
  for (const task of tasks) {
    if (!task.projectId) continue;
    const list = tasksByProject.get(task.projectId) ?? [];
    list.push(task);
    tasksByProject.set(task.projectId, list);
  }

  const standardProjects = projects.filter((project) => project.type === "标准项目" && !isTrainingProject(project));
  const trainingProjects = projects.filter(isTrainingProject);
  const receptionRows = receptions.filter((reception) => reception.type === "VISIT");
  const expoRows = receptions.filter((reception) => reception.type === "BUSINESS_TRIP" || reception.type === "EXHIBITION_INVITE");
  const counts: Record<TabKey, number> = {
    project: standardProjects.length,
    training: trainingProjects.length,
    reception: receptionRows.length,
    expo: expoRows.length,
  };
  return (
    <AppShell>
      <div className="projects-final-wrap">
        <header className="sunny-page-head flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="page-title">手上的项目走到哪一步</h1>
            <p className="page-description mt-2 text-sm">项目 / 培训 / 接待 / 展会，四类各是各的；状态只是图章，不再拿来分组。</p>
          </div>
          <Link href="/projects?new=1#new">
            <Button>
              <Plus className="h-4 w-4" />
              新建
            </Button>
          </Link>
        </header>

        {error === "missing-required" ? <div className="panel mb-4 text-sm text-muted-foreground">{t.projects.requiredErr}</div> : null}

        <nav className="projects-final-tabs" aria-label="项目分类">
          {tabs.map((item, index) => (
            <Link key={item.key} href={"/projects?tab=" + item.key} className={"projects-final-tab " + (activeTab === item.key ? "on" : "")}>
              {item.label}<span className="n">{String(index + 1).padStart(2, "0")}</span><span className="count">{counts[item.key]}</span>
            </Link>
          ))}
        </nav>

        <section className="projects-final-panel">
          {activeTab === "project" ? renderProjectRows(standardProjects, { pname, stagesByProject, tasksByProject }) : null}
          {activeTab === "training" ? renderProjectRows(trainingProjects, { pname, stagesByProject, tasksByProject, training: true }) : null}
          {activeTab === "reception" ? renderReceptionRows(receptionRows) : null}
          {activeTab === "expo" ? renderReceptionRows(expoRows) : null}
          {counts[activeTab] === 0 ? <div className="p-6 text-sm text-muted-foreground">暂无记录。</div> : null}
        </section>

        <CollapseCard className="mt-5" title={t.projects.newProject} hint={t.projects.formHint} open={openForm === "1" || Boolean(error)}>
          <form action={createProjectAction} className="grid gap-4 lg:grid-cols-6">
            <label className="lg:col-span-2"><span className="flabel">{t.projects.fNameZh}</span><input name="nameZh" className="field" /></label>
            <label className="lg:col-span-2"><span className="flabel">{t.projects.fNameEn}</span><input name="nameEn" className="field" /></label>
            <label className="lg:col-span-2"><span className="flabel">{t.projects.fClient}</span><input name="clientName" className="field" /></label>
            <label><span className="flabel">{t.projects.fRegion}</span><select name="region" className="field">{regions.map((region) => <option key={region}>{region}</option>)}</select></label>
            <label><span className="flabel">{t.projects.fType}</span><select name="projectType" className="field"><option>标准项目</option><option>培训项目</option><option>接待/展会专项</option></select></label>
            <label><span className="flabel">{t.projects.fStart}</span><input type="date" name="plannedStart" className="field" /></label>
            <label><span className="flabel">{t.projects.fEnd}</span><input type="date" name="plannedEnd" className="field" /></label>
            <label><span className="flabel">{t.projects.fOwner}</span><select name="ownerId" className="field"><option value="">{t.common.notSelected}</option>{contacts.map((contact) => <option key={contact.id} value={contact.id}>{contact.name}</option>)}</select></label>
            <div className="flex items-end"><Button className="w-full" type="submit"><Plus className="h-4 w-4" />{t.projects.saveProject}</Button></div>
          </form>
        </CollapseCard>
      </div>
    </AppShell>
  );
}

function renderProjectRows(projects: ProjectItem[], context: { pname: (p: { nameZh: string; nameEn?: string }) => string; stagesByProject: Map<string, StageItem[]>; tasksByProject: Map<string, TaskItem[]>; training?: boolean }) {
  return projects.map((project, index) => {
    const status = visibleStatus(project.status);
    const projectStages = (context.stagesByProject.get(project.id) ?? []).sort((a, b) => a.sortOrder - b.sortOrder);
    const projectTasks = context.tasksByProject.get(project.id) ?? [];
    const openTasks = sortOpenTasks(projectTasks);
    const waitingTasks = openTasks.filter((task) => normalizeTaskStatus(task.status) === "WAITING_EXTERNAL" || task.source === "FEEDBACK_FOLLOW_UP");
    const nextTask = openTasks[0];
    return (
      <details key={project.id} className="proj" open={index === 0}>
        <summary>
          <span className="arrow" />
          <div className="proj-summary-main">
            <span className="t">{context.pname(project)}</span><span className="region">{project.region || "未标注地区"}</span>
            <div className="next">下一步：{nextTask?.title ?? (project.status === "PAUSED" ? "暂停中，不催促" : "暂无未完成任务")}</div>
          </div>
          <span className={"stamp " + status.tone}>{status.label}</span>
        </summary>
        <div className="proj-body">
          {context.training ? renderTrainingFlow(project) : renderStageFlow(projectStages)}
          <div className="fields"><span>未完成任务 <b>{openTasks.length}</b></span><span>等待反馈 <b>{waitingTasks.length}</b></span></div>
          <div className={"next-box " + (project.status === "PAUSED" ? "pause" : "")}>下一步：{nextTask?.title ?? (project.status === "PAUSED" ? "暂停中，没有下一步是有意的空白" : "暂无未完成任务")}</div>
        </div>
      </details>
    );
  });
}

function renderStageFlow(stages: StageItem[]) {
  return (
    <div className="flow">
      {stages.map((stage, index) => (
        <span key={stage.id} className="step-wrap inline-flex items-center">
          <span className={"step " + stageState(stage.status)}><span className="label">{stage.name}</span></span>
          {index < stages.length - 1 ? <span className="arrow">→</span> : null}
        </span>
      ))}
    </div>
  );
}

function renderTrainingFlow(project: ProjectItem) {
  const paused = project.status === "PAUSED";
  const currentName = project.currentStageName || "大纲";
  const currentIndex = paused ? trainFlow.length - 1 : Math.max(0, trainFlow.findIndex((name) => currentName.includes(name)));
  return (
    <>
      <div className="flow">
        {trainFlow.map((name, index) => {
          const state = paused ? (index === trainFlow.length - 1 ? "now pause" : "done") : index < currentIndex ? "done" : index === currentIndex ? "now" : "";
          return <span key={name} className="step-wrap inline-flex items-center"><span className={"step " + state}><span className="label">{name}</span></span>{index < trainFlow.length - 1 ? <span className="arrow">→</span> : null}</span>;
        })}
      </div>
      {paused ? <div className="next-box pause">重启前必查：{restartChecklist.join(" / ")}</div> : null}
    </>
  );
}

function renderReceptionRows(receptions: ReceptionItem[]) {
  return receptions.map((reception, index) => {
    const meta = receptionTypeMeta[reception.type as keyof typeof receptionTypeMeta];
    const progress = String(reception.checklistDone) + "/" + String(reception.checklistTotal);
    const status = reception.checklistTotal > 0
      ? { label: progress + " 完成", tone: progressTone(reception.checklistDone, reception.checklistTotal) }
      : visibleStatus(reception.status);
    return (
      <details key={reception.id} className="proj" open={index === 0}>
        <summary>
          <span className="arrow" />
          <div className="proj-summary-main">
            <span className="t">{reception.title}</span><span className="region">{reception.location || meta?.label || "未标注地点"}</span>
            <div className="next">{reception.startAt || "未排期"}{reception.endAt && reception.endAt !== reception.startAt ? " → " + reception.endAt : ""}</div>
          </div>
          <span className={"stamp " + status.tone}>{status.label}</span>
        </summary>
        <div className="proj-body compact">
          <div className="recep-detail">
            <div className="r"><span className="k">类型</span>{meta?.label || reception.type}</div>
            <div className="r"><span className="k">地点</span>{reception.location || "未标注"}</div>
            <div className="r"><span className="k">时间</span>{reception.startAt || "未排期"}{reception.endAt && reception.endAt !== reception.startAt ? " → " + reception.endAt : ""}</div>
            {reception.purpose ? <div className="r"><span className="k">目的</span>{reception.purpose}</div> : null}
          </div>
          <div className="next-box">清单完成度实时读取关联任务：{progress}</div>
        </div>
      </details>
    );
  });
}
