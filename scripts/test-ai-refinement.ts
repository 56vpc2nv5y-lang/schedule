import { runDeepseek } from "../src/lib/ai";

const cases = [
  {
    mode: "translate" as const,
    name: "muon 单数",
    input: "Translate into Chinese: muon-based anomaly detection.",
    markers: ["缪子", "μ子"],
  },
  {
    mode: "translate" as const,
    name: "muon 复数",
    input: "翻译成中文：The researchers are using muons to inspect cargo.",
    markers: ["缪子", "μ子"],
  },
  {
    mode: "resume" as const,
    name: "无数字翻译交付",
    input: "我整理并翻译北理工老师的回复，发给新加坡客户。",
    markers: ["可补强证据"],
  },
  {
    mode: "resume" as const,
    name: "无数字协调经历",
    input: "我负责跟踪微信群里的客户问题，并协调高校老师回复。",
    markers: ["可补强证据"],
  },
];

async function main() {
  const outputs = await Promise.all(
    cases.map(async (test) => ({
      ...test,
      output: await runDeepseek(test.mode, test.input),
    })),
  );

  let failed = 0;
  for (const test of outputs) {
    const pass = test.markers.every((marker) => test.output.includes(marker));
    if (!pass) failed += 1;
    console.log(`${test.mode}/${test.name}: ${pass ? "PASS" : "FAIL"}`);
    if (!pass) console.log(test.output.replace(/\s+/g, " ").slice(0, 240));
  }

  if (failed) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
