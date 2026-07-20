import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { PrismaClient } from "../node_modules/@prisma/client/default.js";

const require = createRequire(import.meta.url);
const { chromium } = require(
  "C:\\Users\\立早\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\node\\node_modules\\.pnpm\\playwright@1.61.1\\node_modules\\playwright",
);

const BASE_URL = "http://localhost:3000";
const OUTPUT_DIR = path.resolve(".codex-artifacts");
const RUN_AI_TEST = process.env.SMOKE_TEST_AI === "1";
const prisma = new PrismaClient();

function parseEnvValue(source, key) {
  const line = source
    .split(/\r?\n/)
    .find((entry) => entry.trim().startsWith(`${key}=`));
  if (!line) return "";
  const value = line.slice(line.indexOf("=") + 1).trim();
  return value.replace(/^(['"])(.*)\1$/, "$2");
}

async function effectiveSetting(key) {
  const row = await prisma.appSetting.findUnique({ where: { id: key } });
  if (row?.value?.trim()) return row.value.trim();
  const envText = await fs.readFile(".env", "utf8");
  return parseEnvValue(envText, key);
}

async function findBrowserExecutable() {
  const bundled = chromium.executablePath();
  const candidates = [
    bundled,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  ];

  for (const candidate of candidates) {
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      // Try the next installed browser.
    }
  }
  throw new Error("No Chromium-based browser executable was found.");
}

const results = [];
const consoleErrors = [];
const pageErrors = [];
const responseErrors = [];

try {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  const [password, executablePath] = await Promise.all([
    effectiveSetting("APP_PASSWORD"),
    findBrowserExecutable(),
  ]);

  const browser = await chromium.launch({
    headless: true,
    executablePath,
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    locale: "zh-CN",
    timezoneId: "Asia/Singapore",
  });
  const page = await context.newPage();

  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push({
        text: message.text(),
        location: message.location(),
      });
    }
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("response", (response) => {
    if (response.status() >= 400) {
      responseErrors.push({ status: response.status(), url: response.url() });
    }
  });

  async function ensureLoggedIn() {
    await page.goto(`${BASE_URL}/today`, { waitUntil: "domcontentloaded" });
    if (!page.url().includes("/login")) return;
    if (!password) throw new Error("Login is required but no password is configured.");
    await page.locator('input[name="password"]').fill(password);
    await Promise.all([
      page.waitForURL((url) => !url.pathname.endsWith("/login")),
      page.getByRole("button", { name: "进入", exact: true }).click(),
    ]);
  }

  async function checkRoute(route, expectedText) {
    const response = await page.goto(`${BASE_URL}${route}`, {
      waitUntil: "domcontentloaded",
    });
    await page.waitForLoadState("networkidle");
    const bodyText = await page.locator("body").innerText();
    const failed =
      !response ||
      response.status() >= 400 ||
      bodyText.includes("页面出错了") ||
      bodyText.includes("Runtime Error") ||
      bodyText.includes("Internal Server Error") ||
      (expectedText && !bodyText.includes(expectedText));
    results.push({
      route,
      status: response?.status() ?? 0,
      expectedText,
      passed: !failed,
    });
  }

  await ensureLoggedIn();

  const routes = [
    ["/today", "今天"],
    ["/", "工作台"],
    ["/calendar", "日历"],
    ["/week", "周计划"],
    ["/receptions", "出差"],
    ["/growth", "成长档案"],
    ["/tasks", "任务"],
    ["/projects", "项目"],
    ["/assistant", "AI 助手"],
  ];

  for (const [route, expectedText] of routes) {
    await checkRoute(route, expectedText);
  }

  await page.goto(`${BASE_URL}/receptions/r-uz-training-2026`, {
    waitUntil: "networkidle",
  });
  const receptionText = await page.locator("body").innerText();
  results.push({
    route: "/receptions/r-uz-training-2026",
    status: 200,
    expectedText: "收集并核对 30 位官员",
    passed:
      receptionText.includes("乌兹住建监察局 30 人赴华培训接待") &&
      receptionText.includes("收集并核对 30 位官员") &&
      !receptionText.includes("页面出错了"),
  });

  await page.goto(`${BASE_URL}/assistant`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "周报", exact: true }).click();
  const dateInputs = page.locator('input[type="date"]');
  await dateInputs.nth(0).fill("2026-07-13");
  await dateInputs.nth(1).fill("2026-07-19");
  await page.getByRole("button", { name: "载入看板记录" }).click();
  await page.waitForFunction(() => {
    const textarea = document.querySelector("textarea");
    return textarea?.value.includes("周报范围：2026-07-13 至 2026-07-19");
  });
  const evidence = await page.locator("textarea").inputValue();
  const evidenceLoaded =
    evidence.includes("乌兹别克斯坦住建监察局赴华培训") &&
    evidence.includes("Muru") &&
    evidence.includes("北理工");
  results.push({
    route: "/assistant#weekly-evidence",
    status: 200,
    expectedText: "周报看板证据",
    passed: evidenceLoaded,
  });

  let aiGeneration = "not-sent-by-automation";
  if (RUN_AI_TEST) {
    aiGeneration = await page.evaluate(async () => {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "translate",
          input: "Connectivity test. Please translate this sentence into Chinese.",
        }),
      });
      const body = await response.json();
      return {
        status: response.status,
        passed:
          response.ok &&
          typeof body.text === "string" &&
          body.text.trim().length > 0,
        outputLength:
          typeof body.text === "string" ? body.text.trim().length : 0,
        error: response.ok ? undefined : body.error,
      };
    });
    results.push({
      route: "/api/ai#generic-connectivity",
      status: aiGeneration.status,
      expectedText: "non-empty AI response",
      passed: aiGeneration.passed,
    });
  }
  await page.screenshot({
    path: path.join(OUTPUT_DIR, "assistant-weekly.png"),
    fullPage: true,
  });
  await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
  await page.screenshot({
    path: path.join(OUTPUT_DIR, "dashboard.png"),
    fullPage: true,
  });

  await browser.close();

  console.log(
    JSON.stringify(
      {
        passed: results.every((result) => result.passed),
        routes: results,
        aiGeneration,
        consoleErrors,
        pageErrors,
        responseErrors,
      },
      null,
      2,
    ),
  );
} finally {
  await prisma.$disconnect();
}
