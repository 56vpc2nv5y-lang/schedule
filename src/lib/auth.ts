// 简单单人密码保护。只有设置了非占位的 APP_PASSWORD 才启用。
export const AUTH_COOKIE = "app_auth";

const PLACEHOLDER = "change-me-before-deploy";

export function getAppPassword() {
  const value = process.env.APP_PASSWORD ?? "";
  if (!value || value === PLACEHOLDER) return "";
  return value;
}

export function isAuthEnabled() {
  return getAppPassword().length > 0;
}
