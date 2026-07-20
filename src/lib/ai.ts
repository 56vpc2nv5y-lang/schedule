import { getEffectiveDeepseekKey } from "@/lib/app-settings";
import { SYSTEM_PROMPTS } from "@/lib/ai-prompts";

// DeepSeek AI 封装。DeepSeek 提供 OpenAI 兼容接口，只需一个 API Key。
// Key 优先读「设置」页保存的值（数据库 AppSetting），回退 .env 的 DEEPSEEK_API_KEY。
// 密钥只在服务端使用，绝不发送到浏览器。

export type AiMode =
  | "translate"
  | "email"
  | "invitation"
  | "summary"
  | "reception"
  | "resume"
  | "weekly";

export const AI_MODES: { key: AiMode; label: string; hint: string }[] = [
  { key: "translate", label: "中英互译", hint: "粘贴中文或英文，自动翻成另一种语言" },
  { key: "email", label: "商务邮件", hint: "给要点或草稿，生成/润色发给甲方或供应商的邮件" },
  { key: "invitation", label: "展会/来访邀请函", hint: "给活动信息，生成中英双语正式邀请函" },
  { key: "summary", label: "会议纪要总结", hint: "粘贴会议记录或长文，整理成结论/待办/待确认" },
  { key: "reception", label: "接待讲解词", hint: "给公司/项目/路线信息，生成中英双语讲解稿" },
  { key: "resume", label: "简历润色", hint: "把一条工作成果润色成可写进简历的中英文要点" },
  { key: "weekly", label: "周报", hint: "从看板载入一周工作证据，按项目整理成周报" },
];

// 场景预设：一键把「填空模板」放进输入框，不用自己想 prompt。
// 每条绑定一个 mode，body 里用【】标出要填的内容。
export const PROMPT_PRESETS: {
  id: string;
  label: string;
  mode: AiMode;
  body: string;
}[] = [
  {
    id: "boss-report",
    label: "向领导汇报进度",
    mode: "email",
    body: "帮我给领导写一段简洁的项目进度汇报（微信/邮件都能用）：\n项目：【项目名】\n本周进展：【做了什么】\n目前卡点/风险：【卡在哪】\n需要领导支持：【要什么支持，没有就写无】\n语气：简练、有条理、不邀功不甩锅。",
  },
  {
    id: "supplier-push",
    label: "催供应商交付",
    mode: "email",
    body: "帮我给高校供应商写一封催进度的邮件，要客气但明确：\n对方：【老师/团队名】\n事项：【催什么，比如第二轮纪要反馈 / 方案 PPT】\n原定时间：【原来说好的时间】\n新期望时间：【希望什么时候给】\n背景：甲方在等，我夹在中间需要给甲方交代。",
  },
  {
    id: "sg-email",
    label: "给新加坡甲方写英文邮件",
    mode: "email",
    body: "Help me write a professional English email to a Singapore client:\n收件人：【姓名/职位】\n目的：【比如确认会议时间 / 回复技术问题 / 跟进报价】\n要点：【想说的内容，中文列出即可】\n语气：professional, warm, concise。请直接输出英文邮件全文。",
  },
  {
    id: "supplier-reply",
    label: "答复供应商的问题",
    mode: "email",
    body: "帮我回复供应商的问题：\n对方问题：【粘贴对方原话】\n我方口径：【我想表达的立场/答案】\n注意：不要替甲方做承诺，拿不准的部分表述为「需与客户确认后回复」。",
  },
  {
    id: "meeting-confirm",
    label: "会前确认议程",
    mode: "email",
    body: "帮我写一封会前确认邮件（中英双语各一版）：\n会议：【主题】\n时间：【时间，注明时区】\n参会方：【甲方/供应商/我方谁参加】\n议程要点：【1… 2… 3…】\n结尾请对方确认时间并补充议题。",
  },
];

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
      temperature: 0.4,
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
