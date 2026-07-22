import Link from "next/link";
import { CheckCircle2, FilePlus2, Plus, Send } from "lucide-react";
import {
  addReviewRoundAction,
  createFeedbackQuestionAction,
  createMeetingReviewAction,
  deleteFeedbackQuestionAction,
  finalizeReviewAction,
  updateFeedbackQuestionAction,
} from "@/app/actions";
import { Trash2 } from "lucide-react";
import { questionStatusMeta, type QuestionStatusKey } from "@/lib/default-data";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CollapseCard } from "@/components/ui/collapse-card";
import { getT } from "@/lib/locale";
import { projectDisplayName } from "@/lib/i18n";
import {
  getContactsForView,
  getFeedbackQuestionsForView,
  getMeetingReviewsForView,
  getProjectsForView,
} from "@/lib/database-data";

export const dynamic = "force-dynamic";

export default async function MeetingReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{
    created?: string;
    error?: string;
    new?: string;
    confirm?: string;
  }>;
}) {
  const [
    { created, error, new: openForm, confirm },
    { locale, t },
    reviews,
    projects,
    contacts,
    questions,
  ] = await Promise.all([
    searchParams,
    getT(),
    getMeetingReviewsForView(),
    getProjectsForView(),
    getContactsForView(),
    getFeedbackQuestionsForView(),
  ]);
  const openQuestions = questions.filter((q) => q.status !== "CONFIRMED");
  const solvedCount = questions.filter((q) => q.status === "CONFIRMED").length;
  const attentionCount = questions.filter(
    (q) => q.status === "UNCLEAR" || q.status === "NEED_MEETING",
  ).length;
  // 按项目分组统计"解决进度"，给用户一个 overview
  const questionsByProject = projects
    .map((p) => ({
      project: p,
      qs: questions.filter((q) => q.projectId === p.id),
    }))
    .filter((x) => x.qs.length > 0);
  const projectMap = new Map(projects.map((p) => [p.id, p]));
  const contactMap = new Map(contacts.map((c) => [c.id, c]));
  const pname = (p: { nameZh: string; nameEn?: string }) =>
    projectDisplayName(locale, p);

  const roundStatusLabel = (status: string) => {
    if (status === "SENT") return t.meetings.roundWaiting;
    if (status === "FEEDBACK_RECEIVED") return t.meetings.roundFeedback;
    if (status === "FINALIZED") return t.meetings.roundFinalized;
    return t.meetings.roundPending;
  };

  return (
    <AppShell>
      <PageHeader
        eyebrow={t.meetings.eyebrow}
        title={t.meetings.title}
        description={t.meetings.desc}
        action={
          <Link href="/meeting-reviews?new=1#new">
            <Button>
              <FilePlus2 className="h-4 w-4" />
              {t.meetings.newFlow}
            </Button>
          </Link>
        }
      />

      {created === "review" ? <Banner tone="ok">{t.common.saved}</Banner> : null}
      {created === "round" ? <Banner tone="ok">{t.common.saved}</Banner> : null}
      {created === "question" || created === "question-updated" ? (
        <Banner tone="ok">问题记录已保存。</Banner>
      ) : null}
      {created === "finalized" ? (
        <Banner tone="ok">{t.meetings.finalizedNote}</Banner>
      ) : null}
      {error === "missing-required" ? (
        <Banner tone="err">{t.common.required}</Banner>
      ) : null}

      {/* 问题反馈清单：日常主战场，放在最上面 */}
      <Card className="mb-5">
        <CardHeader className="border-b border-border">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>{t.questions.listTitle}</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                {t.questions.listHint}
              </p>
            </div>
            <Badge tone={openQuestions.length ? "waiting" : "done"}>
              {t.questions.openCount(openQuestions.length)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pt-4">
          {questions.length > 0 ? (
            <div className="rounded-lg border border-border bg-secondary/30 p-4">
              {/* 总览：一眼看客户问题解决到什么程度 */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="tnum text-2xl font-semibold">
                    {questions.length}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {t.questions.statTotal}
                  </div>
                </div>
                <div>
                  <div className="tnum text-2xl font-semibold text-emerald-600">
                    {solvedCount}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {t.questions.statSolved}
                  </div>
                </div>
                <div>
                  <div className="tnum text-2xl font-semibold text-red-600">
                    {attentionCount}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {t.questions.statAttention}
                  </div>
                </div>
              </div>
              {/* 按项目的解决进度条 */}
              <div className="mt-4 space-y-2">
                {questionsByProject.map(({ project, qs }) => {
                  const solved = qs.filter(
                    (q) => q.status === "CONFIRMED",
                  ).length;
                  const pct = Math.round((solved / qs.length) * 100);
                  return (
                    <div key={project.id}>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium">{pname(project)}</span>
                        <span className="tnum text-muted-foreground">
                          {solved}/{qs.length}
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 rounded-full bg-secondary">
                        <div
                          className="h-1.5 rounded-full bg-emerald-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          {questions.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              {t.questions.empty}
            </div>
          ) : (
            questions.map((q) => {
              const meta =
                questionStatusMeta[q.status as QuestionStatusKey] ??
                questionStatusMeta.OPEN;
              const project = projectMap.get(q.projectId);
              return (
                <div key={q.id} className="rounded-lg border border-border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={meta.tone}>{meta.label}</Badge>
                      <Badge tone="neutral">{q.source}</Badge>
                      {project ? (
                        <span className="text-xs text-muted-foreground">
                          {pname(project)}
                        </span>
                      ) : null}
                    </div>
                    <form action={deleteFeedbackQuestionAction}>
                      <input type="hidden" name="id" value={q.id} />
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
                  <div className="mt-2 text-sm font-medium leading-6">
                    {q.question}
                  </div>
                  <form
                    action={updateFeedbackQuestionAction}
                    className="mt-3 grid gap-2 rounded-lg bg-secondary/30 p-3 md:grid-cols-[minmax(0,2fr)_minmax(0,2fr)_150px_auto]"
                  >
                    <input type="hidden" name="id" value={q.id} />
                    <label>
                      <span className="flabel">{t.questions.fAnswer}</span>
                      <input
                        name="answer"
                        defaultValue={q.answer}
                        className="field field-sm"
                      />
                    </label>
                    <label>
                      <span className="flabel">{t.questions.fNote}</span>
                      <input
                        name="note"
                        defaultValue={q.note}
                        className="field field-sm"
                      />
                    </label>
                    <label>
                      <span className="flabel">{t.common.status}</span>
                      <select
                        name="status"
                        defaultValue={q.status}
                        className="field field-sm"
                      >
                        {(
                          Object.keys(questionStatusMeta) as QuestionStatusKey[]
                        ).map((key) => (
                          <option key={key} value={key}>
                            {questionStatusMeta[key].label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <div className="flex items-end">
                      <SubmitButton
                        size="sm"
                        variant="outline"
                        pendingLabel="保存中..."
                      >
                        {t.questions.updateBtn}
                      </SubmitButton>
                    </div>
                  </form>
                </div>
              );
            })
          )}

          <form
            action={createFeedbackQuestionAction}
            className="grid gap-2 rounded-lg border border-dashed border-border p-3 md:grid-cols-[160px_120px_minmax(0,1fr)_auto]"
          >
            <label>
              <span className="flabel">{t.questions.fProject}</span>
              <select name="projectId" className="field field-sm">
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {pname(project)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="flabel">{t.questions.fSource}</span>
              <select name="source" className="field field-sm">
                <option>甲方</option>
                <option>供应商</option>
                <option>我方</option>
              </select>
            </label>
            <label>
              <span className="flabel">{t.questions.fQuestion}</span>
              <input name="question" className="field field-sm" />
            </label>
            <div className="flex items-end">
              <Button type="submit" size="sm">
                <Plus className="h-4 w-4" />
                {t.questions.addOne}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-5">
        {reviews.map((review) => {
          const project = projectMap.get(review.projectId);
          const finalized = review.status === "FINALIZED";
          const confirming = confirm === review.id;

          return (
            <Card key={review.id}>
              <CardHeader className="border-b border-border">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle>{review.title}</CardTitle>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {project ? pname(project) : ""}
                    </div>
                  </div>
                  <Badge tone={finalized ? "done" : "active"}>
                    {finalized ? t.meetings.finalized : t.meetings.inProgress}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="space-y-3">
                  {review.rounds.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                      {t.meetings.noRounds}
                    </div>
                  ) : null}
                  {review.rounds.map((round) => {
                    const sender = contactMap.get(round.senderId);
                    const receiver = contactMap.get(round.receiverId);
                    return (
                      <div
                        key={round.roundNo}
                        className="grid gap-3 rounded-lg border border-border p-4 sm:grid-cols-[64px_minmax(0,1fr)_110px]"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-sm font-semibold text-accent-foreground">
                          R{round.roundNo}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium">
                            {sender?.name ?? "—"} → {receiver?.name ?? "—"}
                          </div>
                          {round.feedback ? (
                            <p className="mt-1 text-sm leading-6 text-muted-foreground">
                              {round.feedback}
                            </p>
                          ) : null}
                          {round.sentAt ? (
                            <div className="tnum mt-1 font-mono text-xs text-muted-foreground">
                              {t.meetings.sentAt}
                              {round.sentAt}
                            </div>
                          ) : null}
                        </div>
                        <div className="flex items-start justify-end">
                          <Badge
                            tone={round.status === "SENT" ? "waiting" : "done"}
                          >
                            {roundStatusLabel(round.status)}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {!finalized ? (
                  <div className="rounded-lg border border-border bg-secondary/30 p-3">
                    <div className="mb-2 text-xs font-medium text-muted-foreground">
                      {t.meetings.addRound}
                    </div>
                    <form
                      action={addReviewRoundAction}
                      className="grid gap-2 md:grid-cols-[1fr_1fr_2fr_auto]"
                    >
                      <input type="hidden" name="reviewId" value={review.id} />
                      <select name="senderId" className="field">
                        <option value="">{t.meetings.sender}</option>
                        {contacts.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                      <select name="receiverId" className="field">
                        <option value="">{t.meetings.receiver}</option>
                        {contacts.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                      <input
                        name="feedback"
                        placeholder={t.meetings.feedbackPh}
                        className="field"
                      />
                      <Button type="submit" variant="outline">
                        <Send className="h-4 w-4" />
                        {t.meetings.send}
                      </Button>
                    </form>

                    {/* 定稿走两步确认：先点「标记定稿…」，再确认入库 */}
                    {confirming ? (
                      <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50 p-3">
                        <div className="text-sm font-medium text-amber-900">
                          {t.meetings.confirmTitle}
                        </div>
                        <p className="mt-1 text-xs leading-5 text-amber-800">
                          {t.meetings.confirmDesc(review.title)}
                        </p>
                        <div className="mt-2 flex gap-2">
                          <form action={finalizeReviewAction}>
                            <input
                              type="hidden"
                              name="reviewId"
                              value={review.id}
                            />
                            <Button type="submit" size="sm">
                              <CheckCircle2 className="h-4 w-4" />
                              {t.meetings.confirmYes}
                            </Button>
                          </form>
                          <Link href="/meeting-reviews">
                            <Button size="sm" variant="outline">
                              {t.common.cancel}
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3">
                        <Link href={`/meeting-reviews?confirm=${review.id}`}>
                          <Button size="sm" variant="outline">
                            <CheckCircle2 className="h-4 w-4" />
                            {t.meetings.finalize}
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
                    <CheckCircle2 className="h-4 w-4" />
                    {t.meetings.finalizedNote}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
        {reviews.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            {t.meetings.empty}
          </div>
        ) : null}
      </div>

      <CollapseCard
        className="mt-5"
        title={t.meetings.newFlow}
        open={openForm === "1" || Boolean(error)}
      >
        <form
          action={createMeetingReviewAction}
          className="grid gap-3 sm:grid-cols-[1fr_2fr_auto]"
        >
          <select name="projectId" className="field">
            <option value="">{t.meetings.fProject}</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {pname(project)}
              </option>
            ))}
          </select>
          <input name="title" placeholder={t.meetings.fTitlePh} className="field" />
          <Button type="submit">
            <Plus className="h-4 w-4" />
            {t.meetings.create}
          </Button>
        </form>
      </CollapseCard>
    </AppShell>
  );
}

function Banner({
  tone,
  children,
}: {
  tone: "ok" | "err";
  children: React.ReactNode;
}) {
  return (
    <div
      className={
        tone === "ok"
          ? "mb-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900"
          : "mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900"
      }
    >
      {children}
    </div>
  );
}
