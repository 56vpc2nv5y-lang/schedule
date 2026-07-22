import { NextResponse } from "next/server";
import {
  isAiConfigured,
  runDeepseekConversation,
  type AiConversationMessage,
} from "@/lib/ai";
import { RESUME_CHAT_SYSTEM_PROMPT } from "@/lib/ai-prompts";
import { parseResumePointCandidate } from "@/lib/resume-point-parser";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  if (!(await isAiConfigured())) {
    return NextResponse.json(
      { error: "还没有配置 DeepSeek API Key。到「设置 → AI 助手」里填一下即可。" },
      { status: 400 },
    );
  }

  let body: { messages?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "请求格式有误。" }, { status: 400 });
  }

  if (!Array.isArray(body.messages)) {
    return NextResponse.json({ error: "请先输入想讨论的经历。" }, { status: 400 });
  }

  const messages: AiConversationMessage[] = [];
  for (const item of body.messages.slice(-10)) {
    if (!item || typeof item !== "object") continue;
    const candidate = item as { role?: unknown; content?: unknown };
    const role = candidate.role;
    const content = typeof candidate.content === "string" ? candidate.content.trim() : "";
    if ((role !== "user" && role !== "assistant") || !content) continue;
    if (content.length > 3_500) {
      return NextResponse.json({ error: "单条消息请控制在 3500 字以内。" }, { status: 400 });
    }
    messages.push({ role, content });
  }

  if (!messages.length || !messages.some((message) => message.role === "user")) {
    return NextResponse.json({ error: "请先输入想讨论的经历。" }, { status: 400 });
  }

  try {
    const raw = await runDeepseekConversation(RESUME_CHAT_SYSTEM_PROMPT, messages);
    return NextResponse.json(parseResumePointCandidate(raw));
  } catch (error) {
    const message = error instanceof Error ? error.message : "调用失败";
    return NextResponse.json({ error: "AI 调用失败：" + message }, { status: 502 });
  }
}