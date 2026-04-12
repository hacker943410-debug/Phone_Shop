import type { ReactNode } from "react";

import { WorkspaceShell } from "@/components/workspace/workspace-shell";
import { getNavigationItemsForRole } from "@/lib/auth/access";
import { requireCurrentUser } from "@/lib/auth/dal";

interface WorkspaceLayoutProps {
  children: ReactNode;
}

export default async function WorkspaceLayout({
  children,
}: WorkspaceLayoutProps) {
  const currentUser = await requireCurrentUser();
  const navigationItems = getNavigationItemsForRole(currentUser.role);

  return (
    <WorkspaceShell currentUser={currentUser} navigationItems={navigationItems}>
      {children}
    </WorkspaceShell>
  );
}
