import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import {
  createTaskAction,
  createWorkflowTasksAction,
  deleteTaskAction,
} from "@/app/actions";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
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

// 优先级：颜色 + 权重（用于排序和左侧色条）
const PRIORITY_META: Record<
  string,
  { tone: "risk" | "waiting" | "info" | "neutral"; bar: string; weight: number }
> = {
  URGENT: { tone: "risk", bar: "bg-red-500", weight: 3 },
  HIGH: { tone: "waiting", bar: "bg-amber-500", weight: 2 },
  MEDIUM: { tone: "info", bar: "bg-blue-400", weight: 1 },
  LOW: { tone: "neutral", bar: "bg-slate-300", weight: 0 },
};

function nonProjectScope(type: string) {
  if (/行政|报销|入职|财务/.test(type)) return "行政事务";
  if (/接待|展会/.test(type)) return "接待协作";
  if (/内部|汇报|团队/.test(type)) return "内部工作";
  return "未关联项目";
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
  }>;
}) {
  const [
    { setup, created, error, filter = "open", new: openForm },
    { locale, t },
    taskPageData,
  ] = await Promise.all([
    searchParams,
    getT(),
    getTaskPageData(),
  ]);
  const { projects, tasks, contacts } = taskPageData;
  const projectMap = new Map(projects.map((project) => [project.id, project]));
  const contactMap = new Map(contacts.map((contact) => [contact.id, contact]));
  const pname = (p: { nameZh: string; nameEn?: string }) =>
    projectDisplayName(locale, p);

  const statusOptions = (
    ["TODO", "IN_PROGRESS", "WAITING", "DONE", "OVERDUE"] as const
  ).map((value) => ({ value, label: t.statuses.task[value] }));
  const priorityOptions = (["LOW", "MEDIUM", "HIGH", "URGENT"] as const).map(
    (value) => ({ value, label: t.statuses.priority[value] }),
  );

  const filters = [
    { key: "open", label: t.tasks.fOpen },
    { key: "personal", label: t.tasks.fPersonal },
    { key: "overdue", label: t.tasks.fOverdue },
    { key: "done", label: t.tasks.fDone },
    { key: "all", label: t.tasks.fAll },
  ];

  const visibleTasks = tasks
    .filter((task) => {
      switch (filter) {
        case "personal":
          return !task.projectId;
        case "overdue":
          return task.status === "OVERDUE";
        case "done":
          return task.status === "DONE";
        case "all":
          return true;
        default:
          return task.status !== "DONE";
      }
    })
    // 高优先级排前面，同级按截止日期
    .sort((a, b) => {
      const pa = PRIORITY_META[a.priority]?.weight ?? 1;
      const pb = PRIORITY_META[b.priority]?.weight ?? 1;
      if (pa !== pb) return pb - pa;
      return (a.dueDate || "9999").localeCompare(b.dueDate || "9999");
    });

  const formOpen = openForm === "1" || Boolean(created) || Boolean(error);
  const openTaskCount = tasks.filter((task) => task.status !== "DONE").length;
  const nonProjectCount = tasks.filter((task) => !task.projectId).length;

  return (
    <AppShell>
      <PageHeader
        eyebrow={t.tasks.workspace}
        title={t.tasks.title}
        description={t.tasks.summary(openTaskCount, nonProjectCount)}
        action={
          <Link href="/tasks?new=1#new">
            <Button>
              <Plus className="h-4 w-4" />
              {t.tasks.newTask}
            </Button>
          </Link>
        }
      />

      {setup === "database-required" ? (
        <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          {t.common.demoMode}
        </div>
      ) : null}
      {created === "task" ? (
        <div className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          {t.tasks.savedTask}
        </div>
      ) : null}
      {created?.startsWith("workflow-") ? (
        <div className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          {t.workflow.generated(Number(created.slice("workflow-".length)) || 0)}
        </div>
      ) : null}
      {error === "missing-required" ? (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          {t.common.required}
        </div>
      ) : null}

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
                    "rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-secondary",
                    filter === item.key &&
                      "border-primary/30 bg-primary/10 font-medium text-primary",
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-border bg-secondary/70 text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">{t.common.priority}</th>
                  <th className="px-4 py-3 font-medium">{t.tasks.colTask}</th>
                  <th className="px-4 py-3 font-medium">{t.tasks.colBelong}</th>
                  <th className="px-4 py-3 font-medium">{t.common.type}</th>
                  <th className="px-4 py-3 font-medium">{t.common.dueDate}</th>
                  <th className="px-4 py-3 font-medium">{t.common.status}</th>
                  <th className="px-4 py-3 font-medium">{t.common.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {visibleTasks.map((task) => {
                  const project = task.projectId
                    ? projectMap.get(task.projectId)
                    : undefined;
                  const assignee = contactMap.get(task.assigneeId);
                  const pmeta = PRIORITY_META[task.priority] ?? PRIORITY_META.MEDIUM;

                  return (
                    <tr
                      key={task.id}
                      className="bg-card transition-colors hover:bg-secondary/40"
                    >
                      <td className="py-3 pl-0 pr-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn("h-8 w-1 rounded-full", pmeta.bar)}
                            aria-hidden
                          />
                          <Badge tone={pmeta.tone}>
                            {t.statuses.priority[
                              task.priority as keyof typeof t.statuses.priority
                            ] ?? task.priority}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{task.title}</div>
                        {assignee ? (
                          <div className="mt-0.5 text-xs text-muted-foreground">
                            {assignee.name}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        {project ? (
                          <Link
                            href={`/projects/${project.id}`}
                            className="text-muted-foreground hover:text-primary hover:underline"
                          >
                            {pname(project)}
                          </Link>
                        ) : (
                          <Badge tone="neutral">
                            {nonProjectScope(task.type)}
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone="info">{task.type}</Badge>
                      </td>
                      <td className="tnum px-4 py-3 font-mono text-xs text-muted-foreground">
                        {task.dueDate || t.common.none}
                      </td>
                      <td className="px-4 py-3">
                        <TaskStatusPill status={task.status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <StatusSelect
                            taskId={task.id}
                            value={task.status}
                            options={statusOptions}
                          />
                          <TaskEditButton
                            task={task}
                            projects={projects.map((project) => ({
                              id: project.id,
                              name: pname(project),
                            }))}
                            contacts={contacts}
                            taskTypes={taskTypes}
                          />
                          <form action={deleteTaskAction}>
                            <input type="hidden" name="taskId" value={task.id} />
                            <Button
                              variant="ghost"
                              size="icon"
                              type="submit"
                              className="h-8 w-8"
                              title={t.tasks.deleteTask}
                            >
                              <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                            </Button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {visibleTasks.length === 0 ? (
              <div className="p-10 text-center text-sm text-muted-foreground">
                {t.tasks.emptyFilter}
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <CollapseCard
        className="mt-5"
        id="workflow"
        title={t.workflow.title}
        hint={t.workflow.hint}
        open={created?.startsWith("workflow-") ?? false}
      >
        <form
          action={createWorkflowTasksAction}
          className="grid gap-4 lg:grid-cols-4"
        >
          <label>
            <span className="flabel">{t.workflow.fWorkflow}</span>
            <select name="workflow" className="field">
              {workflowTemplates.map((tpl) => (
                <option key={tpl.key} value={tpl.key}>
                  {tpl.name}（{tpl.items.length}）
                </option>
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
                <option key={project.id} value={project.id}>
                  {pname(project)}
                </option>
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

      <CollapseCard
        className="mt-5"
        title={t.tasks.newTask}
        hint={t.tasks.formHint}
        open={formOpen}
      >
        <form action={createTaskAction} className="grid gap-4 lg:grid-cols-6">
          <label className="lg:col-span-2">
            <span className="flabel">{t.tasks.fTitle}</span>
            <input
              name="title"
              placeholder={t.tasks.fTitlePh}
              className="field"
            />
          </label>
          <label className="lg:col-span-2">
            <span className="flabel">{t.tasks.fProject}</span>
            <select name="projectId" className="field">
              <option value="">{t.common.noProject}</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {pname(project)}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="flabel">{t.tasks.fType}</span>
            <select name="type" className="field">
              {taskTypes.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
          </label>
          <label>
            <span className="flabel">{t.tasks.fPriority}</span>
            <select name="priority" defaultValue="MEDIUM" className="field">
              {priorityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
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
              {contacts.map((contact) => (
                <option key={contact.id} value={contact.id}>
                  {contact.name} · {contact.organization}
                </option>
              ))}
            </select>
          </label>
          <label className="lg:col-span-6">
            <span className="flabel">{t.tasks.fDescription}</span>
            <textarea
              name="description"
              className="field min-h-20 resize-y"
              placeholder={t.tasks.fDescriptionPh}
            />
          </label>
          <div className="flex items-end lg:col-start-6">
            <Button className="w-full" type="submit">
              <Plus className="h-4 w-4" />
              {t.tasks.saveTask}
            </Button>
          </div>
        </form>
      </CollapseCard>
    </AppShell>
  );
}
