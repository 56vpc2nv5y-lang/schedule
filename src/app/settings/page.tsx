import {
  DatabaseBackup,
  FileType2,
  KeyRound,
  ListChecks,
  Sparkles,
  Tags,
  UsersRound,
  X,
} from "lucide-react";
import {
  addStageTemplateItemAction,
  createContactRoleAction,
  createFileTypeAction,
  createTagAction,
  deleteContactRoleAction,
  deleteFileTypeAction,
  deleteStageTemplateItemAction,
  deleteTagAction,
  importDataAction,
  initializeDefaultsAction,
  renameStageTemplateItemAction,
  saveDeepseekKeyAction,
} from "@/app/actions";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isDatabaseConfigured } from "@/lib/db-status";
import { isAiConfigured } from "@/lib/ai";
import { getT } from "@/lib/locale";
import {
  contactRoles,
  defaultStageTemplate,
  fileTypes,
  regions,
  taskTypes,
} from "@/lib/default-data";
import {
  getContactRolesForView,
  getFileTypesForView,
  getStageTemplateItemsForView,
  getTagsForView,
} from "@/lib/database-data";

export const dynamic = "force-dynamic";

const tagGroups = [
  { type: "REGION", label: "地区标签", seed: regions },
  { type: "TASK_TYPE", label: "任务类型", seed: taskTypes },
  { type: "PROJECT_TYPE", label: "项目类型", seed: ["标准项目", "接待/展会专项"] },
] as const;

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{
    setup?: string;
    created?: string;
    saved?: string;
    imported?: string;
    error?: string;
  }>;
}) {
  const { setup, created, saved, imported, error } = await searchParams;
  const dbReady = isDatabaseConfigured();
  const [{ t }, aiReady, tags, dbFileTypes, dbRoles, stageItems] =
    await Promise.all([
      getT(),
      isAiConfigured(),
      getTagsForView(),
      getFileTypesForView(),
      getContactRolesForView(),
      getStageTemplateItemsForView(),
    ]);

  const tagsByType = (type: string) => tags.filter((tag) => tag.type === type);
  const templateItems = dbReady
    ? stageItems.map((it) => ({ id: it.id, name: it.name }))
    : defaultStageTemplate.items.map((it) => ({ id: "", name: it.name }));

  return (
    <AppShell>
      <PageHeader
        eyebrow={t.settings.eyebrow}
        title={t.settings.title}
        description={t.settings.desc}
      />

      {setup === "database-required" ? (
        <Banner tone="warn">{t.common.demoMode}</Banner>
      ) : null}
      {created === "defaults" ? <Banner tone="ok">{t.common.saved}</Banner> : null}
      {saved ? <Banner tone="ok">{t.common.saved}</Banner> : null}
      {imported ? (
        <Banner tone="ok">
          {t.common.saved} (+{imported})
        </Banner>
      ) : null}
      {error ? <Banner tone="warn">{t.common.required}</Banner> : null}

      {/* 常用配置：密码 / AI，放最前面 */}
      <div className="mb-5 grid gap-5 lg:grid-cols-2">
        <SettingCard
          icon={<KeyRound className="h-4 w-4 text-primary" />}
          title={t.settings.security}
          description={t.settings.securityHint}
        >
          <div className="flex flex-wrap items-center gap-3">
            <Badge tone="done">自动进入</Badge>
            <p className="text-sm text-muted-foreground">
              个人设备模式已启用，内置口令 <code>sunny</code>，无需再次登录。
            </p>
          </div>
        </SettingCard>

        <SettingCard
          id="ai"
          icon={<Sparkles className="h-4 w-4 text-primary" />}
          title={t.settings.aiCard}
          description={t.settings.aiHint}
        >
          <div className="mb-2">
            <Badge tone={aiReady ? "done" : "waiting"}>
              {aiReady ? t.settings.aiConfigured : t.settings.aiNotConfigured}
            </Badge>
          </div>
          {dbReady ? (
            <form action={saveDeepseekKeyAction} className="flex gap-2">
              <input
                type="password"
                name="key"
                placeholder={t.settings.aiKeyPh}
                className="field"
                autoComplete="off"
              />
              <Button type="submit" size="sm" className="h-9 shrink-0">
                {t.settings.saveKey}
              </Button>
            </form>
          ) : (
            <p className="text-xs leading-5 text-muted-foreground">
              {t.settings.securityNeedDb}
            </p>
          )}
        </SettingCard>
      </div>

      <Card className="mb-5">
        <CardHeader className="border-b border-border">
          <CardTitle>{t.settings.dbCard}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Badge tone={dbReady ? "done" : "waiting"}>
              {dbReady ? t.common.dbConnected : t.common.demoModeShort}
            </Badge>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {t.settings.dbHint}
            </p>
          </div>
          <form action={initializeDefaultsAction}>
            <Button type="submit">{t.settings.initDefaults}</Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Card>
          <CardHeader className="border-b border-border">
            <CardTitle className="flex items-center gap-2">
              <ListChecks className="h-4 w-4 text-primary" />
              {t.settings.stageTemplate}
            </CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              {t.settings.stageTemplateHint}
            </p>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-2">
              {templateItems.map((item, index) => (
                <div
                  key={item.id || index}
                  className="flex items-center gap-3 rounded-lg border border-border p-2.5"
                >
                  <span className="tnum flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-secondary text-xs font-semibold">
                    {index + 1}
                  </span>
                  {dbReady && item.id ? (
                    <>
                      <form
                        action={renameStageTemplateItemAction}
                        className="flex flex-1 items-center gap-2"
                      >
                        <input type="hidden" name="id" value={item.id} />
                        <input
                          name="name"
                          defaultValue={item.name}
                          className="field field-sm flex-1"
                        />
                        <Button type="submit" size="sm" variant="outline" className="h-8">
                          {t.settings.rename}
                        </Button>
                      </form>
                      <form action={deleteStageTemplateItemAction}>
                        <input type="hidden" name="id" value={item.id} />
                        <Button
                          type="submit"
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-muted-foreground"
                          title={t.common.delete}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </form>
                    </>
                  ) : (
                    <span className="flex-1 text-sm font-medium">{item.name}</span>
                  )}
                </div>
              ))}
            </div>
            {dbReady ? (
              <form action={addStageTemplateItemAction} className="mt-3 flex gap-2">
                <input name="name" placeholder={t.settings.addStage} className="field" />
                <Button type="submit" className="shrink-0">
                  {t.settings.addStage}
                </Button>
              </form>
            ) : null}
          </CardContent>
        </Card>

        <div className="space-y-5">
          <SettingCard
            icon={<Tags className="h-4 w-4 text-primary" />}
            title={t.settings.tags}
            description={t.settings.tagsHint}
          >
            {tagGroups.map((group) => (
              <div key={group.type} className="mb-3 last:mb-0">
                <div className="mb-2 text-xs font-medium text-muted-foreground">
                  {group.label}
                </div>
                <div className="flex flex-wrap gap-2">
                  {(dbReady
                    ? tagsByType(group.type)
                    : group.seed.map((name) => ({ id: "", name }))
                  ).map((tag, i) => (
                    <span
                      key={tag.id || `${group.type}-${i}`}
                      className="inline-flex items-center gap-1 rounded-md border border-border bg-secondary/60 px-2 py-1 text-xs"
                    >
                      {tag.name}
                      {dbReady && tag.id ? (
                        <form action={deleteTagAction}>
                          <input type="hidden" name="id" value={tag.id} />
                          <button
                            type="submit"
                            className="text-muted-foreground hover:text-red-600"
                            title={t.common.delete}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </form>
                      ) : null}
                    </span>
                  ))}
                </div>
                {dbReady ? (
                  <form action={createTagAction} className="mt-2 flex gap-2">
                    <input type="hidden" name="type" value={group.type} />
                    <input
                      name="name"
                      placeholder={group.label}
                      className="field field-sm flex-1"
                    />
                    <Button type="submit" size="sm" variant="outline" className="h-8">
                      {t.common.add}
                    </Button>
                  </form>
                ) : null}
              </div>
            ))}
          </SettingCard>

          <SettingCard
            icon={<UsersRound className="h-4 w-4 text-primary" />}
            title={t.settings.roles}
            description={t.settings.rolesHint}
          >
            <ChipCrud
              items={dbReady ? dbRoles : contactRoles.map((name) => ({ id: "", name }))}
              dbReady={dbReady}
              addAction={createContactRoleAction}
              deleteAction={deleteContactRoleAction}
              placeholder={t.settings.roles}
              addLabel={t.common.add}
              deleteLabel={t.common.delete}
            />
          </SettingCard>

          <SettingCard
            icon={<FileType2 className="h-4 w-4 text-primary" />}
            title={t.settings.fileTypes}
            description={t.settings.fileTypesHint}
          >
            <ChipCrud
              items={dbReady ? dbFileTypes : fileTypes.map((name) => ({ id: "", name }))}
              dbReady={dbReady}
              addAction={createFileTypeAction}
              deleteAction={deleteFileTypeAction}
              placeholder={t.settings.fileTypes}
              addLabel={t.common.add}
              deleteLabel={t.common.delete}
            />
          </SettingCard>

          <SettingCard
            icon={<DatabaseBackup className="h-4 w-4 text-primary" />}
            title={t.settings.backup}
            description={t.settings.backupHint}
          >
            <div className="grid grid-cols-2 gap-2">
              <a href="/api/export">
                <Button variant="outline" size="sm" className="w-full">
                  {t.settings.exportJson}
                </Button>
              </a>
            </div>
            <form
              action={importDataAction}
              className="mt-3 space-y-2 rounded-lg border border-border bg-secondary/30 p-3"
            >
              <div className="text-xs font-medium text-muted-foreground">
                {t.settings.import}
              </div>
              <input
                type="file"
                name="file"
                accept="application/json,.json"
                className="w-full text-xs file:mr-2 file:rounded file:border-0 file:bg-secondary file:px-2 file:py-1 file:text-xs"
              />
              <Button type="submit" size="sm" variant="outline" disabled={!dbReady}>
                {t.settings.import}
              </Button>
              <p className="text-xs leading-5 text-muted-foreground">
                {t.settings.importHint}
              </p>
            </form>
          </SettingCard>
        </div>
      </div>
    </AppShell>
  );
}

function ChipCrud({
  items,
  dbReady,
  addAction,
  deleteAction,
  placeholder,
  addLabel,
  deleteLabel,
}: {
  items: { id: string; name: string }[];
  dbReady: boolean;
  addAction: (formData: FormData) => void | Promise<void>;
  deleteAction: (formData: FormData) => void | Promise<void>;
  placeholder: string;
  addLabel: string;
  deleteLabel: string;
}) {
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {items.map((item, i) => (
          <span
            key={item.id || i}
            className="inline-flex items-center gap-1 rounded-md border border-border bg-secondary/60 px-2 py-1 text-xs"
          >
            {item.name}
            {dbReady && item.id ? (
              <form action={deleteAction}>
                <input type="hidden" name="id" value={item.id} />
                <button
                  type="submit"
                  className="text-muted-foreground hover:text-red-600"
                  title={deleteLabel}
                >
                  <X className="h-3 w-3" />
                </button>
              </form>
            ) : null}
          </span>
        ))}
      </div>
      {dbReady ? (
        <form action={addAction} className="mt-2 flex gap-2">
          <input name="name" placeholder={placeholder} className="field field-sm flex-1" />
          <Button type="submit" size="sm" variant="outline" className="h-8">
            {addLabel}
          </Button>
        </form>
      ) : null}
    </div>
  );
}

function SettingCard({
  id,
  icon,
  title,
  description,
  children,
}: {
  id?: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card id={id} className="scroll-mt-20">
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

function Banner({
  tone,
  children,
}: {
  tone: "ok" | "warn";
  children: React.ReactNode;
}) {
  return (
    <div
      className={
        tone === "ok"
          ? "mb-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900"
          : "mb-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900"
      }
    >
      {children}
    </div>
  );
}
