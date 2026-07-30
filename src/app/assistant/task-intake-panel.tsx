"use client";

import { useState } from "react";
import { Check, ImagePlus, Loader2, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type PriorityValue = "HIGH" | "MEDIUM" | "LOW";
type Candidate = { title: string; description: string; priority: PriorityValue; minutes: number };
type ProjectOption = { id: string; name: string };

function todayKey() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

export function TaskIntakePanel({ projects, dbReady }: { projects: ProjectOption[]; dbReady: boolean }) {
  const [projectId, setProjectId] = useState("");
  const [dueDate, setDueDate] = useState(todayKey);
  const [input, setInput] = useState("");
  const [items, setItems] = useState<Candidate[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [ocrProgress, setOcrProgress] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function updateItem(index: number, patch: Partial<Candidate>) {
    setItems((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  }

  async function readScreenshot(file: File) {
    setError(""); setMessage(""); setOcrProgress(0);
    try {
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("chi_sim+eng", 1, {
        workerPath: "/tesseract/worker.min.js",
        corePath: "/tesseract/tesseract-core-simd-lstm.wasm.js",
        langPath: "/tessdata",
        gzip: false,
        logger: (event: { status: string; progress: number }) => {
          if (event.status === "recognizing text") setOcrProgress(Math.round(event.progress * 100));
        },
      });
      const result = await worker.recognize(file);
      await worker.terminate();
      const text = result.data.text.trim();
      if (!text) throw new Error("empty-ocr");
      setInput((current) => (current.trim() ? `${current.trim()}\n${text}` : text));
      setMessage("截图文字已在本机识别，可以继续修改后再整理。");
    } catch {
      setError("截图文字识别失败，请换一张更清晰、文字更大的截图重试。");
    } finally {
      setOcrProgress(null);
    }
  }

  async function analyze() {
    if (!input.trim() || analyzing) return;
    setAnalyzing(true); setError(""); setMessage("");
    try {
      const projectName = projects.find((project) => project.id === projectId)?.name ?? "";
      const response = await fetch("/api/ai/task-intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input, projectName }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "整理失败");
      setItems(data.items ?? []);
      setMessage(data.source === "ai" ? "AI 已整理，请确认后写入看板。" : "AI 暂时未响应，已用本地规则拆分，请确认后写入。");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "整理失败，请重试。");
    } finally {
      setAnalyzing(false);
    }
  }

  async function commit() {
    if (!dbReady || items.length === 0 || committing) return;
    setCommitting(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/ai/task-intake/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, dueDate, items }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "写入失败");
      setMessage(`已新建 ${data.created} 项任务，排入计划 ${data.scheduled} 项${data.skipped ? `，跳过重复 ${data.skipped} 项` : ""}。`);
      setItems([]); setInput("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "写入失败，请重试。");
    } finally {
      setCommitting(false);
    }
  }

  return (
    <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold"><Sparkles className="h-4 w-4 text-primary" />说完就记进看板</h2>
          <p className="mt-1 text-sm text-muted-foreground">临时工作用分号或换行隔开；截止日期默认今天。</p>
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-secondary">
          {ocrProgress === null ? <ImagePlus className="h-4 w-4" /> : <Loader2 className="h-4 w-4 animate-spin" />}
          {ocrProgress === null ? "识别截图" : `识别 ${ocrProgress}%`}
          <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" disabled={ocrProgress !== null} onChange={(event) => { const file = event.target.files?.[0]; if (file) void readScreenshot(file); event.currentTarget.value = ""; }} />
        </label>
      </div>

      <div className="grid gap-3">
        <label><span className="flabel">所属项目</span><select value={projectId} onChange={(event) => setProjectId(event.target.value)} className="field"><option value="">个人 / 内部事务</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label>
        <label><span className="flabel">截止日期</span><input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} className="field" /></label>
        <label><span className="flabel">我做了什么 / 接下来要做什么</span><textarea value={input} onChange={(event) => setInput(event.target.value)} className="field min-h-28 resize-y" placeholder="例如：问 Muru 会议时间；整理反馈并翻译英文；发给供应商确认" /></label>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3"><Button type="button" onClick={analyze} disabled={!input.trim() || analyzing || ocrProgress !== null}>{analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}{analyzing ? "正在整理..." : "AI 整理"}</Button><span className="text-xs text-muted-foreground">截图仅在本机识别；点击整理后才发送文字。</span></div>
      {error ? <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div> : null}
      {message ? <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{message}</div> : null}

      {items.length > 0 ? <div className="mt-5 space-y-2">{items.map((item, index) => <div key={`${item.title}-${index}`} className="grid gap-2 border-b border-border py-3 md:grid-cols-[minmax(0,1fr)_120px_110px_36px]"><input value={item.title} onChange={(event) => updateItem(index, { title: event.target.value })} className="field field-sm" aria-label={`任务 ${index + 1} 标题`} /><select value={item.priority} onChange={(event) => updateItem(index, { priority: event.target.value as PriorityValue })} className="field field-sm"><option value="HIGH">高优先</option><option value="MEDIUM">中优先</option><option value="LOW">低优先</option></select><select value={item.minutes} onChange={(event) => updateItem(index, { minutes: Number(event.target.value) })} className="field field-sm">{[30,45,60,90,120,180].map((minutes) => <option key={minutes} value={minutes}>{minutes} 分钟</option>)}</select><Button type="button" size="icon" variant="ghost" title="移除" onClick={() => setItems((current) => current.filter((_, itemIndex) => itemIndex !== index))}><Trash2 className="h-4 w-4" /></Button></div>)}<div className="flex justify-end pt-2"><Button type="button" onClick={commit} disabled={!dbReady || committing}>{committing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}{committing ? "正在写入..." : "写入看板"}</Button></div></div> : null}
    </section>
  );
}
