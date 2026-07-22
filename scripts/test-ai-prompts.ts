import assert from "node:assert/strict";
import { AI_MODES } from "../src/lib/ai-modes";
import { RESUME_CHAT_SYSTEM_PROMPT, SYSTEM_PROMPTS } from "../src/lib/ai-prompts";
import { parseResumePointCandidate } from "../src/lib/resume-point-parser";

const modeMarkers: Record<string, string[]> = {
  translate: ["术语", "译文", "歧义"],
  email: ["收件人", "承诺", "主题"],
  invitation: ["邀请方", "签证", "English Invitation Letter"],
  summary: ["核心结论", "行动项", "责任人"],
  reception: ["讲解稿", "路线", "English Script"],
  resume: ["数据分析基础 + 商业理解 + 技术型业务拓展", "不强行定位", "可直接使用", "暂定版本"],
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

assert.match(RESUME_CHAT_SYSTEM_PROMPT, /连续对话/, "resume chat: 缺少连续对话规则");
assert.match(RESUME_CHAT_SYSTEM_PROMPT, /最多问两个/, "resume chat: 缺少克制追问规则");
assert.match(RESUME_CHAT_SYSTEM_PROMPT, /<resume-point>/, "resume chat: 缺少可收藏要点格式");
assert.match(RESUME_CHAT_SYSTEM_PROMPT, /不得编造/, "resume chat: 缺少事实边界");

const parsedCandidate = parseResumePointCandidate(
  [
    "这版强调你对材料和反馈的整合能力。",
    "<resume-point>",
    "<title>场景分析交付</title>",
    "<zh>在五天内整合技术与市场材料，迭代完成三版情景分析演示文稿，支撑部门负责人与新加坡客户的沟通。</zh>",
    "<en>Synthesized technical and market inputs into three iterative scenario-analysis presentation drafts within five days, supporting the department head's communication with a Singapore client.</en>",
    "</resume-point>",
  ].join(String.fromCharCode(10)),
);
assert.equal(parsedCandidate.point?.title, "场景分析交付", "resume chat: 未识别收藏标题");
assert.match(parsedCandidate.point?.chinese ?? "", /五天内/, "resume chat: 未识别中文候选");
assert.match(parsedCandidate.point?.english ?? "", /Singapore client/, "resume chat: 未识别英文候选");
assert.match(parsedCandidate.reply, /整合能力/, "resume chat: 未保留自然回复");
console.log("AI prompt contract: " + AI_MODES.length + "/" + AI_MODES.length + " modes passed");