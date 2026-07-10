import Link from "next/link";
import { ExternalLink, FolderOpen, Plus, Star } from "lucide-react";
import {
  createResourceAction,
  deleteResourceAction,
  updateResourceAction,
} from "@/app/actions";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CollapseCard } from "@/components/ui/collapse-card";
import { InlineEdit } from "@/components/ui/inline-edit";
import { resourceCategories } from "@/lib/default-data";
import { getT } from "@/lib/locale";
import type { Dict } from "@/lib/i18n";
import { getResourcesForView } from "@/lib/database-data";

export const dynamic = "force-dynamic";

export default async function ResourcesPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string; error?: string; new?: string }>;
}) {
  const [{ created, error, new: openForm }, { t }, resources] =
    await Promise.all([searchParams, getT(), getResourcesForView()]);

  const important = resources.filter((r) => r.important);
  const byCategory = resourceCategories
    .map((category) => ({
      category,
      items: resources.filter((r) => r.category === category),
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

      {created === "resource" ? (
        <div className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          {t.common.saved}
        </div>
      ) : null}
      {error === "missing-required" ? (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          {t.common.required}
        </div>
      ) : null}

      {important.length > 0 ? (
        <Card className="mb-5">
          <CardHeader className="border-b border-border">
            <CardTitle className="flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-500" />
              {t.resources.frequent}
            </CardTitle>
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
                {group.category}
                <Badge tone="neutral">{group.items.length}</Badge>
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
        <form action={createResourceAction} className="grid gap-4 lg:grid-cols-6">
          <label className="lg:col-span-2">
            <span className="flabel">{t.resources.fName}</span>
            <input name="name" className="field" />
          </label>
          <label>
            <span className="flabel">{t.resources.fCategory}</span>
            <select name="category" className="field" defaultValue="公司模板">
              {resourceCategories.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
          </label>
          <label className="lg:col-span-3">
            <span className="flabel">{t.resources.fUrl}</span>
            <input name="url" placeholder="https://" className="field" />
          </label>
          <label className="lg:col-span-4">
            <span className="flabel">{t.resources.fNote}</span>
            <input name="note" className="field" />
          </label>
          <label className="flex items-center gap-2 self-end text-sm">
            <input type="checkbox" name="important" className="h-4 w-4" />
            <span className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 text-amber-500" />
              {t.resources.fImportant}
            </span>
          </label>
          <div className="flex items-end">
            <Button className="w-full" type="submit">
              <Plus className="h-4 w-4" />
              {t.common.save}
            </Button>
          </div>
        </form>
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
    <div className="rounded-lg border border-border p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-sm font-medium">
            {resource.important ? (
              <Star className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-500" />
            ) : null}
            <span className="truncate">{resource.name}</span>
          </div>
          {resource.note ? (
            <div className="mt-1 text-xs leading-5 text-muted-foreground">
              {resource.note}
            </div>
          ) : null}
          <div className="mt-2 flex items-center gap-2">
            <Badge tone="info">{resource.category}</Badge>
            <span className="tnum font-mono text-xs text-muted-foreground">
              {resource.updatedAt}
            </span>
          </div>
        </div>
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

      <div className="mt-2 flex items-center gap-3 border-t border-border/60 pt-2">
        <InlineEdit label={t.common.edit}>
          <form
            action={updateResourceAction}
            className="grid gap-2 sm:grid-cols-2"
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
                {categories.map((c) => (
                  <option key={c}>{c}</option>
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
        </InlineEdit>
        <form action={deleteResourceAction}>
          <input type="hidden" name="id" value={resource.id} />
          <button
            type="submit"
            className="text-xs font-medium text-muted-foreground hover:text-red-600"
          >
            {t.common.delete}
          </button>
        </form>
      </div>
    </div>
  );
}
