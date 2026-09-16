import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE } from "@/lib/auth";
import { ACCOUNT_SESSION_COOKIE } from "@/lib/account-auth";

export function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/login", request.url));
  response.cookies.delete(ACCOUNT_SESSION_COOKIE);
  response.cookies.delete(AUTH_COOKIE);
  return response;
}
