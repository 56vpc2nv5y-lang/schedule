import Link from "next/link";
import { CalendarDays, FilePlus2, Plus, UserPlus } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { TaskStatusPill } from "@/components/ui/status-pill";
import { NewTaskDrawer } from "@/app/tasks/new-task-drawer";
import { getContactsForView, getFeedbackQuestionsForView, getProjectsForView, getReceptionsForView, getTasksForView } from "@/lib/database-data";
import { todayDateKey } from "@/lib/date-time";
import { buildWorkEvents, eventsForDate } from "@/lib/work-calendar";
import { businessKindFromTask, businessKindMeta, issueStatusMeta, normalizeTaskStatus } from "@/lib/workflow-meta";
import { taskTypes } from "@/lib/default-data";

export const dynamic = "force-dynamic";

const focusStatuses = new Set(["NOT_STARTED", "IN_PROGRESS", "SELF_CHECK", "READY_TO_SEND"]);
const waitingStatuses = new Set(["WAITING_EXTERNAL", "LEADER_REVIEW", "READY_TO_SEND"]);

function addDaysIso(iso: string, days: number) {
  const date = new Date(iso + "T12:00:00");
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function formatHeroDate(iso: string) {
  const date = new Date(iso + "T12:00:00");
  return new Intl.DateTimeFormat("zh-CN", { month: "long", day: "numeric", weekday: "long" }).format(date);
}

function dueText(date?: string) {
  if (!date) return "未排期";
  const today = todayDateKey();
  if (date < today) return "已逾期 · " + date;
  if (date === today) return "今天";
  return date;
}

function progress(done: number, total: number) {
  return total === 0 ? 0 : Math.round((done / total) * 100);
}

function priorityClass(priority: string) {
  return priority.toLowerCase();
}

export default async function DashboardPage() {
  const [projects, tasks, receptions, questions, contacts] = await Promise.all([
    getProjectsForView(),
    getTasksForView(),
    getReceptionsForView(),
    getFeedbackQuestionsForView(),
    getContactsForView(),
  ]);

  const today = todayDateKey();
  const soon = addDaysIso(today, 14);
  const projectMap = new Map(projects.map((project) => [project.id, project]));
  const openTasks = tasks.filter((task) => normalizeTaskStatus(task.status) !== "DONE");
  const activeProjects = projects.filter((project) => project.status === "ACTIVE");
  const overdueCount = openTasks.filter((task) => task.dueDate && task.dueDate < today).length;

  const focusTasks = openTasks
    .filter((task) => {
      const status = normalizeTaskStatus(task.status);
      if (!focusStatuses.has(status)) return false;
      if (!task.dueDate) return true;
      return task.dueDate <= soon;
    })
    .sort((a, b) => (a.dueDate || "9999-12-31").localeCompare(b.dueDate || "9999-12-31"))
    .slice(0, 5);

  const waitingTasks = openTasks.filter((task) => waitingStatuses.has(normalizeTaskStatus(task.status)));
  const openQuestions = questions.filter((question) => question.archivedAt === "" && issueStatusMeta(question.status).value !== "SENT_CLIENT");
  const waitingIssues = openQuestions.filter((question) =>
    ["WAITING_SUPPLIER", "LEADER_REVIEW", "TRANSLATION", "TO_CLIENT"].includes(issueStatusMeta(question.status).value),
  );
  const waitingItems = [
    ...waitingTasks.slice(0, 4).map((task) => ({ kind: "task" as const, id: task.id, title: task.title, projectId: task.projectId, status: task.status })),
    ...waitingIssues.slice(0, 4).map((question) => ({ kind: "issue" as const, id: question.id, title: question.question, projectId: question.projectId, status: question.status })),
  ].slice(0, 7);

  const events = buildWorkEvents({ tasks, receptions, projects });
  const todayEvents = eventsForDate(events, today);
  const todayDetail = todayEvents.length ? todayEvents : events.filter((event) => event.start >= today).slice(0, 5);

  const statusBuckets = [
    { label: "待自查", key: "SELF_CHECK" },
    { label: "待 Leader 审核", key: "LEADER_REVIEW" },
    { label: "待外部回复", key: "WAITING_EXTERNAL" },
    { label: "待对外发送", key: "READY_TO_SEND" },
  ].map((bucket) => ({
    ...bucket,
    tasks: openTasks.filter((task) => normalizeTaskStatus(task.status) === bucket.key).slice(0, 2),
  }));

  return (
    <AppShell>
      <div className="os-shell-page dashboard-plain">
        <header className="os-page-head">
          <div>
            <div className="page-eyebrow">Dashboard · {today}</div>
            <h1 className="page-title mt-2">工作台</h1>
            <p className="os-page-sub">先处理今天，再看流程卡点和活跃项目。暂停和远期事项不抢首页空间。</p>
          </div>
          <div className="os-row">
            <NewTaskDrawer projects={projects.map((project) => ({ id: project.id, name: project.nameZh || project.nameEn }))} contacts={contacts} taskTypes={taskTypes} />
            <Link href="/calendar" className="os-link-button"><CalendarDays className="h-4 w-4" />日历</Link>
          </div>
        </header>

        <div className="os-grid12 os-mt">
          <section className="os-card os-s7">
            <div className="os-card-head">
              <div>
                <div className="os-card-title">今日执行清单</div>
                <div className="os-card-sub">按紧急程度和下一步动作排序，只保留现在能推进的事项</div>
              </div>
              <Link href="/tasks" className="os-link-button">任务台账</Link>
            </div>
            <div className="os-card-body">
              {focusTasks.length === 0 ? <div className="empty">今天没有必须推进的任务。</div> : null}
              {focusTasks.map((task) => {
                const project = task.projectId ? projectMap.get(task.projectId) : undefined;
                const kind = businessKindFromTask(task, project);
                const kindMeta = businessKindMeta[kind];
                return (
                  <article key={task.id} className="os-task-item">
                    <div className={`os-priority ${priorityClass(task.priority)} ${kindMeta.calendarClass}`} />
                    <div className="min-w-0">
                      <div className="os-task-title">{task.title}</div>
                      <div className="os-meta">
                        <span className={`os-pill ${kindMeta.calendarClass}`}>{kindMeta.label}</span>
                        <span className="os-pill gray">{dueText(task.dueDate)}</span>
                        {project ? <span className="os-pill gray">{project.nameZh}</span> : <span className="os-pill gray">个人/行政</span>}
                      </div>
                      <div className="os-task-next">下一步：{task.description || task.sourceLabel || "确认负责人、截止时间和下一步动作。"}</div>
                    </div>
                    <TaskStatusPill status={task.status} />
                  </article>
                );
              })}
            </div>
          </section>

          <section className="os-card os-s5">
            <div className="os-card-head">
              <div>
                <div className="os-card-title">今日详情</div>
                <div className="os-card-sub">会议、截止事项和等待节点</div>
              </div>
              <Link href="/calendar" className="os-link-button">打开日历</Link>
            </div>
            <div className="os-card-body">
              {todayDetail.length === 0 ? <div className="empty">今天没有日程或任务节点。</div> : null}
              <div className="os-agenda-group">
                <div className="os-agenda-label">今天需要关注</div>
                {todayDetail.map((event) => {
                  const meta = businessKindMeta[event.kind];
                  return (
                    <Link key={event.id} href={event.href} className="os-agenda-item text-inherit no-underline">
                      <div className="os-small os-muted">{event.start === today ? "今天" : event.start}</div>
                      <div className="os-agenda-line" style={{ background: `var(--os-${event.kind === "expo" ? "orange" : event.kind === "training" ? "purple" : event.kind === "reception" ? "green" : event.kind === "admin" ? "gray" : "blue"})` }} />
                      <div className="min-w-0">
                        <div className="os-agenda-title">{event.title}</div>
                        <div className="os-agenda-note">{meta.label} · {event.projectName || event.tag}</div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        </div>

        <div className="os-grid12 os-mt">
          <section className="os-card os-s8">
            <div className="os-card-head">
              <div>
                <div className="os-card-title">流程卡点</div>
                <div className="os-card-sub">不是堆数字，而是告诉你哪一类动作最容易卡住</div>
              </div>
            </div>
            <div className="os-card-body">
              <div className="os-flow-grid">
                {statusBuckets.map((bucket) => (
                  <div key={bucket.key} className="os-flow-box">
                    <div className="num">{bucket.tasks.length}</div>
                    <div className="label">{bucket.label}</div>
                    <div className="os-flow-list">
                      {bucket.tasks.length ? bucket.tasks.map((task) => <Link key={task.id} href={`/tasks?filter=${bucket.key}`}>{task.title}</Link>) : <span>暂无卡点</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <aside className="os-card os-s4">
            <div className="os-card-head">
              <div>
                <div className="os-card-title">快速新建</div>
                <div className="os-card-sub">从当前工作直接发起下一步</div>
              </div>
            </div>
            <div className="os-card-body">
              <div className="os-quick-grid">
                <Link href="/tasks?new=1" className="os-quick"><b><Plus className="mr-1 inline h-4 w-4" />新建任务</b><span>记录明确下一步</span></Link>
                <Link href="/calendar" className="os-quick"><b><CalendarDays className="mr-1 inline h-4 w-4" />查看日程</b><span>会议、接待或截止</span></Link>
                <Link href="/meeting-reviews?new=1" className="os-quick"><b><FilePlus2 className="mr-1 inline h-4 w-4" />新建问题</b><span>发供应商或专家</span></Link>
                <Link href="/contacts?new=1" className="os-quick"><b><UserPlus className="mr-1 inline h-4 w-4" />新建联系人</b><span>关联项目和跟进</span></Link>
              </div>
            </div>
          </aside>
        </div>

        <section className="os-card os-mt">
          <div className="os-card-head">
            <div>
              <div className="os-card-title">活跃项目推进</div>
              <div className="os-card-sub">只展示最近需要行动的进行中项目</div>
            </div>
            <Link href="/projects" className="os-link-button">进入项目看板</Link>
          </div>
          <div className="os-card-body">
            {activeProjects.slice(0, 5).map((project) => {
              const value = progress(project.completedStageCount, project.totalStageCount);
              return (
                <article key={project.id} className="os-project-line">
                  <div className="min-w-0">
                    <div className="os-strong truncate">{project.nameZh}</div>
                    <div className="os-tiny os-muted">{project.clientName || project.region || "未标注客户"}</div>
                  </div>
                  <span className="os-pill project">{project.currentStageName || "未生成阶段"}</span>
                  <div>
                    <div className="os-task-next mt-0">下一步：查看当前阶段任务，确认是否需要自查、审核或对外发送。</div>
                    <div className="os-progress mt-2"><span style={{ width: `${value}%` }} /></div>
                  </div>
                  <div className="os-small os-muted">{project.plannedEnd || "未排期"}</div>
                </article>
              );
            })}
            {activeProjects.length === 0 ? <div className="empty">暂无进行中的项目。</div> : null}
          </div>
        </section>
      </div>
    </AppShell>
  );
}