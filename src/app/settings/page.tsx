import {
  DatabaseBackup,
  FileType2,
  Languages,
  ListChecks,
  Tags,
  UsersRound,
} from "lucide-react";
import { initializeDefaultsAction } from "@/app/actions";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDatabaseModeLabel } from "@/lib/db-status";
import {
  contactRoles,
  defaultStageTemplate,
  fileTypes,
  regions,
  taskTypes,
} from "@/lib/default-data";

export const dynamic = "force-dynamic";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ setup?: string; created?: string }>;
}) {
  const { setup, created } = await searchParams;

  return (
    <AppShell>
      <PageHeader
        eyebrow="系统设置"
        title="把流程认知做成可配置资产"
        description="阶段模板、标签、角色、文件类型和备份都集中在这里维护，避免把业务流程写死在代码里。"
      />

      {setup === "database-required" ? (
        <div className="mb-5 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          当前还是演示数据模式。创建 Supabase 项目并填写 DATABASE_URL / DIRECT_URL 后，再回来初始化默认配置。
        </div>
      ) : null}

      {created === "defaults" ? (
        <div className="mb-5 rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          默认标签、角色、文件类型和阶段模板已写入数据库。
        </div>
      ) : null}

      <Card className="mb-5">
        <CardHeader className="border-b border-border">
          <CardTitle>Supabase 连接状态</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Badge tone={getDatabaseModeLabel() === "Supabase 已连接" ? "done" : "waiting"}>
              {getDatabaseModeLabel()}
            </Badge>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              连接数据库后，新增联系人、项目、任务会永久保存；未连接时只显示演示数据。
            </p>
          </div>
          <form action={initializeDefaultsAction}>
            <Button type="submit">初始化默认配置</Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Card>
          <CardHeader className="border-b border-border">
            <CardTitle className="flex items-center gap-2">
              <ListChecks className="h-4 w-4 text-primary" />
              阶段模板管理
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-sm font-semibold">
                  {defaultStageTemplate.name}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  默认模板 · 新建项目时一键生成阶段
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  复制模板
                </Button>
                <Button size="sm">新增阶段</Button>
              </div>
            </div>
            <div className="space-y-2">
              {defaultStageTemplate.items.map((item) => (
                <div
                  key={item.sortOrder}
                  className="grid gap-3 rounded-md border border-border p-3 sm:grid-cols-[48px_minmax(0,1fr)_96px]"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-secondary text-sm font-semibold">
                    {item.sortOrder}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{item.name}</div>
                    {item.description ? (
                      <div className="mt-1 text-xs text-muted-foreground">
                        {item.description}
                      </div>
                    ) : null}
                  </div>
                  <div className="flex items-start justify-end gap-2">
                    <Button variant="ghost" size="sm">
                      编辑
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-5">
          <SettingCard
            icon={<Tags className="h-4 w-4 text-primary" />}
            title="标签管理"
            description="地区、项目类型、任务类型"
          >
            <BadgeList title="地区标签" items={regions} />
            <BadgeList title="任务类型" items={taskTypes.slice(0, 6)} />
          </SettingCard>

          <SettingCard
            icon={<UsersRound className="h-4 w-4 text-primary" />}
            title="联系人角色"
            description="联系人可多角色复用"
          >
            <BadgeList title="角色" items={contactRoles} />
          </SettingCard>

          <SettingCard
            icon={<FileType2 className="h-4 w-4 text-primary" />}
            title="文件类型 / 文本模板"
            description="文档类型和邀请函变量模板"
          >
            <BadgeList title="文件类型" items={fileTypes} />
            <div className="mt-3 rounded-md border border-border bg-secondary/50 p-3 font-mono text-xs leading-5 text-muted-foreground">
              Dear {"{{visitor_name}}"}, 欢迎参加 {"{{event_name}}"}。
            </div>
          </SettingCard>

          <SettingCard
            icon={<Languages className="h-4 w-4 text-primary" />}
            title="显示偏好"
            description="中文 / 中英并排"
          >
            <div className="grid grid-cols-2 gap-2">
              <Button size="sm">默认中文</Button>
              <Button variant="outline" size="sm">
                中英并排
              </Button>
            </div>
          </SettingCard>

          <SettingCard
            icon={<DatabaseBackup className="h-4 w-4 text-primary" />}
            title="数据备份"
            description="JSON 导出与导入恢复"
          >
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm">
                导出 JSON
              </Button>
              <Button variant="outline" size="sm">
                导入恢复
              </Button>
            </div>
          </SettingCard>
        </div>
      </div>
    </AppShell>
  );
}

function SettingCard({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
        <p className="text-xs leading-5 text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function BadgeList({ title, items }: { title: string; items: readonly string[] }) {
  return (
    <div>
      <div className="mb-2 text-xs font-medium text-muted-foreground">{title}</div>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <Badge key={item} tone="neutral">
            {item}
          </Badge>
        ))}
      </div>
    </div>
  );
}
