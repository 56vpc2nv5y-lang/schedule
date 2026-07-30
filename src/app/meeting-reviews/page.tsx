import Link from "next/link";
import { CheckCircle2, FilePlus2, Plus, Send, Trash2 } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { CollapseCard } from "@/components/ui/collapse-card";
import { StatusStamp, type StatusStampTone } from "@/components/ui/status-pill";
import { getT } from "@/lib/locale";
import { projectDisplayName } from "@/lib/i18n";
import { getContactsForView, getFeedbackQuestionsForView, getMeetingReviewsForView, getProjectsForView } from "@/lib/database-data";

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

export default async function MeetingReviewsPage({ searchParams }: { searchParams: Promise<{ created?: string; error?: string; new?: string; confirm?: string }> }) {
  const [{ created, error, new: openForm, confirm }, { locale, t }, reviews, projects, contacts, questions] = await Promise.all([
    searchParams,
    getT(),
    getMeetingReviewsForView(),
    getProjectsForView(),
    getContactsForView(),
    getFeedbackQuestionsForView(),
  ]);
  const projectMap = new Map(projects.map((project) => [project.id, project]));
  const contactMap = new Map(contacts.map((contact) => [contact.id, contact]));
  const pname = (p: { nameZh: string; nameEn?: string }) => projectDisplayName(locale, p);
  const openQuestions = questions.filter((q) => q.status !== "CONFIRMED");
  const solvedCount = questions.filter((q) => q.status === "CONFIRMED").length;
  const attentionCount = questions.filter((q) => q.status === "UNCLEAR" || q.status === "NEED_MEETING").length;
  const sentCount = questions.filter((q) => q.status === "SENT" || q.status === "ANSWERED").length;

  const roundStatusLabel = (status: string) => {
    if (status === "SENT") return t.meetings.roundWaiting;
    if (status === "FEEDBACK_RECEIVED") return t.meetings.roundFeedback;
    if (status === "FINALIZED") return t.meetings.roundFinalized;
    return t.meetings.roundPending;
  };

  return (
    <AppShell>
      <div className="sunny-page">
        <header className="sunny-page-head flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="page-eyebrow text-xs text-muted-foreground">Meeting Review</div>
            <h1 className="page-title mt-2">纪要与问题</h1>
            <p className="page-description mt-2 max-w-2xl text-sm leading-6">问题先看状态，编辑和轮次默认折起，页面不再一口气摊开所有表单。</p>
          </div>
          <Link href="/meeting-reviews?new=1#new"><Button><FilePlus2 className="h-4 w-4" />{t.meetings.newFlow}</Button></Link>
        </header>

        {created ? <Banner>已更新。</Banner> : null}
        {error === "missing-required" ? <Banner>{t.common.required}</Banner> : null}

        <section className="mb-6 focus-bar">
          <div className="focus-card"><strong className="tnum">{questions.length}</strong><span>问题总数</span></div>
          <div className="focus-card" data-tone="done"><strong className="tnum">{solvedCount}</strong><span>已确认解决</span></div>
          <div className="focus-card" data-tone={attentionCount > 0 ? "danger" : undefined}><strong className="tnum">{attentionCount}</strong><span>需追问 / 开会</span></div>
          <div className="focus-card" data-tone={openQuestions.length > 0 ? "waiting" : undefined}><strong className="tnum">{openQuestions.length}</strong><span>未关闭</span></div>
        </section>

        <section className="panel mb-6">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div><h2 className="sunny-title text-lg">问题列表</h2><p className="text-xs text-muted-foreground">已发/待判断 {sentCount}</p></div>
          </div>
          <div className="space-y-2">
            {questions.length === 0 ? <div className="rounded border border-dashed border-border p-6 text-center text-sm text-muted-foreground">{t.questions.empty}</div> : null}
            {questions.map((q) => {
              const meta = questionStatusMeta[q.status as QuestionStatusKey] ?? questionStatusMeta.OPEN;
              const project = projectMap.get(q.projectId);
              const actionable = q.status === "UNCLEAR" || q.status === "NEED_MEETING";
              return (
                <details key={q.id} className="fold">
                  <summary>
                    <div className="project-card-head">
                      <div>
                        <div className="flex flex-wrap items-center gap-2"><StatusStamp tone={questionTone(q.status)}>{meta.label}</StatusStamp><span className="chip">{q.source}</span>{project ? <span className="chip">{pname(project)}</span> : null}</div>
                        <div className="mt-2 text-sm font-semibold leading-6">{q.question}</div>
                        {q.answer || q.note ? <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{q.answer || q.note}</p> : null}
                      </div>
                      <span className="chip">编辑</span>
                    </div>
                  </summary>
                  <div className="fold-body">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      {actionable ? q.followUpTaskId ? <Link href="/tasks?filter=waiting" className="gen-btn">查看任务 →</Link> : <form action={createFeedbackFollowUpTaskAction}><input type="hidden" name="questionId" value={q.id} /><button type="submit" className="gen-btn">生成任务 →</button></form> : null}
                      <form action={deleteFeedbackQuestionAction}><input type="hidden" name="id" value={q.id} /><Button variant="ghost" size="icon" type="submit" className="h-7 w-7" title={t.common.delete}><Trash2 className="h-3.5 w-3.5 text-muted-foreground" /></Button></form>
                    </div>
                    <form action={updateFeedbackQuestionAction} className="grid gap-2 md:grid-cols-[minmax(0,2fr)_minmax(0,2fr)_170px_auto]">
                      <input type="hidden" name="id" value={q.id} />
                      <label><span className="flabel">{t.questions.fAnswer}</span><input name="answer" defaultValue={q.answer} className="field field-sm" /></label>
                      <label><span className="flabel">{t.questions.fNote}</span><input name="note" defaultValue={q.note} className="field field-sm" /></label>
                      <label><span className="flabel">{t.common.status}</span><select name="status" defaultValue={q.status} className="field field-sm">{(Object.keys(questionStatusMeta) as QuestionStatusKey[]).map((key) => <option key={key} value={key}>{questionStatusMeta[key].label}</option>)}</select></label>
                      <div className="flex items-end"><SubmitButton size="sm" variant="outline" pendingLabel="保存中...">{t.questions.updateBtn}</SubmitButton></div>
                    </form>
                  </div>
                </details>
              );
            })}
          </div>
          <form action={createFeedbackQuestionAction} className="mt-4 grid gap-2 rounded border border-dashed border-border p-3 md:grid-cols-[180px_130px_minmax(0,1fr)_auto]">
            <label><span className="flabel">{t.questions.fProject}</span><select name="projectId" className="field field-sm">{projects.map((project) => <option key={project.id} value={project.id}>{pname(project)}</option>)}</select></label>
            <label><span className="flabel">{t.questions.fSource}</span><select name="source" className="field field-sm"><option>甲方</option><option>供应商</option><option>我方</option></select></label>
            <label><span className="flabel">{t.questions.fQuestion}</span><input name="question" className="field field-sm" /></label>
            <div className="flex items-end"><Button type="submit" size="sm"><Plus className="h-4 w-4" />{t.questions.addOne}</Button></div>
          </form>
        </section>

        <section className="space-y-3">
          {reviews.length === 0 ? <div className="panel text-center text-sm text-muted-foreground">{t.meetings.empty}</div> : null}
          {reviews.map((review) => {
            const project = projectMap.get(review.projectId);
            const finalized = review.status === "FINALIZED";
            const confirming = confirm === review.id;
            return (
              <details key={review.id} className="fold">
                <summary>
                  <div className="project-card-head">
                    <div><h2 className="sunny-title text-base">{review.title}</h2><div className="mt-1 text-xs text-muted-foreground">{project ? pname(project) : ""} · {review.rounds.length} 轮</div></div>
                    <StatusStamp tone={finalized ? "done" : "active"}>{finalized ? t.meetings.finalized : t.meetings.inProgress}</StatusStamp>
                  </div>
                </summary>
                <div className="fold-body space-y-4">
                  <div className="mr-track space-y-1">
                    {review.rounds.map((round) => {
                      const sender = contactMap.get(round.senderId);
                      const receiver = contactMap.get(round.receiverId);
                      return <div key={round.roundNo} className="mr-row"><div className="mr-round">R{round.roundNo}</div><div className="min-w-0"><div className="text-sm font-semibold">{sender?.name ?? "-"} → {receiver?.name ?? "-"}</div>{round.feedback ? <p className="mt-1 text-sm leading-6 text-muted-foreground">{round.feedback}</p> : null}{round.sentAt ? <div className="tnum mt-1 font-mono text-xs text-muted-foreground">{t.meetings.sentAt}{round.sentAt}</div> : null}</div><StatusStamp tone={roundTone(round.status)}>{roundStatusLabel(round.status)}</StatusStamp></div>;
                    })}
                  </div>
                  {!finalized ? <div className="rounded border border-border bg-secondary/30 p-3"><form action={addReviewRoundAction} className="grid gap-2 md:grid-cols-[1fr_1fr_2fr_auto]"><input type="hidden" name="reviewId" value={review.id} /><select name="senderId" className="field"><option value="">{t.meetings.sender}</option>{contacts.map((contact) => <option key={contact.id} value={contact.id}>{contact.name}</option>)}</select><select name="receiverId" className="field"><option value="">{t.meetings.receiver}</option>{contacts.map((contact) => <option key={contact.id} value={contact.id}>{contact.name}</option>)}</select><input name="feedback" placeholder={t.meetings.feedbackPh} className="field" /><Button type="submit" variant="outline"><Send className="h-4 w-4" />{t.meetings.send}</Button></form>{confirming ? <div className="mt-3 flex gap-2"><form action={finalizeReviewAction}><input type="hidden" name="reviewId" value={review.id} /><Button type="submit" size="sm"><CheckCircle2 className="h-4 w-4" />{t.meetings.confirmYes}</Button></form><Link href="/meeting-reviews"><Button size="sm" variant="outline">{t.common.cancel}</Button></Link></div> : <div className="mt-3"><Link href={`/meeting-reviews?confirm=${review.id}`}><Button size="sm" variant="outline"><CheckCircle2 className="h-4 w-4" />{t.meetings.finalize}</Button></Link></div>}</div> : <div className="rounded border border-border bg-secondary/30 p-3 text-sm">{t.meetings.finalizedNote}</div>}
                </div>
              </details>
            );
          })}
        </section>

        <CollapseCard className="mt-5" title={t.meetings.newFlow} open={openForm === "1" || Boolean(error)}>
          <form action={createMeetingReviewAction} className="grid gap-3 sm:grid-cols-[1fr_2fr_auto]"><select name="projectId" className="field"><option value="">{t.meetings.fProject}</option>{projects.map((project) => <option key={project.id} value={project.id}>{pname(project)}</option>)}</select><input name="title" placeholder={t.meetings.fTitlePh} className="field" /><Button type="submit"><Plus className="h-4 w-4" />{t.meetings.create}</Button></form>
        </CollapseCard>
      </div>
    </AppShell>
  );
}

function Banner({ children }: { children: React.ReactNode }) { return <div className="panel mb-5 text-sm text-muted-foreground">{children}</div>; }
