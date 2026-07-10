import { NextResponse } from "next/server";
import { getEffectiveDeepseekKey } from "@/lib/app-settings";
import { getProjectsForView } from "@/lib/database-data";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// 把用户口述的"今天做了什么"抽取成结构化草稿，返回给前端确认后再入库。
const SYSTEM = `你是一个工作助理，负责把用户口述的一天工作，拆解成结构化的待办/记录条目。
只输出一个 JSON 数组，不要任何解释文字、不要 markdown 代码块。每个元素形如：
{"type":"task|growth|question|knowledge","title":"简短标题","project":"匹配到的项目名或空串","date":"YYYY-MM-DD或空串","detail":"补充说明或空串","category":"成长类型(仅type=growth时:成果亮点/技能积累/复盘教训/证书培训/人脉资源)或空串","source":"提问方(仅type=question时:甲方/供应商/我方)或空串"}
判断规则：
- 已经做完、值得写进简历的成果 → growth（填 category）
- 待办、要跟进、要翻译、要催的事 → task
- 甲方/供应商提出的、需要跟踪解决的问题 → question（必须能匹配到项目）
- 学到的新知识点/术语 → knowledge
project 字段只能从给定的项目列表里选最匹配的一个，匹配不上就留空串。`;

export async function POST(request: Request) {
  const key = await getEffectiveDeepseekKey();
  if (!key) {
    return NextResponse.json(
      { error: "还没配置 AI 密钥，去「设置 → AI 助手」填一下。" },
      { status: 400 },
    );
  }

  let body: { text?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "请求格式有误。" }, { status: 400 });
  }
  const text = (body.text ?? "").trim();
  if (!text) return NextResponse.json({ error: "先说说今天做了什么。" }, { status: 400 });

  const projects = await getProjectsForView();
  const projectNames = projects.map((p) => p.nameZh).join("、");

  const base = (process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com").replace(
    /\/+$/,
    "",
  );
  const model = process.env.DEEPSEEK_MODEL ?? "deepseek-chat";

  try {
    const res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        stream: false,
        messages: [
          { role: "system", content: SYSTEM },
          {
            role: "user",
            content: `现有项目列表：${projectNames || "（暂无）"}\n\n我今天的工作：\n${text}`,
          },
        ],
      }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return NextResponse.json(
        { error: `AI 调用失败：${res.status} ${detail.slice(0, 120)}` },
        { status: 502 },
      );
    }
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    let content = data.choices?.[0]?.message?.content?.trim() ?? "[]";
    // 去掉可能的 ```json 包裹
    content = content.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
    const firstBracket = content.indexOf("[");
    const lastBracket = content.lastIndexOf("]");
    if (firstBracket >= 0 && lastBracket > firstBracket) {
      content = content.slice(firstBracket, lastBracket + 1);
    }
    let items: unknown;
    try {
      items = JSON.parse(content);
    } catch {
      return NextResponse.json({ error: "AI 返回格式解析失败，换个说法再试。" }, { status: 502 });
    }
    return NextResponse.json({ items: Array.isArray(items) ? items : [] });
  } catch {
    return NextResponse.json({ error: "网络错误，请重试。" }, { status: 502 });
  }
}
