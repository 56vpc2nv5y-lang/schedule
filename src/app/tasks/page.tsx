import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import { createTaskAction, deleteTaskAction } from "@/app/actions";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { CollapseCard } from "@/components/ui/collapse-card";
import { TaskStatusPill } from "@/components/ui/status-pill";
import { taskTypes } from "@/lib/default-data";
import { getT } from "@/lib/locale";
import { projectDisplayName } from "@/lib/i18n";
import { getTaskPageData } from "@/lib/database-data";
import { cn } from "@/lib/utils";
import { StatusSelect } from "./status-select";
import { TaskEditButton } from "./task-edit";

export const dynamic = "force-dynamic";

const priorities = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;
const filterTabs = [
  { key: "open", label: "待处理" },
  { key: "waiting", label: "等回复" },
  { key: "done", label: "已完成" },
  { key: "all", label: "全部" },
];

function sourceMeta(source: string) {
  if (source === "RECEPTION_CHECKLIST") return { label: "接待清单", tone: "wait" };
  if (source === "FEEDBACK_FOLLOW_UP") return { label: "来自纪要", tone: "danger" };
  if (source === "TRAINING_CHECKLIST") return { label: "培训清单", tone: "active" };
  if (source === "PROJECT_STAGE") return { label: "项目阶段", tone: "active" };
  return { label: "手动新建", tone: "neutral" };
}

function scopeText(task: { projectId: string; type: string }, projectName?: string) {
  if (projectName) return projectName;
  if (/行政|报销|财务|入职/.test(task.type)) return "个人/行政";
  return "个人事务";
}

function rank(task: { status: string; dueDate: string }) {
  if (task.status === "DONE") return 9;
  if (task.status === "OVERDUE") return 0;
  if (task.dueDate && task.dueDate < new Date().toISOString().slice(0, 10)) return 0;
  if (task.status === "IN_PROGRESS") return 1;
  if (task.status === "TODO") return 2;
  if (task.status === "WAITING") return 3;
  return 4;
}

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string; error?: string; filter?: string; new?: string; updated?: string }>;
}) {
  const [{ created, error, filter = "open", new: openForm, updated }, { locale, t }, taskPageData] =
    await Promise.all([searchParams, getT(), getTaskPageData()]);
  const { projects, tasks, contacts } = taskPageData;
  const projectMap = new Map(projects.map((project) => [project.id, project]));
  const contactMap = new Map(contacts.map((contact) => [contact.id, contact]));
  const pname = (p: { nameZh: string; nameEn?: string }) => projectDisplayName(locale, p);
  const projectOptions = projects.map((project) => ({ id: project.id, name: pname(project) }));
  const statusOptions = (["TODO", "IN_PROGRESS", "WAITING", "DONE", "OVERDUE"] as const).map((value) => ({ value, label: t.statuses.task[value] }));
  const priorityOptions = priorities.map((value) => ({ value, label: t.statuses.priority[value] }));

  const visibleTasks = tasks
    .filter((task) => {
      if (filter === "waiting") return task.status === "WAITING";
      if (filter === "done") return task.status === "DONE";
      if (filter === "all") return true;
      return task.status !== "DONE";
    })
    .sort((a, b) => {
      const ra = rank(a);
      const rb = rank(b);
      if (ra !== rb) return ra - rb;
      return (a.dueDate || "9999-12-31").localeCompare(b.dueDate || "9999-12-31");
    });
  const formOpen = openForm === "1" || Boolean(created) || Boolean(error);

  return (
    <AppShell>
      <div className="sunny-page">
        <header className="sunny-page-head flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="page-eyebrow text-xs text-muted-foreground">Task Registry</div>
            <h1 className="page-title mt-2">任务列表</h1>
            <p className="page-description mt-2 text-sm leading-6">一件事一行：来源 → 事项 → 截止/负责人 → 状态。优先级只是手动标记，不做自动算法。</p>
          </div>
          <Link href="/tasks?new=1#new"><Button><Plus className="h-4 w-4" />{t.tasks.newTask}</Button></Link>
        </header>

        {created === "task" ? <Banner>{t.tasks.savedTask}</Banner> : null}
        {updated === "training-checklist" ? <Banner>培训清单已更新。</Banner> : null}
        {error === "missing-required" ? <Banner>{t.common.required}</Banner> : null}

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <nav className="tabs" aria-label="任务筛选">
            {filterTabs.map((item) => (
              <Link key={item.key} href={`/tasks?filter=${item.key}`} className={`tab ${filter === item.key ? "on" : ""}`}>{item.label}</Link>
            ))}
          </nav>
          <div className="priority-note">排序：未完成在前，其次按截止日期；高/中/低只表达你手动判断的重要程度。</div>
        </div>

        <section className="task-ledger">
          {visibleTasks.length === 0 ? <div className="p-8 text-center text-sm text-muted-foreground">{t.tasks.emptyFilter}</div> : null}
          {visibleTasks.map((task) => {
            const project = task.projectId ? projectMap.get(task.projectId) : undefined;
            const source = sourceMeta(task.source);
            const assignee = contactMap.get(task.assigneeId);
            const done = task.status === "DONE";
            const titleNode = task.source === "MANUAL" ? (
              <TaskEditButton trigger="title" task={task} projects={projectOptions} contacts={contacts} taskTypes={taskTypes} />
            ) : project ? (
              <Link href="/projects" className="hover:text-primary hover:underline">{task.title}</Link>
            ) : <span>{task.title}</span>;
            return (
              <article key={task.id} className="task-line" data-done={done}>
                <div className="min-w-0">
                  <div className="task-title">{titleNode}</div>
                  {task.description ? <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{task.description}</p> : null}
                  <div className="task-meta">
                    <span className={`stamp ${source.tone}`}>{source.label}</span>
                    <span className="chip">{scopeText(task, project ? pname(project) : undefined)}</span>
                    {task.dueDate ? <span className="chip">{task.dueDate}</span> : null}
                    <span className="chip">{t.statuses.priority[task.priority as keyof typeof t.statuses.priority] ?? task.priority}</span>
                    {assignee ? <span className="chip">{assignee.name}</span> : null}
                  </div>
                </div>
                <div className="task-actions">
                  <TaskStatusPill status={task.status} />
                  <StatusSelect taskId={task.id} value={task.status} options={statusOptions} />
                  {task.source === "MANUAL" ? (
                    <form action={deleteTaskAction}>
                      <input type="hidden" name="taskId" value={task.id} />
                      <Button variant="ghost" size="icon" type="submit" className="h-8 w-8" title={t.tasks.deleteTask}><Trash2 className="h-3.5 w-3.5 text-muted-foreground" /></Button>
                    </form>
                  ) : null}
                </div>
              </article>
            );
          })}
        </section>

        <CollapseCard className="mt-5" title={t.tasks.newTask} hint={t.tasks.formHint} open={formOpen}>
          <form action={createTaskAction} className="grid gap-4 lg:grid-cols-6">
            <label className="lg:col-span-2"><span className="flabel">{t.tasks.fTitle}</span><input name="title" placeholder={t.tasks.fTitlePh} className="field" /></label>
            <label className="lg:col-span-2"><span className="flabel">{t.tasks.fProject}</span><select name="projectId" className="field"><option value="">{t.common.noProject}</option>{projects.map((project) => <option key={project.id} value={project.id}>{pname(project)}</option>)}</select></label>
            <label><span className="flabel">{t.tasks.fType}</span><select name="type" className="field">{taskTypes.map((type) => <option key={type}>{type}</option>)}</select></label>
            <label><span className="flabel">{t.tasks.fPriority}</span><select name="priority" defaultValue="MEDIUM" className="field">{priorityOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
            <label><span className="flabel">{t.tasks.fDue}</span><input type="date" name="dueDate" className="field" /></label>
            <label className="lg:col-span-2"><span className="flabel">{t.tasks.fAssignee}</span><select name="assigneeId" className="field"><option value="">{t.common.notSelected}</option>{contacts.map((contact) => <option key={contact.id} value={contact.id}>{contact.name} / {contact.organization}</option>)}</select></label>
            <label className="lg:col-span-6"><span className="flabel">{t.tasks.fDescription}</span><textarea name="description" className="field min-h-20 resize-y" placeholder={t.tasks.fDescriptionPh} /></label>
            <div className="flex items-end lg:col-start-6"><Button className="w-full" type="submit"><Plus className="h-4 w-4" />{t.tasks.saveTask}</Button></div>
          </form>
        </CollapseCard>
      </div>
    </AppShell>
  );
}

function Banner({ children }: { children: React.ReactNode }) {
  return <div className="panel mb-5 text-sm text-muted-foreground">{children}</div>;
}
