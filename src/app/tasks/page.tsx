import Link from "next/link";
import { Trash2 } from "lucide-react";
import { deleteTaskAction } from "@/app/actions";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { TaskStatusPill } from "@/components/ui/status-pill";
import { taskTypes } from "@/lib/default-data";
import { getTaskPageData } from "@/lib/database-data";
import { businessKindFromTask, businessKindMeta, normalizeTaskStatus, taskStatusOptions } from "@/lib/workflow-meta";
import { StatusSelect } from "./status-select";
import { TaskEditButton } from "./task-edit";
import { NewTaskDrawer } from "./new-task-drawer";

export const dynamic = "force-dynamic";

const priorityLabels: Record<string, string> = { LOW: "低", MEDIUM: "中", HIGH: "高", URGENT: "紧急" };
const businessFilters = [
  { value: "all", label: "全部业务类型" },
  { value: "project", label: "项目" },
  { value: "training", label: "培训" },
  { value: "reception", label: "接待" },
  { value: "expo", label: "展会" },
  { value: "admin", label: "行政" },
];

function sourceMeta(source: string) {
  if (source === "RECEPTION_CHECKLIST") return { label: "接待清单", tone: "green" };
  if (source === "FEEDBACK_FOLLOW_UP") return { label: "来自纪要", tone: "red" };
  if (source === "TRAINING_CHECKLIST") return { label: "培训清单", tone: "purple" };
  if (source === "PROJECT_STAGE") return { label: "项目阶段", tone: "blue" };
  return { label: "手动新建", tone: "gray" };
}

function dueLabel(date: string) {
  if (!date) return "待确认";
  const today = new Date().toISOString().slice(0, 10);
  if (date < today) return "已逾期 · " + date;
  if (date === today) return "今天";
  return date;
}

function rank(task: { status: string; dueDate: string }) {
  const status = normalizeTaskStatus(task.status);
  if (status === "DONE") return 9;
  if (task.dueDate && task.dueDate < new Date().toISOString().slice(0, 10)) return 0;
  if (status === "IN_PROGRESS") return 1;
  if (status === "READY_TO_SEND" || status === "LEADER_REVIEW") return 2;
  if (status === "WAITING_EXTERNAL") return 3;
  if (status === "SELF_CHECK") return 4;
  return 5;
}

function qs(params: Record<string, string | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value && value !== "all") search.set(key, value);
  });
  const value = search.toString();
  return value ? "?" + value : "";
}

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string; error?: string; filter?: string; new?: string; q?: string; type?: string; projectId?: string; updated?: string }>;
}) {
  const [{ created, error, filter = "all", new: openForm, q = "", type = "all", projectId = "", updated }, taskPageData] = await Promise.all([
    searchParams,
    getTaskPageData(),
  ]);
  const { projects, tasks, contacts } = taskPageData;
  const projectMap = new Map(projects.map((project) => [project.id, project]));
  const contactMap = new Map(contacts.map((contact) => [contact.id, contact]));
  const projectOptions = projects.map((project) => ({ id: project.id, name: project.nameZh || project.nameEn }));
  const statusOptions = taskStatusOptions.map((item) => ({ value: item.value, label: item.label }));

  const enriched = tasks.map((task) => {
    const project = task.projectId ? projectMap.get(task.projectId) : undefined;
    const kind = businessKindFromTask(task, project);
    return { task, project, kind };
  });

  const visibleTasks = enriched
    .filter(({ task }) => filter === "all" || normalizeTaskStatus(task.status) === filter)
    .filter(({ kind }) => type === "all" || kind === type)
    .filter(({ task }) => !projectId || task.projectId === projectId)
    .filter(({ task, project }) => {
      const text = `${task.title} ${task.description} ${task.sourceLabel} ${task.type} ${project?.nameZh ?? ""} ${project?.nameEn ?? ""}`.toLowerCase();
      return !q || text.includes(q.toLowerCase());
    })
    .sort((a, b) => {
      const ra = rank(a.task);
      const rb = rank(b.task);
      if (ra !== rb) return ra - rb;
      return (a.task.dueDate || "9999-12-31").localeCompare(b.task.dueDate || "9999-12-31");
    });

  const statusCards = [
    { value: "all", label: "全部", count: tasks.length, hint: "查看所有任务" },
    ...taskStatusOptions.map((status) => ({
      value: status.value,
      label: status.label,
      count: tasks.filter((task) => normalizeTaskStatus(task.status) === status.value).length,
      hint: "点击筛选该状态",
    })),
  ];
  const formOpen = openForm === "1" || Boolean(created) || Boolean(error);

  return (
    <AppShell>
      <div className="os-shell-page tasks-demo-page">
        <header className="os-page-head">
          <div>
            <div className="page-eyebrow">Task Registry</div>
            <h1 className="page-title mt-2">任务台账</h1>
            <p className="os-page-sub">一件事一行：任务、归属、当前状态、截止时间和操作。优先级是手动判断，不做隐藏算法。</p>
          </div>
          <NewTaskDrawer projects={projectOptions} contacts={contacts} taskTypes={taskTypes} openDefault={formOpen} />
        </header>

        {created === "task" ? <Banner>任务已保存。</Banner> : null}
        {updated ? <Banner>状态已更新，必要时可在状态选择器旁点击“撤销”。</Banner> : null}
        {error === "missing-required" ? <Banner tone="danger">标题等必填字段不能为空。</Banner> : null}

        <section className="os-status-board">
          {statusCards.map((card) => (
            <Link
              key={card.value}
              href={`/tasks${qs({ filter: card.value, q, type, projectId })}`}
              className={`os-status-card ${filter === card.value ? "active" : ""}`}
            >
              <div className="num">{card.count}</div>
              <div className="os-small os-strong">{card.label}</div>
              <div className="os-tiny os-muted">{card.hint}</div>
            </Link>
          ))}
        </section>

        <section className="os-card os-mt">
          <div className="os-card-head os-filterbar">
            <form action="/tasks" className="os-filters">
              <input type="hidden" name="filter" value={filter} />
              <label className="os-search">⌕<input name="q" defaultValue={q} placeholder="搜索任务或项目" /></label>
              <select name="type" defaultValue={type} className="os-select">
                {businessFilters.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
              <select name="projectId" defaultValue={projectId} className="os-select">
                <option value="">全部项目</option>
                {projects.map((project) => <option key={project.id} value={project.id}>{project.nameZh || project.nameEn}</option>)}
              </select>
              <Button type="submit" variant="outline" size="sm">筛选</Button>
            </form>
            <Link href="/tasks" className="os-link-button">重置筛选</Link>
          </div>
          <div className="os-card-body p-0">
            <div className="border-b border-border bg-secondary/30 px-4 py-3 text-sm text-muted-foreground">当前显示 {filter === "all" ? "全部" : statusCards.find((card) => card.value === filter)?.label} · {visibleTasks.length} 条任务</div>
            <div className="os-table-wrap">
              <table className="os-table">
                <thead>
                  <tr>
                    <th></th>
                    <th>任务 / 下一步</th>
                    <th>归属</th>
                    <th>当前状态</th>
                    <th>截止时间</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleTasks.map(({ task, project, kind }) => {
                    const source = sourceMeta(task.source);
                    const business = businessKindMeta[kind];
                    const assignee = task.assigneeId ? contactMap.get(task.assigneeId) : undefined;
                    const overdue = task.dueDate && task.dueDate < new Date().toISOString().slice(0, 10) && normalizeTaskStatus(task.status) !== "DONE";
                    return (
                      <tr key={task.id}>
                        <td><span className="os-check">{normalizeTaskStatus(task.status) === "DONE" ? "✓" : ""}</span></td>
                        <td>
                          <div className="os-task-title">
                            {task.source === "MANUAL" ? <TaskEditButton trigger="title" task={task} projects={projectOptions} contacts={contacts} taskTypes={taskTypes} /> : task.title}
                          </div>
                          <div className="os-task-next">{task.description || task.sourceLabel || "下一步待补充"}</div>
                          <div className="os-meta">
                            <span className={`os-pill ${source.tone}`}>{source.label}</span>
                            <span className={`os-pill ${business.calendarClass}`}>{business.label}</span>
                            <span className="os-pill gray">优先级：{priorityLabels[task.priority] ?? task.priority}</span>
                          </div>
                        </td>
                        <td>
                          <div className="os-small os-strong">{project?.nameZh ?? "个人/行政"}</div>
                          <div className="os-tiny os-muted">{assignee ? assignee.name : "未指定负责人"}</div>
                        </td>
                        <td>
                          <div className="os-stack">
                            <TaskStatusPill status={task.status} />
                            <StatusSelect taskId={task.id} value={task.status} options={statusOptions} />
                          </div>
                        </td>
                        <td>
                          <span className={overdue ? "os-overdue" : ""}>{dueLabel(task.dueDate)}</span>
                          {task.waitingOn ? <div className="os-tiny os-muted mt-1">等待：{task.waitingOn}</div> : null}
                          {task.sendChannel ? <div className="os-tiny os-muted mt-1">渠道：{task.sendChannel}</div> : null}
                        </td>
                        <td>
                          <div className="os-actions">
                            {task.source === "MANUAL" ? <TaskEditButton task={task} projects={projectOptions} contacts={contacts} taskTypes={taskTypes} /> : null}
                            {task.source === "MANUAL" ? (
                              <form action={deleteTaskAction}>
                                <input type="hidden" name="taskId" value={task.id} />
                                <Button variant="ghost" size="icon" type="submit" className="h-8 w-8" title="删除任务"><Trash2 className="h-3.5 w-3.5 text-muted-foreground" /></Button>
                              </form>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {visibleTasks.length === 0 ? <div className="empty">没有符合当前条件的任务。</div> : null}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function Banner({ children, tone = "ok" }: { children: React.ReactNode; tone?: "ok" | "danger" }) {
  return <div className={`mb-4 rounded-lg border px-4 py-3 text-sm ${tone === "danger" ? "border-red-200 bg-red-50 text-red-900" : "border-border bg-card text-muted-foreground"}`}>{children}</div>;
}