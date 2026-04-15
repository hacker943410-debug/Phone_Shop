import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { LoginPanel } from "@/components/login/login-panel";
import { getCurrentUser } from "@/lib/auth/dal";
import { normalizeRedirectPath, resolvePostLoginPath } from "@/lib/auth/access";

export const metadata: Metadata = {
  title: "로그인",
};

interface LoginPageProps {
  searchParams: Promise<{
    next?: string;
  }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const redirectTo = normalizeRedirectPath(params.next);
  const user = await getCurrentUser();

  if (user) {
    redirect(resolvePostLoginPath(user.role, redirectTo));
  }

  return <LoginPanel redirectTo={redirectTo} />;
}
