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

function parseEnvValue(source, key) {
  const line = source
    .split(/\r?\n/)
    .find((entry) => entry.trim().startsWith(`${key}=`));
  return line
    ? line
        .slice(line.indexOf("=") + 1)
        .trim()
        .replace(/^(['"])(.*)\1$/, "$2")
    : "";
}

async function appPassword() {
  try {
    const setting = await prisma.appSetting.findUnique({
      where: { id: "APP_PASSWORD" },
    });
    if (setting?.value?.trim()) return setting.value.trim();
  } catch {
    // The browser test can still fall back to the local environment.
  }
  try {
    return parseEnvValue(await fs.readFile(".env", "utf8"), "APP_PASSWORD");
  } catch {
    return "";
  }
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
    } catch {
      // Try the next browser.
    }
  }
  throw new Error("No Chromium-based browser executable was found.");
}

const checks = [];
const consoleErrors = [];
const pageErrors = [];

try {
  await fs.mkdir(outputDir, { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    executablePath: await findBrowser(),
  });
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

  await page.goto(`${baseUrl}/`, { waitUntil: "domcontentloaded" });
  if (page.url().includes("/login")) {
    const password = await appPassword();
    if (!password) throw new Error("Login is required but no password is available.");
    await page.locator('input[name="password"]').fill(password);
    await Promise.all([
      page.waitForURL((url) => !url.pathname.endsWith("/login")),
      page.getByRole("button", { name: "进入", exact: true }).click(),
    ]);
  }

  await page.goto(`${baseUrl}/`, { waitUntil: "networkidle" });
  const dashboardText = await page.locator("body").innerText();
  const expandButtons = page.getByTitle("展开阶段");
  const projectCount = await expandButtons.count();
  let accordionPassed = projectCount > 0;
  if (projectCount > 0) {
    await expandButtons.first().click();
    accordionPassed =
      accordionPassed && (await page.getByTitle("收起阶段").count()) === 1;
    if (projectCount > 1) {
      await page.getByTitle("展开阶段").first().click();
      accordionPassed =
        accordionPassed && (await page.getByTitle("收起阶段").count()) === 1;
    }
  }
  const dashboardOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  checks.push({
    name: "dashboard-summary-timeline",
    passed:
      dashboardText.includes("近期项目时间线") &&
      dashboardText.includes("正在推进") &&
      !dashboardText.includes("季度看板") &&
      accordionPassed &&
      !dashboardOverflow,
  });
  await page.screenshot({
    path: path.join(outputDir, "dashboard-summary-expanded.png"),
    fullPage: true,
  });

  await page.goto(`${baseUrl}/tasks`, { waitUntil: "networkidle" });
  const taskText = await page.locator("body").innerText();
  const editButtons = page.getByTitle("编辑");
  const hasEdit = (await editButtons.count()) > 0;
  let editDialogPassed = false;
  if (hasEdit) {
    await editButtons.first().click();
    const dialog = page.locator(".fixed.inset-0").last();
    editDialogPassed =
      (await dialog.getByText("编辑任务", { exact: true }).count()) === 1 &&
      (await dialog.locator('input[name="title"]').inputValue()).length > 0 &&
      (await dialog.locator('textarea[name="description"]').count()) === 1;
    await dialog.getByRole("button", { name: "取消", exact: true }).click();
  }
  checks.push({
    name: "task-edit-and-classification",
    passed:
      taskText.includes("非项目任务") &&
      !taskText.includes("项目待办和个人杂事") &&
      hasEdit &&
      editDialogPassed,
  });

  await page.goto(`${baseUrl}/calendar`, { waitUntil: "networkidle" });
  const calendarText = await page.locator("body").innerText();
  checks.push({
    name: "calendar-header-deduplicated",
    passed:
      calendarText.includes("本月") &&
      !calendarText.includes("蓝=任务") &&
      !calendarText.includes("月历总览"),
  });

  await page.goto(`${baseUrl}/projects`, { waitUntil: "networkidle" });
  const projectsText = await page.locator("body").innerText();
  checks.push({
    name: "stage-count-progress",
    passed:
      projectsText.includes("阶段完成") &&
      !projectsText.includes("生命周期进度"),
  });

  await browser.close();
  const result = {
    passed:
      checks.every((check) => check.passed) &&
      consoleErrors.length === 0 &&
      pageErrors.length === 0,
    checks,
    consoleErrors,
    pageErrors,
  };
  console.log(JSON.stringify(result, null, 2));
  if (!result.passed) process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
