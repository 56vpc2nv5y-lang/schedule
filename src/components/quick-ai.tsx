"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Sparkles, Wand2, X } from "lucide-react";
import { createDailyItemsAction, type DailyDraft } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const TYPE_META: Record<
  string,
  { label: string; tone: "active" | "info" | "waiting" | "done" | "neutral" }
> = {
  task: { label: "任务", tone: "info" },
  growth: { label: "成长", tone: "active" },
  question: { label: "问题清单", tone: "waiting" },
  knowledge: { label: "知识库", tone: "neutral" },
};

// 右下角浮动 AI：说说今天做了什么 → 自动拆成任务/成长/问题/知识草稿 → 确认入库
export function QuickAi() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [drafts, setDrafts] = useState<(DailyDraft & { _on: boolean })[] | null>(
    null,
  );
  const [saved, setSaved] = useState(0);
  const [pending, startTransition] = useTransition();

  async function analyze() {
    if (!text.trim() || loading) return;
    setLoading(true);
    setError("");
    setDrafts(null);
    setSaved(0);
    try {
      const res = await fetch("/api/quick-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error ?? "调用失败");
      else {
        const items: DailyDraft[] = Array.isArray(data.items) ? data.items : [];
        if (items.length === 0) setError("没有识别到可记录的内容，换个说法试试。");
        else setDrafts(items.map((it) => ({ ...it, _on: true })));
      }
    } catch {
      setError("网络错误，请重试。");
    } finally {
      setLoading(false);
    }
  }

  function toggle(i: number) {
    setDrafts((prev) =>
      prev ? prev.map((d, idx) => (idx === i ? { ...d, _on: !d._on } : d)) : prev,
    );
  }
  function edit(i: number, key: keyof DailyDraft, value: string) {
    setDrafts((prev) =>
      prev ? prev.map((d, idx) => (idx === i ? { ...d, [key]: value } : d)) : prev,
    );
  }

  function createAll() {
    if (!drafts) return;
    const chosen = drafts.filter((d) => d._on).map(({ _on, ...rest }) => rest);
    if (chosen.length === 0) return;
    startTransition(async () => {
      const res = await createDailyItemsAction(chosen);
      setSaved(res.created);
      setDrafts(null);
      setText("");
      router.refresh();
    });
  }

  return (
    <>
      {/* 悬浮按钮 */}
      <button
        onClick={() => setOpen((v) => !v)}
        title="AI 小助手：说说今天做了什么"
        className="fixed bottom-5 right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105"
      >
        {open ? <X className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
      </button>

      {open ? (
        <div className="fixed bottom-20 right-5 z-40 flex max-h-[70vh] w-[92vw] max-w-md flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
          <div className="border-b border-border bg-secondary/40 px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Wand2 className="h-4 w-4 text-primary" />
              AI 小助手
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              用大白话说今天做了什么，我帮你拆成任务/成长/问题/知识，确认后一键入库。
            </p>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              placeholder="例如：今天翻译完北理工的回复发给新加坡了；下午催了樊老师缪子材料；学到 muon tomography 是用宇宙射线做成像；明天要背合肥院讲解稿"
              className="field w-full resize-y text-sm"
              style={{ height: "auto" }}
            />
            <Button
              onClick={analyze}
              disabled={loading || !text.trim()}
              className="w-full"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {loading ? "分析中…" : "分析并生成草稿"}
            </Button>

            {error ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-900">
                {error}
              </div>
            ) : null}
            {saved > 0 ? (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 text-xs text-emerald-900">
                已创建 {saved} 条，去对应页面查看。
              </div>
            ) : null}

            {drafts ? (
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground">
                  勾选要创建的（可改标题），未勾选的忽略：
                </div>
                {drafts.map((d, i) => {
                  const meta = TYPE_META[d.type] ?? TYPE_META.task;
                  return (
                    <div
                      key={i}
                      className={`rounded-lg border p-2.5 ${
                        d._on ? "border-primary/30 bg-primary/5" : "border-border opacity-60"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={d._on}
                          onChange={() => toggle(i)}
                          className="h-4 w-4 shrink-0"
                        />
                        <Badge tone={meta.tone}>{meta.label}</Badge>
                        {d.project ? (
                          <span className="truncate text-[11px] text-muted-foreground">
                            {d.project}
                          </span>
                        ) : null}
                        {d.date ? (
                          <span className="tnum ml-auto text-[11px] text-muted-foreground">
                            {d.date}
                          </span>
                        ) : null}
                      </div>
                      <input
                        value={d.title ?? ""}
                        onChange={(e) => edit(i, "title", e.target.value)}
                        className="field field-sm mt-2 w-full"
                      />
                    </div>
                  );
                })}
                <Button
                  onClick={createAll}
                  disabled={pending || !drafts.some((d) => d._on)}
                  className="w-full"
                >
                  {pending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  创建选中项
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
