import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { createProjectAction } from "@/app/actions";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDatabaseModeLabel } from "@/lib/db-status";
import { regions } from "@/lib/default-data";
import {
  getContactsForView,
  getProjectsForView,
  getTasksForView,
} from "@/lib/database-data";

export const dynamic = "force-dynamic";

const columns = [
  { label: "进行中", status: "ACTIVE", tone: "active" as const },
  { label: "暂停", status: "PAUSED", tone: "waiting" as const },
  { label: "已完成", status: "COMPLETED", tone: "done" as const },
  { label: "归档", status: "ARCHIVED", tone: "neutral" as const },
];

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ setup?: string; error?: string }>;
}) {
  const [{ setup, error }, projects, tasks, contacts] = await Promise.all([
    searchParams,
    getProjectsForView(),
    getTasksForView(),
    getContactsForView(),
  ]);

  return (
    <AppShell>
      <PageHeader
        eyebrow="项目看板"
        title="按状态推进项目"
        description="项目卡片展示地区、类型、进度和待办数量。后续接入数据库后，拖动或状态变更会写入动态时间线。"
        action={
          <Button>
            <Plus className="h-4 w-4" />
            新建项目
          </Button>
        }
      />

      {setup === "database-required" ? (
        <div className="mb-5 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          现在还没有连接 Supabase，所以新增项目不会保存。先按 README 或 docs 里的步骤创建 Supabase 数据库并填写环境变量。
        </div>
      ) : null}

      {error === "missing-required" ? (
        <div className="mb-5 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          项目名称和甲方名称是必填项。
        </div>
      ) : null}

      <Card className="mb-5">
        <CardHeader className="border-b border-border">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>新建项目</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                {getDatabaseModeLabel()} · 保存后会自动生成默认阶段。
              </p>
            </div>
            <Badge tone="active">Supabase 写入</Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <form action={createProjectAction} className="grid gap-4 lg:grid-cols-6">
            <label className="space-y-2 text-sm lg:col-span-2">
              <span className="text-xs font-medium text-muted-foreground">
                项目名称
              </span>
              <input
                name="nameZh"
                placeholder="例如：新加坡医疗 AI 项目"
                className="h-9 w-full rounded-md border border-input bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </label>
            <label className="space-y-2 text-sm lg:col-span-2">
              <span className="text-xs font-medium text-muted-foreground">
                英文名称
              </span>
              <input
                name="nameEn"
                placeholder="Optional English name"
                className="h-9 w-full rounded-md border border-input bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </label>
            <label className="space-y-2 text-sm lg:col-span-2">
              <span className="text-xs font-medium text-muted-foreground">
                甲方名称
              </span>
              <input
                name="clientName"
                placeholder="客户公司/机构"
                className="h-9 w-full rounded-md border border-input bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="text-xs font-medium text-muted-foreground">
                地区
              </span>
              <select
                name="region"
                className="h-9 w-full rounded-md border border-input bg-white px-3 text-sm"
              >
                {regions.map((region) => (
                  <option key={region}>{region}</option>
                ))}
              </select>
            </label>
            <label className="space-y-2 text-sm">
              <span className="text-xs font-medium text-muted-foreground">
                项目类型
              </span>
              <select
                name="projectType"
                className="h-9 w-full rounded-md border border-input bg-white px-3 text-sm"
              >
                <option>标准项目</option>
                <option>接待/展会专项</option>
              </select>
            </label>
            <label className="space-y-2 text-sm">
              <span className="text-xs font-medium text-muted-foreground">
                计划开始
              </span>
              <input
                type="date"
                name="plannedStart"
                className="h-9 w-full rounded-md border border-input bg-white px-3 text-sm"
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="text-xs font-medium text-muted-foreground">
                计划结束
              </span>
              <input
                type="date"
                name="plannedEnd"
                className="h-9 w-full rounded-md border border-input bg-white px-3 text-sm"
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="text-xs font-medium text-muted-foreground">
                我方负责人
              </span>
              <select
                name="ownerId"
                className="h-9 w-full rounded-md border border-input bg-white px-3 text-sm"
              >
                <option value="">暂不选择</option>
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
                保存项目
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-4">
        {columns.map((column) => {
          const columnProjects = projects.filter(
            (project) => project.status === column.status,
          );

          return (
            <Card key={column.status} className="min-h-[520px]">
              <CardHeader className="border-b border-border">
                <div className="flex items-center justify-between gap-3">
                  <CardTitle>{column.label}</CardTitle>
                  <Badge tone={column.tone}>{columnProjects.length}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-4">
                {columnProjects.map((project) => {
                  const projectTasks = tasks.filter(
                    (task) => task.projectId === project.id,
                  );

                  return (
                    <Link
                      href={`/projects/${project.id}`}
                      key={project.id}
                      className="block rounded-md border border-border bg-white p-4 transition-colors hover:border-primary/40 hover:bg-accent/40"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="line-clamp-2 text-sm font-semibold">
                            {project.nameZh}
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {project.nameEn}
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Badge tone="neutral">{project.region}</Badge>
                        <Badge tone="info">{project.type}</Badge>
                      </div>
                      <div className="mt-4">
                        <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                          <span>生命周期进度</span>
                          <span>{project.progress}%</span>
                        </div>
                        <div className="h-2 rounded-md bg-secondary">
                          <div
                            className="h-2 rounded-md bg-primary"
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                      </div>
                      <div className="mt-3 text-xs text-muted-foreground">
                        {projectTasks.length} 个关联任务
                      </div>
                    </Link>
                  );
                })}
                {columnProjects.length === 0 ? (
                  <div className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                    暂无项目
                  </div>
                ) : null}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </AppShell>
  );
}
