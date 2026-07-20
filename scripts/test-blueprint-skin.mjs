import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require(
  "C:\\Users\\立早\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\node\\node_modules\\.pnpm\\playwright@1.61.1\\node_modules\\playwright",
);

const baseUrl = "http://localhost:3000";
const outputDir = path.resolve(".codex-artifacts", "blueprint");
const results = [];
const consoleErrors = [];
const pageErrors = [];

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
      // Continue to the next installed Chromium browser.
    }
  }
  throw new Error("No Chromium-based browser executable was found.");
}

async function installSkin(context) {
  await context.addInitScript(() => {
    localStorage.setItem("skin", "blueprint");
    localStorage.setItem("skin-blueprint-v1", "1");
  });
}

async function loginIfNeeded(page) {
  await page.goto(`${baseUrl}/today`, { waitUntil: "domcontentloaded" });
  if (!page.url().includes("/login")) return;
  const password = await appPassword();
  if (!password) throw new Error("Login is required but APP_PASSWORD is unavailable.");
  await page.locator('input[name="password"]').fill(password);
  await Promise.all([
    page.waitForURL((url) => !url.pathname.endsWith("/login")),
    page.getByRole("button", { name: "进入", exact: true }).click(),
  ]);
}

function collectErrors(page, prefix) {
  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(`${prefix}: ${message.text()}`);
    }
  });
  page.on("pageerror", (error) => pageErrors.push(`${prefix}: ${error.message}`));
}

async function checkPage(page, check) {
  await page.goto(`${baseUrl}${check.path}`, { waitUntil: "networkidle" });
  const bodyText = await page.locator("body").innerText();
  const metrics = await page.evaluate(() => ({
    skin: document.documentElement.getAttribute("data-skin"),
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: document.documentElement.clientWidth,
    bodyWidth: document.body.scrollWidth,
    weekStrip: (() => {
      const element = document.querySelector(".today-week-strip");
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      return { left: rect.left, right: rect.right, width: rect.width, clientWidth: element.clientWidth, scrollWidth: element.scrollWidth };
    })(),
    overflow:
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth,
    sidebarWidth:
      document.querySelector(".app-sidebar")?.getBoundingClientRect().width ?? 0,
    offenders: Array.from(document.querySelectorAll("body *"))
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          tag: element.tagName.toLowerCase(),
          className:
            typeof element.className === "string" ? element.className : "",
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          width: Math.round(rect.width),
        };
      })
      .filter((item) => item.right > window.innerWidth + 1 || item.left < -1)
      .sort((a, b) => b.right - a.right)
      .slice(0, 12),
    scrollContainers: Array.from(document.querySelectorAll("body *"))
      .filter((element) => element.scrollWidth > element.clientWidth + 1)
      .map((element) => ({
        tag: element.tagName.toLowerCase(),
        className:
          typeof element.className === "string" ? element.className : "",
        clientWidth: element.clientWidth,
        scrollWidth: element.scrollWidth,
        overflowX: getComputedStyle(element).overflowX,
      }))
      .sort((a, b) => b.scrollWidth - a.scrollWidth)
      .slice(0, 12),
  }));
  const passed =
    metrics.skin === "blueprint" &&
    !metrics.overflow &&
    check.expected.every((text) => bodyText.includes(text)) &&
    check.rejected.every((text) => !bodyText.includes(text));
  results.push({ name: check.name, passed, metrics });
  await page.screenshot({
    path: path.join(outputDir, `${check.name}.png`),
    fullPage: true,
  });
}

await fs.mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  executablePath: await findBrowser(),
});

try {
  const desktop = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    locale: "zh-CN",
    timezoneId: "Asia/Singapore",
  });
  await installSkin(desktop);
  const desktopPage = await desktop.newPage();
  collectErrors(desktopPage, "desktop");
  await loginIfNeeded(desktopPage);

  const desktopChecks = [
    {
      name: "today-desktop",
      path: "/today",
      expected: ["今天，先推进最重要的事", "专注时间与固定安排"],
      rejected: ["今天好，先看这些", "拖动即可调整"],
    },
    {
      name: "dashboard-desktop",
      path: "/",
      expected: ["最近在推进什么", "近期项目时间线", "正在推进"],
      rejected: ["一眼看到手上的项目走到哪一步"],
    },
    {
      name: "week-desktop",
      path: "/week",
      expected: ["这一周，时间要留给什么", "先看固定安排和关键交付"],
      rejected: ["一周每小时在干什么", "灰色是每天例行"],
    },
    {
      name: "calendar-desktop",
      path: "/calendar",
      expected: ["时间全景", "本月"],
      rejected: ["月历总览", "蓝=任务"],
    },
  ];
  for (const check of desktopChecks) {
    await checkPage(desktopPage, check);
  }

  const storageState = await desktop.storageState();
  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    locale: "zh-CN",
    timezoneId: "Asia/Singapore",
    storageState,
  });
  await installSkin(mobile);
  const mobilePage = await mobile.newPage();
  collectErrors(mobilePage, "mobile");
  await checkPage(mobilePage, {
    name: "today-mobile",
    path: "/today",
    expected: ["今天，先推进最重要的事", "今日待办"],
    rejected: ["今天好，先看这些"],
  });
  await checkPage(mobilePage, {
    name: "week-mobile",
    path: "/week",
    expected: ["这一周，时间要留给什么"],
    rejected: ["一周每小时在干什么"],
  });

  await mobile.close();
  await desktop.close();
} finally {
  await browser.close();
}

const passed =
  results.every((result) => result.passed) &&
  consoleErrors.length === 0 &&
  pageErrors.length === 0;
console.log(
  JSON.stringify({ passed, results, consoleErrors, pageErrors, outputDir }, null, 2),
);
if (!passed) process.exitCode = 1;
