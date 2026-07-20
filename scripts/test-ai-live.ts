import { AI_MODES, isAiConfigured, runDeepseek, type AiMode } from "../src/lib/ai";

type Case = {
  mode: AiMode;
  name: string;
  input: string;
  mustInclude?: string[];
  mustNotInclude?: string[];
};

const cases: Case[] = [
  {
    mode: "translate",
    name: "数字与日期保真",
    input: "请翻译成英文：2026年7月16日，我们把误报率3.5%的说明发给了Mu Ru。",
    mustInclude: ["2026", "3.5%", "Mu Ru"],
  },
  {
    mode: "translate",
    name: "专业术语保真",
    input: "Translate into Chinese: There is currently no evidence to support muon-based anomaly detection for cargo screening.",
    mustInclude: ["缪子"],
  },
  {
    mode: "email",
    name: "高校催复",
    input: "给樊老师写一条微信：客户还在等缪子问题的回复，请今天确认是否完成，但不要替客户作任何承诺。",
    mustNotInclude: ["保证客户", "一定会合作"],
  },
  {
    mode: "email",
    name: "Leader进度汇报",
    input: "给杜总汇报：乌兹住建监察局30人培训分析已完成初稿，越南培训和国家智库部分还在补，计划17点汇报。",
    mustInclude: ["17"],
  },
  {
    mode: "invitation",
    name: "信息完整邀请函",
    input: "邀请方：GSafety；受邀方：某代表团；活动：技术交流；时间：2026-08-01；地点：合肥；人数：30人。请写双语邀请函。",
    mustInclude: ["2026", "30", "English"],
  },
  {
    mode: "invitation",
    name: "缺项不编造",
    input: "请为一场来访写邀请函，只知道活动在北京，其他信息没有。",
    mustInclude: ["待补充"],
    mustNotInclude: ["签证担保"],
  },
  {
    mode: "summary",
    name: "责任人与日期",
    input: "会议决定：Sunny于7月16日下午整理北理工回复并翻译英文，随后发给Mu Ru。樊老师的后续补充时间未定。",
    mustInclude: ["Sunny", "7月16日", "待确认"],
  },
  {
    mode: "summary",
    name: "观点不当结论",
    input: "有人建议用缪子做异常检测，但客户问目前是否有证据。团队没有给出确定结论。",
    mustInclude: ["待确认"],
  },
  {
    mode: "reception",
    name: "双语路线讲解",
    input: "路线：公司展厅、会议室。事实：公司提供安全检测解决方案。来访方30人。请写简短双语讲解稿。",
    mustInclude: ["30", "English"],
  },
  {
    mode: "reception",
    name: "缺事实留空",
    input: "给清华大学参访写讲解词，但我还没有路线和技术数据。",
    mustInclude: ["待补充"],
  },
  {
    mode: "resume",
    name: "已有数量证据",
    input: "我协调30位乌兹别克斯坦官员进入清华大学的人员报备，并跟踪材料。",
    mustInclude: ["30", "English"],
  },
  {
    mode: "resume",
    name: "无数字不虚构",
    input: "我整理并翻译北理工老师的回复，发给新加坡客户。",
    mustInclude: ["可补充"],
    mustNotInclude: ["提升50%", "100%"],
  },
  {
    mode: "weekly",
    name: "跨日工作流合并",
    input: "7/14 Sunny收到北理工回复并整理中文版；7/15完成英文版并发给新加坡；7/16补充缪子问题并发给Mu Ru。",
    mustInclude: ["北理工", "新加坡", "Mu Ru"],
  },
  {
    mode: "weekly",
    name: "区分他人成果",
    input: "晓卉姐和文静建了微信群。Sunny后续负责跟踪。杜总要求Sunny做下半年工作预测，Sunny已完成初稿。",
    mustInclude: ["Sunny", "初稿"],
    mustNotInclude: ["Sunny建立了微信群"],
  },
];

function validate(test: Case, output: string) {
  const missing = (test.mustInclude ?? []).filter(
    (item) => !output.toLowerCase().includes(item.toLowerCase()),
  );
  const forbidden = (test.mustNotInclude ?? []).filter((item) =>
    output.toLowerCase().includes(item.toLowerCase()),
  );
  return { pass: output.length > 0 && missing.length === 0 && forbidden.length === 0, missing, forbidden };
}

async function main() {
  if (!(await isAiConfigured())) {
    console.log("AI live tests skipped: DeepSeek is not configured");
    return;
  }

  const results: {
    mode: AiMode;
    name: string;
    pass: boolean;
    missing: string[];
    forbidden: string[];
    preview: string;
  }[] = [];

  for (let index = 0; index < cases.length; index += 2) {
    const batch = cases.slice(index, index + 2);
    const batchResults = await Promise.all(
      batch.map(async (test) => {
        const output = await runDeepseek(test.mode, test.input);
        return { test, output, result: validate(test, output) };
      }),
    );
    for (const { test, output, result } of batchResults) {
      results.push({
        mode: test.mode,
        name: test.name,
        ...result,
        preview: output.replace(/\s+/g, " ").slice(0, 100),
      });
    }
  }

  for (const mode of AI_MODES) {
    const modeResults = results.filter((result) => result.mode === mode.key);
    const passed = modeResults.filter((result) => result.pass).length;
    console.log(`${mode.key}: ${passed}/${modeResults.length}`);
    for (const result of modeResults.filter((item) => !item.pass)) {
      console.log(JSON.stringify(result));
    }
  }

  const failed = results.filter((result) => !result.pass);
  if (failed.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
