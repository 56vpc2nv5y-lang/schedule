import { NextResponse } from "next/server";
import { AI_MODES, isAiConfigured, runDeepseek, type AiMode } from "@/lib/ai";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const VALID = new Set(AI_MODES.map((m) => m.key));

export async function POST(request: Request) {
  if (!(await isAiConfigured())) {
    return NextResponse.json(
      { error: "还没有配置 DeepSeek API Key。到「设置 → AI 助手」里填一下即可。" },
      { status: 400 },
    );
  }

  let body: { mode?: string; input?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "请求格式有误。" }, { status: 400 });
  }

  const mode = body.mode ?? "";
  const input = (body.input ?? "").trim();

  if (!VALID.has(mode as AiMode)) {
    return NextResponse.json({ error: "未知的模式。" }, { status: 400 });
  }
  if (!input) {
    return NextResponse.json({ error: "请输入内容。" }, { status: 400 });
  }
  const maxInputLength = mode === "weekly" ? 16_000 : 8_000;
  if (input.length > maxInputLength) {
    return NextResponse.json(
      { error: `内容过长，请控制在 ${maxInputLength} 字以内。` },
      { status: 400 },
    );
  }

  try {
    const text = await runDeepseek(mode as AiMode, input);
    return NextResponse.json({ text });
  } catch (error) {
    const message = error instanceof Error ? error.message : "调用失败";
    return NextResponse.json(
      { error: `AI 调用失败：${message}` },
      { status: 502 },
    );
  }
}
