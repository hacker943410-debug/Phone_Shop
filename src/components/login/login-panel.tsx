"use client";

import { useActionState } from "react";

import { loginAction, type LoginActionState } from "@/app/actions/auth";
import {
  formControlClassName,
  primaryButtonClassName,
} from "@/components/workspace/ui-classnames";
import { WorkspaceMessageModal } from "@/components/workspace/workspace-alert-dialog";

interface LoginPanelProps {
  redirectTo: string;
}

const initialState: LoginActionState = {
  message: null,
  username: "admin",
};

export function LoginPanel({ redirectTo }: LoginPanelProps) {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.08),_transparent_26%),radial-gradient(circle_at_bottom_right,_rgba(217,119,6,0.08),_transparent_22%),linear-gradient(180deg,_#fafaf8_0%,_#f5f4f1_100%)] px-4 py-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-6">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-amber-700">
            PhoneShop Access
          </p>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-[-0.045em] text-slate-950 sm:text-5xl">
            매장 장부를 현장 흐름대로 빠르게 다루는 관리 화면.
          </h1>
          <p className="max-w-2xl text-base leading-8 text-slate-600">
            첫 버전은 단일 매장 기준으로 시작하고, 할인·리베이트·정책 수익을 서로 섞지
            않도록 장부 흐름을 분리했습니다. 로그인 후 재고, 고객, 판매, 미수금 메뉴로
            바로 이어지는 구조입니다.
          </p>
          <div className="flex flex-wrap gap-3">
            <span className="rounded-md border border-stone-700 bg-stone-900 px-3 py-1.5 text-xs font-semibold text-stone-50">
              관리자 / 직원 권한 분리
            </span>
            <span className="rounded-md border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700">
              할인 정책 자동 제안
            </span>
          </div>
        </section>

        <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-[0_1px_3px_rgba(15,23,42,0.05),0_1px_2px_rgba(15,23,42,0.08)] sm:p-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                Sign in
              </p>
              <h2 className="text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                장부 워크스페이스 로그인
              </h2>
              <p className="text-sm leading-6 text-slate-500">
                시드된 관리자/직원 계정으로 로그인하면 역할에 맞는 메뉴만 노출됩니다.
              </p>
            </div>

            <form action={formAction} className="space-y-4">
              <input name="redirectTo" type="hidden" value={redirectTo} />

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">아이디</span>
                <input
                  autoComplete="username"
                  className={formControlClassName}
                  defaultValue={state.username}
                  name="username"
                  placeholder="admin"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">비밀번호</span>
                <input
                  autoComplete="current-password"
                  className={formControlClassName}
                  name="password"
                  placeholder="비밀번호"
                  type="password"
                />
              </label>

              <button
                className={`${primaryButtonClassName} h-10 w-full px-4`}
                disabled={isPending}
                type="submit"
              >
                {isPending ? "로그인 중.." : "로그인"}
              </button>
            </form>

            <WorkspaceMessageModal
              message={state.message}
              signal={state}
              subtitle="Login"
              title="로그인 정보를 확인해 주세요"
              tone="error"
            />

            <div className="rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-sm leading-6 text-slate-700">
              개발용 시드 계정:
              <br />
              관리자 `admin / admin1234!`
              <br />
              직원 `jihu_kim / staff1234!`
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
