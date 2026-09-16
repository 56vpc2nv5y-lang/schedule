import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE } from "@/lib/auth";
import { ACCOUNT_SESSION_COOKIE, LEGACY_ACCOUNT_SESSION_COOKIES } from "@/lib/account-auth";

export function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/login", request.url));
  const legacyPaths = [
    "/",
    "/calendar",
    "/tasks",
    "/resources",
    "/projects",
    "/guide",
    "/week",
    "/today",
    "/receptions",
    "/contacts",
    "/knowledge",
    "/meeting-reviews",
    "/assistant",
    "/settings",
  ];
  for (const path of legacyPaths) {
    for (const name of [ACCOUNT_SESSION_COOKIE, ...LEGACY_ACCOUNT_SESSION_COOKIES, AUTH_COOKIE]) {
      response.cookies.set(name, "", {
        expires: new Date(0),
        httpOnly: true,
        maxAge: 0,
        path,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });
    }
  }
  return response;
}
