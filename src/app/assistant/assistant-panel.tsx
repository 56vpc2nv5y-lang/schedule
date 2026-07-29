"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BookmarkPlus,
  CalendarRange,
  Check,
  Copy,
  Loader2,
  Sparkles,
  X,
} from "lucide-react";
import {
  createPromptTemplateAction,
  deletePromptTemplateAction,
} from "@/app/actions";
import { AI_MODES, PROMPT_PRESETS, type AiMode } from "@/lib/ai-modes";
import { Button } from "@/components/ui/button";
import { useDict } from "@/components/layout/locale-provider";
import { TaskIntakePanel } from "@/app/assistant/task-intake-panel";

type Template = { id: string; name: string; content: string };

function formatDateInput(value: Date) {
  const offset = value.getTimezoneOffset() * 60_000;
  return new Date(value.getTime() - offset).toISOString().slice(0, 10);
}

function currentWeekRange() {
  const now = new Date();
  const weekday = (now.getDay() + 6) % 7;
  const start = new Date(now);
  start.setDate(now.getDate() - weekday);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start: formatDateInput(start), end: formatDateInput(end) };
}

export function AssistantPanel({
  configured,
  templates,
  dbReady,
  projects,
}: {
  configured: boolean;
  templates: Template[];
  dbReady: boolean;
  projects: { id: string; name: string }[];
}) {
  const t = useDict();
  const [initialWeek] = useState(currentWeekRange);
  const [mode, setMode] = useState<AiMode>("email");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingEvidence, setLoadingEvidence] = useState(false);
  const [weekStart, setWeekStart] = useState(initialWeek.start);
  const [weekEnd, setWeekEnd] = useState(initialWeek.end);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [showSave, setShowSave] = useState(false);

  const activeMode = AI_MODES.find((m) => m.key === mode);

  function applyPreset(presetMode: AiMode, body: string) {
    setMode(presetMode);
    setInput(body);
    setOutput("");
    setError("");
  }

  async function loadWeeklyEvidence() {
    if (!dbReady || loadingEvidence || !weekStart || !weekEnd) return;
    setLoadingEvidence(true);
    setError("");
    setOutput("");
    try {
      const params = new URLSearchParams({ start: weekStart, end: weekEnd });
      const res = await fetch(`/api/weekly-report?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "读取周报数据失败");
      } else {
        setMode("weekly");
        setInput(data.input ?? "");
      }
    } catch {
      setError("读取周报数据失败，请重试。");
    } finally {
      setLoadingEvidence(false);
    }
  }

  async function run() {
    if (!input.trim() || loading) return;
    setLoading(true);
    setError("");
    setOutput("");
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, input }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "调用失败");
      } else {
        setOutput(data.text ?? "");
      }
    } catch {
      setError("网络错误，请重试。");
    } finally {
      setLoading(false);
    }
  }

  async function copyOutput() {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="chat-panel border border-border bg-card">
        {!configured ? (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
            <span>{t.assistant.notConfigured}</span>
            <Link href="/settings#ai">
              <Button variant="outline" size="sm">{t.assistant.goSettings}</Button>
            </Link>
          </div>
        ) : null}

        <div className="mb-4 flex flex-wrap gap-2">
          {AI_MODES.map((m) => (
            <button
              key={m.key}
              onClick={() => setMode(m.key)}
              className={mode === m.key ? "mode-pill border-primary px-3 py-1.5 text-sm text-primary" : "mode-pill px-3 py-1.5 text-sm"}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="chat-scroll">
          <div className="bubble ai">
            <div className="mb-1 font-medium">Sunny AI</div>
            <div className="text-muted-foreground">选择场景模板，贴入上下文，我会按当前看板里的项目和任务语言帮你整理。</div>
            <div className="card-mini">
              <div className="text-xs font-medium text-muted-foreground">当前模式</div>
              <div className="mt-1 text-sm">{activeMode?.label}</div>
            </div>
          </div>

          {input.trim() ? (
            <div className="bubble me whitespace-pre-wrap">{input}</div>
          ) : null}

          {loading ? (
            <div className="bubble ai flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t.assistant.generating}
            </div>
          ) : null}

          {error ? <div className="bubble ai text-red-700">{error}</div> : null}

          {output ? (
            <div className="bubble ai whitespace-pre-wrap">
              {output}
              <div className="card-mini flex items-center justify-between gap-3">
                <span className="text-sm">已生成回复草稿</span>
                <Button variant="outline" size="sm" onClick={copyOutput}>
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? t.assistant.copied : t.assistant.copy}
                </Button>
              </div>
            </div>
          ) : null}
        </div>

        {mode === "weekly" ? (
          <div className="mt-4 grid gap-2 rounded border border-border bg-secondary/30 p-3 sm:grid-cols-[1fr_1fr_auto]">
            <label className="space-y-1">
              <span className="flabel">开始日期</span>
              <input type="date" value={weekStart} onChange={(event) => setWeekStart(event.target.value)} className="field field-sm w-full" />
            </label>
            <label className="space-y-1">
              <span className="flabel">结束日期</span>
              <input type="date" value={weekEnd} onChange={(event) => setWeekEnd(event.target.value)} className="field field-sm w-full" />
            </label>
            <Button type="button" variant="outline" size="sm" onClick={loadWeeklyEvidence} disabled={!dbReady || loadingEvidence || !weekStart || !weekEnd} className="self-end">
              {loadingEvidence ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarRange className="h-4 w-4" />}
              {loadingEvidence ? "正在读取" : "载入看板记录"}
            </Button>
          </div>
        ) : null}

        <div className="mt-4 rounded border border-border bg-secondary/20 p-3">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={t.assistant.placeholder}
            className="field h-32 w-full resize-y"
          />
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground">{input.length} {t.assistant.chars}</span>
            <Button onClick={run} disabled={!configured || loading || loadingEvidence || !input.trim()}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {loading ? t.assistant.generating : t.assistant.generate}
            </Button>
          </div>
        </div>
      </section>

      <aside className="space-y-5">
        <TaskIntakePanel projects={projects} dbReady={dbReady} />

        <div className="sunny-panel border border-border p-4">
          <div className="mb-3 text-sm font-medium">{t.assistant.presets}</div>
          <div className="flex flex-wrap gap-2">
            {PROMPT_PRESETS.map((preset) => (
              <button key={preset.id} onClick={() => applyPreset(preset.mode, preset.body)} className="chip hover:text-primary">
                {preset.label}
              </button>
            ))}
            {templates.map((tpl) => (
              <span key={tpl.id} className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary/40 pl-3 text-sm">
                <button onClick={() => applyPreset("email", tpl.content)} className="py-1.5 text-foreground hover:text-primary">
                  {tpl.name}
                </button>
                <form action={deletePromptTemplateAction}>
                  <input type="hidden" name="id" value={tpl.id} />
                  <button type="submit" className="px-2 py-1.5 text-muted-foreground hover:text-red-600" title={t.common.delete}>
                    <X className="h-3 w-3" />
                  </button>
                </form>
              </span>
            ))}
          </div>

          {dbReady ? (
            <div className="mt-3">
              {showSave ? (
                <form action={createPromptTemplateAction} className="grid gap-2 rounded border border-border bg-secondary/30 p-3">
                  <input name="name" placeholder={t.assistant.templateName} className="field field-sm" />
                  <input name="content" defaultValue={input} placeholder={t.assistant.templateBody} className="field field-sm" />
                  <Button type="submit" size="sm" variant="outline">{t.common.save}</Button>
                </form>
              ) : (
                <button onClick={() => setShowSave(true)} className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline">
                  <BookmarkPlus className="h-3.5 w-3.5" />
                  {t.assistant.saveTemplate}
                </button>
              )}
            </div>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
