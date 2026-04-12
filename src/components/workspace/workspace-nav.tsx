"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { logoutAction } from "@/app/actions/auth";
import {
  getRoleLabel,
  type AuthenticatedUser,
  type WorkspaceNavigationItem,
} from "@/lib/auth/access";

function isActivePath(pathname: string, href: string) {
  if (href === "/")
    return pathname === "/";

  return pathname === href || pathname.startsWith(`${href}/`);
}

interface WorkspaceNavProps {
  currentUser: AuthenticatedUser;
  items: WorkspaceNavigationItem[];
}

export function WorkspaceNav({ currentUser, items }: WorkspaceNavProps) {
  const pathname = usePathname();

  return (
    <nav className="flex h-full flex-col gap-3">
      <div className="space-y-1">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-amber-700/75">
          Workspace
        </p>
        <h2 className="text-lg font-semibold text-slate-950">
          PhoneShop Ledger
        </h2>
      </div>
      <ul className="grid gap-2">
        {items.map((item) => {
          const active = isActivePath(pathname, item.href);

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={[
                  "group block rounded-[1.35rem] border px-4 py-3 transition",
                  active
                    ? "border-slate-950 bg-slate-950 text-white shadow-[0_18px_40px_-24px_rgba(15,23,42,0.85)]"
                    : "border-slate-950/10 bg-white/80 text-slate-700 hover:border-amber-500/40 hover:bg-white",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold">{item.label}</p>
                    <p
                      className={[
                        "text-xs leading-5",
                        active ? "text-slate-300" : "text-slate-500",
                      ].join(" ")}
                    >
                      {item.description}
                    </p>
                  </div>
                  {item.badge ? (
                    <span
                      className={[
                        "rounded-full px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.2em]",
                        active
                          ? "bg-white/10 text-amber-200"
                          : "bg-amber-100 text-amber-800",
                      ].join(" ")}
                    >
                      {item.badge}
                    </span>
                  ) : null}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="mt-auto space-y-3 rounded-[1.5rem] border border-slate-950/8 bg-white/90 p-4">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-slate-950">
            {currentUser.displayName}
          </p>
          <p className="text-xs text-slate-500">
            @{currentUser.username} · {getRoleLabel(currentUser.role)}
          </p>
        </div>

        <div className="rounded-[1.15rem] bg-stone-50 px-3 py-2 text-xs leading-5 text-slate-600">
          {currentUser.role === "ADMIN"
            ? "정책과 기초정보 메뉴까지 관리할 수 있습니다."
            : "직원 계정은 정책 관리와 관리자 전용 설정 메뉴가 숨겨집니다."}
        </div>

        <form action={logoutAction}>
          <button
            className="w-full rounded-2xl border border-slate-950/10 bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            type="submit"
          >
            로그아웃
          </button>
        </form>
      </div>
    </nav>
  );
}
