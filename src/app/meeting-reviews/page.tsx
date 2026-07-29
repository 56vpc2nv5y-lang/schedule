import Link from "next/link";
import { CheckCircle2, FilePlus2, ListTodo, Plus, Send, Trash2 } from "lucide-react";
import {
  addReviewRoundAction,
  createFeedbackFollowUpTaskAction,
  createFeedbackQuestionAction,
  createMeetingReviewAction,
  deleteFeedbackQuestionAction,
  finalizeReviewAction,
  updateFeedbackQuestionAction,
} from "@/app/actions";
import { questionStatusMeta, type QuestionStatusKey } from "@/lib/default-data";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CollapseCard } from "@/components/ui/collapse-card";
import { StatusStamp, type StatusStampTone } from "@/components/ui/status-pill";
import { getT } from "@/lib/locale";
import { projectDisplayName } from "@/lib/i18n";
import {
  getContactsForView,
  getFeedbackQuestionsForView,
  getMeetingReviewsForView,
  getProjectsForView,
} from "@/lib/database-data";

export const dynamic = "force-dynamic";

function questionTone(status: string): StatusStampTone {
  if (status === "CONFIRMED") return "done";
  if (status === "ANSWERED") return "waiting";
  if (status === "UNCLEAR" || status === "NEED_MEETING") return "danger";
  return "neutral";
}

function roundTone(status: string): StatusStampTone {
  if (status === "FINALIZED") return "done";
  if (status === "FEEDBACK_RECEIVED") return "active";
  if (status === "SENT") return "waiting";
  return "neutral";
}

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
  const sentCount = questions.filter((q) => q.status === "SENT" || q.status === "ANSWERED").length;
  const questionsByProject = projects
    .map((project) => ({
      project,
      qs: questions.filter((q) => q.projectId === project.id),
    }))
    .filter((item) => item.qs.length > 0);
  const projectMap = new Map(projects.map((project) => [project.id, project]));
  const contactMap = new Map(contacts.map((contact) => [contact.id, contact]));
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
      <div className="sunny-page">
        <div className="sunny-page-head flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="page-eyebrow text-xs text-muted-foreground">Meeting Review</div>
            <h1 className="page-title mt-2">纪要与问题</h1>
            <p className="page-description mt-2 max-w-2xl text-sm leading-6">
              保留原有问题状态、纪要轮次和项目映射，只把展示层换成统一图章和档案时间线。
            </p>
          </div>
          <Link href="/meeting-reviews?new=1#new">
            <Button>
              <FilePlus2 className="h-4 w-4" />
              {t.meetings.newFlow}
            </Button>
          </Link>
        </div>

        {created === "review" ? <Banner tone="ok">{t.common.saved}</Banner> : null}
        {created === "round" ? <Banner tone="ok">{t.common.saved}</Banner> : null}
        {created === "question" || created === "question-updated" ? (
          <Banner tone="ok">问题记录已保存。</Banner>
        ) : null}
        {created === "follow-up-task" ? (
          <Banner tone="ok">已生成跟进任务，可在任务列表继续推进。</Banner>
        ) : null}
        {created === "follow-up-task-exists" ? (
          <Banner tone="ok">该问题已有一条关联任务。</Banner>
        ) : null}
        {created === "finalized" ? <Banner tone="ok">{t.meetings.finalizedNote}</Banner> : null}
        {error === "missing-required" ? <Banner tone="err">{t.common.required}</Banner> : null}

        <section className="mb-6">
          <div className="focus-bar">
            <div className="focus-card">
              <strong className="tnum">{questions.length}</strong>
              <span>问题总数</span>
            </div>
            <div className="focus-card" data-tone="done">
              <strong className="tnum">{solvedCount}</strong>
              <span>已确认解决</span>
            </div>
            <div className="focus-card" data-tone={attentionCount > 0 ? "danger" : undefined}>
              <strong className="tnum">{attentionCount}</strong>
              <span>需追问 / 开会</span>
            </div>
            <div className="focus-card" data-tone={openQuestions.length > 0 ? "waiting" : undefined}>
              <strong className="tnum">{openQuestions.length}</strong>
              <span>未关闭</span>
            </div>
          </div>
        </section>

        <Card className="mb-6">
          <CardHeader className="border-b border-border">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>{t.questions.listTitle}</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">{t.questions.listHint}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="chip">已发/待判断 {sentCount}</span>
                {questionsByProject.map(({ project, qs }) => {
                  const solved = qs.filter((q) => q.status === "CONFIRMED").length;
                  return (
                    <span key={project.id} className="chip">
                      {pname(project)} {solved}/{qs.length}
                    </span>
                  );
                })}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {questions.length === 0 ? (
              <div className="rounded border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                {t.questions.empty}
              </div>
            ) : (
              <div className="space-y-3">
                {questions.map((q) => {
                  const meta = questionStatusMeta[q.status as QuestionStatusKey] ?? questionStatusMeta.OPEN;
                  const project = projectMap.get(q.projectId);
                  const actionable = q.status === "UNCLEAR" || q.status === "NEED_MEETING";
                  return (
                    <article key={q.id} className="rounded border border-border bg-card p-4">
                      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <StatusStamp tone={questionTone(q.status)}>{meta.label}</StatusStamp>
                            <span className="chip">{q.source}</span>
                            {project ? <span className="chip">{pname(project)}</span> : null}
                            {q.followUpTaskId ? <span className="chip">关联任务 {q.followUpTaskStatus || "待处理"}</span> : null}
                          </div>
                          <div className="mt-3 text-sm font-semibold leading-6">{q.question}</div>
                          {q.answer || q.note ? (
                            <p className="mt-2 text-sm leading-6 text-muted-foreground">
                              {q.answer ? `答复：${q.answer}` : ""}{q.answer && q.note ? " / " : ""}{q.note ? `备注：${q.note}` : ""}
                            </p>
                          ) : null}
                        </div>
                        <div className="flex flex-col items-start gap-2 lg:items-end">
                          {actionable ? (
                            q.followUpTaskId ? (
                              <Link href="/tasks?filter=minutes" className="gen-btn">
                                查看任务 →
                              </Link>
                            ) : (
                              <form action={createFeedbackFollowUpTaskAction}>
                                <input type="hidden" name="questionId" value={q.id} />
                                <button type="submit" className="gen-btn">
                                  生成任务 →
                                </button>
                              </form>
                            )
                          ) : null}
                          <form action={deleteFeedbackQuestionAction}>
                            <input type="hidden" name="id" value={q.id} />
                            <Button variant="ghost" size="icon" type="submit" className="h-7 w-7" title={t.common.delete}>
                              <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                            </Button>
                          </form>
                        </div>
                      </div>

                      <form
                        action={updateFeedbackQuestionAction}
                        className="mt-4 grid gap-2 rounded border border-border bg-secondary/30 p-3 md:grid-cols-[minmax(0,2fr)_minmax(0,2fr)_170px_auto]"
                      >
                        <input type="hidden" name="id" value={q.id} />
                        <label>
                          <span className="flabel">{t.questions.fAnswer}</span>
                          <input name="answer" defaultValue={q.answer} className="field field-sm" />
                        </label>
                        <label>
                          <span className="flabel">{t.questions.fNote}</span>
                          <input name="note" defaultValue={q.note} className="field field-sm" />
                        </label>
                        <label>
                          <span className="flabel">{t.common.status}</span>
                          <select name="status" defaultValue={q.status} className="field field-sm">
                            {(Object.keys(questionStatusMeta) as QuestionStatusKey[]).map((key) => (
                              <option key={key} value={key}>{questionStatusMeta[key].label}</option>
                            ))}
                          </select>
                        </label>
                        <div className="flex items-end">
                          <SubmitButton size="sm" variant="outline" pendingLabel="保存中...">
                            {t.questions.updateBtn}
                          </SubmitButton>
                        </div>
                      </form>
                    </article>
                  );
                })}
              </div>
            )}

            <form
              action={createFeedbackQuestionAction}
              className="mt-4 grid gap-2 rounded border border-dashed border-border p-3 md:grid-cols-[180px_130px_minmax(0,1fr)_auto]"
            >
              <label>
                <span className="flabel">{t.questions.fProject}</span>
                <select name="projectId" className="field field-sm">
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>{pname(project)}</option>
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
                      <div className="mt-1 text-xs text-muted-foreground">{project ? pname(project) : ""}</div>
                    </div>
                    <StatusStamp tone={finalized ? "done" : "active"}>
                      {finalized ? t.meetings.finalized : t.meetings.inProgress}
                    </StatusStamp>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  <div className="mr-track space-y-1">
                    {review.rounds.length === 0 ? (
                      <div className="rounded border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                        {t.meetings.noRounds}
                      </div>
                    ) : null}
                    {review.rounds.map((round) => {
                      const sender = contactMap.get(round.senderId);
                      const receiver = contactMap.get(round.receiverId);
                      return (
                        <div key={round.roundNo} className="mr-row">
                          <div className="mr-round">R{round.roundNo}</div>
                          <div className="min-w-0">
                            <div className="text-sm font-semibold">
                              {sender?.name ?? "-"} → {receiver?.name ?? "-"}
                            </div>
                            {round.feedback ? (
                              <p className="mt-1 text-sm leading-6 text-muted-foreground">{round.feedback}</p>
                            ) : null}
                            {round.sentAt ? (
                              <div className="tnum mt-1 font-mono text-xs text-muted-foreground">
                                {t.meetings.sentAt}{round.sentAt}
                              </div>
                            ) : null}
                          </div>
                          <div className="flex justify-end">
                            <StatusStamp tone={roundTone(round.status)}>{roundStatusLabel(round.status)}</StatusStamp>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {!finalized ? (
                    <div className="rounded border border-border bg-secondary/30 p-3">
                      <div className="mb-2 text-xs font-medium text-muted-foreground">{t.meetings.addRound}</div>
                      <form action={addReviewRoundAction} className="grid gap-2 md:grid-cols-[1fr_1fr_2fr_auto]">
                        <input type="hidden" name="reviewId" value={review.id} />
                        <select name="senderId" className="field">
                          <option value="">{t.meetings.sender}</option>
                          {contacts.map((contact) => <option key={contact.id} value={contact.id}>{contact.name}</option>)}
                        </select>
                        <select name="receiverId" className="field">
                          <option value="">{t.meetings.receiver}</option>
                          {contacts.map((contact) => <option key={contact.id} value={contact.id}>{contact.name}</option>)}
                        </select>
                        <input name="feedback" placeholder={t.meetings.feedbackPh} className="field" />
                        <Button type="submit" variant="outline">
                          <Send className="h-4 w-4" />
                          {t.meetings.send}
                        </Button>
                      </form>

                      {confirming ? (
                        <div className="mt-3 rounded border border-amber-300 bg-amber-50 p-3">
                          <div className="text-sm font-medium text-amber-900">{t.meetings.confirmTitle}</div>
                          <p className="mt-1 text-xs leading-5 text-amber-800">{t.meetings.confirmDesc(review.title)}</p>
                          <div className="mt-2 flex gap-2">
                            <form action={finalizeReviewAction}>
                              <input type="hidden" name="reviewId" value={review.id} />
                              <Button type="submit" size="sm">
                                <CheckCircle2 className="h-4 w-4" />
                                {t.meetings.confirmYes}
                              </Button>
                            </form>
                            <Link href="/meeting-reviews">
                              <Button size="sm" variant="outline">{t.common.cancel}</Button>
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
                    <div className="flex items-center gap-2 rounded border border-border bg-secondary/30 p-3 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      {t.meetings.finalizedNote}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
          {reviews.length === 0 ? (
            <div className="rounded border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              {t.meetings.empty}
            </div>
          ) : null}
        </div>

        <CollapseCard className="mt-5" title={t.meetings.newFlow} open={openForm === "1" || Boolean(error)}>
          <form action={createMeetingReviewAction} className="grid gap-3 sm:grid-cols-[1fr_2fr_auto]">
            <select name="projectId" className="field">
              <option value="">{t.meetings.fProject}</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>{pname(project)}</option>
              ))}
            </select>
            <input name="title" placeholder={t.meetings.fTitlePh} className="field" />
            <Button type="submit">
              <Plus className="h-4 w-4" />
              {t.meetings.create}
            </Button>
          </form>
        </CollapseCard>
      </div>
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
          ? "mb-5 rounded border border-border bg-secondary/50 p-4 text-sm"
          : "mb-5 rounded border border-red-200 bg-red-50 p-4 text-sm text-red-900"
      }
    >
      {children}
    </div>
  );
}
