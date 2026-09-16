import Link from "next/link";
import { ExternalLink, FolderOpen, Plus, Star } from "lucide-react";
import { deleteResourceAction, updateResourceAction } from "@/app/actions";
import { ResourceCreatePanel } from "@/app/resources/resource-create-panel";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CollapseCard } from "@/components/ui/collapse-card";
import { RecordDisclosure } from "@/components/ui/record-disclosure";
import { getResourcesForView } from "@/lib/database-data";
import { resourceCategories } from "@/lib/default-data";
import type { Dict } from "@/lib/i18n";
import { getT } from "@/lib/locale";
import { isStorageConfigured } from "@/lib/storage";

export const dynamic = "force-dynamic";

export default async function ResourcesPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string; error?: string; new?: string }>;
}) {
  const [{ created, error, new: openForm }, { t }, resources] =
    await Promise.all([searchParams, getT(), getResourcesForView()]);
  const storageReady = isStorageConfigured();

  const important = resources.filter((resource) => resource.important);
  const byCategory = resourceCategories
    .map((category) => ({
      category,
      // Important resources are promoted above and should not be rendered twice.
      items: resources.filter(
        (resource) => resource.category === category && !resource.important,
      ),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <AppShell>
      <PageHeader
        eyebrow={t.resources.eyebrow}
        title={t.resources.title}
        description={t.resources.desc}
        action={
          <Link href="/resources?new=1#new">
            <Button>
              <Plus className="h-4 w-4" />
              {t.resources.newResource}
            </Button>
          </Link>
        }
      />

      {created === "resource" || created === "resource-upload" ? (
        <div className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          {t.common.saved}
        </div>
      ) : null}
      {error === "missing-required" ? (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          {t.common.required}
        </div>
      ) : null}
      {error === "file-empty" ? (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          请选择需要上传的文件。
        </div>
      ) : null}
      {error === "file-too-large" ? (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          文件超过 20MB，请压缩后重试或改为登记网盘链接。
        </div>
      ) : null}
      {error === "storage-not-configured" ? (
        <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          文件存储尚未配置，请先到设置页检查 Supabase Storage。
        </div>
      ) : null}
      {error === "upload-failed" ? (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          上传失败。请检查存储桶是否存在、是否允许上传，然后重试。
        </div>
      ) : null}

      {important.length > 0 ? (
        <Card className="mb-5">
          <CardHeader className="border-b border-border">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-4 w-4 text-amber-500" />
                {t.resources.frequent}
              </CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                重要资料集中显示在这里，下方分类不再重复列出。
              </p>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3 pt-4 sm:grid-cols-2">
            {important.map((resource) => (
              <ResourceRow
                key={resource.id}
                resource={resource}
                t={t}
                categories={resourceCategories}
              />
            ))}
          </CardContent>
        </Card>
      ) : null}

      <div className="space-y-5">
        {byCategory.map((group) => (
          <Card key={group.category}>
            <CardHeader className="border-b border-border">
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4 text-primary" />
                <span>{`${group.category} (${group.items.length})`}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 pt-4 sm:grid-cols-2">
              {group.items.map((resource) => (
                <ResourceRow
                  key={resource.id}
                  resource={resource}
                  t={t}
                  categories={resourceCategories}
                />
              ))}
            </CardContent>
          </Card>
        ))}
        {resources.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            {t.resources.empty}
          </div>
        ) : null}
      </div>

      <CollapseCard
        className="mt-5"
        title={t.resources.newResource}
        open={openForm === "1" || Boolean(error)}
      >
        <ResourceCreatePanel
          categories={resourceCategories}
          storageReady={storageReady}
        />
      </CollapseCard>
    </AppShell>
  );
}

function ResourceRow({
  resource,
  t,
  categories,
}: {
  resource: {
    id: string;
    name: string;
    category: string;
    url: string;
    note: string;
    important: boolean;
    updatedAt: string;
  };
  t: Dict;
  categories: string[];
}) {
  return (
    <RecordDisclosure
      ariaLabel={`展开“${resource.name}”的编辑表单`}
      summary={
        <div className="flex min-w-0 items-center gap-2">
          {resource.important ? (
            <Star className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-500" />
          ) : null}
          <span className="min-w-0 flex-1 truncate text-sm font-medium">
            {resource.name}
          </span>
          <Badge tone="info">{resource.category}</Badge>
          <span className="tnum hidden shrink-0 font-mono text-xs text-muted-foreground sm:inline">
            {resource.updatedAt}
          </span>
        </div>
      }
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <p className="text-xs leading-5 text-muted-foreground">
          {resource.note || "暂无备注"}
        </p>
        {resource.url ? (
          <a
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-1 text-sm text-primary hover:underline"
          >
            <ExternalLink className="h-4 w-4" />
            {t.resources.openLink}
          </a>
        ) : (
          <span className="shrink-0 text-xs text-muted-foreground">
            {t.resources.noLink}
          </span>
        )}
      </div>
      <form
        action={updateResourceAction}
        className="grid gap-2 border-t border-border pt-3 sm:grid-cols-2"
      >
        <input type="hidden" name="id" value={resource.id} />
        <label className="sm:col-span-2">
          <span className="flabel">{t.resources.fName}</span>
          <input
            name="name"
            defaultValue={resource.name}
            className="field field-sm"
          />
        </label>
        <label>
          <span className="flabel">{t.resources.fCategory}</span>
          <select
            name="category"
            defaultValue={resource.category}
            className="field field-sm"
          >
            {categories.map((category) => (
              <option key={category}>{category}</option>
            ))}
          </select>
        </label>
        <label>
          <span className="flabel">{t.resources.fUrl}</span>
          <input
            name="url"
            defaultValue={resource.url}
            placeholder="https://"
            className="field field-sm"
          />
        </label>
        <label className="sm:col-span-2">
          <span className="flabel">{t.resources.fNote}</span>
          <input
            name="note"
            defaultValue={resource.note}
            className="field field-sm"
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="important"
            defaultChecked={resource.important}
            className="h-4 w-4"
          />
          {t.resources.fImportant}
        </label>
        <div className="flex items-end justify-end">
          <Button type="submit" size="sm">
            {t.common.save}
          </Button>
        </div>
      </form>
      <form action={deleteResourceAction} className="mt-2">
        <input type="hidden" name="id" value={resource.id} />
        <button
          type="submit"
          className="text-xs font-medium text-muted-foreground hover:text-red-600"
        >
          {t.common.delete}
        </button>
      </form>
    </RecordDisclosure>
  );
}
