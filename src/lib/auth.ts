// 单人工作台默认启用个人自动登录；部署到共享环境时可用 PERSONAL_AUTO_LOGIN=false 关闭。
export const AUTH_COOKIE = "app_auth";
export const PERSONAL_APP_PASSWORD = "sunny";

const PLACEHOLDER = "change-me-before-deploy";

export function getAppPassword() {
  const value = process.env.APP_PASSWORD ?? "";
  if (!value || value === PLACEHOLDER) return "";
  return value;
}

export function isPersonalAutoLoginEnabled() {
  return process.env.PERSONAL_AUTO_LOGIN !== "false";
}

export function isAuthEnabled() {
  return getAppPassword().length > 0;
}
