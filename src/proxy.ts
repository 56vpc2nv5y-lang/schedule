import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE } from "@/lib/auth";
import { getEffectivePassword, passwordCookieValue } from "@/lib/app-settings";

// Next.js 16 的 proxy 约定（原 middleware），运行在 Node.js 运行时，
// 因此可以读数据库里保存的密码（设置页修改的那个）。
export async function proxy(req: NextRequest) {
  const password = await getEffectivePassword();

  // 未设置密码 => 不启用保护（本地/演示直接放行）
  if (!password) return NextResponse.next();

  const { pathname } = req.nextUrl;
  // 登录页始终放行，否则会重定向死循环
  if (pathname === "/login") return NextResponse.next();

  const cookie = req.cookies.get(AUTH_COOKIE)?.value ?? "";
  // 兼容旧 cookie（明文密码）与新 cookie（哈希）
  const authed =
    cookie === passwordCookieValue(password) || cookie === password;
  if (authed) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  // 保护所有页面与接口，排除 Next 静态资源和图片
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
