import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { PrismaClient } from "../node_modules/@prisma/client/default.js";

const require = createRequire(import.meta.url);
const { chromium } = require(
  "C:\\Users\\立早\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\node\\node_modules\\.pnpm\\playwright@1.61.1\\node_modules\\playwright",
);
const prisma = new PrismaClient();
const baseUrl = "http://localhost:3000";
const outputDir = path.resolve(".codex-artifacts");
const marker = `Codex流程测试-${Date.now()}`;
const checks = [];
const consoleErrors = [];
const pageErrors = [];
let uploadedResource;
let createdTaskTitles = [];

function parseEnv(source) {
  return Object.fromEntries(
    source
      .split(/\r?\n/)
      .filter((line) => line && !line.trim().startsWith("#") && line.includes("="))
      .map((line) => {
        const index = line.indexOf("=");
        return [line.slice(0, index).trim(), line.slice(index + 1).trim().replace(/^(['"])(.*)\1$/, "$2")];
      }),
  );
}

async function appPassword() {
  const setting = await prisma.appSetting.findUnique({ where: { id: "APP_PASSWORD" } }).catch(() => null);
  if (setting?.value?.trim()) return setting.value.trim();
  const env = parseEnv(await fs.readFile(".env", "utf8"));
  return env.APP_PASSWORD ?? "";
}

async function findBrowser() {
  const candidates = [
    chromium.executablePath(),
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  ];
  for (const candidate of candidates) {
    try {
      await fs.access(candidate);
      return candidate;
    } catch {}
  }
  throw new Error("No Chromium browser found");
}

async function login(page) {
  await page.goto(`${baseUrl}/today`, { waitUntil: "domcontentloaded" });
  if (!page.url().includes("/login")) return;
  await page.locator('input[name="password"]').fill(await appPassword());
  await Promise.all([
    page.waitForURL((url) => !url.pathname.endsWith("/login")),
    page.getByRole("button", { name: "进入", exact: true }).click(),
  ]);
}

async function cleanupStorage(url) {
  if (!url) return;
  const env = parseEnv(await fs.readFile(".env", "utf8"));
  const parsed = new URL(url);
  const match = parsed.pathname.match(/^\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);
  if (!match || !env.SUPABASE_SERVICE_ROLE_KEY) return;
  await fetch(`${parsed.origin}/storage/v1/object/${match[1]}/${match[2]}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    },
  });
}

try {
  await fs.mkdir(outputDir, { recursive: true });
  const uploadPath = path.join(outputDir, `${marker}.txt`);
  await fs.writeFile(uploadPath, "Synthetic upload verification only.\n", "utf8");

  const browser = await chromium.launch({ headless: true, executablePath: await findBrowser() });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    locale: "zh-CN",
    timezoneId: "Asia/Singapore",
  });
  const page = await context.newPage();
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await login(page);

  await page.goto(`${baseUrl}/meeting-reviews`, { waitUntil: "networkidle" });
  const saveButton = page.getByRole("button", { name: "保存", exact: true }).first();
  await saveButton.click();
  await page.waitForURL(/created=question-updated/);
  checks.push({
    name: "feedback-save-visible",
    passed: (await page.getByText("问题记录已保存。", { exact: true }).count()) === 1,
  });

  await page.goto(`${baseUrl}/resources?new=1#new`, { waitUntil: "networkidle" });
  const uploadForm = page.locator("form").filter({ has: page.locator('input[type="file"]') }).first();
  await uploadForm.locator('input[type="file"]').setInputFiles(uploadPath);
  await uploadForm.locator('input[name="name"]').fill(marker);
  await Promise.all([
    page.waitForURL(/created=resource-upload/),
    uploadForm.getByRole("button", { name: "上传并登记", exact: true }).click(),
  ]);
  uploadedResource = await prisma.resource.findFirst({ where: { name: marker } });
  checks.push({
    name: "resource-upload",
    passed: Boolean(uploadedResource?.url) && (await page.getByText("已保存。", { exact: true }).count()) > 0,
  });

  const source = await context.newPage();
  await source.setContent('<div style="font:48px Arial;color:#111;background:white;padding:40px;width:900px">截图测试；整理测试材料；发送测试回复</div>');
  const screenshotPath = path.join(outputDir, "ocr-synthetic.png");
  await source.screenshot({ path: screenshotPath });
  await source.close();

  await page.goto(`${baseUrl}/assistant`, { waitUntil: "networkidle" });
  const imageInput = page.locator('input[type="file"][accept^="image/"]');
  await imageInput.setInputFiles(screenshotPath);
  await page.getByText("截图文字已在本机识别，可继续修改后整理。", { exact: true }).waitFor({ timeout: 60000 });
  const intakeText = await page.locator("textarea").first().inputValue();
  checks.push({ name: "local-screenshot-ocr", passed: intakeText.includes("截图") && intakeText.includes("测试") });

  await page.locator("textarea").first().fill(`${marker}确认接口；${marker}整理材料`);
  await page.getByRole("button", { name: "AI 整理", exact: true }).click();
  await page.getByText(/AI 已整理|本地规则完成拆分/).waitFor({ timeout: 60000 });
  const titleInputs = page.locator('input[aria-label^="任务 "][aria-label$=" 标题"]');
  const itemCount = await titleInputs.count();
  for (let index = 0; index < itemCount; index += 1) {
    createdTaskTitles.push(await titleInputs.nth(index).inputValue());
  }
  checks.push({ name: "ai-task-parse", passed: itemCount >= 2 && createdTaskTitles.every(Boolean) });
  await page.getByRole("button", { name: "写入看板并排进周计划", exact: true }).click();
  await page.getByText(/已新建 \d+ 项任务，排入周计划 \d+ 项/).waitFor({ timeout: 30000 });
  const [createdTasks, createdBlocks] = await Promise.all([
    prisma.task.count({ where: { title: { in: createdTaskTitles } } }),
    prisma.scheduleBlock.count({ where: { title: { in: createdTaskTitles } } }),
  ]);
  checks.push({ name: "ai-task-commit-and-schedule", passed: createdTasks >= 2 && createdBlocks >= 2 });

  await page.goto(`${baseUrl}/calendar?ym=2026-06`, { waitUntil: "networkidle" });
  const juneText = await page.locator("body").innerText();
  checks.push({
    name: "june-calendar-complete",
    passed:
      juneText.includes("2026 年 6 月") &&
      juneText.includes("翻译北理工车辆维保 PPT") &&
      juneText.includes("Scenario Analysis PPT 第一稿") &&
      juneText.includes("整理越南培训提案"),
  });

  await page.goto(`${baseUrl}/week`, { waitUntil: "networkidle" });
  const gridAlignment = await page.evaluate(() => {
    const grids = [...document.querySelectorAll("div")].filter((element) => {
      const columns = getComputedStyle(element).gridTemplateColumns;
      return columns.startsWith("56px ") && element.children.length === 8;
    });
    if (grids.length < 2) return false;
    const reference = [...grids[0].children].map((child) => child.getBoundingClientRect());
    return grids.slice(1).every((grid) =>
      [...grid.children].every((child, index) => {
        const rect = child.getBoundingClientRect();
        return Math.abs(rect.x - reference[index].x) < 1 && Math.abs(rect.width - reference[index].width) < 1;
      }),
    );
  });
  checks.push({ name: "week-grid-alignment", passed: gridAlignment });
  await page.screenshot({ path: path.join(outputDir, "week-grid-final.png"), fullPage: false });

  const trainingTestStartedAt = new Date();
  await page.goto(`${baseUrl}/projects/p-uz-training-2026`, { waitUntil: "networkidle" });
  const trainingText = await page.locator("body").innerText();
  await Promise.all([
    page.waitForURL(/updated=training/),
    page.getByRole("button", { name: "保存培训台账", exact: true }).click(),
  ]);
  const trainingSaveVisible =
    (await page.getByText("培训台账已保存。", { exact: true }).count()) === 1;

  const checklistBefore = await prisma.trainingChecklistItem.findFirst({
    where: { trainingProfile: { projectId: "p-uz-training-2026" } },
    orderBy: [{ section: "asc" }, { sortOrder: "asc" }],
  });
  let checklistRoundTrip = false;
  const checklistStates = { before: null, changed: null, restored: null };
  if (checklistBefore) {
    const row = page.locator("form").filter({
      has: page.getByText(checklistBefore.label, { exact: true }),
    }).first();
    await Promise.all([
      page.waitForURL(/updated=training-checklist/),
      row.locator('button[type="submit"]').click(),
    ]);
    const changed = await prisma.trainingChecklistItem.findUnique({
      where: { id: checklistBefore.id },
    });
    const restoredRow = page.locator("form").filter({
      has: page.getByText(checklistBefore.label, { exact: true }),
    }).first();
    await restoredRow.locator('button[type="submit"]').click();
    const restoredTitle = checklistBefore.done ? "标记未完成" : "标记已完成";
    await page.locator("form").filter({
      has: page.getByText(checklistBefore.label, { exact: true }),
    }).first().getByTitle(restoredTitle).waitFor();
    const restored = await prisma.trainingChecklistItem.findUnique({
      where: { id: checklistBefore.id },
    });
    checklistStates.before = checklistBefore.done;
    checklistStates.changed = changed?.done ?? null;
    checklistStates.restored = restored?.done ?? null;
    checklistRoundTrip =
      changed?.done === !checklistBefore.done &&
      restored?.done === checklistBefore.done;
  }

  checks.push({
    name: "training-workflow-and-specialized-ledger",
    details: { trainingSaveVisible, checklistRoundTrip, checklistStates },
    passed:
      trainingText.includes("培训项目台账") &&
      trainingText.includes("当前：筹备") &&
      trainingText.includes("内部成本不可对外发送") &&
      trainingText.includes("暂停 / 重启复核") &&
      !trainingText.includes("推进至下一阶段") &&
      trainingSaveVisible &&
      checklistRoundTrip,
  });
  await prisma.timelineEvent.deleteMany({
    where: {
      projectId: "p-uz-training-2026",
      action: "培训台账更新",
      createdAt: { gte: trainingTestStartedAt },
    },
  });
  await page.screenshot({
    path: path.join(outputDir, "training-ledger-final.png"),
    fullPage: false,
  });
  await page.goto(`${baseUrl}/growth`, { waitUntil: "networkidle" });
  const growthText = await page.locator("body").innerText();
  checks.push({
    name: "resume-baseline",
    passed: growthText.includes("GPA 4.63 / 5.00") && growthText.includes("50k+ reviews") && growthText.includes("生成简历要点"),
  });
  await page.screenshot({ path: path.join(outputDir, "growth-final.png"), fullPage: false });

  const manifestResponse = await page.request.get(`${baseUrl}/manifest.webmanifest`);
  const workerResponse = await page.request.get(`${baseUrl}/sw.js`);
  checks.push({ name: "pwa-assets", passed: manifestResponse.ok() && workerResponse.ok() });

  await browser.close();
} finally {
  if (createdTaskTitles.length > 0) {
    await prisma.scheduleBlock.deleteMany({ where: { title: { in: createdTaskTitles } } }).catch(() => {});
    await prisma.task.deleteMany({ where: { title: { in: createdTaskTitles } } }).catch(() => {});
  }
  if (uploadedResource) {
    await prisma.resource.delete({ where: { id: uploadedResource.id } }).catch(() => {});
    await cleanupStorage(uploadedResource.url).catch(() => {});
  }
  await prisma.$disconnect();
}

const result = {
  passed: checks.every((check) => check.passed) && consoleErrors.length === 0 && pageErrors.length === 0,
  checks,
  consoleErrors,
  pageErrors,
};
console.log(JSON.stringify(result, null, 2));
if (!result.passed) process.exitCode = 1;
