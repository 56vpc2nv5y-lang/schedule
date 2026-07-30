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
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { CollapseCard } from "@/components/ui/collapse-card";
import { StatusStamp, type StatusStampTone } from "@/components/ui/status-pill";
import { getContactsForView, getFeedbackQuestionsForView, getMeetingReviewsForView, getProjectsForView } from "@/lib/database-data";
import { projectDisplayName } from "@/lib/i18n";
import { getT } from "@/lib/locale";
import { issueStatusMeta, issueStatusOptions, sendChannelOptions } from "@/lib/workflow-meta";

export const dynamic = "force-dynamic";

function questionTone(status: string): StatusStampTone {
  return issueStatusMeta(status).tone as StatusStampTone;
}

function roundTone(status: string): StatusStampTone {
  if (status === "FINALIZED") return "done";
  if (status === "FEEDBACK_RECEIVED") return "active";
  if (status === "SENT") return "waiting";
  return "neutral";
}

function roundStatusLabel(status: string) {
  if (status === "SENT") return "等待反馈";
  if (status === "FEEDBACK_RECEIVED") return "已反馈";
  if (status === "FINALIZED") return "已定稿";
  return "待发送";
}

function qs(params: Record<string, string | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value && value !== "all") search.set(key, value);
  });
  const value = search.toString();
  return value ? "?" + value : "";
}

export default async function MeetingReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string; error?: string; new?: string; reviewNew?: string; confirm?: string; status?: string; projectId?: string; q?: string }>;
}) {
  const [{ created, error, new: openQuestionForm, reviewNew, confirm, status = "active", projectId = "", q = "" }, { locale }, reviews, projects, contacts, questions] = await Promise.all([
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

  const isArchived = (question: { status: string; archivedAt: string }) => question.archivedAt !== "" || issueStatusMeta(question.status).value === "SENT_CLIENT";
  const activeQuestions = questions.filter((question) => !isArchived(question));
  const archivedQuestions = questions.filter((question) => isArchived(question));
  const attentionCount = activeQuestions.filter((question) => ["WAITING_SUPPLIER", "LEADER_REVIEW", "TRANSLATION", "TO_CLIENT"].includes(issueStatusMeta(question.status).value)).length;

  const visibleQuestions = questions
    .filter((question) => {
      const meta = issueStatusMeta(question.status);
      if (status === "archived") return isArchived(question);
      if (status === "active") return !isArchived(question);
      return meta.value === status;
    })
    .filter((question) => !projectId || question.projectId === projectId)
    .filter((question) => {
      const project = projectMap.get(question.projectId);
      const text = `${question.question} ${question.answer} ${question.note} ${question.supplierReply} ${question.sunnyJudgment} ${project?.nameZh ?? ""}`.toLowerCase();
      return !q || text.includes(q.toLowerCase());
    });

  const statusItems = [
    { value: "active", label: "进行中", count: activeQuestions.length },
    ...issueStatusOptions.map((item) => ({
      value: item.value,
      label: item.label,
      count: questions.filter((question) => !isArchived(question) && issueStatusMeta(question.status).value === item.value).length,
    })),
    { value: "archived", label: "已归档", count: archivedQuestions.length },
  ];

  const projectItems = projects
    .map((project) => ({ project, count: questions.filter((question) => question.projectId === project.id).length }))
    .filter((item) => item.count > 0)
    .slice(0, 8);

  return (
    <AppShell>
      <div className="os-shell-page">
        <header className="os-page-head">
          <div>
            <div className="page-eyebrow">Issue Closure</div>
            <h1 className="page-title mt-2">问题闭环</h1>
            <p className="os-page-sub">上半区处理纪要审阅轮次，下半区处理客户/供应商问题闭环，两个流程不再上下重复堆叠。</p>
          </div>
          <div className="os-row">
            <Link href="/meeting-reviews?new=1#new-question" className="os-link-button primary"><FilePlus2 className="h-4 w-4" />新建问题</Link>
            <Link href="/meeting-reviews?reviewNew=1#new-review" className="os-link-button"><Plus className="h-4 w-4" />新建纪要</Link>
          </div>
        </header>

        {created ? <Banner>已更新。</Banner> : null}
        {error === "missing-required" ? <Banner tone="danger">必填字段不能为空。</Banner> : null}

        <section className="focus-bar mb-4">
          <div className="focus-card"><strong className="tnum">{questions.length}</strong><span>问题总数</span></div>
          <div className="focus-card" data-tone="done"><strong className="tnum">{archivedQuestions.length}</strong><span>已发客户 / 已归档</span></div>
          <div className="focus-card" data-tone={attentionCount > 0 ? "danger" : undefined}><strong className="tnum">{attentionCount}</strong><span>需追问 / 审核 / 发送</span></div>
          <div className="focus-card" data-tone={activeQuestions.length > 0 ? "waiting" : undefined}><strong className="tnum">{activeQuestions.length}</strong><span>未关闭</span></div>
        </section>

        <div className="os-issue-layout os-mt">
          <aside className="os-side">
            {statusItems.map((item) => (
              <Link key={item.value} href={`/meeting-reviews${qs({ status: item.value, projectId, q })}`} className={`os-side-item ${status === item.value ? "active" : ""}`}>
                <span>{item.label}</span><b>{item.count}</b>
              </Link>
            ))}
            <div className="os-divider" />
            <div className="os-side-title">按项目</div>
            <Link href={`/meeting-reviews${qs({ status, q })}`} className={`os-side-item ${!projectId ? "active" : ""}`}><span>全部项目</span><b>{questions.length}</b></Link>
            {projectItems.map(({ project, count }) => (
              <Link key={project.id} href={`/meeting-reviews${qs({ status, projectId: project.id, q })}`} className={`os-side-item ${projectId === project.id ? "active" : ""}`}>
                <span className="truncate">{pname(project)}</span><b>{count}</b>
              </Link>
            ))}
          </aside>

          <section className="os-card">
            <div className="os-card-head os-filterbar">
              <div>
                <div className="os-card-title">问题闭环列表</div>
                <div className="os-card-sub">点击任一行展开完整编辑表单</div>
              </div>
              <form action="/meeting-reviews" className="os-filters">
                <input type="hidden" name="status" value={status} />
                <input type="hidden" name="projectId" value={projectId} />
                <label className="os-search">⌕<input name="q" defaultValue={q} placeholder="搜索问题、回复或联系人" /></label>
                <Button type="submit" variant="outline" size="sm">搜索</Button>
              </form>
            </div>
            <div>
              {visibleQuestions.length === 0 ? <div className="empty">没有符合当前筛选的问题。</div> : null}
              {visibleQuestions.map((question) => {
                const meta = issueStatusMeta(question.status);
                const project = projectMap.get(question.projectId);
                const owner = question.ownerContactId ? contactMap.get(question.ownerContactId) : undefined;
                const actionable = meta.value !== "SENT_CLIENT";
                const supplierReply = question.supplierReply || question.answer || "还没有记录供应商回复。";
                const judgment = question.sunnyJudgment || question.note || "还没有写 Sunny 判断。";
                return (
                  <details key={question.id} className="os-fold-clean">
                    <summary>
                      <div className="os-issue-row">
                        <div className="min-w-0">
                          <div className="os-row flex-wrap">
                            {project ? <span className="os-pill project">{pname(project)}</span> : null}
                            <span className="os-strong">{question.question}</span>
                          </div>
                          <div className="os-issue-preview">{supplierReply}</div>
                        </div>
                        <div>
                          <StatusStamp tone={questionTone(question.status)}>{meta.label}</StatusStamp>
                          <div className="os-tiny os-muted mt-2">更新：{question.updatedAt || "未记录"}</div>
                        </div>
                        <div>
                          <div className="os-small os-strong">{owner?.name || question.source || "未指定"}</div>
                          <div className="os-tiny os-muted">{owner?.organization || "对接方"}</div>
                        </div>
                        <div className="os-small os-muted">{question.dueAt || question.expectedReplyAt || "待排期"}</div>
                      </div>
                    </summary>
                    <div className="os-issue-body">
                      <div className="os-row justify-end os-mt">
                        {actionable ? question.followUpTaskId ? (
                          <Link href="/tasks" className="gen-btn">查看任务 →</Link>
                        ) : (
                          <form action={createFeedbackFollowUpTaskAction}>
                            <input type="hidden" name="questionId" value={question.id} />
                            <button type="submit" className="gen-btn">生成任务 →</button>
                          </form>
                        ) : null}
                        <form action={deleteFeedbackQuestionAction}>
                          <input type="hidden" name="id" value={question.id} />
                          <Button variant="ghost" size="sm" type="submit"><Trash2 className="h-3.5 w-3.5" />删除</Button>
                        </form>
                      </div>

                      <div className="os-grid12 os-mt">
                        <div className="os-block os-s6">
                          <div className="os-block-label">问题背景</div>
                          <div className="os-long-text">{question.background || question.question}</div>
                        </div>
                        <div className="os-block answer os-s6">
                          <div className="os-block-label">供应商回复 / Sunny 判断</div>
                          <div className="os-long-text">{supplierReply}</div>
                          <div className="os-divider" />
                          <div className="os-small os-strong">Sunny 判断</div>
                          <div className="os-small os-muted mt-1 leading-6">{judgment}</div>
                        </div>
                      </div>

                      <form action={updateFeedbackQuestionAction} className="os-form-grid os-mt">
                        <input type="hidden" name="id" value={question.id} />
                        <label className="os-field-full"><span className="flabel">问题</span><textarea name="question" defaultValue={question.question} className="field min-h-20" /></label>
                        <label><span className="flabel">状态</span><select name="status" defaultValue={meta.value} className="field">{issueStatusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
                        <label><span className="flabel">发送渠道</span><select name="sendChannel" defaultValue={question.sendChannel} className="field"><option value="">暂不选择</option>{sendChannelOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
                        <label className="os-field-full"><span className="flabel">背景 / 客户原问</span><textarea name="background" defaultValue={question.background} className="field min-h-24" /></label>
                        <label><span className="flabel">供应商问题</span><textarea name="supplierQuestion" defaultValue={question.supplierQuestion} className="field min-h-24" /></label>
                        <label><span className="flabel">供应商回复</span><textarea name="supplierReply" defaultValue={question.supplierReply || question.answer} className="field min-h-24" /></label>
                        <label><span className="flabel">Sunny 判断</span><textarea name="sunnyJudgment" defaultValue={question.sunnyJudgment || question.note} className="field min-h-24" /></label>
                        <label><span className="flabel">追问记录</span><textarea name="followUpLog" defaultValue={question.followUpLog} className="field min-h-24" /></label>
                        <label><span className="flabel">中文最终回复</span><textarea name="finalReplyZh" defaultValue={question.finalReplyZh} className="field min-h-24" /></label>
                        <label><span className="flabel">英文最终回复</span><textarea name="finalReplyEn" defaultValue={question.finalReplyEn} className="field min-h-24" /></label>
                        <label><span className="flabel">截止 / 计划时间</span><input name="dueAt" defaultValue={question.dueAt} className="field" /></label>
                        <div className="os-row justify-end self-end"><Button type="submit" size="sm">保存问题</Button></div>
                      </form>
                    </div>
                  </details>
                );
              })}
            </div>
          </section>
        </div>

        <section className="os-card os-review-panel">
          <div className="os-card-head">
            <div>
              <div className="os-card-title os-review-title">纪要审阅轮次</div>
              <div className="os-card-sub">R1/R2/R3 固定在左侧，右侧显示发送方、接收方、摘要和状态</div>
            </div>
          </div>
          <div className="os-card-body os-review-list">
            {reviews.length === 0 ? <div className="empty">暂无纪要审阅流程。</div> : null}
            {reviews.map((review) => {
              const project = projectMap.get(review.projectId);
              const finalized = review.status === "FINALIZED";
              const confirming = confirm === review.id;
              return (
                <details key={review.id} className="os-review-fold">
                  <summary>
                    <div className="os-review-summary">
                      <div className="min-w-0">
                        <h2>{review.title}</h2>
                        <div>{project ? pname(project) : "未关联项目"} · {review.rounds.length} 轮</div>
                      </div>
                      <StatusStamp tone={finalized ? "done" : "danger"}>{finalized ? "已定稿" : "进行中"}</StatusStamp>
                    </div>
                  </summary>
                  <div className="os-review-body">
                    {review.rounds.map((round) => {
                      const sender = round.senderId ? contactMap.get(round.senderId) : undefined;
                      const receiver = round.receiverId ? contactMap.get(round.receiverId) : undefined;
                      return (
                        <div key={round.roundNo} className="os-mr-row">
                          <div className="os-mr-round">R{round.roundNo}</div>
                          <div className="min-w-0">
                            <div className="os-small os-strong">{sender?.name ?? "-"} → {receiver?.name ?? "-"}</div>
                            {round.feedback ? <p className="mt-1 text-sm leading-6 text-muted-foreground">{round.feedback}</p> : null}
                            {round.sentAt ? <div className="tnum mt-1 font-mono text-xs text-muted-foreground">发送：{round.sentAt}</div> : null}
                          </div>
                          <StatusStamp tone={roundTone(round.status)}>{roundStatusLabel(round.status)}</StatusStamp>
                        </div>
                      );
                    })}
                    {!finalized ? (
                      <div className="mt-3 rounded-lg border border-border bg-secondary/30 p-3">
                        <form action={addReviewRoundAction} className="grid gap-2 md:grid-cols-[1fr_1fr_2fr_auto]">
                          <input type="hidden" name="reviewId" value={review.id} />
                          <select name="senderId" className="field"><option value="">发送方</option>{contacts.map((contact) => <option key={contact.id} value={contact.id}>{contact.name}</option>)}</select>
                          <select name="receiverId" className="field"><option value="">接收方</option>{contacts.map((contact) => <option key={contact.id} value={contact.id}>{contact.name}</option>)}</select>
                          <input name="feedback" placeholder="内容摘要 / 反馈" className="field" />
                          <Button type="submit" variant="outline"><Send className="h-4 w-4" />发送</Button>
                        </form>
                        {confirming ? (
                          <div className="mt-3 flex gap-2">
                            <form action={finalizeReviewAction}><input type="hidden" name="reviewId" value={review.id} /><Button type="submit" size="sm"><CheckCircle2 className="h-4 w-4" />确认定稿</Button></form>
                            <Link href="/meeting-reviews"><Button size="sm" variant="outline">取消</Button></Link>
                          </div>
                        ) : <div className="mt-3"><Link href={`/meeting-reviews?confirm=${review.id}`}><Button size="sm" variant="outline"><CheckCircle2 className="h-4 w-4" />定稿</Button></Link></div>}
                      </div>
                    ) : null}
                  </div>
                </details>
              );
            })}
          </div>
        </section>

        <CollapseCard id="new-review" className="mt-5" title="新建纪要审阅流程" open={reviewNew === "1"}>
          <form action={createMeetingReviewAction} className="grid gap-3 sm:grid-cols-[1fr_2fr_auto]">
            <select name="projectId" className="field"><option value="">选择项目</option>{projects.map((project) => <option key={project.id} value={project.id}>{pname(project)}</option>)}</select>
            <input name="title" placeholder="例如：车辆 POC 第三轮纪要" className="field" />
            <Button type="submit"><Plus className="h-4 w-4" />创建</Button>
          </form>
        </CollapseCard>

        <CollapseCard id="new-question" className="mt-5" title="新建问题" open={openQuestionForm === "1" || Boolean(error)}>
          <form action={createFeedbackQuestionAction} className="grid gap-3 md:grid-cols-[180px_130px_minmax(0,1fr)_auto]">
            <label><span className="flabel">项目</span><select name="projectId" className="field">{projects.map((project) => <option key={project.id} value={project.id}>{pname(project)}</option>)}</select></label>
            <label><span className="flabel">来源</span><select name="source" className="field"><option>客户</option><option>供应商</option><option>我方</option></select></label>
            <label><span className="flabel">问题</span><input name="question" className="field" /></label>
            <div className="flex items-end"><Button type="submit"><Plus className="h-4 w-4" />添加</Button></div>
          </form>
        </CollapseCard>
      </div>
    </AppShell>
  );
}

function Banner({ children, tone = "ok" }: { children: React.ReactNode; tone?: "ok" | "danger" }) {
  return <div className={`mb-4 rounded-lg border px-4 py-3 text-sm ${tone === "danger" ? "border-red-200 bg-red-50 text-red-900" : "border-border bg-card text-muted-foreground"}`}>{children}</div>;
}