import fs from "node:fs/promises";
import { createRequire } from "node:module";
import { PrismaClient } from "../node_modules/@prisma/client/default.js";

const require = createRequire(import.meta.url);
const { chromium } = require(
  "C:\\Users\\立早\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\node\\node_modules\\.pnpm\\playwright@1.61.1\\node_modules\\playwright",
);

const prisma = new PrismaClient();
const baseUrl = "http://localhost:3000";
const title = `Codex 今日完成测试 ${Date.now()}`;
let browser;
let taskId;

function parseEnvValue(source, key) {
  const line = source
    .split(/\r?\n/)
    .find((entry) => entry.trim().startsWith(`${key}=`));
  if (!line) return "";
  return line
    .slice(line.indexOf("=") + 1)
    .trim()
    .replace(/^(['"])(.*)\1$/, "$2");
}

async function effectivePassword() {
  const row = await prisma.appSetting.findUnique({
    where: { id: "APP_PASSWORD" },
  });
  if (row?.value?.trim()) return row.value.trim();
  return parseEnvValue(await fs.readFile(".env", "utf8"), "APP_PASSWORD");
}

async function browserExecutable() {
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
      // Try the next installed browser.
    }
  }
  throw new Error("No Chromium-based browser executable was found.");
}

try {
  const dateKey = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Singapore",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const task = await prisma.task.create({
    data: {
      title,
      dueDate: new Date(`${dateKey}T00:00:00+08:00`),
    },
    select: { id: true },
  });
  taskId = task.id;

  browser = await chromium.launch({
    headless: true,
    executablePath: await browserExecutable(),
  });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    locale: "zh-CN",
    timezoneId: "Asia/Singapore",
  });

  await page.goto(`${baseUrl}/today`, { waitUntil: "networkidle" });
  if (page.url().includes("/login")) {
    const password = await effectivePassword();
    await page.locator('input[name="password"]').fill(password);
    await Promise.all([
      page.waitForURL((url) => !url.pathname.endsWith("/login")),
      page.getByRole("button", { name: "进入", exact: true }).click(),
    ]);
    await page.goto(`${baseUrl}/today`, { waitUntil: "networkidle" });
  }

  const completeButton = page.getByRole("button", {
    name: `完成任务：${title}`,
    exact: true,
  });
  await completeButton.waitFor({ state: "visible" });
  await completeButton.click();
  await completeButton.waitFor({ state: "detached", timeout: 15_000 });

  const updated = await prisma.task.findUnique({
    where: { id: taskId },
    select: { status: true },
  });
  const passed = updated?.status === "DONE";
  console.log(
    JSON.stringify(
      {
        passed,
        databaseStatus: updated?.status ?? null,
        removedFromTodayList: true,
      },
      null,
      2,
    ),
  );
  if (!passed) process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  if (taskId) {
    await prisma.task.delete({ where: { id: taskId } }).catch(() => {});
  }
  await prisma.$disconnect();
}
