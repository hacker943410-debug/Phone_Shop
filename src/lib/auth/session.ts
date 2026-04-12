import { cookies } from "next/headers";

import type { AuthenticatedUser } from "@/lib/auth/access";
import {
  createSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  verifySessionToken,
} from "@/lib/auth/session-token";

function getCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}

export async function createUserSession(user: AuthenticatedUser) {
  const cookieStore = await cookies();
  const token = createSessionToken({
    userId: user.id,
    role: user.role,
    username: user.username,
  });

  cookieStore.set(SESSION_COOKIE_NAME, token, getCookieOptions());
}

export async function destroyUserSession() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, "", {
    ...getCookieOptions(),
    maxAge: 0,
  });
}

export async function getSessionTokenPayload() {
  const cookieStore = await cookies();
  return verifySessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);
}
