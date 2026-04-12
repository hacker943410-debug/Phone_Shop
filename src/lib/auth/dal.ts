import { cache } from "react";
import { redirect } from "next/navigation";

import type { AuthRole, AuthenticatedUser } from "@/lib/auth/access";
import { getSessionTokenPayload } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const getCurrentUser = cache(async (): Promise<AuthenticatedUser | null> => {
  const session = await getSessionTokenPayload();

  if (!session?.userId) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.userId,
    },
    select: {
      id: true,
      username: true,
      displayName: true,
      role: true,
      isActive: true,
    },
  });

  if (!user || !user.isActive) {
    return null;
  }

  return user;
});

export async function requireCurrentUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireRole(role: AuthRole) {
  const user = await requireCurrentUser();

  if (user.role !== role) {
    redirect("/");
  }

  return user;
}
