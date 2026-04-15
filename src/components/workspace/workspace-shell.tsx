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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,_rgba(37,99,235,0.08),_transparent_28%),radial-gradient(circle_at_bottom_left,_rgba(217,119,6,0.08),_transparent_24%),linear-gradient(180deg,_rgba(250,250,248,1)_0%,_rgba(245,244,241,1)_100%)]">
      <div className="mx-auto grid min-h-screen max-w-[1600px] gap-4 px-3 py-3 xl:grid-cols-[248px_minmax(0,1fr)] xl:px-6 xl:py-6">
        <aside className="rounded-2xl border border-stone-200 bg-[linear-gradient(180deg,rgba(246,245,242,0.98)_0%,rgba(250,250,248,0.95)_100%)] p-3 shadow-[0_1px_3px_rgba(15,23,42,0.05),0_1px_2px_rgba(15,23,42,0.08)] sm:p-4 xl:sticky xl:top-6 xl:h-[calc(100vh-3rem)]">
          <WorkspaceNav currentUser={currentUser} items={navigationItems} />
        </aside>
        <div className="rounded-2xl border border-stone-200 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.05),0_1px_2px_rgba(15,23,42,0.08)]">
          {children}
        </div>
      </div>
    </div>
  );
}
