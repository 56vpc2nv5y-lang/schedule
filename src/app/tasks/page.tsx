import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import {
  createTaskAction,
  createWorkflowTasksAction,
  deleteTaskAction,
} from "@/app/actions";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CollapseCard } from "@/components/ui/collapse-card";
import { TaskStatusPill } from "@/components/ui/status-pill";
import { taskTypes, workflowTemplates } from "@/lib/default-data";
import { getT } from "@/lib/locale";
import { projectDisplayName } from "@/lib/i18n";
import { getTaskPageData } from "@/lib/database-data";
import { cn } from "@/lib/utils";
import { StatusSelect } from "./status-select";
import { TaskEditButton } from "./task-edit";

const PRIORITY_META: Record<
  string,
  { tone: "risk" | "waiting" | "info" | "neutral"; bar: string; weight: number }
> = {
  URGENT: { tone: "risk", bar: "var(--status-danger)", weight: 3 },
  HIGH: { tone: "waiting", bar: "var(--status-wait)", weight: 2 },
  MEDIUM: { tone: "info", bar: "var(--status-active)", weight: 1 },
  LOW: { tone: "neutral", bar: "var(--ink-faint)", weight: 0 },
};

function sourceMeta(source: string) {
  if (source === "RECEPTION_CHECKLIST") return { label: "接待清单", tone: "waiting" as const };
  if (source === "FEEDBACK_FOLLOW_UP") return { label: "来自纪要", tone: "risk" as const };
  if (source === "MANUAL") return { label: "手动新建", tone: "neutral" as const };
  return { label: "项目阶段", tone: "info" as const };
}

function nonProjectScope(type: string) {
  if (/行政|报销|入职|财务/.test(type)) return "行政事务";
  if (/接待|展会/.test(type)) return "接待协作";
  if (/内部|汇报|团队/.test(type)) return "内部工作";
  return "个人/行政事务";
}

export const dynamic = "force-dynamic";

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{
    setup?: string;
    created?: string;
    error?: string;
    filter?: string;
    new?: string;
    updated?: string;
  }>;
}) {
  const [
    { setup, created, error, filter = "open", new: openForm, updated },
    { locale, t },
    taskPageData,
  ] = await Promise.all([searchParams, getT(), getTaskPageData()]);
  const { projects, tasks, contacts } = taskPageData;
  const projectMap = new Map(projects.map((project) => [project.id, project]));
  const contactMap = new Map(contacts.map((contact) => [contact.id, contact]));
  const pname = (p: { nameZh: string; nameEn?: string }) => projectDisplayName(locale, p);

  const statusOptions = (["TODO", "IN_PROGRESS", "WAITING", "DONE", "OVERDUE"] as const).map((value) => ({
    value,
    label: t.statuses.task[value],
  }));
  const priorityOptions = (["LOW", "MEDIUM", "HIGH", "URGENT"] as const).map((value) => ({
    value,
    label: t.statuses.priority[value],
  }));

  const filters = [
    { key: "open", label: "项目待办" },
    { key: "personal", label: "个人/行政" },
    { key: "training", label: "培训清单" },
    { key: "reception", label: "接待清单" },
    { key: "minutes", label: "来自纪要" },
    { key: "overdue", label: t.tasks.fOverdue },
    { key: "done", label: t.tasks.fDone },
    { key: "all", label: t.tasks.fAll },
  ];

  const visibleTasks = tasks
    .filter((task) => {
      const project = task.projectId ? projectMap.get(task.projectId) : undefined;
      switch (filter) {
        case "personal":
          return !task.projectId && task.status !== "DONE";
        case "training":
          return task.source === "TRAINING_CHECKLIST";
        case "reception":
          return task.source === "RECEPTION_CHECKLIST";
        case "minutes":
          return task.source === "FEEDBACK_FOLLOW_UP";
        case "overdue":
          return task.status === "OVERDUE";
        case "done":
          return task.status === "DONE";
        case "all":
          return true;
        default:
          return Boolean(task.projectId) && task.status !== "DONE" && task.status !== "WAITING" && project?.status !== "COMPLETED" && project?.status !== "CANCELLED";
      }
    })
    .sort((a, b) => {
      const pa = PRIORITY_META[a.priority]?.weight ?? 1;
      const pb = PRIORITY_META[b.priority]?.weight ?? 1;
      if (pa !== pb) return pb - pa;
      return (a.dueDate || "9999").localeCompare(b.dueDate || "9999");
    });

  const formOpen = openForm === "1" || Boolean(created) || Boolean(error);
  const projectOpenCount = tasks.filter((task) => Boolean(task.projectId) && task.status !== "DONE" && task.status !== "WAITING").length;
  const nonProjectCount = tasks.filter((task) => !task.projectId && task.status !== "DONE").length;
  const sourceCounts = {
    project: tasks.filter((task) => task.source === "PROJECT_STAGE" || task.source === "TRAINING_CHECKLIST").length,
    reception: tasks.filter((task) => task.source === "RECEPTION_CHECKLIST").length,
    minutes: tasks.filter((task) => task.source === "FEEDBACK_FOLLOW_UP").length,
    manual: tasks.filter((task) => task.source === "MANUAL").length,
  };

  return (
    <AppShell>
      <div className="sunny-page">
        <div className="sunny-page-head flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="page-eyebrow text-xs text-muted-foreground">Task Registry</div>
            <h1 className="page-title mt-2">任务列表</h1>
            <p className="page-description mt-2 text-sm leading-6">
              项目待办 {projectOpenCount} 项；个人 / 行政 {nonProjectCount} 项。每一行都标明任务来源。
            </p>
          </div>
          <Link href="/tasks?new=1#new">
            <Button>
              <Plus className="h-4 w-4" />
              {t.tasks.newTask}
            </Button>
          </Link>
        </div>

        {setup === "database-required" ? <Banner tone="warn">{t.common.demoMode}</Banner> : null}
        {created === "task" ? <Banner tone="ok">{t.tasks.savedTask}</Banner> : null}
        {created?.startsWith("workflow-") ? <Banner tone="ok">{t.workflow.generated(Number(created.slice("workflow-".length)) || 0)}</Banner> : null}
        {updated === "training-checklist" ? <Banner tone="ok">培训清单已更新。</Banner> : null}
        {error === "missing-required" ? <Banner tone="err">{t.common.required}</Banner> : null}

        <div className="mb-5 grid gap-3 md:grid-cols-4">
          <MiniStat label="项目阶段" value={sourceCounts.project} />
          <MiniStat label="接待清单" value={sourceCounts.reception} />
          <MiniStat label="来自纪要" value={sourceCounts.minutes} />
          <MiniStat label="手动新建" value={sourceCounts.manual} />
        </div>

        <Card>
          <CardHeader className="border-b border-border">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle>{t.tasks.listTitle}</CardTitle>
              <div className="flex flex-wrap gap-1.5">
                {filters.map((item) => (
                  <Link
                    key={item.key}
                    href={`/tasks?filter=${item.key}`}
                    className={cn(
                      "chip",
                      filter === item.key && "border-primary text-primary",
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {visibleTasks.length === 0 ? (
              <div className="rounded border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
                {t.tasks.emptyFilter}
              </div>
            ) : (
              <div className="space-y-3">
                {visibleTasks.map((task) => {
                  const project = task.projectId ? projectMap.get(task.projectId) : undefined;
                  const sourceBacked = task.source !== "MANUAL";
                  const assignee = contactMap.get(task.assigneeId);
                  const pmeta = PRIORITY_META[task.priority] ?? PRIORITY_META.MEDIUM;
                  const smeta = sourceMeta(task.source);

                  return (
                    <article key={task.id} className="task-row-card grid gap-4 md:grid-cols-[8px_minmax(0,1fr)_220px]">
                      <span className="h-full rounded-full" style={{ background: pmeta.bar }} aria-hidden />
                      <div className="min-w-0">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <Badge tone={pmeta.tone}>{t.statuses.priority[task.priority as keyof typeof t.statuses.priority] ?? task.priority}</Badge>
                          <Badge tone={smeta.tone}>{smeta.label}</Badge>
                          {project ? <span className="chip">{pname(project)}</span> : <span className="chip">{nonProjectScope(task.type)}</span>}
                          {task.dueDate ? <span className="chip">{task.dueDate}</span> : null}
                        </div>
                        {sourceBacked ? (
                          project ? (
                            <Link href={`/projects/${project.id}`} className="sunny-title text-base hover:text-primary hover:underline">
                              {task.title}
                            </Link>
                          ) : (
                            <div className="sunny-title text-base">{task.title}</div>
                          )
                        ) : (
                          <TaskEditButton
                            trigger="title"
                            task={task}
                            projects={projects.map((project) => ({ id: project.id, name: pname(project) }))}
                            contacts={contacts}
                            taskTypes={taskTypes}
                          />
                        )}
                        {task.description ? <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground">{task.description}</p> : null}
                        <div className="mt-2 text-xs text-muted-foreground">
                          来源：{smeta.label}{task.sourceLabel ? ` / ${task.sourceLabel}` : ""}
                          {assignee ? ` / 负责人：${assignee.name}` : ""}
                        </div>
                      </div>
                      <div className="flex flex-col items-start gap-2 md:items-end">
                        <TaskStatusPill status={task.status} />
                        <div className="flex items-center gap-1.5">
                          <StatusSelect taskId={task.id} value={task.status} options={statusOptions} />
                          {!sourceBacked ? (
                            <form action={deleteTaskAction}>
                              <input type="hidden" name="taskId" value={task.id} />
                              <Button variant="ghost" size="icon" type="submit" className="h-8 w-8" title={t.tasks.deleteTask}>
                                <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                              </Button>
                            </form>
                          ) : null}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <CollapseCard className="mt-5" id="workflow" title={t.workflow.title} hint={t.workflow.hint} open={created?.startsWith("workflow-") ?? false}>
          <form action={createWorkflowTasksAction} className="grid gap-4 lg:grid-cols-4">
            <label>
              <span className="flabel">{t.workflow.fWorkflow}</span>
              <select name="workflow" className="field">
                {workflowTemplates.map((tpl) => (
                  <option key={tpl.key} value={tpl.key}>{tpl.name}（{tpl.items.length}）</option>
                ))}
              </select>
            </label>
            <label>
              <span className="flabel">{t.workflow.fBase}</span>
              <input type="date" name="baseDate" className="field" />
            </label>
            <label>
              <span className="flabel">{t.workflow.fProject}</span>
              <select name="projectId" className="field">
                <option value="">{t.common.noProject}</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>{pname(project)}</option>
                ))}
              </select>
            </label>
            <div className="flex items-end">
              <Button className="w-full" type="submit">
                <Plus className="h-4 w-4" />
                {t.workflow.generate}
              </Button>
            </div>
          </form>
        </CollapseCard>

        <CollapseCard className="mt-5" title={t.tasks.newTask} hint={t.tasks.formHint} open={formOpen}>
          <form action={createTaskAction} className="grid gap-4 lg:grid-cols-6">
            <label className="lg:col-span-2">
              <span className="flabel">{t.tasks.fTitle}</span>
              <input name="title" placeholder={t.tasks.fTitlePh} className="field" />
            </label>
            <label className="lg:col-span-2">
              <span className="flabel">{t.tasks.fProject}</span>
              <select name="projectId" className="field">
                <option value="">{t.common.noProject}</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>{pname(project)}</option>
                ))}
              </select>
            </label>
            <label>
              <span className="flabel">{t.tasks.fType}</span>
              <select name="type" className="field">
                {taskTypes.map((type) => <option key={type}>{type}</option>)}
              </select>
            </label>
            <label>
              <span className="flabel">{t.tasks.fPriority}</span>
              <select name="priority" defaultValue="MEDIUM" className="field">
                {priorityOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            <label>
              <span className="flabel">{t.tasks.fDue}</span>
              <input type="date" name="dueDate" className="field" />
            </label>
            <label className="lg:col-span-2">
              <span className="flabel">{t.tasks.fAssignee}</span>
              <select name="assigneeId" className="field">
                <option value="">{t.common.notSelected}</option>
                {contacts.map((contact) => <option key={contact.id} value={contact.id}>{contact.name} / {contact.organization}</option>)}
              </select>
            </label>
            <label className="lg:col-span-6">
              <span className="flabel">{t.tasks.fDescription}</span>
              <textarea name="description" className="field min-h-20 resize-y" placeholder={t.tasks.fDescriptionPh} />
            </label>
            <div className="flex items-end lg:col-start-6">
              <Button className="w-full" type="submit">
                <Plus className="h-4 w-4" />
                {t.tasks.saveTask}
              </Button>
            </div>
          </form>
        </CollapseCard>
      </div>
    </AppShell>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="focus-card border border-border bg-card">
      <strong className="tnum">{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function Banner({ tone, children }: { tone: "ok" | "warn" | "err"; children: React.ReactNode }) {
  return (
    <div className={tone === "err" ? "mb-5 rounded border border-red-200 bg-red-50 p-4 text-sm text-red-900" : "mb-5 rounded border border-border bg-secondary/50 p-4 text-sm"}>
      {children}
    </div>
  );
}
