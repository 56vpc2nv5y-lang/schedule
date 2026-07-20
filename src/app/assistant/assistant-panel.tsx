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
import { AI_MODES, PROMPT_PRESETS, type AiMode } from "@/lib/ai";
import { Button } from "@/components/ui/button";
import { useDict } from "@/components/layout/locale-provider";

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
}: {
  configured: boolean;
  templates: Template[];
  dbReady: boolean;
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
      const params = new URLSearchParams({
        start: weekStart,
        end: weekEnd,
      });
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
    <div className="space-y-5">
      {!configured ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          <span>{t.assistant.notConfigured}</span>
          <Link href="/settings#ai">
            <Button variant="outline" size="sm">
              {t.assistant.goSettings}
            </Button>
          </Link>
        </div>
      ) : null}

      {/* 场景模板：一键把填空 prompt 放进输入框 */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="mb-3 text-sm font-medium">{t.assistant.presets}</div>
        <div className="flex flex-wrap gap-2">
          {PROMPT_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => applyPreset(preset.mode, preset.body)}
              className="rounded-lg border border-border bg-secondary/40 px-3 py-1.5 text-sm text-foreground transition-colors hover:border-primary/40 hover:bg-accent"
            >
              {preset.label}
            </button>
          ))}
          {templates.map((tpl) => (
            <span
              key={tpl.id}
              className="inline-flex items-center gap-1 rounded-lg border border-primary/25 bg-primary/5 pl-3 text-sm"
            >
              <button
                onClick={() => applyPreset("email", tpl.content)}
                className="py-1.5 text-foreground hover:text-primary"
              >
                {tpl.name}
              </button>
              <form action={deletePromptTemplateAction}>
                <input type="hidden" name="id" value={tpl.id} />
                <button
                  type="submit"
                  className="px-2 py-1.5 text-muted-foreground hover:text-red-600"
                  title={t.common.delete}
                >
                  <X className="h-3 w-3" />
                </button>
              </form>
            </span>
          ))}
        </div>

        {dbReady ? (
          <div className="mt-3">
            {showSave ? (
              <form
                action={createPromptTemplateAction}
                className="grid gap-2 rounded-lg border border-border bg-secondary/30 p-3 sm:grid-cols-[200px_1fr_auto]"
              >
                <input
                  name="name"
                  placeholder={t.assistant.templateName}
                  className="field field-sm"
                />
                <input
                  name="content"
                  defaultValue={input}
                  placeholder={t.assistant.templateBody}
                  className="field field-sm"
                />
                <Button type="submit" size="sm" variant="outline">
                  {t.common.save}
                </Button>
              </form>
            ) : (
              <button
                onClick={() => setShowSave(true)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
              >
                <BookmarkPlus className="h-3.5 w-3.5" />
                {t.assistant.saveTemplate}
              </button>
            )}
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        {AI_MODES.map((m) => (
          <button
            key={m.key}
            onClick={() => setMode(m.key)}
            className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
              mode === m.key
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="mb-2 text-sm font-medium">{t.assistant.input}</div>
          <p className="mb-3 text-xs text-muted-foreground">{activeMode?.hint}</p>
          {mode === "weekly" ? (
            <div className="mb-3 grid gap-2 rounded-lg border border-border bg-secondary/30 p-3 sm:grid-cols-[1fr_1fr_auto]">
              <label className="space-y-1">
                <span className="text-xs text-muted-foreground">开始日期</span>
                <input
                  type="date"
                  value={weekStart}
                  onChange={(event) => setWeekStart(event.target.value)}
                  className="field field-sm w-full"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs text-muted-foreground">结束日期</span>
                <input
                  type="date"
                  value={weekEnd}
                  onChange={(event) => setWeekEnd(event.target.value)}
                  className="field field-sm w-full"
                />
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={loadWeeklyEvidence}
                disabled={!dbReady || loadingEvidence || !weekStart || !weekEnd}
                className="self-end"
              >
                {loadingEvidence ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CalendarRange className="h-4 w-4" />
                )}
                {loadingEvidence ? "正在读取" : "载入看板记录"}
              </Button>
            </div>
          ) : null}
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t.assistant.placeholder}
            className="field h-72 w-full resize-y"
          />
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {input.length} {t.assistant.chars}
            </span>
            <Button
              onClick={run}
              disabled={!configured || loading || loadingEvidence || !input.trim()}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {loading ? t.assistant.generating : t.assistant.generate}
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-sm font-medium">{t.assistant.output}</div>
            {output ? (
              <Button variant="ghost" size="sm" onClick={copyOutput}>
                {copied ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                {copied ? t.assistant.copied : t.assistant.copy}
              </Button>
            ) : null}
          </div>
          {error ? (
            <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900">
              {error}
            </div>
          ) : null}
          <div className="min-h-72 whitespace-pre-wrap rounded-lg bg-secondary/40 p-3 text-sm leading-6">
            {output || (
              <span className="text-muted-foreground">
                {t.assistant.resultPlaceholder}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
