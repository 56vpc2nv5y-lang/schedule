"use client";

import { useState } from "react";
import { BookmarkPlus, Loader2, MessageCircle, Send, X } from "lucide-react";
import { createResumePointAction } from "@/app/actions";
import { Button } from "@/components/ui/button";

type ResumePointDraft = {
  title: string;
  chinese: string;
  english: string;
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  visible?: string;
  point?: ResumePointDraft;
};

type ProjectOption = {
  id: string;
  name: string;
};

type SourceContext = {
  title: string;
  detail?: string;
  projectId?: string;
  projectName?: string;
  happenedAt?: string;
};

function sourcePrompt(source: SourceContext) {
  const lines = [
    "我想把下面这段真实经历打磨成一条中英文简历要点。",
    "经历标题：" + source.title,
  ];
  if (source.projectName) lines.push("项目：" + source.projectName);
  if (source.happenedAt) lines.push("日期：" + source.happenedAt);
  if (source.detail) lines.push("事实材料：" + source.detail);
  lines.push("请先给我一版克制、可直接使用的候选要点；如果确实缺少关键信息，再只问我最重要的问题。");
  return lines.join("\n");
}

export function ResumeCoach({
  configured,
  projects,
  source,
}: {
  configured: boolean;
  projects: ProjectOption[];
  source?: SourceContext;
}) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function openCoach() {
    setOpen(true);
    setError("");
    if (!draft && messages.length === 0 && source) {
      setDraft(sourcePrompt(source));
    }
  }

  function closeCoach() {
    setOpen(false);
    setError("");
  }

  async function send() {
    const content = draft.trim();
    if (!content || loading || !configured) return;

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content }];
    setMessages(nextMessages);
    setDraft("");
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/ai/resume-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.map((message) => ({
            role: message.role,
            content: message.content,
          })),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "简历助手暂时无法回复");

      const point = data.point as ResumePointDraft | undefined;
      const reply = String(data.reply ?? "").trim();
      const pointContext = point
        ? ["候选要点：", "中文：" + point.chinese, "English: " + point.english].join("\n")
        : "";
      setMessages([
        ...nextMessages,
        {
          role: "assistant",
          content: [reply, pointContext].filter(Boolean).join("\n\n"),
          visible: reply,
          point,
        },
      ]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "网络错误，请重试。");
      setDraft(content);
    } finally {
      setLoading(false);
    }
  }

  const triggerLabel = source ? "在对话中润色" : "简历对话";

  return (
    <>
      <Button
        type="button"
        variant={source ? "ghost" : "outline"}
        size="sm"
        onClick={openCoach}
        title={configured ? "与简历助手连续讨论、迭代候选要点" : "请先在设置中配置 AI Key"}
        disabled={!configured}
      >
        <MessageCircle className="h-4 w-4" />
        {triggerLabel}
      </Button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/25 p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeCoach();
          }}
        >
          <section
            aria-label="简历对话助手"
            aria-modal="true"
            role="dialog"
            className="flex max-h-[calc(100vh-2rem)] w-full max-w-3xl flex-col overflow-hidden rounded-lg border border-border bg-card shadow-2xl"
          >
            <header className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
              <div>
                <h2 className="text-base font-semibold">简历对话助手</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  像和编辑一起改稿：先给可用版本，再围绕事实、语气和岗位逐步调整。
                </p>
              </div>
              <Button type="button" size="icon" variant="ghost" onClick={closeCoach} title="关闭">
                <X className="h-4 w-4" />
              </Button>
            </header>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-secondary/20 p-5">
              {messages.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border bg-card p-4 text-sm leading-6 text-muted-foreground">
                  直接告诉我你做了什么、想投什么岗位，或从某条成长记录进入对话。我会保留这次窗口里的上下文。
                </div>
              ) : null}

              {messages.map((message, index) => (
                <div
                  key={index}
                  className={message.role === "user" ? "ml-auto max-w-[88%]" : "mr-auto max-w-[92%]"}
                >
                  <div
                    className={
                      message.role === "user"
                        ? "rounded-lg bg-primary px-4 py-3 text-sm leading-6 text-primary-foreground"
                        : "rounded-lg border border-border bg-card px-4 py-3 text-sm leading-6 text-foreground"
                    }
                  >
                    {message.visible ?? message.content}
                  </div>

                  {message.point ? (
                    <form
                      action={createResumePointAction}
                      className="mt-2 rounded-lg border border-primary/25 bg-card p-4"
                    >
                      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-primary">
                        <BookmarkPlus className="h-4 w-4" />
                        候选要点：可以直接编辑后收藏
                      </div>
                      <div className="grid gap-3">
                        <label>
                          <span className="flabel">要点标题</span>
                          <input name="title" defaultValue={message.point.title} className="field field-sm" required />
                        </label>
                        <label>
                          <span className="flabel">中文</span>
                          <textarea name="chinese" defaultValue={message.point.chinese} className="field min-h-20 resize-y" required />
                        </label>
                        <label>
                          <span className="flabel">English</span>
                          <textarea name="english" defaultValue={message.point.english} className="field min-h-20 resize-y" required />
                        </label>
                        <label>
                          <span className="flabel">关联项目</span>
                          <select name="projectId" className="field field-sm" defaultValue={source?.projectId ?? ""}>
                            <option value="">不关联项目</option>
                            {projects.map((project) => (
                              <option key={project.id} value={project.id}>{project.name}</option>
                            ))}
                          </select>
                        </label>
                        <input name="sourceNote" type="hidden" value="简历对话助手候选要点" />
                        <div className="flex justify-end">
                          <Button type="submit" size="sm">
                            <BookmarkPlus className="h-4 w-4" />
                            收藏到简历库
                          </Button>
                        </div>
                      </div>
                    </form>
                  ) : null}
                </div>
              ))}

              {loading ? (
                <div className="mr-auto flex w-fit items-center gap-2 rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  正在一起改这条经历...
                </div>
              ) : null}
            </div>

            <div className="border-t border-border bg-card p-4">
              {error ? (
                <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900">
                  {error}
                </div>
              ) : null}
              <label className="block">
                <span className="sr-only">发送给简历助手</span>
                <textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  className="field min-h-24 resize-y"
                  placeholder="例如：我不是独立完成分析，是整合技术同事的材料；请改得更像解决方案岗。"
                  disabled={loading}
                />
              </label>
              <div className="mt-3 flex items-center justify-between gap-3">
                <span className="text-xs text-muted-foreground">仅发送你在这次对话中输入的事实给已配置的 AI。</span>
                <Button type="button" onClick={send} disabled={!draft.trim() || loading || !configured}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  发送
                </Button>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}