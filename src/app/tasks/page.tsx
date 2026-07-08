import { Filter, Plus } from "lucide-react";
import { createTaskAction } from "@/app/actions";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TaskStatusPill } from "@/components/ui/status-pill";
import { getDatabaseModeLabel } from "@/lib/db-status";
import { taskTypes } from "@/lib/default-data";
import {
  getContactsForView,
  getProjectsForView,
  getTasksForView,
} from "@/lib/database-data";

export const dynamic = "force-dynamic";

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ setup?: string; created?: string; error?: string }>;
}) {
  const [{ setup, created, error }, projects, tasks, contacts] = await Promise.all([
    searchParams,
    getProjectsForView(),
    getTasksForView(),
    getContactsForView(),
  ]);
  const projectMap = new Map(projects.map((project) => [project.id, project]));
  const contactMap = new Map(contacts.map((contact) => [contact.id, contact]));

  return (
    <AppShell>
      <PageHeader
        eyebrow="任务列表"
        title="事项、联系人与阶段联动"
        description="新建任务时应先选项目，再按该项目已关联的甲方/供应商联系人过滤下拉选项。这里用静态数据展示联动后的结果。"
        action={
          <>
            <Button variant="outline">
              <Filter className="h-4 w-4" />
              筛选
            </Button>
            <Button>
              <Plus className="h-4 w-4" />
              新建任务
            </Button>
          </>
        }
      />

      {setup === "database-required" ? (
        <div className="mb-5 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          还没连接 Supabase，新增任务不会保存。先完成数据库连接后再录入真实任务。
        </div>
      ) : null}

      {created === "task" ? (
        <div className="mb-5 rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          任务已保存到数据库。
        </div>
      ) : null}

      {error === "missing-required" ? (
        <div className="mb-5 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          关联项目和任务标题是必填项。
        </div>
      ) : null}

      <Card className="mb-5">
        <CardHeader className="border-b border-border">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>新增任务</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                {getDatabaseModeLabel()} · 保存后会进入任务列表，并写入项目动态。
              </p>
            </div>
            <Badge tone="active">任务写入</Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <form action={createTaskAction} className="grid gap-4 lg:grid-cols-6">
            <label className="space-y-2 text-sm lg:col-span-2">
              <span className="text-xs font-medium text-muted-foreground">
                关联项目
              </span>
              <select
                name="projectId"
                className="h-9 w-full rounded-md border border-input bg-white px-3 text-sm"
              >
                <option value="">请选择项目</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.nameZh}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2 text-sm lg:col-span-2">
              <span className="text-xs font-medium text-muted-foreground">
                任务标题
              </span>
              <input
                name="title"
                placeholder="例如：确认会议纪要第二轮反馈"
                className="h-9 w-full rounded-md border border-input bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="text-xs font-medium text-muted-foreground">
                任务类型
              </span>
              <select
                name="type"
                className="h-9 w-full rounded-md border border-input bg-white px-3 text-sm"
              >
                {taskTypes.map((type) => (
                  <option key={type}>{type}</option>
                ))}
              </select>
            </label>
            <label className="space-y-2 text-sm">
              <span className="text-xs font-medium text-muted-foreground">
                截止日期
              </span>
              <input
                type="date"
                name="dueDate"
                className="h-9 w-full rounded-md border border-input bg-white px-3 text-sm"
              />
            </label>
            <label className="space-y-2 text-sm lg:col-span-2">
              <span className="text-xs font-medium text-muted-foreground">
                负责人
              </span>
              <select
                name="assigneeId"
                className="h-9 w-full rounded-md border border-input bg-white px-3 text-sm"
              >
                <option value="">暂不选择</option>
                {contacts.map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.name} · {contact.organization}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex items-end">
              <Button className="w-full" type="submit">
                <Plus className="h-4 w-4" />
                保存任务
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b border-border">
          <CardTitle>全部任务</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="border-b border-border bg-secondary/70 text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">任务</th>
                  <th className="px-4 py-3 font-medium">项目</th>
                  <th className="px-4 py-3 font-medium">类型</th>
                  <th className="px-4 py-3 font-medium">负责人</th>
                  <th className="px-4 py-3 font-medium">关联对接人</th>
                  <th className="px-4 py-3 font-medium">截止</th>
                  <th className="px-4 py-3 font-medium">状态</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {tasks.map((task) => {
                  const project = projectMap.get(task.projectId);
                  const assignee = contactMap.get(task.assigneeId);

                  return (
                    <tr key={task.id} className="bg-card">
                      <td className="px-4 py-4 font-medium">{task.title}</td>
                      <td className="px-4 py-4 text-muted-foreground">
                        {project?.nameZh}
                      </td>
                      <td className="px-4 py-4">
                        <Badge tone="info">{task.type}</Badge>
                      </td>
                      <td className="px-4 py-4 text-muted-foreground">
                        {assignee?.name}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {task.contactIds.map((contactId) => {
                            const contact = contactMap.get(contactId);
                            return contact ? (
                              <Badge key={contact.id} tone="neutral">
                                {contact.name}
                              </Badge>
                            ) : null;
                          })}
                        </div>
                      </td>
                      <td className="px-4 py-4 font-mono text-xs text-muted-foreground">
                        {task.dueDate}
                      </td>
                      <td className="px-4 py-4">
                        <TaskStatusPill status={task.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>级联选择示例</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <label className="space-y-2 text-sm">
              <span className="text-xs font-medium text-muted-foreground">
                关联项目
              </span>
              <select className="h-9 w-full rounded-md border border-input bg-white px-3 text-sm">
                {projects.map((project) => (
                  <option key={project.id}>{project.nameZh}</option>
                ))}
              </select>
            </label>
            <label className="space-y-2 text-sm">
              <span className="text-xs font-medium text-muted-foreground">
                甲方对接人
              </span>
              <select className="h-9 w-full rounded-md border border-input bg-white px-3 text-sm">
                <option>Lim Wei</option>
              </select>
            </label>
            <label className="space-y-2 text-sm">
              <span className="text-xs font-medium text-muted-foreground">
                供应商对接人
              </span>
              <select className="h-9 w-full rounded-md border border-input bg-white px-3 text-sm">
                <option>Tan Mei Ling</option>
              </select>
            </label>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>状态联动提醒</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-amber-200 bg-amber-50 p-4">
              <div className="text-sm font-medium text-amber-900">
                某阶段下全部任务完成时
              </div>
              <p className="mt-2 text-sm leading-6 text-amber-800">
                弹出确认：“是否将该阶段状态一并标记为已完成？”用户确认后再写库。
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
