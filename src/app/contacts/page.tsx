import { ContactRound, Plus } from "lucide-react";
import { createContactAction } from "@/app/actions";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDatabaseModeLabel } from "@/lib/db-status";
import { contactRoles, regions } from "@/lib/default-data";
import { getContactsForView, getProjectsForView } from "@/lib/database-data";

export const dynamic = "force-dynamic";

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ setup?: string; created?: string; error?: string }>;
}) {
  const [{ setup, created, error }, contacts, projects] = await Promise.all([
    searchParams,
    getContactsForView(),
    getProjectsForView(),
  ]);

  return (
    <AppShell>
      <PageHeader
        eyebrow="联系人库"
        title="Single Source of Truth"
        description="项目、任务、阶段、接待安排里的“人”都引用这里的联系人 ID。更新职位或邮箱后，所有页面显示自然同步。"
        action={
          <Button>
            <Plus className="h-4 w-4" />
            新增联系人
          </Button>
        }
      />

      {setup === "database-required" ? (
        <div className="mb-5 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          还没连接 Supabase，新增联系人不会保存。先创建免费 Supabase 项目并填写 DATABASE_URL / DIRECT_URL。
        </div>
      ) : null}

      {created === "contact" ? (
        <div className="mb-5 rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          联系人已保存到数据库。
        </div>
      ) : null}

      {error === "missing-required" ? (
        <div className="mb-5 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          姓名和单位是必填项。
        </div>
      ) : null}

      <Card className="mb-5">
        <CardHeader className="border-b border-border">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>新增联系人</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                {getDatabaseModeLabel()} · 保存后可被项目、任务和接待安排引用。
              </p>
            </div>
            <Badge tone="active">唯一数据源</Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <form action={createContactAction} className="grid gap-4 lg:grid-cols-6">
            <label className="space-y-2 text-sm">
              <span className="text-xs font-medium text-muted-foreground">姓名</span>
              <input
                name="name"
                placeholder="联系人姓名"
                className="h-9 w-full rounded-md border border-input bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </label>
            <label className="space-y-2 text-sm lg:col-span-2">
              <span className="text-xs font-medium text-muted-foreground">单位</span>
              <input
                name="organization"
                placeholder="公司 / 高校 / 机构"
                className="h-9 w-full rounded-md border border-input bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="text-xs font-medium text-muted-foreground">职位</span>
              <input
                name="title"
                placeholder="职位"
                className="h-9 w-full rounded-md border border-input bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="text-xs font-medium text-muted-foreground">地区</span>
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
              <span className="text-xs font-medium text-muted-foreground">角色</span>
              <select
                name="role"
                className="h-9 w-full rounded-md border border-input bg-white px-3 text-sm"
              >
                {contactRoles.map((role) => (
                  <option key={role}>{role}</option>
                ))}
              </select>
            </label>
            <label className="space-y-2 text-sm lg:col-span-2">
              <span className="text-xs font-medium text-muted-foreground">邮箱</span>
              <input
                name="email"
                placeholder="email@example.com"
                className="h-9 w-full rounded-md border border-input bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </label>
            <label className="space-y-2 text-sm lg:col-span-2">
              <span className="text-xs font-medium text-muted-foreground">微信</span>
              <input
                name="wechat"
                placeholder="微信号，可选"
                className="h-9 w-full rounded-md border border-input bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </label>
            <div className="flex items-end lg:col-span-2">
              <Button className="w-full" type="submit">
                <Plus className="h-4 w-4" />
                保存联系人
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b border-border">
          <CardTitle className="flex items-center gap-2">
            <ContactRound className="h-4 w-4 text-primary" />
            联系人列表
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="border-b border-border bg-secondary/70 text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">姓名</th>
                  <th className="px-4 py-3 font-medium">单位 / 职位</th>
                  <th className="px-4 py-3 font-medium">地区</th>
                  <th className="px-4 py-3 font-medium">邮箱</th>
                  <th className="px-4 py-3 font-medium">角色</th>
                  <th className="px-4 py-3 font-medium">关联项目</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {contacts.map((contact) => {
                  const relatedProjects = projects.filter(
                    (project) =>
                      project.ownerId === contact.id ||
                      (project.clientContactIds as readonly string[]).includes(
                        contact.id,
                      ) ||
                      (project.supplierContactIds as readonly string[]).includes(
                        contact.id,
                      ),
                  );

                  return (
                    <tr key={contact.id}>
                      <td className="px-4 py-4 font-medium">{contact.name}</td>
                      <td className="px-4 py-4">
                        <div>{contact.organization}</div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {contact.title}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-muted-foreground">
                        {contact.region}
                      </td>
                      <td className="px-4 py-4 font-mono text-xs text-muted-foreground">
                        {contact.email || "-"}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {contact.roles.map((role) => (
                            <Badge key={role} tone="neutral">
                              {role}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-muted-foreground">
                        {relatedProjects.length}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
}
