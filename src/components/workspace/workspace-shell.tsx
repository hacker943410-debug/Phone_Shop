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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,_rgba(180,83,9,0.07),_transparent_24%),radial-gradient(circle_at_bottom_left,_rgba(41,37,36,0.06),_transparent_28%),linear-gradient(180deg,_rgba(247,246,242,1)_0%,_rgba(241,239,234,1)_100%)]">
      <div className="grid min-h-screen gap-3 p-3 xl:grid-cols-[268px_minmax(0,1fr)] xl:items-start xl:gap-3.5 xl:p-3.5 2xl:grid-cols-[288px_minmax(0,1fr)] 2xl:p-4">
        <aside className="rounded-[1.8rem] border border-stone-200/85 bg-[linear-gradient(180deg,rgba(246,245,242,0.98)_0%,rgba(250,250,248,0.94)_100%)] p-3 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.34)] sm:p-4 xl:sticky xl:top-3.5 xl:h-[calc(100vh-1.75rem)] 2xl:top-4 2xl:h-[calc(100vh-2rem)]">
          <WorkspaceNav currentUser={currentUser} items={navigationItems} />
        </aside>
        <div className="min-h-[calc(100vh-2rem)] overflow-visible rounded-[1.95rem] border border-stone-200/85 bg-[linear-gradient(180deg,rgba(255,255,255,0.92)_0%,rgba(252,251,248,0.9)_100%)] shadow-[0_24px_50px_-38px_rgba(15,23,42,0.34)] backdrop-blur-sm xl:min-h-[calc(100vh-1.75rem)] 2xl:min-h-[calc(100vh-2rem)]">
          {children}
        </div>
      </div>
    </div>
  );
}
