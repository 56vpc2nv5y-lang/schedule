import { NextResponse } from "next/server";
import { isAiConfigured, runDeepseek } from "@/lib/ai";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type PriorityValue = "HIGH" | "MEDIUM" | "LOW";
type Candidate = {
  title: string;
  description: string;
  priority: PriorityValue;
  minutes: number;
};

const ALLOWED_MINUTES = [30, 45, 60, 90, 120, 180];

function localPriority(text: string): PriorityValue {
  if (/紧急|马上|尽快|今天|上午|下午|截止|客户等|汇报|会议|发送|提交/i.test(text)) {
    return "HIGH";
  }
  if (/以后|有空|备用|参考|了解|学习/i.test(text)) return "LOW";
  return "MEDIUM";
}

function localMinutes(text: string) {
  if (/ppt|方案|报告|翻译|整理|查缺补漏|简历|分析/i.test(text)) return 90;
  if (/询问|确认|回复|发送|跟踪|报备/i.test(text)) return 30;
  return 60;
}

function splitLocally(input: string): Candidate[] {
  return input
    .split(/[；;\n]+/)
    .map((part) => part.replace(/^[-*\d.、)）\s]+/, "").trim())
    .filter(Boolean)
    .slice(0, 20)
    .map((title) => ({
      title,
      description: "",
      priority: localPriority(title),
      minutes: localMinutes(title),
    }));
}

function normalizeItems(value: unknown): Candidate[] {
  if (!value || typeof value !== "object") return [];
  const items = (value as { items?: unknown }).items;
  if (!Array.isArray(items)) return [];

  return items
    .map((item): Candidate | null => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const title = String(row.title ?? "").trim().slice(0, 180);
      if (!title) return null;
      const rawPriority = String(row.priority ?? "MEDIUM").toUpperCase();
      const priority: PriorityValue =
        rawPriority === "HIGH" || rawPriority === "LOW" ? rawPriority : "MEDIUM";
      const rawMinutes = Number(row.minutes ?? 60);
      const minutes = ALLOWED_MINUTES.reduce((best, current) =>
        Math.abs(current - rawMinutes) < Math.abs(best - rawMinutes) ? current : best,
      );
      return {
        title,
        description: String(row.description ?? "").trim().slice(0, 600),
        priority,
        minutes,
      };
    })
    .filter((item): item is Candidate => Boolean(item))
    .slice(0, 20);
}

function parseAiJson(text: string) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return [];
  try {
    return normalizeItems(JSON.parse(text.slice(start, end + 1)));
  } catch {
    return [];
  }
}

export async function POST(request: Request) {
  let body: { input?: string; projectName?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "请求格式有误。" }, { status: 400 });
  }

  const input = String(body.input ?? "").trim();
  if (!input) {
    return NextResponse.json({ error: "请先输入工作内容。" }, { status: 400 });
  }
  if (input.length > 12_000) {
    return NextResponse.json({ error: "内容过长，请控制在 12000 字以内。" }, { status: 400 });
  }

  const fallback = splitLocally(input);
  if (fallback.length === 0) {
    return NextResponse.json({ error: "没有识别出可录入的任务。" }, { status: 400 });
  }

  if (await isAiConfigured()) {
    try {
      const projectContext = body.projectName ? `所属项目：${body.projectName}\n` : "";
      const text = await runDeepseek("taskIntake", `${projectContext}原始工作记录：\n${input}`);
      const items = parseAiJson(text);
      if (items.length > 0) return NextResponse.json({ items, source: "ai" });
    } catch {
      // AI 暂时不可用时仍返回本地拆分结果，不阻断录入。
    }
  }

  return NextResponse.json({ items: fallback, source: "local" });
}
