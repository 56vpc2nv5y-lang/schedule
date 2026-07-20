import assert from "node:assert/strict";
import { AI_MODES } from "../src/lib/ai";
import { SYSTEM_PROMPTS } from "../src/lib/ai-prompts";

const modeMarkers: Record<string, string[]> = {
  translate: ["术语", "译文", "歧义"],
  email: ["收件人", "承诺", "主题"],
  invitation: ["邀请方", "签证", "English Invitation Letter"],
  summary: ["核心结论", "行动项", "责任人"],
  reception: ["讲解稿", "路线", "English Script"],
  resume: ["简历要点", "假数字", "English Resume Bullets"],
  weekly: ["按项目", "等待外部反馈", "待确认信息"],
};

for (const { key } of AI_MODES) {
  const prompt = SYSTEM_PROMPTS[key];
  assert.ok(prompt.length > 350, `${key}: prompt 太短`);
  assert.match(prompt, /不得编造/, `${key}: 缺少禁止编造规则`);
  assert.match(prompt, /待补充|待确认/, `${key}: 缺少信息不足处理`);
  for (const marker of modeMarkers[key]) {
    assert.ok(prompt.includes(marker), `${key}: 缺少专用规则 ${marker}`);
  }
}

console.log(`AI prompt contract: ${AI_MODES.length}/${AI_MODES.length} modes passed`);
