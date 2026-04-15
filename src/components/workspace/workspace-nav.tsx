"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { logoutAction } from "@/app/actions/auth";
import {
  getRoleLabel,
  type AuthenticatedUser,
  type WorkspaceNavigationItem,
} from "@/lib/auth/access";
import {
  sidebarPrimaryButtonClassName,
  secondaryButtonClassName,
} from "@/components/workspace/ui-classnames";

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
    <nav aria-label="워크스페이스 사이드바" className="flex h-full flex-col gap-4">
      {/* 브랜드 영역 */}
      <div className="space-y-1.5 border-b border-stone-200 pb-4">
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-blue-700">
          Workspace
        </p>
        <div className="space-y-0.5">
          <h2 className="text-lg font-semibold tracking-[-0.025em] text-slate-950">
            PhoneShop Ledger
          </h2>
        </div>
      </div>

      {/* 퀵 액션 버튼 */}
      <div className="grid gap-2">
        <Link
          href="/sales/new"
          className={`${sidebarPrimaryButtonClassName} h-9 w-full gap-1.5 px-3`}
        >
          <span aria-hidden="true">+</span>
          판매 등록
        </Link>
        <Link
          href="/inventory"
          className={`${secondaryButtonClassName} h-9 w-full gap-1.5 px-3`}
        >
          재고 입고
        </Link>
      </div>

      {/* 메뉴 목록 */}
      <ul className="grid gap-1">
        {items.map((item) => {
          const active = isActivePath(pathname, item.href);

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={[
                  "group flex items-center gap-2.5 rounded-lg border px-3 py-2 transition",
                  active
                    ? "border-blue-200 bg-blue-50 text-slate-950"
                    : "border-transparent bg-transparent text-slate-700 hover:border-stone-200 hover:bg-white",
                ].join(" ")}
              >
                {/* 활성 인디케이터 바 */}
                <span
                  aria-hidden="true"
                  className={[
                    "h-4 w-1 flex-shrink-0 rounded-full transition",
                    active
                      ? "bg-blue-700"
                      : "bg-stone-200 group-hover:bg-stone-300",
                  ].join(" ")}
                />
                {/* 메뉴명 */}
                <span className="flex-1 text-sm font-semibold">
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      {/* 사용자 정보 + 로그아웃 */}
      <div className="mt-auto space-y-3 rounded-xl border border-stone-200 bg-white p-4">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-slate-950">
            {currentUser.displayName}
          </p>
          <p className="text-xs text-slate-500">
            @{currentUser.username} / {getRoleLabel(currentUser.role)}
          </p>
        </div>

        <div className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2.5 text-xs leading-5 text-slate-600">
          {currentUser.role === "ADMIN"
            ? "정책과 기초정보 메뉴까지 모두 관리할 수 있습니다."
            : "직원 계정은 정책 관리와 관리자 전용 설정 메뉴가 숨겨집니다."}
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
