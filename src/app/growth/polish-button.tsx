"use client";

import { useState } from "react";
import { Check, Copy, Loader2, Sparkles } from "lucide-react";
import { useDict } from "@/components/layout/locale-provider";

/** 成长档案条目的「AI 润色成简历句」按钮，结果就地展开 */
export function PolishButton({
  title,
  detail,
  configured,
}: {
  title: string;
  detail?: string;
  configured: boolean;
}) {
  const t = useDict();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function polish() {
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "resume",
          input: detail ? `${title}\n补充背景：${detail}` : title,
        }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error ?? "调用失败");
      else setResult(data.text ?? "");
    } catch {
      setError("网络错误，请重试。");
    } finally {
      setLoading(false);
    }
  }

  async function copy() {
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div>
      <button
        onClick={polish}
        disabled={!configured || loading}
        title={configured ? undefined : t.growth.aiNeedKey}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Sparkles className="h-3.5 w-3.5" />
        )}
        {loading ? t.growth.aiWorking : t.growth.aiPolish}
      </button>

      {error ? (
        <div className="mt-2 rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-900">
          {error}
        </div>
      ) : null}
      {result ? (
        <div className="mt-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="whitespace-pre-wrap text-sm leading-6">{result}</div>
            <button
              onClick={copy}
              className="shrink-0 text-muted-foreground hover:text-primary"
              title={t.growth.aiCopy}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
