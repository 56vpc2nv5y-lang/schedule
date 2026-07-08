const placeholderFragments = [
  "localhost:5432/schedule",
  "USER:PASSWORD",
  "PROJECT_REF",
  "CHANGE_ME",
  "user:password",
];

export function isDatabaseConfigured() {
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
  return isDatabaseConfigured() ? "Supabase 已连接" : "演示数据模式";
}
