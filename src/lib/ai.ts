import { getEffectiveDeepseekKey } from "@/lib/app-settings";
import { SYSTEM_PROMPTS } from "@/lib/ai-prompts";
import type { AiMode } from "@/lib/ai-modes";

// DeepSeek AI 封装。DeepSeek 提供 OpenAI 兼容接口，只需一个 API Key。
// Key 优先读「设置」页保存的值（数据库 AppSetting），回退 .env 的 DEEPSEEK_API_KEY。
// 密钥只在服务端使用，绝不发送到浏览器。

export async function isAiConfigured() {
  return Boolean(await getEffectiveDeepseekKey());
}

export async function runDeepseek(mode: AiMode, input: string): Promise<string> {
  const key = await getEffectiveDeepseekKey();
  if (!key) throw new Error("ai-not-configured");

  const base = (process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com").replace(
    /\/+$/,
    "",
  );
  const model = process.env.DEEPSEEK_MODEL ?? "deepseek-chat";
  const system = SYSTEM_PROMPTS[mode] ?? SYSTEM_PROMPTS.translate;

  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      temperature: mode === "taskIntake" ? 0.1 : 0.4,
      stream: false,
      messages: [
        { role: "system", content: system },
        { role: "user", content: input },
      ],
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`deepseek-failed: ${res.status} ${detail.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return data.choices?.[0]?.message?.content?.trim() ?? "";
}

export type AiConversationMessage = {
  role: "user" | "assistant";
  content: string;
};

export async function runDeepseekConversation(
  system: string,
  messages: AiConversationMessage[],
): Promise<string> {
  const key = await getEffectiveDeepseekKey();
  if (!key) throw new Error("ai-not-configured");

  const base = (process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com").replace(new RegExp("/+$"), "");
  const model = process.env.DEEPSEEK_MODEL ?? "deepseek-chat";

  const res = await fetch(base + "/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + key,
    },
    body: JSON.stringify({
      model,
      temperature: 0.25,
      stream: false,
      messages: [{ role: "system", content: system }, ...messages],
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error("deepseek-failed: " + res.status + " " + detail.slice(0, 200));
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return data.choices?.[0]?.message?.content?.trim() ?? "";
}
