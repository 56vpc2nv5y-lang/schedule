import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ACCOUNT_SESSION_COOKIE, verifyAccountSession } from "@/lib/account-auth";

const publicPaths = new Set(["/login", "/register"]);
const ownerOnlyPaths = ["/growth", "/money"];
const nonOwnerWriteAllowlist = new Set([
  "/api/ai",
  "/api/ai/resume-chat",
  "/api/ai/task-intake",
]);

function isOwnerOnlyPath(pathname: string) {
  return ownerOnlyPaths.some((path) => pathname === path || pathname.startsWith(path + "/"));
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (publicPaths.has(pathname)) {
    const account = verifyAccountSession(req.cookies.get(ACCOUNT_SESSION_COOKIE)?.value);
    if (account) {
      const url = req.nextUrl.clone();
      url.pathname = "/";
      url.search = "";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }
  const account = verifyAccountSession(req.cookies.get(ACCOUNT_SESSION_COOKIE)?.value);
  if (account) {
    if (account.kind !== "owner" && isOwnerOnlyPath(pathname)) {
      const url = req.nextUrl.clone();
      url.pathname = "/";
      url.search = "";
      return NextResponse.redirect(url);
    }
    const isWriteRequest = !["GET", "HEAD", "OPTIONS"].includes(req.method);
    if (account.kind !== "owner" && isWriteRequest && !nonOwnerWriteAllowlist.has(pathname)) {
      const url = req.nextUrl.clone();
      url.pathname = pathname.startsWith("/api/") ? "/" : pathname;
      url.searchParams.set("demo", "readonly");
      return NextResponse.redirect(url, 303);
    }
    return NextResponse.next();
  }
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest|.*\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
