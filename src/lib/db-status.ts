const placeholderFragments = [
  "localhost:5432/schedule",
  "USER:PASSWORD",
  "PROJECT_REF",
  "CHANGE_ME",
  "user:password",
];

const enabledValues = new Set(["1", "true", "yes", "on"]);

export function isDatabaseOfflineMode() {
  return enabledValues.has(
    (process.env.DATABASE_OFFLINE_MODE ?? "").trim().toLowerCase(),
  );
}

export function isDatabaseConfigured() {
  if (isDatabaseOfflineMode()) {
    return false;
  }

  const databaseUrl = process.env.DATABASE_URL ?? "";
  const directUrl = process.env.DIRECT_URL ?? "";

  if (!databaseUrl.startsWith("postgres")) {
    return false;
  }

  if (placeholderFragments.some((fragment) => databaseUrl.includes(fragment))) {
    return false;
  }

  if (!directUrl || placeholderFragments.some((fragment) => directUrl.includes(fragment))) {
    return false;
  }

  return true;
}

export function getDatabaseModeLabel() {
  if (isDatabaseOfflineMode()) {
    return "离线演示模式";
  }

  return isDatabaseConfigured() ? "Supabase 已配置" : "演示数据模式";
}
