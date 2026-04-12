import type { ReactNode } from "react";

import { WorkspaceNav } from "@/components/workspace/workspace-nav";
import type {
  AuthenticatedUser,
  WorkspaceNavigationItem,
} from "@/lib/auth/access";

interface WorkspaceShellProps {
  children: ReactNode;
  currentUser: AuthenticatedUser;
  navigationItems: WorkspaceNavigationItem[];
}

export function WorkspaceShell({
  children,
  currentUser,
  navigationItems,
}: WorkspaceShellProps) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,_rgba(13,148,136,0.16),_transparent_32%),radial-gradient(circle_at_bottom_left,_rgba(217,119,6,0.16),_transparent_28%),linear-gradient(180deg,_rgba(251,245,233,0.96)_0%,_rgba(245,238,228,1)_100%)]">
      <div className="mx-auto grid min-h-screen max-w-[1600px] gap-6 px-4 py-4 lg:grid-cols-[292px_minmax(0,1fr)] lg:px-6 lg:py-6">
        <aside className="rounded-[2rem] border border-white/60 bg-[linear-gradient(180deg,rgba(255,252,246,0.94)_0%,rgba(255,247,236,0.88)_100%)] p-5 shadow-[0_24px_80px_-48px_rgba(148,163,184,0.55)] backdrop-blur">
          <WorkspaceNav currentUser={currentUser} items={navigationItems} />
        </aside>
        <div className="rounded-[2.25rem] border border-white/55 bg-white/72 shadow-[0_28px_90px_-50px_rgba(15,23,42,0.35)] backdrop-blur">
          {children}
        </div>
      </div>
    </div>
  );
}
