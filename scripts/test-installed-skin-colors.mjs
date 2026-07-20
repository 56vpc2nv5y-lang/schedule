import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require(
  "C:\\Users\\立早\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\node\\node_modules\\.pnpm\\playwright@1.61.1\\node_modules\\playwright",
);

const baseUrl = "http://localhost:3000";
const outputDir = path.resolve(".codex-artifacts", "skin-colors");

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
      // Continue to the next browser.
    }
  }
  throw new Error("No Chromium browser found.");
}

await fs.mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  executablePath: await findBrowser(),
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  locale: "zh-CN",
});
await context.addInitScript(() => {
  localStorage.setItem("skin-blueprint-v1", "1");
  localStorage.setItem("skin", "vibrant");
});
const page = await context.newPage();
const errors = [];
page.on("console", (message) => {
  if (message.type() === "error") errors.push(message.text());
});
page.on("pageerror", (error) => errors.push(error.message));

await page.goto(`${baseUrl}/`, { waitUntil: "domcontentloaded" });
if (page.url().includes("/login")) {
  const env = await fs.readFile(".env", "utf8");
  const password = parseEnvValue(env, "APP_PASSWORD");
  await page.locator('input[name="password"]').fill(password);
  await Promise.all([
    page.waitForURL((url) => !url.pathname.endsWith("/login")),
    page.getByRole("button", { name: "进入", exact: true }).click(),
  ]);
}
await page.goto(`${baseUrl}/`, { waitUntil: "networkidle" });

async function capture(skin) {
  await page.evaluate((nextSkin) => {
    document.documentElement.setAttribute("data-skin", nextSkin);
    localStorage.setItem("skin", nextSkin);
  }, skin);
  await page.waitForTimeout(100);
  const styles = await page.evaluate(() => {
    const bar = document.querySelector(".blueprint-gantt-summary-bar");
    return {
      bar: bar ? getComputedStyle(bar).backgroundColor : "",
      bodyImage: getComputedStyle(document.body).backgroundImage,
      overflow:
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
    };
  });
  await page.screenshot({
    path: path.join(outputDir, `gantt-${skin}.png`),
    fullPage: false,
  });
  return styles;
}

const vibrant = await capture("vibrant");
const sunset = await capture("sunset");
await context.close();
await browser.close();

const passed =
  Boolean(vibrant.bar) &&
  Boolean(sunset.bar) &&
  vibrant.bar !== sunset.bar &&
  vibrant.bodyImage === "none" &&
  sunset.bodyImage === "none" &&
  !vibrant.overflow &&
  !sunset.overflow &&
  errors.length === 0;

console.log(JSON.stringify({ passed, vibrant, sunset, errors }, null, 2));
if (!passed) process.exitCode = 1;
