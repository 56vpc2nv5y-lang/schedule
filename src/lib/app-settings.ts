import { createHash } from "node:crypto";
import { getPrisma } from "@/lib/prisma";
import { isDatabaseConfigured } from "@/lib/db-status";
import {
  PERSONAL_APP_PASSWORD,
  getAppPassword as getEnvPassword,
  isPersonalAutoLoginEnabled,
} from "@/lib/auth";

// 运行时配置：优先读数据库 AppSetting，回退环境变量。
// 带 60 秒内存缓存，避免每个请求都查库（proxy 里每次页面跳转都会走到）。

export const SETTING_KEYS = {
  password: "APP_PASSWORD",
  deepseekKey: "DEEPSEEK_API_KEY",
} as const;

type CacheEntry = { value: string | null; expires: number };
const cache = new Map<string, CacheEntry>();
const TTL = 60_000;

export function invalidateSettingCache(key?: string) {
  if (key) cache.delete(key);
  else cache.clear();
}

export async function getDbSetting(key: string): Promise<string | null> {
  if (!isDatabaseConfigured()) return null;

  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return hit.value;

  let value: string | null = null;
  try {
    const row = await getPrisma().appSetting.findUnique({ where: { id: key } });
    value = row?.value?.trim() || null;
  } catch {
    value = null;
  }
  cache.set(key, { value, expires: Date.now() + TTL });
  return value;
}

export async function setDbSetting(key: string, value: string) {
  const trimmed = value.trim();
  if (trimmed) {
    await getPrisma().appSetting.upsert({
      where: { id: key },
      create: { id: key, value: trimmed },
      update: { value: trimmed },
    });
  } else {
    await getPrisma().appSetting.deleteMany({ where: { id: key } });
  }
  invalidateSettingCache(key);
}

/** 个人模式固定使用内置口令；关闭自动登录后回退到数据库、环境变量或默认口令。 */
export async function getEffectivePassword(): Promise<string> {
  if (isPersonalAutoLoginEnabled()) return PERSONAL_APP_PASSWORD;
  const fromDb = await getDbSetting(SETTING_KEYS.password);
  return fromDb ?? (getEnvPassword() || PERSONAL_APP_PASSWORD);
}

/** 生效的 DeepSeek API Key：设置页里存的优先，其次 .env */
export async function getEffectiveDeepseekKey(): Promise<string> {
  const fromDb = await getDbSetting(SETTING_KEYS.deepseekKey);
  return fromDb ?? (process.env.DEEPSEEK_API_KEY ?? "").trim();
}

/** 登录 cookie 存的不是明文密码，而是密码的 SHA-256，改密码即全端失效 */
export function passwordCookieValue(password: string) {
  return createHash("sha256").update(`schedule:${password}`).digest("hex");
}
