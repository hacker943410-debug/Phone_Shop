import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { isProtectedPath } from "@/lib/auth/access";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session-token";

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  const session = verifySessionToken(
    request.cookies.get(SESSION_COOKIE_NAME)?.value,
  );

  if (session) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", `${pathname}${search}`);

  return NextResponse.redirect(loginUrl);
}

export const proxyConfig = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt)$).*)",
  ],
};
