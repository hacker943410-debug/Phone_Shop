"use server";

import { redirect } from "next/navigation";

import type { AuthenticatedUser } from "@/lib/auth/access";
import { resolvePostLoginPath } from "@/lib/auth/access";
import { createUserSession, destroyUserSession } from "@/lib/auth/session";
import { verifyPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/prisma";

export interface LoginActionState {
  message: string | null;
  username: string;
}

export async function loginAction(
  _previousState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const redirectTo = String(formData.get("redirectTo") ?? "/");

  if (!username || !password) {
    return {
      message: "아이디와 비밀번호를 모두 입력하세요.",
      username,
    };
  }

  const user = await prisma.user.findUnique({
    where: {
      username,
    },
    select: {
      id: true,
      username: true,
      displayName: true,
      role: true,
      isActive: true,
      passwordHash: true,
    },
  });

  if (!user || !user.passwordHash) {
    return {
      message: "아이디 또는 비밀번호가 올바르지 않습니다.",
      username,
    };
  }

  if (!user.isActive) {
    return {
      message: "비활성화된 계정입니다. 관리자에게 문의하세요.",
      username,
    };
  }

  if (!verifyPassword(password, user.passwordHash)) {
    return {
      message: "아이디 또는 비밀번호가 올바르지 않습니다.",
      username,
    };
  }

  const authenticatedUser: AuthenticatedUser = {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
    isActive: user.isActive,
  };

  await createUserSession(authenticatedUser);

  redirect(resolvePostLoginPath(user.role, redirectTo));
}

export async function logoutAction() {
  await destroyUserSession();
  redirect("/login");
}
