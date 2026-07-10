import Link from "next/link";
import { BookOpenText, ExternalLink, Plus, Trash2 } from "lucide-react";
import {
  createKnowledgeNoteAction,
  deleteKnowledgeNoteAction,
  updateKnowledgeNoteAction,
} from "@/app/actions";
import { InlineEdit } from "@/components/ui/inline-edit";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CollapseCard } from "@/components/ui/collapse-card";
import { knowledgeTopics } from "@/lib/default-data";
import { getT } from "@/lib/locale";
import { projectDisplayName } from "@/lib/i18n";
import {
  getKnowledgeNotesForView,
  getProjectsForView,
} from "@/lib/database-data";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function KnowledgePage({
  searchParams,
}: {
  searchParams: Promise<{
    setup?: string;
    created?: string;
    error?: string;
    new?: string;
    topic?: string;
  }>;
}) {
  const [
    { setup, created, error, new: openForm, topic: activeTopic },
    { locale, t },
    notes,
    projects,
  ] = await Promise.all([
    searchParams,
    getT(),
    getKnowledgeNotesForView(),
    getProjectsForView(),
  ]);
  const projectMap = new Map(projects.map((project) => [project.id, project]));
  const pname = (p: { nameZh: string; nameEn?: string }) =>
    projectDisplayName(locale, p);

  // 主题列表 = 预设主题 + 数据里出现过的主题
  const topics = [
    ...new Set([...knowledgeTopics, ...notes.map((note) => note.topic)]),
  ];
  const visibleNotes = activeTopic
    ? notes.filter((note) => note.topic === activeTopic)
    : notes;

  return (
    <AppShell>
      <PageHeader
        eyebrow={t.knowledge.eyebrow}
        title={t.knowledge.title}
        description={t.knowledge.desc}
        action={
          <Link href="/knowledge?new=1#new">
            <Button>
              <Plus className="h-4 w-4" />
              {t.knowledge.addOne}
            </Button>
          </Link>
        }
      />

      {setup === "database-required" ? (
        <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          {t.common.demoMode}
        </div>
      ) : null}
      {created === "note" ? (
        <div className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          {t.common.saved}
        </div>
      ) : null}
      {error === "missing-required" ? (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          {t.common.required}
        </div>
      ) : null}

      <Card>
        <CardHeader className="border-b border-border">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2">
              <BookOpenText className="h-4 w-4 text-primary" />
              {t.knowledge.eyebrow}
            </CardTitle>
            <div className="flex flex-wrap gap-1.5">
              <Link
                href="/knowledge"
                className={cn(
                  "rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-secondary",
                  !activeTopic &&
                    "border-primary/30 bg-primary/10 font-medium text-primary",
                )}
              >
                {t.knowledge.allTopics}
              </Link>
              {topics.map((topic) => {
                const count = notes.filter((note) => note.topic === topic).length;
                if (count === 0 && !knowledgeTopics.includes(topic)) return null;
                return (
                  <Link
                    key={topic}
                    href={`/knowledge?topic=${encodeURIComponent(topic)}`}
                    className={cn(
                      "rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-secondary",
                      activeTopic === topic &&
                        "border-primary/30 bg-primary/10 font-medium text-primary",
                    )}
                  >
                    {topic}
                    {count ? ` · ${count}` : ""}
                  </Link>
                );
              })}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {visibleNotes.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              {t.knowledge.empty}
            </div>
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {visibleNotes.map((note) => {
                const project = note.projectId
                  ? projectMap.get(note.projectId)
                  : undefined;
                return (
                  <div
                    key={note.id}
                    className="flex flex-col rounded-lg border border-border p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone="info">{note.topic}</Badge>
                        {project ? (
                          <Badge tone="neutral">{pname(project)}</Badge>
                        ) : null}
                      </div>
                      <form action={deleteKnowledgeNoteAction}>
                        <input type="hidden" name="id" value={note.id} />
                        <Button
                          variant="ghost"
                          size="icon"
                          type="submit"
                          className="h-7 w-7"
                          title={t.common.delete}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                      </form>
                    </div>
                    <div className="mt-2 text-sm font-semibold">{note.title}</div>
                    <p className="mt-1 flex-1 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                      {note.content}
                    </p>
                    {note.url ? (
                      <a
                        href={note.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        {t.common.open}
                      </a>
                    ) : null}
                    <div className="mt-2 border-t border-border/60 pt-2">
                      <InlineEdit label={t.common.edit}>
                        <form
                          action={updateKnowledgeNoteAction}
                          className="grid gap-2"
                        >
                          <input type="hidden" name="id" value={note.id} />
                          <div className="grid gap-2 sm:grid-cols-2">
                            <label>
                              <span className="flabel">{t.knowledge.fTopic}</span>
                              <input
                                name="topic"
                                defaultValue={note.topic}
                                list="topic-options"
                                className="field field-sm"
                              />
                            </label>
                            <label>
                              <span className="flabel">{t.knowledge.fProject}</span>
                              <select
                                name="projectId"
                                defaultValue={note.projectId}
                                className="field field-sm"
                              >
                                <option value="">{t.common.notSelected}</option>
                                {projects.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {pname(p)}
                                  </option>
                                ))}
                              </select>
                            </label>
                          </div>
                          <label>
                            <span className="flabel">{t.knowledge.fTitle}</span>
                            <input
                              name="title"
                              defaultValue={note.title}
                              className="field field-sm"
                            />
                          </label>
                          <label>
                            <span className="flabel">{t.knowledge.fContent}</span>
                            <textarea
                              name="content"
                              defaultValue={note.content}
                              rows={3}
                              className="field field-sm"
                            />
                          </label>
                          <label>
                            <span className="flabel">{t.knowledge.fUrl}</span>
                            <input
                              name="url"
                              defaultValue={note.url}
                              placeholder="https://"
                              className="field field-sm"
                            />
                          </label>
                          <div className="flex justify-end">
                            <Button type="submit" size="sm">
                              {t.common.save}
                            </Button>
                          </div>
                        </form>
                      </InlineEdit>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <CollapseCard
        className="mt-5"
        title={t.knowledge.addOne}
        open={openForm === "1" || Boolean(created) || Boolean(error)}
      >
        <form
          action={createKnowledgeNoteAction}
          className="grid gap-4 lg:grid-cols-6"
        >
          <label>
            <span className="flabel">{t.knowledge.fTopic}</span>
            <input
              name="topic"
              list="topic-options"
              placeholder="太赫兹"
              className="field"
            />
            <datalist id="topic-options">
              {topics.map((topic) => (
                <option key={topic} value={topic} />
              ))}
            </datalist>
          </label>
          <label className="lg:col-span-3">
            <span className="flabel">{t.knowledge.fTitle}</span>
            <input name="title" placeholder={t.knowledge.fTitlePh} className="field" />
          </label>
          <label className="lg:col-span-2">
            <span className="flabel">{t.knowledge.fProject}</span>
            <select name="projectId" className="field">
              <option value="">{t.common.notSelected}</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {pname(project)}
                </option>
              ))}
            </select>
          </label>
          <label className="lg:col-span-4">
            <span className="flabel">{t.knowledge.fContent}</span>
            <textarea name="content" rows={3} className="field" />
          </label>
          <label className="lg:col-span-2">
            <span className="flabel">{t.knowledge.fUrl}</span>
            <input name="url" placeholder="https://" className="field" />
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
