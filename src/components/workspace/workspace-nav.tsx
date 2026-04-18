"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { logoutAction } from "@/app/actions/auth";
import {
  getRoleLabel,
  type AuthenticatedUser,
  type WorkspaceNavigationItem,
} from "@/lib/auth/access";
import { secondaryButtonClassName } from "@/components/workspace/ui-classnames";

function isActivePath(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

interface WorkspaceNavProps {
  currentUser: AuthenticatedUser;
  items: WorkspaceNavigationItem[];
}

export function WorkspaceNav({ currentUser, items }: WorkspaceNavProps) {
  const pathname = usePathname();

  return (
    <nav aria-label="워크스페이스 사이드바" className="flex h-full flex-col gap-3">
      <div className="border-b border-stone-200/90 pb-3">
        <h2 className="text-[1.08rem] font-semibold tracking-[-0.035em] text-slate-950">
          매장 장부
        </h2>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto rounded-[1.3rem] border border-stone-200/80 bg-white/72 p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">
        <ul className="grid gap-1">
          {items.map((item) => {
            const active = isActivePath(pathname, item.href);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={[
                    "group flex items-center rounded-[0.95rem] border px-3 py-2 transition",
                    active
                      ? "border-amber-200 bg-[linear-gradient(135deg,rgba(255,247,237,1)_0%,rgba(255,251,235,1)_100%)] text-slate-950 shadow-[0_18px_32px_-28px_rgba(217,119,6,0.35)]"
                      : "border-transparent bg-transparent text-slate-700 hover:border-stone-200 hover:bg-white",
                  ].join(" ")}
                >
                  <span className="flex-1 text-sm font-semibold">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="mt-auto space-y-2.5 rounded-[1.3rem] border border-stone-200 bg-white/90 p-3.5 shadow-[0_18px_36px_-34px_rgba(15,23,42,0.32)]">
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-slate-950">
              {currentUser.displayName}
            </p>
            <span className="rounded-full border border-stone-200 bg-stone-100 px-2 py-0.5 text-[0.66rem] font-semibold uppercase tracking-[0.2em] text-slate-500">
              {getRoleLabel(currentUser.role)}
            </span>
          </div>
          <p className="text-xs text-slate-500">@{currentUser.username}</p>
        </div>

        <form action={logoutAction}>
          <button
            className={`${secondaryButtonClassName} h-10 w-full px-4`}
            type="submit"
          >
            로그아웃
          </button>
        </form>
      </div>
    </nav>
  );
}
