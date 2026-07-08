import Link from "next/link";
import { ArrowRight, Database, GitBranch, Plus, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TaskStatusPill } from "@/components/ui/status-pill";
import { getDatabaseModeLabel } from "@/lib/db-status";
import {
  getContactsForView,
  getProjectsForView,
  getStagesForView,
  getTasksForView,
  getTimelineForView,
} from "@/lib/database-data";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const ganttStart = new Date("2026-04-01").getTime();
const ganttEnd = new Date("2026-12-01").getTime();
const ganttSpan = ganttEnd - ganttStart;

function percent(date: string) {
  return Math.max(
    0,
    Math.min(100, ((new Date(date).getTime() - ganttStart) / ganttSpan) * 100),
  );
}

function stageBarColor(status: string) {
  if (status === "COMPLETED") return "bg-emerald-500";
  if (status === "IN_PROGRESS") return "bg-primary";
  if (status === "DELAYED") return "bg-red-500";
  return "bg-slate-300";
}

export default async function DashboardPage() {
  const [projects, stages, tasks, timelineEvents, contacts] = await Promise.all([
    getProjectsForView(),
    getStagesForView(),
    getTasksForView(),
    getTimelineForView(),
    getContactsForView(),
  ]);
  const contactMap = new Map(contacts.map((contact) => [contact.id, contact]));
  const activeProjects = projects.filter((project) => project.status === "ACTIVE");
  const riskTasks = tasks.filter((task) => task.status === "OVERDUE");
  const waitingTasks = tasks.filter((task) => task.status === "WAITING");

  return (
    <AppShell>
      <PageHeader
        eyebrow="全生命周期甘特总览"
        title="技术合作项目控制台"
        description="从商机、供应商沟通、报价、方案、会议纪要，到合同、交付、验收和售后维护。页面使用种子数据展示结构，数据库 schema 已按引用关系准备。"
        action={
          <>
            <Button variant="outline">
              <GitBranch className="h-4 w-4" />
              Git 就绪
            </Button>
            <Button>
              <Plus className="h-4 w-4" />
              新建项目
            </Button>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "进行中项目", value: activeProjects.length, meta: "跨 3 个地区" },
          { label: "待处理任务", value: tasks.length, meta: `${riskTasks.length} 个逾期` },
          { label: "等待反馈", value: waitingTasks.length, meta: "供应商/甲方回传" },
          { label: "数据模型", value: "ID", meta: "联系人唯一数据源" },
        ].map((item) => (
          <Card key={item.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-muted-foreground">{item.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">{item.value}</div>
              <div className="mt-2 text-xs text-muted-foreground">{item.meta}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-border">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>项目甘特图</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                  用完整阶段模板铺开项目起点到终点，便于发现延期与空档。
                </p>
              </div>
              <div className="flex gap-2">
                <Badge tone="done">已完成</Badge>
                <Badge tone="active">进行中</Badge>
                <Badge tone="risk">延期</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid grid-cols-[220px_minmax(620px,1fr)] overflow-x-auto">
              <div className="border-r border-border bg-secondary/70">
                <div className="h-11 border-b border-border px-4 py-3 text-xs font-medium text-muted-foreground">
                  项目 / 阶段
                </div>
                {projects.map((project) => (
                  <div key={project.id} className="border-b border-border p-4">
                    <Link
                      href={`/projects/${project.id}`}
                      className="line-clamp-1 text-sm font-medium hover:text-primary"
                    >
                      {project.nameZh}
                    </Link>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {project.region} · {project.progress}%
                    </div>
                  </div>
                ))}
              </div>
              <div className="min-w-[720px]">
                <div className="grid h-11 grid-cols-8 border-b border-border bg-secondary/70 text-xs text-muted-foreground">
                  {["4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月"].map(
                    (month) => (
                      <div key={month} className="border-r border-border px-3 py-3">
                        {month}
                      </div>
                    ),
                  )}
                </div>
                <div className="timeline-grid">
                  {projects.map((project) => {
                    const projectStages = stages.filter(
                      (stage) => stage.projectId === project.id,
                    );

                    return (
                      <div
                        key={project.id}
                        className="relative h-[73px] border-b border-border px-3 py-4"
                      >
                        {projectStages.map((stage) => {
                          const left = percent(stage.plannedStart);
                          const width = Math.max(
                            4,
                            percent(stage.plannedEnd) - left,
                          );

                          return (
                            <div
                              key={stage.id}
                              className={cn(
                                "absolute top-5 h-7 rounded-md px-2 py-1 text-[11px] font-medium text-white shadow-sm",
                                stageBarColor(stage.status),
                              )}
                              style={{ left: `${left}%`, width: `${width}%` }}
                              title={stage.name}
                            >
                              <span className="block truncate">{stage.name}</span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>联动提醒</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
                <div className="text-sm font-medium text-amber-900">
                  会议纪要第二轮任务已逾期
                </div>
                <p className="mt-1 text-xs leading-5 text-amber-800">
                  建议确认是否将对应阶段状态标记为已延期，而不是静默自动修改。
                </p>
              </div>
              <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3">
                <div className="text-sm font-medium text-emerald-900">
                  文件定稿后可入库
                </div>
                <p className="mt-1 text-xs leading-5 text-emerald-800">
                  纪要终稿确认时显示确认弹窗，保存为项目文件版本。
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>近期任务</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {tasks.slice(0, 3).map((task) => {
                  const assignee = contactMap.get(task.assigneeId);

                return (
                  <div key={task.id} className="rounded-md border border-border p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="line-clamp-1 text-sm font-medium">
                          {task.title}
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {assignee?.name} · {task.dueDate}
                        </div>
                      </div>
                      <TaskStatusPill status={task.status} />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>部署准备</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <Database className="mt-0.5 h-4 w-4 text-primary" />
                <span>Prisma schema 已支持 Vercel Postgres/Supabase。</span>
              </div>
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 text-primary" />
                <span>{getDatabaseModeLabel()}，预留 APP_PASSWORD。</span>
              </div>
              <Link
                href="/settings"
                className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
              >
                查看设置模块
                <ArrowRight className="h-4 w-4" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="mt-5">
        <CardHeader>
          <CardTitle>项目动态时间线</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 lg:grid-cols-3">
            {timelineEvents.map((event) => (
              <div key={event.id} className="rounded-md border border-border p-3">
                <Badge tone="info">{event.action}</Badge>
                <p className="mt-3 text-sm leading-6">{event.message}</p>
                <div className="mt-2 font-mono text-xs text-muted-foreground">
                  {event.createdAt}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
}
